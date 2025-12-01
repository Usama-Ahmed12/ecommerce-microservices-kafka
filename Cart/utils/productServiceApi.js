const axios = require('axios');
const logger = require('./logger');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';

const getProductById = async (productId) => {
  try {
    logger.info("ProductServiceAPI: Fetching product", { productId });
    
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
    
    if (response.data && response.data.success) {
      logger.info("ProductServiceAPI: Product fetched", { productId });
      return { success: true, data: response.data.data };
    }

    logger.warn("ProductServiceAPI: Product not found", { productId });
    return { success: false, data: null };

  } catch (error) {
    logger.error("ProductServiceAPI: Error fetching product", { error: error.message, productId });
    return { success: false, data: null };
  }
};

module.exports = { getProductById };