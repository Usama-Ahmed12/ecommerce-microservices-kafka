const Joi = require('joi');

// Validation schema for user profile update (future use)
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
  address: Joi.string().max(200),
});

// Validation schema for password change (future use)
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
