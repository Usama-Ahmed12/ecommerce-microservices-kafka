const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

// Authenticate (token verify from cookie)
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      logger.warn("AuthMiddleware: authenticate - Token missing in cookies.");
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH_TOKEN_MISSING
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug("AuthMiddleware: authenticate - Token decoded successfully", { userId: decoded.userId });

    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("AuthMiddleware: authenticate - User not found for decoded token", { userId: decoded.userId });
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH_USER_NOT_FOUND
      });
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.firstName || user.name,
      role: user.role
    };

    logger.info("AuthMiddleware: authenticate - Authentication successful", { userId: req.user.userId, role: req.user.role });
    next();
  } catch (error) {
    logger.error("AuthMiddleware: authenticate - Authentication failed", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.AUTH_TOKEN_INVALID
    });
  }
};

// Authorize (role check)
const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        logger.error("AuthMiddleware: authorize - req.user not set before authorization.");
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: MESSAGES.SERVER_ERROR
        });
      }

      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        logger.warn("AuthMiddleware: authorize - Access denied", { requiredRoles: roles, userRole });
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: MESSAGES.AUTH_ACCESS_DENIED
        });
      }

      logger.info("AuthMiddleware: authorize - Authorization successful", { userId: req.user.userId, role: userRole });
      next();
    } catch (error) {
      logger.error("AuthMiddleware: authorize - Authorization failed", { error: error.message, stack: error.stack });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.SERVER_ERROR
      });
    }
  };
};

module.exports = { authenticate, authorize };
