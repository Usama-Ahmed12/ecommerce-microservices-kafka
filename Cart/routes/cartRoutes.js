const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { addToCart, getCart, clearCart } = require('../controllers/cartController');

router.post('/add', authenticate, addToCart);
router.get('/', authenticate, getCart);
router.delete('/', authenticate, clearCart);

module.exports = router;