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
    
    // Product service doesn't need full user - just userId and role
    req.user = {
      userId: decoded.userId,
      role: "admin" // Simplified - ideally fetch from Auth service
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

const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: MESSAGES.SERVER_ERROR
        });
      }

      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        logger.warn("AuthMiddleware: Access denied", { requiredRoles: roles, userRole });
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: MESSAGES.AUTH_ACCESS_DENIED
        });
      }

      next();
    } catch (error) {
      logger.error("AuthMiddleware: Authorization failed", { error: error.message });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.SERVER_ERROR
      });
    }
  };
};

module.exports = { authenticate, authorize };