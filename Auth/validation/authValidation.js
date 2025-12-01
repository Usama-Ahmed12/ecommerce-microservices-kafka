const Joi = require("joi");

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters long"
  }),
  lastName: Joi.string().min(2).required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters long"
  }),
  phoneNumber: Joi.string().min(10).required().messages({
    "string.empty": "Phone number is required",
    "string.min": "Phone number must be at least 10 digits long"
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long"
  }),
  address: Joi.string().allow("", null).messages({
    "string.base": "Address must be a string"
  }),
  role: Joi.string().valid("user", "admin").optional().messages({
    "any.only": "Role must be either 'user' or 'admin'"
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required"
  })
});

const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email"
  })
});
module.exports = { registerSchema, loginSchema, refreshTokenSchema, resendVerificationSchema };