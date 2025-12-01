const Cart = require("../models/cartModel");
const { getProductById } = require("../utils/productServiceApi");
const logger = require("../utils/logger");
const STATUS_CODES = require('../utils/statusCodes');
const MESSAGES = require('../utils/messages');
const kafkaProducer = require('../kafka/producer');
const TOPICS = require('../kafka/topics');

const addToCart = async ({ userId, productId, quantity }) => {
  try {
    logger.info("CartService: Add to Cart called", { userId, productId, quantity });

    const productResponse = await getProductById(productId);
    
    if (!productResponse.success || !productResponse.data) {
      logger.warn("Product not found via Product Service", { productId });
      return { 
        success: false, 
        message: MESSAGES.PRODUCT_NOT_FOUND, 
        statusCode: STATUS_CODES.NOT_FOUND 
      };
    }

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
        logger.info("Updated product quantity in cart", { userId, productId });
      } else {
        cart.items.push({ product: productId, quantity });
        logger.info("Added new product to cart", { userId, productId });
      }
    } else {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
      logger.info("Created new cart for user", { userId });
    }

    await cart.save();

    // ✅ NON-BLOCKING KAFKA - Fire and forget
    kafkaProducer.publishEvent(TOPICS.CART_ITEM_ADDED, {
      cartId: cart._id.toString(),
      userId: userId,
      productId: productId,
      productName: productResponse.data.name,
      quantity: quantity,
      addedAt: new Date().toISOString()
    }).catch(err => logger.warn('Kafka publish failed (non-blocking)', { error: err.message }));

    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProductById(item.product.toString());
        return {
          product: prod.data,
          quantity: item.quantity,
          _id: item._id
        };
      })
    );

    const cartData = {
      _id: cart._id,
      user: cart.user,
      items: itemsWithProducts,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };

    return { 
      success: true, 
      message: MESSAGES.ADD_TO_CART_SUCCESS, 
      data: cartData, 
      statusCode: STATUS_CODES.OK 
    };
  } catch (error) {
    logger.error("CartService AddToCart Error", { 
      error: error.message, 
      userId,
      productId
    });
    
    return { 
      success: false, 
      message: MESSAGES.SERVER_ERROR, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR 
    };
  }
};

const getCart = async ({ userId }) => {
  try {
    logger.info("CartService: Get Cart called", { userId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      logger.warn("Cart not found or empty", { userId });
      return { 
        success: false, 
        message: MESSAGES.CART_NOT_FOUND, 
        statusCode: STATUS_CODES.NOT_FOUND 
      };
    }

    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProductById(item.product.toString());
        return {
          product: prod.success ? prod.data : null,
          quantity: item.quantity,
          _id: item._id
        };
      })
    );

    const cartData = {
      _id: cart._id,
      user: cart.user,
      items: itemsWithProducts,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };

    logger.info("Cart fetched successfully", { userId, itemsCount: cart.items.length });
    return { 
      success: true, 
      message: MESSAGES.CART_FETCH_SUCCESS_DB, 
      data: cartData, 
      statusCode: STATUS_CODES.OK 
    };
  } catch (error) {
    logger.error("CartService GetCart Error", { error: error.message });
    return { 
      success: false, 
      message: MESSAGES.SERVER_ERROR, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR 
    };
  }
};

const deleteOldCarts = async () => {
  try {
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const oldCarts = await Cart.find({
      updatedAt: { $lt: oldDate }
    });
    
    // ✅ NON-BLOCKING: Fire all Kafka events in parallel
    const kafkaPromises = oldCarts
      .filter(cart => cart.items.length > 0)
      .map(cart => 
        kafkaProducer.publishEvent(TOPICS.CART_ABANDONED, {
          cartId: cart._id.toString(),
          userId: cart.user.toString(),
          itemsCount: cart.items.length,
          lastUpdated: cart.updatedAt,
          abandonedAt: new Date().toISOString()
        }).catch(err => logger.warn('Kafka publish failed for cart', { 
          cartId: cart._id, 
          error: err.message 
        }))
      );
    
    // Don't wait for Kafka, just log
    Promise.all(kafkaPromises).then(() => 
      logger.info(`Kafka events sent for ${kafkaPromises.length} abandoned carts`)
    );
    
    const result = await Cart.deleteMany({
      updatedAt: { $lt: oldDate }
    });

    logger.info(`Cron: Deleted old carts = ${result.deletedCount}`);
  } catch (error) {
    logger.error("Cron Cart Cleanup Error", { error: error.message });
  }
};

module.exports = { addToCart, getCart, deleteOldCarts };