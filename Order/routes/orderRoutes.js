const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, markOrderPaid } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/create', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);
router.put('/:id/pay', authenticate, markOrderPaid);

module.exports = router;