const authService = require('../services/authservice');
const { registerSchema, loginSchema, refreshTokenSchema, resendVerificationSchema } = require('../validation/authValidation');
const logger = require('../utils/logger');
const STATUS_CODES = require('../utils/statusCodes');
const MESSAGES = require('../utils/messages');

const registerUser = async (req, res) => {
  try {
    logger.info("Register API Request", { body: req.body });
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.registerUser(req.body);
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Register Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const resp = await authService.verifyEmail(token);
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Verify Email Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const loginUser = async (req, res) => {
  try {
    logger.info("Login API Request", { body: req.body });
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.loginUser(req.body);

    if (!resp.success) {
      return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
    }

    res.cookie("token", resp.accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    if (resp.refreshToken) {
        res.cookie("refreshToken", resp.refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.LOGIN_SUCCESS,
    });

  } catch (error) {
    logger.error("Login Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    logger.info("Logout successful - Token cookie(s) cleared.");
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.LOGOUT_SUCCESS });
  } catch (error) {
    logger.error("Logout Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const refreshToken = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;

    if (!currentRefreshToken) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.REFRESH_TOKEN_MISSING });
    }

    const resp = await authService.refreshAccessToken({ token: currentRefreshToken });

    if (!resp.success) {
      return res.status(resp.statusCode || STATUS_CODES.FORBIDDEN).json(resp);
    }

    res.cookie("token", resp.accessToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.REFRESH_TOKEN_SUCCESS, accessToken: resp.accessToken });
  } catch (error) {
    logger.error("Refresh Token Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { error } = resendVerificationSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.resendVerificationEmail(req.body.email);
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Resend Verification Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshToken,
  resendVerificationEmail
};
