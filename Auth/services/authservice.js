const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const STATUS_CODES = require('../utils/statusCodes');
const MESSAGES = require('../utils/messages');
const kafkaProducer = require('../kafka/producer');
const TOPICS = require('../kafka/topics');

const generateTokens = (userId, email, firstName) => {
  const accessToken = jwt.sign({ 
    userId, 
    email, 
    firstName 
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
  
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const registerUser = async ({ firstName, lastName, phoneNumber, email, password, address, role }) => {
  try {
    logger.info("Checking if user exists", { email });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return { success: false, message: MESSAGES.REGISTER_USER_EXISTS, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      address,
      role: role || "user",
      verificationToken,
      verificationTokenExpiry,
    });

    logger.info("User created successfully", { userId: user._id, email });

    //  KAFKA EVENT - USER REGISTERED
    await kafkaProducer.publishEvent(TOPICS.USER_REGISTERED, {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      registeredAt: new Date().toISOString()
    });

    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f6f6f6ff; padding: 30px;">
        <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; padding: 20px; text-align: center;">
          <h2 style="color:#222;">Welcome to <span style="color:#E91E63;">Mahas Creation</span> 🎉</h2>
          <p style="font-size:16px; color:#555;">Hi <b>${user.firstName}</b>,</p>
          <p style="font-size:15px; color:#555;">Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}"
             style="display:inline-block;background-color:#E91E63;color:white;padding:12px 25px;
                    border-radius:5px;text-decoration:none;margin-top:10px;font-weight:bold;">
             Verify My Email
          </a>
          <p style="font-size:13px; color:#777; margin-top:20px;">This link will expire in 24 hours.</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #eeeeee;">
          <p style="font-size:12px; color:#999;">Ignore this email if you didn't sign up.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - Mahas Creation",
        html,
      });
      logger.info("Verification email sent to user", { email: user.email });
    } catch (err) {
      logger.warn("Failed to send verification email", { error: err.message });
    }

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: " New User Registered",
        text: `A new user has signed up:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phoneNumber}`,
      });
      logger.info("Admin notified of new registration", { email });
    } catch (err) {
      logger.warn("Failed to notify admin", { error: err.message });
    }

    return { success: true, message: MESSAGES.REGISTER_SUCCESS, statusCode: STATUS_CODES.CREATED };
  } catch (error) {
    logger.error("Register Service Error", { error: error.message });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const verifyEmail = async (token) => {
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return { success: false, message: MESSAGES.VERIFY_EMAIL_INVALID, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationToken: "", verificationTokenExpiry: "" },
      }
    );

    logger.info("User email verified", { email: user.email });

    //  KAFKA EVENT - USER VERIFIED
    await kafkaProducer.publishEvent(TOPICS.USER_VERIFIED, {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      verifiedAt: new Date().toISOString()
    });

    return { success: true, message: MESSAGES.VERIFY_EMAIL_SUCCESS, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("Verify Email Error", { error: error.message });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const resendVerificationEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return { success: false, message: MESSAGES.RESEND_VERIFICATION_USER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    if (user.isVerified) return { success: false, message: MESSAGES.RESEND_VERIFICATION_ALREADY_VERIFIED, statusCode: STATUS_CODES.BAD_REQUEST };

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 24*60*60*1000;

    await User.updateOne(
      { _id: user._id },
      { $set: { verificationToken, verificationTokenExpiry } }
    );

    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f6f6f6ff; padding: 30px;">
        <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; padding: 20px; text-align: center;">
          <h2 style="color:#222;">Welcome to <span style="color:#E91E63;">Mahas Creation</span> 🎉</h2>
          <p style="font-size:16px; color:#555;">Hi <b>${user.firstName}</b>,</p>
          <p style="font-size:15px; color:#555;">Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}"
             style="display:inline-block;background-color:#E91E63;color:white;padding:12px 25px;
                    border-radius:5px;text-decoration:none;margin-top:10px;font-weight:bold;">
             Verify My Email
          </a>
          <p style="font-size:13px; color:#777; margin-top:20px;">This link will expire in 24 hours.</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #eeeeee;">
          <p style="font-size:12px; color:#999;">Ignore this email if you didn't sign up.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - Mahas Creation",
      html,
    });

    return { success: true, message: MESSAGES.RESEND_VERIFICATION_SUCCESS, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("Resend Verification Email Error", { error: error.message });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const loginUser = async ({ email, password }) => {
  try {
    logger.info("Login attempt", { email });

    const user = await User.findOne({ email });
    if (!user) return { success: false, message: MESSAGES.LOGIN_INVALID_CREDENTIALS, statusCode: STATUS_CODES.UNAUTHORIZED };
    if (!user.isVerified) return { success: false, message: MESSAGES.LOGIN_NOT_VERIFIED, statusCode: STATUS_CODES.UNAUTHORIZED };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { success: false, message: MESSAGES.LOGIN_INVALID_CREDENTIALS, statusCode: STATUS_CODES.UNAUTHORIZED };

    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.firstName);
    logger.info("Login successful", { userId: user._id, email });

    //  KAFKA EVENT - USER LOGGED IN (Optional - for analytics)
    await kafkaProducer.publishEvent(TOPICS.USER_LOGGED_IN, {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      loggedInAt: new Date().toISOString()
    });

    return { success: true, message: MESSAGES.LOGIN_SUCCESS, accessToken, refreshToken, statusCode: STATUS_CODES.OK };

  } catch (error) {
    logger.error("Login Service Error", { error: error.message });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

const refreshAccessToken = (payload) => {
  try {
    const decoded = jwt.verify(payload.token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return { success: true, message: MESSAGES.REFRESH_TOKEN_SUCCESS, accessToken, statusCode: STATUS_CODES.OK };
  } catch (error) {
    return { success: false, message: MESSAGES.REFRESH_TOKEN_INVALID, statusCode: STATUS_CODES.FORBIDDEN };
  }
};

module.exports = { registerUser, verifyEmail, loginUser, refreshAccessToken, resendVerificationEmail };