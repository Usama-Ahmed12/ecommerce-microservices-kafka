const logger = require('../../utils/logger');
const TOPICS = require('../topics');
const Product = require('../../models/productModel');

class EventHandlers {
  
  async handleEvent(topic, event, headers) {
    try {
      switch (topic) {
        case TOPICS.ORDER_CREATED:
          await this.handleOrderCreated(event);
          break;
        
        case TOPICS.ORDER_CANCELLED:
          await this.handleOrderCancelled(event);
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
    const { orderId, items } = event;
    
    logger.info('📦 Processing order created - Reducing stock', { orderId });
    
    try {
      // Reduce stock for each product in order
      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (product) {
          const newStock = product.stock - item.quantity;
          
          product.stock = Math.max(0, newStock);
          await product.save();
          
          logger.info('✅ Stock reduced for product', { 
            productId: item.productId,
            quantity: item.quantity,
            newStock: product.stock
          });
          
          // If out of stock, publish event
          if (product.stock === 0) {
            const kafkaProducer = require('../producer');
            await kafkaProducer.publishEvent(TOPICS.PRODUCT_OUT_OF_STOCK, {
              productId: product._id.toString(),
              productName: product.name,
              orderId: orderId
            });
          }
        }
      }
    } catch (error) {
      logger.error('❌ Error reducing stock', { error: error.message, orderId });
    }
  }

  async handleOrderCancelled(event) {
    const { orderId, items } = event;
    
    logger.info('↩️ Processing order cancelled - Restoring stock', { orderId });
    
    try {
      // Restore stock for each product
      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (product) {
          product.stock += item.quantity;
          await product.save();
          
          logger.info('✅ Stock restored for product', { 
            productId: item.productId,
            quantity: item.quantity,
            newStock: product.stock
          });
        }
      }
    } catch (error) {
      logger.error('❌ Error restoring stock', { error: error.message, orderId });
    }
  }
}

const eventHandlers = new EventHandlers();

module.exports = eventHandlers;