const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      logger.warn("AuthMiddleware: Token missing");
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH_TOKEN_MISSING
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      userId: decoded.userId
    };

    logger.info("AuthMiddleware: Authentication successful", { userId: req.user.userId });
    next();
  } catch (error) {
    logger.error("AuthMiddleware: Authentication failed", { error: error.message });
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.AUTH_TOKEN_INVALID
    });
  }
};

module.exports = { authenticate };