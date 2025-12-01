const TOPICS = {
  // Cart Service will PRODUCE these events
  CART_ITEM_ADDED: 'cart.item.added',
  CART_ITEM_REMOVED: 'cart.item.removed',
  CART_CLEARED: 'cart.cleared',
  CART_ABANDONED: 'cart.abandoned',
  
  // Cart Service will CONSUME these events
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_OUT_OF_STOCK: 'product.out.of.stock',
  PRICE_CHANGED: 'product.price.changed'
};

module.exports = TOPICS;