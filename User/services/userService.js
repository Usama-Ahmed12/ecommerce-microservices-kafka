const User = require("../models/userModel");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes");
const MESSAGES = require("../utils/messages");

//  Get User Profile Service
const getUserProfileService = async (userId) => {
  try {
    logger.info("UserService: getUserProfileService - Fetching profile for user", { userId });

    const user = await User.findById(userId).select("-password");

    if (!user) {
      logger.warn("UserService: getUserProfileService - User not found", { userId });
      return { success: false, message: MESSAGES.USER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    logger.info("UserService: getUserProfileService - User profile fetched successfully", { userId });
    return {
      success: true,
      message: MESSAGES.USER_PROFILE_FETCH_SUCCESS,
      profile: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        address: user.address,
        role: user.role,
      },
      statusCode: STATUS_CODES.OK,
    };
  } catch (error) {
    logger.error("UserService: getUserProfileService - Error fetching user profile", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.USER_PROFILE_FETCH_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

//  Delete User Service
const deleteUserService = async (identifier, isAdmin = false) => {
  try {
    logger.info("UserService: deleteUserService - Initiated delete for user", { identifier, isAdmin });

    let user;
    if (isAdmin) {
      user = await User.findOneAndDelete({ email: identifier });
    } else {
      user = await User.findOneAndDelete({ email: identifier });
    }

    if (!user) {
      logger.warn("UserService: deleteUserService - User not found for deletion", { identifier });
      return { success: false, message: MESSAGES.USER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    logger.info("UserService: deleteUserService - User account deleted successfully", { identifier });
    return { success: true, message: MESSAGES.USER_DELETE_SUCCESS, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("UserService: deleteUserService - Error deleting user", { error: error.message, stack: error.stack, identifier });
    return { success: false, message: MESSAGES.USER_DELETE_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

module.exports = {
  getUserProfileService,
  deleteUserService,
};
