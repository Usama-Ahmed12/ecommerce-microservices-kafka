const { getUserProfileService, deleteUserService } = require("../services/userService");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

//  Get Logged-in User Profile
const getUserProfile = async (req, res) => {
  try {
    logger.info("UserController: getUserProfile - API Request initiated for user", { userId: req.user.userId });

    const resp = await getUserProfileService(req.user.userId);

    if (!resp.success) {
      logger.warn("UserController: getUserProfile - Failed to fetch user profile from service", { userId: req.user.userId, message: resp.message, statusCode: resp.statusCode });
    }

    return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: resp.success,
      message: resp.message,
      profile: resp.profile || MESSAGES.DATA_NULL,
    });
  } catch (error) {
    logger.error("UserController: getUserProfile - Unexpected error", { error: error.message, stack: error.stack, userId: req.user.userId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.USER_PROFILE_FETCH_ERROR,
      profile: MESSAGES.DATA_NULL,
    });
  }
};

//  Delete User (Admin ya User dono apna account delete kar sakte hain)
const deleteUser = async (req, res) => {
  try {
    logger.info("UserController: deleteUser - API Request initiated", { userId: req.user.userId, role: req.user.role, paramsId: req.params.id });

    const identifier =
      req.user.role === "admin" && req.params.id
        ? req.params.id
        : req.user.email;

    const isAdmin = req.user.role === "admin";

    const resp = await deleteUserService(identifier, isAdmin);

    if (!resp.success) {
      logger.warn("UserController: deleteUser - Failed to delete user from service", { identifier, isAdmin, message: resp.message, statusCode: resp.statusCode });
    }

    return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: resp.success,
      message: resp.message,
    });
  } catch (error) {
    logger.error("UserController: deleteUser - Unexpected error", { error: error.message, stack: error.stack, userId: req.user.userId, identifier: req.params.id });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.USER_DELETE_ERROR,
    });
  }
};

module.exports = {
  getUserProfile,
  deleteUser,
};
