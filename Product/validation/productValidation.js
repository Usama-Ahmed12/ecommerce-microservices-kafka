const Joi = require("joi");

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Product name should be a type of text",
    "string.empty": "Product name cannot be empty",
    "string.min": "Product name should have at least 3 characters",
    "any.required": "Product name is required",
  }),

  description: Joi.string().min(5).max(500).required().messages({
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have at least 5 characters",
    "any.required": "Description is required",
  }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),

  category: Joi.string().required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),

  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative",
  }),

  variants: Joi.array()
    .items(
      Joi.object({
        color: Joi.string().required().messages({
          "string.empty": "Color is required",
        }),
        stock: Joi.number().integer().min(0).required().messages({
          "number.base": "Stock must be a number",
          "any.required": "Stock is required for variant",
        }),
        price: Joi.number().positive().precision(2).required().messages({
          "number.base": "Variant price must be a number",
          "number.positive": "Variant price must be positive",
          "any.required": "Variant price is required",
        }),
        description: Joi.string().min(3).max(200).optional().messages({
          "string.min": "Variant description should have at least 3 characters",
        }),
      })
    )
    .optional(),

  image: Joi.string().optional(),
});

module.exports = { createProductSchema };