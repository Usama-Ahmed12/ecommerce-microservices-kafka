const TOPICS = {
  // Order Service will PRODUCE these events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  
  // Order Service will CONSUME these events
  CART_UPDATED: 'cart.updated',
  PRODUCT_UPDATED: 'product.updated',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed'
};

module.exports = TOPICS;