# User Service - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd User
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
PORT=3005
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/user_db
JWT_SECRET=mysecretkey
JWT_REFRESH_SECRET=myrefreshsecretkey
BASE_URL=http://localhost:3005
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Run the Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Test the Service
```bash
# Health check
curl http://localhost:3005/health

# Get user profile (requires auth token in cookie)
curl http://localhost:3005/api/users/profile \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

## Service Architecture

```
User/
├── config/          # Database configuration
├── controllers/     # Request handlers
├── middleware/      # Auth middleware
├── models/          # User model
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utilities (logger, messages, status codes)
├── validation/      # Input validation schemas
├── logs/            # Application logs
├── app.js           # Express app setup
├── server.js        # Server entry point
└── package.json     # Dependencies
```

## API Documentation

### Authentication Required
All endpoints require JWT token in cookies (set by Auth Service).

### Endpoints

#### 1. Get User Profile
```http
GET /api/users/profile
Cookie: token=<JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile fetched successfully.",
  "profile": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "address": "123 Main St",
    "role": "user"
  }
}
```

#### 2. Delete Own Account
```http
DELETE /api/users/delete
Cookie: token=<JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "User account deleted successfully."
}
```

#### 3. Delete User by Email (Admin Only)
```http
DELETE /api/users/delete/:email
Cookie: token=<ADMIN_JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "User account deleted successfully."
}
```

## Integration with Other Services

### Auth Service (Port 3001)
- Handles user registration and login
- Sets JWT token in cookies
- User Service verifies these tokens

### Order Service (Port 3004)
- Fetches user details for orders
- Shares same database

### Cart Service (Port 3003)
- Links cart to user
- Shares same database

## Database Schema

```javascript
{
  firstName: String (required),
  lastName: String (required),
  phoneNumber: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  address: String (default: ""),
  role: String (enum: ["user", "admin"], default: "user"),
  isVerified: Boolean (default: false),
  verificationToken: String,
  verificationTokenExpiry: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Security Features

- ✅ Helmet for secure headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS enabled
- ✅ JWT token verification
- ✅ Role-based access control
- ✅ Password excluded from responses

## Logging

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

View logs:
```bash
# Real-time monitoring
tail -f logs/combined.log

# View errors only
cat logs/error.log
```

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3006
```

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in `.env`
- Verify database name matches other services

### JWT Token Invalid
- Ensure JWT_SECRET matches Auth Service
- Check token expiry
- Verify cookie is being sent

### User Not Found
- Check if user exists in database
- Verify userId in JWT token
- Check database connection

## Development Tips

1. **Use nodemon for auto-restart:**
   ```bash
   npm run dev
   ```

2. **Check service health:**
   ```bash
   curl http://localhost:3005/health
   ```

3. **View logs in real-time:**
   ```bash
   tail -f logs/combined.log
   ```

4. **Test with Postman:**
   - Import API collection
   - Set cookie with JWT token from Auth Service

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up proper MongoDB replica set
5. Configure reverse proxy (Nginx)
6. Set up monitoring and alerts
7. Regular database backups

## Next Steps

- [ ] Add user profile update endpoint
- [ ] Add password change functionality
- [ ] Add user search for admin
- [ ] Add pagination for user lists
- [ ] Add user activity logs
- [ ] Add email notifications
- [ ] Add profile picture upload

---

**Service Status:** ✅ Ready for Production
**Last Updated:** 2024
