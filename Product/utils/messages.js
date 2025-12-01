// src/utils/messages.js

/**
 * @description Centralized application messages for consistent responses.
 * Add all user-facing or internal messages here.
 */
const MESSAGES = {
  // General Messages
  SUCCESS: "Operation successful",
  SERVER_ERROR: "An unexpected server error occurred. Please try again later.",
  VALIDATION_ERROR: "Validation failed. Please check your input.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access to this resource is forbidden.",
  DATA_NULL: null, // For data field when no data is returned

  // Auth Module Messages
  REGISTER_SUCCESS: "Verification email sent. Please verify your account to log in.",
  REGISTER_USER_EXISTS: "An account with this email already exists.",
  VERIFY_EMAIL_SUCCESS: "Your email has been successfully verified. You can now log in.",
  VERIFY_EMAIL_INVALID: "Invalid or expired verification link. Please request a new one.",
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGIN_INVALID_CREDENTIALS: "Invalid email or password.",
  LOGIN_NOT_VERIFIED: "Please verify your email address before logging in.",
  LOGOUT_SUCCESS: "Logged out successfully. All session data cleared.",
  REFRESH_TOKEN_MISSING: "Refresh token is missing.",
  REFRESH_TOKEN_INVALID: "Invalid or expired refresh token. Please log in again.",
  REFRESH_TOKEN_SUCCESS: "New access token generated successfully.",
  RESEND_VERIFICATION_SUCCESS: "Verification email resent successfully. Check your inbox.",
  RESEND_VERIFICATION_USER_NOT_FOUND: "No user found with this email address.",
  RESEND_VERIFICATION_ALREADY_VERIFIED: "Your account is already verified. No need to resend.",

  // --- NEW AUTH MIDDLEWARE MESSAGES ---
  AUTH_TOKEN_MISSING: "Authentication token is missing. Please log in.", // Added
  AUTH_TOKEN_INVALID: "Authentication token is invalid or expired. Please login again.", // Added
  AUTH_USER_NOT_FOUND: "Authenticated user not found. Please log in again.", // Added
  AUTH_ACCESS_DENIED: "Access denied. You do not have the required permissions.", // Added
  // ------------------------------------

  // Product Module Messages
  PRODUCT_ADDED_SUCCESS: "Product added successfully.",
  PRODUCT_EXISTS: "A product with this name already exists.",
  PRODUCT_NOT_FOUND: "The requested product was not found.",
  PRODUCTS_FETCH_SUCCESS_CACHE: "Products fetched successfully (from cache).",
  PRODUCTS_FETCH_SUCCESS_DB: "Products fetched successfully (from database).",
  PRICE_REQUIRED: "Product price is required and must be a valid number.",
  PRODUCTS_EMPTY_LIST: "No products found matching your criteria.",
  PRODUCT_SERVER_ERROR: "Server error while processing product request.",

  // Cart Module Messages
  ADD_TO_CART_SUCCESS: "Product successfully added to cart.",
  CART_FETCH_SUCCESS_CACHE: "Cart details fetched successfully (from cache).",
  CART_FETCH_SUCCESS_DB: "Cart details fetched successfully (from database).",
  CART_NOT_FOUND: "Your cart is empty or does not exist.",
  CART_SERVER_ERROR: "Server error while managing cart.",
  CART_ITEM_UPDATED: "Cart item quantity updated successfully.",
  CART_ITEM_REMOVED: "Item removed from cart.",
  CART_CLEARED: "Cart cleared successfully.",
  OLD_CARTS_DELETED: "Abandoned carts older than 24 hours deleted successfully.", // NEW

  // Order Module Messages
  ORDER_PLACED_SUCCESS: "Your order has been placed successfully!",
  ORDER_CREATED_SERVER_ERROR: "Server error while creating your order.",
  ORDER_CART_EMPTY: "Cannot place an order with an empty cart.",
  ORDERS_FETCH_SUCCESS_CACHE: "Your past orders fetched successfully (from cache).",
  ORDERS_FETCH_SUCCESS_DB: "Your past orders fetched successfully (from database).",
  ORDER_NOT_FOUND: "The requested order was not found.",
  ORDER_PAID_SUCCESS: "Order payment confirmed successfully. Invoice sent to your email.",
  ORDER_ALREADY_PAID: "This order has already been marked as paid.",
  USER_EMAIL_NAME_MISSING: "User email or name is missing from the request.",
  ORDER_UPDATE_PAYMENT_ERROR: "Server error while updating order payment status.",
  ORDER_STATUS_UPDATED: "Order status updated successfully.",
  OLD_PENDING_ORDERS_CANCELLED: "Old pending orders cancelled successfully.", // NEW

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
