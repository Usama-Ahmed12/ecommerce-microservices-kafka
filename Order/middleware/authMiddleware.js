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
    
    //  Updated: Extract email and firstName from token
    req.user = {
      userId: decoded.userId,
      email: decoded.email || "user@example.com",
      name: decoded.firstName || "User"
    };

    logger.info("AuthMiddleware: Authentication successful", { 
      userId: req.user.userId, 
      email: req.user.email 
    });
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