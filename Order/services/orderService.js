const Order = require('../models/orderModel');
const { getCartByUserId, clearCart } = require('../utils/cartServiceApi');
const axios = require('axios');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const STATUS_CODES = require('../utils/statusCodes');
const MESSAGES = require('../utils/messages');
const kafkaProducer = require('../kafka/producer');
const TOPICS = require('../kafka/topics');
require('dotenv').config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

const cancelOldPendingOrders = async () => {
  try {
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await Order.updateMany(
      { status: "Pending", createdAt: { $lt: oldDate } },
      { status: "Cancelled", cancelledAt: new Date() }
    );

    logger.info(`OrderService: Cancelled old pending orders = ${result.modifiedCount}`);

    return { 
      cancelledCount: result.modifiedCount, 
      success: true, 
      message: MESSAGES.OLD_PENDING_ORDERS_CANCELLED, 
      statusCode: STATUS_CODES.OK 
    };
  } catch (error) {
    logger.error("OrderService: Error cancelling old pending orders", { error: error.message });
    return { 
      success: false, 
      message: MESSAGES.SERVER_ERROR, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR 
    };
  }
};

const createOrder = async ({ userId, userEmail, userName, token, cookies }) => {
  try {
    logger.info("OrderService: createOrder - Initiated for user", { userId, userEmail, userName });

    if (!userEmail || !userName) {
      logger.warn("OrderService: createOrder - User email or name missing", { userId });
      return { success: false, message: MESSAGES.USER_EMAIL_NAME_MISSING, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const cartResponse = await getCartByUserId(userId, token, cookies);
    logger.info("OrderService: createOrder - Cart fetched", { userId, success: cartResponse.success });
    
    if (!cartResponse.success || !cartResponse.data || cartResponse.data.items.length === 0) {
      logger.warn("OrderService: createOrder - Cart is empty", { userId });
      return { success: false, message: MESSAGES.ORDER_CART_EMPTY, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const cart = cartResponse.data;
    const itemsWithProducts = [];
    let totalAmount = 0;

    logger.info("OrderService: createOrder - Fetching product details for cart items", { userId, itemsCount: cart.items.length });

    for (const item of cart.items) {
      try {
        const productId = item.product._id || item.product;
        logger.debug("OrderService: createOrder - Fetching product", { productId });
        
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
        
        if (productResponse.data && productResponse.data.success) {
          const product = productResponse.data.data;
          itemsWithProducts.push({
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              image: product.image
            },
            quantity: item.quantity
          });
          totalAmount += product.price * item.quantity;
          logger.debug("OrderService: createOrder - Product added to order", { productName: product.name, totalAmount });
        }
      } catch (error) {
        logger.error("OrderService: createOrder - Error fetching product", { 
          productId: item.product, 
          error: error.message 
        });
      }
    }

    if (itemsWithProducts.length === 0) {
      logger.warn("OrderService: createOrder - No valid products in cart", { userId });
      return { success: false, message: "No valid products in cart", statusCode: STATUS_CODES.BAD_REQUEST };
    }

    logger.info("OrderService: createOrder - Creating order", { userId, itemsCount: itemsWithProducts.length, totalAmount });
    
    const order = new Order({
      user: userId,
      items: itemsWithProducts,
      totalAmount,
      status: "Pending"
    });

    await order.save();
    logger.info("OrderService: createOrder - Order saved successfully", { orderId: order._id, userId });

    //  KAFKA EVENT - ORDER CREATED
    await kafkaProducer.publishEvent(TOPICS.ORDER_CREATED, {
      orderId: order._id.toString(),
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      items: itemsWithProducts.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount: totalAmount,
      status: order.status,
      createdAt: order.createdAt
    });

    await clearCart(userId, token, cookies);
    logger.info("OrderService: createOrder - Cart cleared for user", { userId });

    //  NON-BLOCKING EMAIL SENDING - Fire and forget
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Order Placed - ${order._id}`,
        html: `
          <h2>New Order Placed</h2>
          <p>User: ${userName} (${userEmail})</p>
          <p>Order ID: ${order._id}</p>
          <p>Total Amount: $${totalAmount.toFixed(2)}</p>
          <h3>Items:</h3>
          <ul>
            ${itemsWithProducts.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
          </ul>
        `
      })
      .then(() => logger.info("OrderService: createOrder - Admin notification sent", { orderId: order._id }))
      .catch(emailError => logger.warn("OrderService: createOrder - Admin email failed", { error: emailError.message, orderId: order._id }));
    }

    //  NON-BLOCKING USER EMAIL
    sendEmail({
      to: userEmail,
      subject: `Your Order Confirmation - ${order._id}`,
      html: `
        <h2>Thank you for your order, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: ${order.status}</p>
        <p>Total Amount: $${totalAmount.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${itemsWithProducts.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
        </ul>
        <p>We will notify you once your order is shipped.</p>
      `
    })
    .then(() => logger.info("OrderService: createOrder - User confirmation sent", { orderId: order._id, userEmail }))
    .catch(emailError => logger.warn("OrderService: createOrder - User email failed", { error: emailError.message, userEmail }));

    logger.info("OrderService: createOrder - Order created successfully", { orderId: order._id, userId, totalAmount });
    return { success: true, message: MESSAGES.ORDER_PLACED_SUCCESS, data: order, statusCode: STATUS_CODES.CREATED };

  } catch (error) {
    logger.error("OrderService: createOrder - Unexpected error", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.ORDER_CREATED_SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const getUserOrders = async ({ userId }) => {
  try {
    logger.info("OrderService: getUserOrders - Fetching orders", { userId });
    
    const orders = await Order.find({ user: userId });
    
    if (!orders || orders.length === 0) {
      logger.info("OrderService: getUserOrders - No orders found", { userId });
      return { success: true, message: MESSAGES.ORDERS_FETCH_SUCCESS_DB, data: [], statusCode: STATUS_CODES.OK };
    }
    
    logger.info("OrderService: getUserOrders - Orders fetched successfully", { userId, count: orders.length });
    return { success: true, message: MESSAGES.ORDERS_FETCH_SUCCESS_DB, data: orders, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("OrderService: getUserOrders - Error fetching orders", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const markOrderPaid = async ({ userId, orderId, userEmail, userName }) => {
  try {
    logger.info("OrderService: markOrderPaid - Initiated", { userId, orderId });

    if (!userEmail || !userName) {
      logger.warn("OrderService: markOrderPaid - User email or name missing", { userId, orderId });
      return { success: false, message: MESSAGES.USER_EMAIL_NAME_MISSING, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    
    if (!order) {
      logger.warn("OrderService: markOrderPaid - Order not found", { userId, orderId });
      return { success: false, message: MESSAGES.ORDER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    if (order.status === "Paid") {
      logger.info("OrderService: markOrderPaid - Order already paid", { orderId });
      return { success: false, message: MESSAGES.ORDER_ALREADY_PAID, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    order.status = "Paid";
    order.paidAt = new Date();
    await order.save();
    
    logger.info("OrderService: markOrderPaid - Order status updated to Paid", { orderId, userId });

    //  KAFKA EVENT - ORDER PAID
    await kafkaProducer.publishEvent(TOPICS.ORDER_PAID, {
      orderId: order._id.toString(),
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      totalAmount: order.totalAmount,
      status: 'Paid',
      paidAt: order.paidAt,
      items: order.items
    });

    //  NON-BLOCKING EMAIL SENDING
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `Order Paid - ${order._id}`,
        html: `
          <h2>Order Paid Notification</h2>
          <p>User: ${userName} (${userEmail})</p>
          <p>Order ID: ${order._id}</p>
          <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
          <p>Status: Paid</p>
        `
      })
      .then(() => logger.info("OrderService: markOrderPaid - Admin notification sent", { orderId }))
      .catch(emailError => logger.warn("OrderService: markOrderPaid - Admin email failed", { error: emailError.message, orderId }));
    }

    //  NON-BLOCKING USER EMAIL
    sendEmail({
      to: userEmail,
      subject: `Invoice for Your Order - ${order._id}`,
      html: `
        <h2>Thank you for your payment, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: Paid</p>
        <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
        <p>Your order is now confirmed as paid. We will notify you once your order is shipped.</p>
      `
    })
    .then(() => logger.info("OrderService: markOrderPaid - User invoice sent", { orderId, userEmail }))
    .catch(emailError => logger.warn("OrderService: markOrderPaid - User email failed", { error: emailError.message, userEmail }));

    logger.info("OrderService: markOrderPaid - Order marked as paid successfully", { orderId, userId });
    return { success: true, message: MESSAGES.ORDER_PAID_SUCCESS, data: order, statusCode: STATUS_CODES.OK };

  } catch (error) {
    logger.error("OrderService: markOrderPaid - Unexpected error", { error: error.message, stack: error.stack, userId, orderId });
    return { success: false, message: MESSAGES.ORDER_UPDATE_PAYMENT_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

module.exports = { 
  createOrder, 
  getUserOrders, 
  markOrderPaid, 
  cancelOldPendingOrders 
};