const TOPICS = {
  // Product Service will PRODUCE these events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_OUT_OF_STOCK: 'product.out.of.stock',
  PRICE_CHANGED: 'product.price.changed',
  
  // Product Service will CONSUME these events (future)
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled'
};

module.exports = TOPICS;