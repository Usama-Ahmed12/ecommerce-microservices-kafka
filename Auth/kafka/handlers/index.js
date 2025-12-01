const logger = require('../../utils/logger');
const TOPICS = require('../topics');

class EventHandlers {
  
  async handleEvent(topic, event, headers) {
    try {
      switch (topic) {
        case TOPICS.ORDER_CREATED:
          await this.handleOrderCreated(event);
          break;
        
        case TOPICS.ORDER_PAID:
          await this.handleOrderPaid(event);
          break;
        
        default:
          logger.warn(`⚠️ Unhandled event from topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`❌ Error handling event from ${topic}`, { 
        error: error.message, 
        event 
      });
      throw error;
    }
  }

  async handleOrderCreated(event) {
    const { orderId, userId, userEmail, totalAmount } = event;
    
    logger.info('📦 Processing order created event', { orderId, userId });
    
    // Future: Update user's order history, analytics, etc.
    // const User = require('../../models/userModel');
    // await User.updateOne(
    //   { _id: userId },
    //   { $inc: { totalOrders: 1 } }
    // );
  }

  async handleOrderPaid(event) {
    const { orderId, userId, totalAmount } = event;
    
    logger.info('💳 Processing order paid event', { orderId, userId });
    
    // Future: Track user spending, loyalty points, etc.
  }
}

const eventHandlers = new EventHandlers();

module.exports = eventHandlers;