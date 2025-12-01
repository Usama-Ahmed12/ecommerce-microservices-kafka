const Joi = require("joi");

const addToCartSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "Product ID is required",
    "string.empty": "Product ID cannot be empty",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
});

module.exports = { addToCartSchema };