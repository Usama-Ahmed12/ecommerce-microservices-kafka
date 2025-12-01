const Joi = require("joi");

const createOrderSchema = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required to create an order",
    "string.empty": "User ID cannot be empty",
  }),
});

module.exports = { createOrderSchema };