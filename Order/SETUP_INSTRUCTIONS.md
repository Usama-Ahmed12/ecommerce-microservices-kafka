# Order Service Setup Instructions

## Problem Summary
Order service Cart service ko call kar rahi hai lekin token properly forward nahi ho raha.

## Solution
Order service ko cookies properly handle karni chahiye aur Cart service ko call karte waqt cookies forward karni chahiye.

## Steps to Fix

### 1. Ensure cookie-parser is installed
```bash
cd Order
npm install cookie-parser
```

### 2. Update Order/app.js to use cookie-parser
Add this line after other middleware:
```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

### 3. Token should be extracted from cookies in controller
Already done in Order/controllers/orderController.js

### 4. Token should be passed to Cart service with cookies
Update Order/utils/cartServiceApi.js to forward cookies properly

## Testing
1. Login: POST http://localhost:3001/api/auth/login
2. Add to cart: POST http://localhost:3003/api/cart/add
3. Create order: POST http://localhost:3004/api/orders/create

All requests should use same cookies/session.
