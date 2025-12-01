const orderService = require("../services/orderService");
const { createOrderSchema } = require("../validation/orderValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

const createOrder = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;
  const token = req.cookies.token;

  try {
    logger.info("OrderController: createOrder - API Request initiated", { userId, userEmail });

    const { error } = createOrderSchema.validate({ userId });
    if (error) {
      logger.warn("OrderController: createOrder - Validation failed", { error: error.details[0].message, userId });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
        data: MESSAGES.DATA_NULL,
      });
    }

    const resp = await orderService.createOrder({ 
      userId, 
      userEmail, 
      userName,
      token,
      cookies: req.cookies
    });

    if (!resp.success) {
      logger.warn("OrderController: createOrder - Order creation failed", { userId, message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info("OrderController: createOrder - Redis cache cleared", { cacheKey });

    return res.status(resp.statusCode || STATUS_CODES.CREATED).json({
      success: true,
      message: resp.message,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: createOrder - Unexpected error", { error: error.message, userId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ORDER_CREATED_SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

const getUserOrders = async (req, res) => {
  const userId = req.user?.userId?.toString();

  try {
    logger.info("OrderController: getUserOrders - API Request initiated", { userId });

    const cacheKey = `orders:${userId}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("OrderController: getUserOrders - Orders fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ORDERS_FETCH_SUCCESS_CACHE,
        data: parsed,
      });
    }

    const resp = await orderService.getUserOrders({ userId });

    if (!resp.success) {
      logger.warn("OrderController: getUserOrders - No orders found", { userId, message: resp.message });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    if (resp.data && resp.data.length > 0) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(resp.data));
      logger.info("OrderController: getUserOrders - Orders cached in Redis", { cacheKey });
    } else {
      await redisClient.setEx(cacheKey, 300, JSON.stringify([]));
      logger.info("OrderController: getUserOrders - Empty orders cached", { cacheKey });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.ORDERS_FETCH_SUCCESS_DB,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: getUserOrders - Unexpected error", { error: error.message, userId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

const markOrderPaid = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;
  const orderId = req.params.id;

  try {
    logger.info("OrderController: markOrderPaid - API Request initiated", { userId, orderId });

    if (!userEmail || !userName) {
      logger.warn("OrderController: markOrderPaid - User email or name missing", { userId, orderId });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.USER_EMAIL_NAME_MISSING,
        data: MESSAGES.DATA_NULL,
      });
    }

    const resp = await orderService.markOrderPaid({ userId, orderId, userEmail, userName });

    if (!resp.success) {
      logger.warn("OrderController: markOrderPaid - Order payment update failed", { userId, orderId });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info("OrderController: markOrderPaid - Redis cache cleared", { cacheKey });

    return res.status(resp.statusCode || STATUS_CODES.OK).json({
      success: true,
      message: resp.message,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: markOrderPaid - Unexpected error", { error: error.message, orderId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ORDER_UPDATE_PAYMENT_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };