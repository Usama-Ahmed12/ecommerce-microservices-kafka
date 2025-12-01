/**
 * @description Centralized application messages for consistent responses.
 */
const MESSAGES = {
  // General Messages
  SUCCESS: "Operation successful",
  SERVER_ERROR: "An unexpected server error occurred. Please try again later.",
  VALIDATION_ERROR: "Validation failed. Please check your input.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access to this resource is forbidden.",
  DATA_NULL: null,

  // Auth Middleware Messages
  AUTH_TOKEN_MISSING: "Authentication token is missing. Please log in.",
  AUTH_TOKEN_INVALID: "Authentication token is invalid or expired. Please login again.",
  AUTH_USER_NOT_FOUND: "Authenticated user not found. Please log in again.",
  AUTH_ACCESS_DENIED: "Access denied. You do not have the required permissions.",

  // User Module Messages
  USER_PROFILE_FETCH_SUCCESS: "User profile fetched successfully.",
  USER_NOT_FOUND: "User account not found.",
  USER_DELETE_SUCCESS: "User account deleted successfully.",
  USER_PROFILE_FETCH_ERROR: "Could not retrieve user profile.",
  USER_DELETE_ERROR: "Server error while attempting to delete user account.",
  USER_UPDATE_SUCCESS: "User profile updated successfully.",
  USER_PASSWORD_CHANGED: "Password changed successfully.",
};

module.exports = MESSAGES;
