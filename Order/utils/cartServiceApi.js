const axios = require('axios');
const logger = require('./logger');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3004';

const getCartByUserId = async (userId, token, cookies) => {
  try {
    logger.info("CartServiceAPI: Fetching cart for user", { userId });
    
    const response = await axios.get(`${CART_SERVICE_URL}/api/cart`, {
      headers: {
        'Cookie': `token=${token}` // JWT token pass karo
      }
    });

    if (response.data && response.data.success) {
      logger.info("CartServiceAPI: Cart fetched successfully", { userId, itemsCount: response.data.data.items.length });
      return { success: true, data: response.data.data };
    }

    logger.warn("CartServiceAPI: Cart fetch failed", { userId });
    return { success: false, data: null };

  } catch (error) {
    logger.error("CartServiceAPI: Error fetching cart", { error: error.message, userId });
    return { success: false, data: null };
  }
};

const clearCart = async (userId, token, cookies) => {
  try {
    logger.info("CartServiceAPI: Clearing cart for user", { userId });
    
    // Cart service mein clear endpoint banana padega
    // Abhi ke liye skip kar sakte ho
    
    return { success: true };
  } catch (error) {
    logger.error("CartServiceAPI: Error clearing cart", { error: error.message, userId });
    return { success: false };
  }
};

module.exports = { getCartByUserId, clearCart };