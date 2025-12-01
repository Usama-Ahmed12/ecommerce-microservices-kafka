const express = require("express");
const router = express.Router();
const { getProductById, getAllProducts, addProduct } = require("../controllers/productController");
const uploadAnyImage = require("../middleware/uploadMiddleware");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// GET all products
router.get("/", getAllProducts);

// GET product by ID
router.get("/:id", getProductById);

// POST product (admin only)
router.post("/", authenticate, authorize(["admin"]), uploadAnyImage(), addProduct);

module.exports = router;