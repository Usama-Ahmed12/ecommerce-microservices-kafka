const cartService = require("../services/cartService");
const { addToCartSchema } = require("../validation/cartValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require('../utils/statusCodes');
const MESSAGES = require('../utils/messages');

const addToCart = async (req, res) => {
  try {
    logger.info("Add to Cart API Request", { body: req.body, userId: req.user?.userId });

    const { error } = addToCartSchema.validate(req.body);
    if (error) {
      logger.warn("Add to Cart Validation Failed", { error: error.details[0].message });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    const resp = await cartService.addToCart({
      userId: req.user.userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    if (!resp.success) {
      logger.warn("Add to Cart Service Failed", { message: resp.message });
    } else {
      logger.info("Item Added to Cart", { userId: req.user.userId, productId: req.body.productId });

      const cacheKey = `cart:${req.user.userId}`;
      await redisClient.del(cacheKey);
      logger.info("Redis cache cleared after cart update", { cacheKey });
    }

    return res.status(resp.statusCode || STATUS_CODES.OK).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("Add to Cart Error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      data: null
    });
  }
};

const getCart = async (req, res) => {
  try {
    logger.info("Get Cart API Request", { userId: req.user?.userId });

    const cacheKey = `cart:${req.user.userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("Cart fetched from Redis cache", { cacheKey });
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.CART_FETCH_SUCCESS_CACHE,
        data: JSON.parse(cachedData),
      });
    }

    const resp = await cartService.getCart({ userId: req.user.userId });

    if (!resp.success) {
      logger.warn("Get Cart Service Failed", { message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: resp.message,
        data: null,
      });
    }

    await redisClient.setEx(cacheKey, 300, JSON.stringify(resp.data));
    logger.info("Cart cached in Redis", { cacheKey });

    logger.info("Cart Fetched Successfully", { userId: req.user.userId });
    return res.status(resp.statusCode || STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.CART_FETCH_SUCCESS_DB,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("Get Cart Error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      data: null
    });
  }
};

const clearCart = async (req, res) => {
  try {
    logger.info("Clear Cart API Request", { userId: req.user?.userId });

    const resp = await cartService.clearCart({ userId: req.user.userId });

    if (!resp.success) {
      logger.warn("Clear Cart Service Failed", { message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: null,
      });
    }

    const cacheKey = `cart:${req.user.userId}`;
    await redisClient.del(cacheKey);
    logger.info("Redis cache cleared after cart clear", { cacheKey });

    logger.info("Cart Cleared Successfully", { userId: req.user.userId });
    return res.status(resp.statusCode || STATUS_CODES.OK).json({
      success: true,
      message: resp.message,
      data: null,
    });
  } catch (error) {
    logger.error("Clear Cart Error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      data: null
    });
  }
};

module.exports = { addToCart, getCart, clearCart };