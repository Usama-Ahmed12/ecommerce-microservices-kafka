const logger = require('../../utils/logger');
const TOPICS = require('../topics');
const Cart = require('../../models/cartModel');

class EventHandlers {
  
  async handleEvent(topic, event, headers) {
    try {
      switch (topic) {
        case TOPICS.PRODUCT_UPDATED:
          await this.handleProductUpdated(event);
          break;
        
        case TOPICS.PRODUCT_DELETED:
          await this.handleProductDeleted(event);
          break;
        
        case TOPICS.PRODUCT_OUT_OF_STOCK:
          await this.handleProductOutOfStock(event);
          break;
        
        case TOPICS.PRICE_CHANGED:
          await this.handlePriceChanged(event);
          break;
        
        default:
          logger.warn(` Unhandled event from topic: ${topic}`);
      }
    } catch (error) {
      logger.error(` Error handling event from ${topic}`, { 
        error: error.message, 
        event 
      });
      throw error;
    }
  }

  async handleProductUpdated(event) {
    const { productId, price, stock, name } = event;
    
    logger.info(' Processing product updated event', { productId, price, stock });
    
    try {
      // Find all carts with this product
      const carts = await Cart.find({ 'items.product': productId });
      
      if (carts.length > 0) {
        logger.info(`Found ${carts.length} carts with product ${productId}`);
        
        // Note: We don't update price in cart
        // Cart just stores product ID
        // Price is fetched fresh from Product Service when cart is viewed
        
        // If product out of stock, we could notify users
        if (stock === 0) {
          logger.warn(`Product ${productId} is out of stock, present in ${carts.length} carts`);
          // Future: Send notification to users
        }
      }
    } catch (error) {
      logger.error(' Error handling product update', { 
        error: error.message, 
        productId 
      });
    }
  }

  async handleProductDeleted(event) {
    const { productId } = event;
    
    logger.info(' Processing product deleted - Removing from carts', { productId });
    
    try {
      // Remove product from all carts
      const result = await Cart.updateMany(
        { 'items.product': productId },
        { $pull: { items: { product: productId } } }
      );
      
      logger.info(` Product removed from ${result.modifiedCount} carts`, { productId });
      
      // Clean up empty carts
      await Cart.deleteMany({ items: { $size: 0 } });
      
    } catch (error) {
      logger.error(' Error removing deleted product from carts', { 
        error: error.message, 
        productId 
      });
    }
  }

  async handleProductOutOfStock(event) {
    const { productId, productName } = event;
    
    logger.info(' Processing product out of stock', { productId, productName });
    
    try {
      // Find carts with this product
      const carts = await Cart.find({ 'items.product': productId }).populate('user');
      
      if (carts.length > 0) {
        logger.warn(`Product ${productName} is out of stock, present in ${carts.length} carts`);
        
        // Future: Send notification to users
        // for (const cart of carts) {
        //   await sendNotification(cart.user, `${productName} in your cart is now out of stock`);
        // }
      }
    } catch (error) {
      logger.error(' Error handling out of stock event', { 
        error: error.message, 
        productId 
      });
    }
  }

  async handlePriceChanged(event) {
    const { productId, oldPrice, newPrice, productName } = event;
    
    logger.info('💰 Processing price change', { 
      productId, 
      productName,
      oldPrice, 
      newPrice 
    });
    
    try {
      // Find carts with this product
      const carts = await Cart.find({ 'items.product': productId }).populate('user');
      
      if (carts.length > 0) {
        const priceChangePercent = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
        
        logger.info(`Price changed by ${priceChangePercent}% for product in ${carts.length} carts`);
        
        // Future: Notify users about price change
        // Especially if it's a price drop (sale)
        if (newPrice < oldPrice) {
          logger.info(`🎉 Price drop! Product ${productName}: Rs ${oldPrice} → Rs ${newPrice}`);
          // Send notification about sale
        }
      }
    } catch (error) {
      logger.error('❌ Error handling price change', { 
        error: error.message, 
        productId 
      });
    }
  }
}

const eventHandlers = new EventHandlers();

module.exports = eventHandlers;