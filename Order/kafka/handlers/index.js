const logger = require('../../utils/logger');
const TOPICS = require('../topics');
const Order = require('../../models/orderModel');

class EventHandlers {
  
  async handleEvent(topic, event, headers) {
    try {
      switch (topic) {
        case TOPICS.PAYMENT_SUCCESS:
          await this.handlePaymentSuccess(event);
          break;
        
        case TOPICS.PAYMENT_FAILED:
          await this.handlePaymentFailed(event);
          break;
        
        case TOPICS.PRODUCT_UPDATED:
          await this.handleProductUpdated(event);
          break;
        
        case TOPICS.CART_UPDATED:
          await this.handleCartUpdated(event);
          break;
        
        default:
          logger.warn(` Unhandled event from topic: ${topic}`);
      }
    } catch (error) {
      logger.error(` Error handling event from ${topic}`, { 
        error: error.message, 
        event 
      });
      throw error; // Re-throw for retry logic
    }
  }

  async handlePaymentSuccess(event) {
    const { orderId, paymentId, amount, userId } = event;
    
    try {
      logger.info(' Processing payment success event', { orderId, paymentId });
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        logger.warn(' Order not found for payment success', { orderId });
        return;
      }

      if (order.status === 'Paid') {
        logger.info('ℹ Order already marked as paid', { orderId });
        return;
      }

      order.status = 'Paid';
      order.paidAt = new Date();
      order.paymentId = paymentId;
      await order.save();
      
      logger.info(' Order marked as paid successfully', { orderId });

      // Publish ORDER_PAID event for other services
      const kafkaProducer = require('../producer');
      await kafkaProducer.publishEvent(TOPICS.ORDER_PAID, {
        orderId: order._id.toString(),
        userId: order.user.toString(),
        totalAmount: order.totalAmount,
        paymentId,
        status: 'Paid',
        paidAt: order.paidAt,
        items: order.items
      });

    } catch (error) {
      logger.error(' Error handling payment success', { 
        error: error.message, 
        orderId 
      });
      throw error;
    }
  }

  async handlePaymentFailed(event) {
    const { orderId, reason, userId } = event;
    
    try {
      logger.info(' Processing payment failed event', { orderId, reason });
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        logger.warn(' Order not found for payment failure', { orderId });
        return;
      }

      order.status = 'Cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = reason || 'Payment failed';
      await order.save();
      
      logger.info(' Order cancelled due to payment failure', { orderId });

      // Publish ORDER_CANCELLED event
      const kafkaProducer = require('../producer');
      await kafkaProducer.publishEvent(TOPICS.ORDER_CANCELLED, {
        orderId: order._id.toString(),
        userId: order.user.toString(),
        reason: reason || 'Payment failed',
        cancelledAt: order.cancelledAt,
        items: order.items
      });

    } catch (error) {
      logger.error(' Error handling payment failure', { 
        error: error.message, 
        orderId 
      });
      throw error;
    }
  }

  async handleProductUpdated(event) {
    const { productId, price, stock, name } = event;
    
    logger.info(' Processing product updated event', { 
      productId, 
      price, 
      stock 
    });

    // Future: Update pending orders if product price changed
    // Or notify users if product out of stock
  }

  async handleCartUpdated(event) {
    const { userId, cartId, action } = event;
    
    logger.info(' Processing cart updated event', { 
      userId, 
      cartId, 
      action 
    });

    // Future: Handle cart updates if needed
  }
}

const eventHandlers = new EventHandlers();

module.exports = eventHandlers;