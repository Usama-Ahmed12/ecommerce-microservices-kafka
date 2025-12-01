# User Service - Microservice

## Overview
User Service handles all user-related operations including profile management and user deletion.

## Port
- **Default Port:** 3005
- Configure in `.env` file

## Features
- ✅ Get user profile (authenticated)
- ✅ Delete user account (self or admin)
- ✅ JWT authentication via cookies
- ✅ Role-based access control
- ✅ Logging with Winston
- ✅ Security with Helmet & Rate Limiting

## API Endpoints

### Get User Profile
```
GET /api/users/profile
Headers: Cookie with JWT token
Response: User profile data
```

### Delete Own Account
```
DELETE /api/users/delete
Headers: Cookie with JWT token
Response: Success message
```

### Delete User (Admin Only)
```
DELETE /api/users/delete/:id
Headers: Cookie with JWT token (admin role required)
Response: Success message
```

## Environment Variables
```env
PORT=3005
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/user_db
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
BASE_URL=http://localhost:3005
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables

3. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## Database
- Uses MongoDB
- Database: `user_db` (separate database for User Service)
- Collection: `users`
- Independent from other services for true microservices architecture

## Dependencies
- express
- mongoose
- bcrypt
- jsonwebtoken
- winston (logging)
- helmet (security)
- cors
- cookie-parser
- joi (validation)

## Integration with Other Services
This service works independently with its own database (`user_db`):
- Auth Service (Port 3001) - Handles authentication, uses `auth_db`
- Order Service (Port 3004) - Manages orders, uses `order_db`
- Cart Service (Port 3003) - Manages cart, uses `cart_db`
- Product Service (Port 3002) - Manages products, uses `product_db`

**Communication:** Services communicate via REST APIs when needed

## Health Check
```
GET /health
Response: { service: "User Service", status: "OK", port: 3005 }
```

## Logs
- All logs: `logs/combined.log`
- Error logs: `logs/error.log`
