module.exports = {
  apps: [
    {
      name: 'order-service',
      script: 'server.js',
      cwd: './Order',
      watch: false,
      instances: 1,
      autorestart: true
    },
    {
      name: 'auth-service',
      script: 'server.js',
      cwd: './Auth',
      watch: false,
      instances: 1,
      autorestart: true
    },
    {
      name: 'cart-service',
      script: 'server.js',
      cwd: './Cart',
      watch: false,
      instances: 1,
      autorestart: true
    },
    {
      name: 'user-service',
      script: 'server.js',
      cwd: './User',
      watch: false,
      instances: 1,
      autorestart: true
    },
    {
      name: 'product-service',
      script: 'server.js',
      cwd: './Product',
      watch: false,
      instances: 1,
      autorestart: true
    }
  ]
};