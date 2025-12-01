# E-Commerce Microservices Architecture

## 🎯 Overview
Complete e-commerce backend built with **true microservices architecture** - each service has its own independent database.

## 🏗️ Architecture

```
5 Independent Microservices + 5 Separate Databases
```

| Service | Port | Database | Status |
|---------|------|----------|--------|
| **Auth Service** | 3001 | `auth_db` | ✅ Complete |
| **Product Service** | 3002 | `product_db` | ✅ Complete |
| **Cart Service** | 3003 | `cart_db` | ✅ Complete |
| **Order Service** | 3004 | `order_db` | ✅ Complete |
| **User Service** | 3005 | `user_db` | ✅ Complete |

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### 2. Start MongoDB
```bash
mongod
```

### 3. Start All Services

Open 5 terminals and run:

```bash
# Terminal 1
cd Auth && npm install && npm run dev

# Terminal 2
cd Product && npm install && npm run dev

# Terminal 3
cd Cart && npm install && npm run dev

# Terminal 4
cd Order && npm install && npm run dev

# Terminal 5
cd User && npm install && npm run dev
```

### 4. Verify All Services
```bash
# Windows
test-all-services.bat

# Linux/Mac
./test-all-services.sh
```

### 5. Check Databases
```bash
node check-databases.js
```

## 📚 Documentation

- **[MICROSERVICES_GUIDE.md](MICROSERVICES_GUIDE.md)** - Complete architecture guide
- **[DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)** - Database separation details
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Step-by-step testing instructions

## 🔑 Key Features

### True Microservices Architecture
- ✅ **Separate Databases** - Each service has its own MongoDB database
- ✅ **Independent Deployment** - Deploy services individually
- ✅ **Fault Isolation** - One service failure doesn't affect others
- ✅ **Independent Scaling** - Scale services based on load
- ✅ **Technology Freedom** - Can use different databases per service

### Security
- ✅ JWT Authentication
- ✅ HTTP-only Cookies
- ✅ Helmet Security Headers
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Password Hashing (bcrypt)

### Features
- ✅ User Registration & Login
- ✅ Email Verification
- ✅ Product Management (CRUD)
- ✅ Shopping Cart
- ✅ Order Processing
- ✅ User Profile Management
- ✅ Admin Panel
- ✅ Logging (Winston)
- ✅ Error Handling

## 🗄️ Database Structure

```
MongoDB (localhost:27017)
├── auth_db      → User authentication
├── product_db   → Product catalog
├── cart_db      → Shopping carts
├── order_db     → Orders
└── user_db      → User profiles
```

## 🔧 Configuration

Each service needs a `.env` file:

### Auth Service
```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/auth_db
JWT_SECRET=mysecretkey
JWT_REFRESH_SECRET=myrefreshsecretkey
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Product Service
```env
PORT=3002
MONGO_URI=mongodb://127.0.0.1:27017/product_db
JWT_SECRET=mysecretkey
```

### Cart Service
```env
PORT=3003
MONGO_URI=mongodb://127.0.0.1:27017/cart_db
JWT_SECRET=mysecretkey
```

### Order Service
```env
PORT=3004
MONGO_URI=mongodb://127.0.0.1:27017/order_db
JWT_SECRET=mysecretkey
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### User Service
```env
PORT=3005
MONGO_URI=mongodb://127.0.0.1:27017/user_db
JWT_SECRET=mysecretkey
```

**Important:** All services must use the **same JWT_SECRET**!

## 📡 API Endpoints

### Auth Service (3001)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/logout` - Logout user

### Product Service (3002)
- `GET /api/products` - Get all products
- `POST /api/products` - Add product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart Service (3003)
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:id` - Remove from cart

### Order Service (3004)
- `POST /api/orders/create` - Place order
- `GET /api/orders` - Get user orders
- `GET /api/orders/all` - Get all orders (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)

### User Service (3005)
- `GET /api/users/profile` - Get user profile
- `DELETE /api/users/delete` - Delete own account
- `DELETE /api/users/delete/:id` - Delete user (admin)

## 🧪 Testing

### Health Check All Services
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

### Complete User Flow
```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"Test@123","phoneNumber":"1234567890"}'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test@123"}' \
  -c cookies.txt

# 3. Get Products
curl http://localhost:3002/api/products -b cookies.txt

# 4. Add to Cart
curl -X POST http://localhost:3003/api/cart/add \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"productId":"PRODUCT_ID","quantity":2}'

# 5. Place Order
curl -X POST http://localhost:3004/api/orders/create \
  -b cookies.txt

# 6. Get Profile
curl http://localhost:3005/api/users/profile -b cookies.txt
```

## 📊 Monitoring

### Check Databases
```bash
mongosh

show dbs
# Should show: auth_db, product_db, cart_db, order_db, user_db

use auth_db
db.users.countDocuments()

use product_db
db.products.countDocuments()

use cart_db
db.carts.countDocuments()

use order_db
db.orders.countDocuments()

use user_db
db.users.countDocuments()
```

### View Logs
```bash
# Auth Service logs
tail -f Auth/logs/combined.log

# Product Service logs
tail -f Product/logs/combined.log

# All error logs
tail -f */logs/error.log
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Change port in .env
PORT=3006
```

### MongoDB Not Running
```bash
# Start MongoDB
mongod

# Verify
mongosh
```

### JWT Token Issues
- Ensure all services use same `JWT_SECRET`
- Check cookie is being sent
- Login again for fresh token

## 🚀 Deployment

### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  auth-service:
    build: ./Auth
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
  
  # ... other services
```

### PM2 (Process Manager)
```bash
pm2 start Auth/server.js --name auth-service
pm2 start Product/server.js --name product-service
pm2 start Cart/server.js --name cart-service
pm2 start Order/server.js --name order-service
pm2 start User/server.js --name user-service

pm2 save
pm2 startup
```

## 📈 Next Steps

- [ ] Add API Gateway (Kong, Express Gateway)
- [ ] Implement Service Discovery (Consul)
- [ ] Add Load Balancing (Nginx)
- [ ] Implement Caching (Redis)
- [ ] Add Message Queue (RabbitMQ)
- [ ] Set up Monitoring (Prometheus + Grafana)
- [ ] Implement CI/CD Pipeline
- [ ] Add Unit & Integration Tests

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License

## 👨‍💻 Author

E-Commerce Microservices Team

---

**Status:** ✅ Production Ready
**Architecture:** True Microservices with Separate Databases
**Last Updated:** 2024

For detailed documentation, see:
- [Microservices Guide](MICROSERVICES_GUIDE.md)
- [Database Architecture](DATABASE_ARCHITECTURE.md)
- [Testing Guide](TESTING_GUIDE.md)
