const TOPICS = {
  // Auth Service will PRODUCE these events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_LOGGED_IN: 'user.logged.in',
  PASSWORD_RESET: 'user.password.reset',
  
  // Auth Service will CONSUME these events (future)
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid'
};

module.exports = TOPICS;