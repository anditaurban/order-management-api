# Order Management REST API

Production-ready, highly secure, layered Node.js & Express.js REST API for managing orders, products, users, and order items using MySQL 8+ database transactions.

---

## [ASSUMPTION]
1. **User Roles vs. Ownership Authorization**: The database schema does not contain a `roles` table or `role` column in `users`. Consequently, authorization is based strictly on **Resource Ownership Validation** (e.g., users can only view and update their own orders). Product creation, modification, and deletion are available to authenticated users.
2. **Order Cancellation & Stock Restoration**: Cancelling an order (changing status to `cancelled`) restores the stock of affected products within a database transaction. Completed orders cannot be cancelled.
3. **Price Snapshot**: The `price` column in `order_items` stores the unit price snapshot of the product at the exact moment of the transaction, ensuring historical order data remains intact even if product prices change later.

---

## 1. Project Overview
This project is an enterprise-grade Order Management REST API built with Node.js, Express.js, and MySQL 8+. It strictly follows clean layered architecture principles, ensuring complete separation of concerns between HTTP handling, business logic, data access, and database storage.

---

## 2. Architecture
The application follows a strict 6-tier layered architecture:

```
Client (Postman / Web App)
        │
        ▼
Middleware (Helmet, CORS, Rate Limit, Auth JWT, Validation, Centralized Error)
        │
        ▼
Router (Route definitions only - no SQL, no business logic)
        │
        ▼
Controller (Req/Res mapping, parameter extraction, status codes - no SQL, no complex logic)
        │
        ▼
Service (Business logic, calculations, transaction orchestration, domain rules)
        │
        ▼
Repository (Database access, raw SQL parameterized queries, connection handling)
        │
        ▼
MySQL 8+ Connection Pool (order_management database)
```

### Layer Responsibilities:
- **Router**: Defines API endpoints and maps them to controllers and validation middlewares.
- **Controller**: Handles HTTP requests/responses, extracts body/query/params, calls services, and returns standardized JSON responses.
- **Service**: Executes core business logic, calculates subtotals/totals, handles validation checks, and orchestrates atomic MySQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).
- **Repository**: Executes raw SQL queries using parameterized queries (`?`) to prevent SQL Injection and manages row locks (`FOR UPDATE`).
- **Middleware**: Intercepts requests for authentication (JWT), input validation, rate limiting, and global error handling.

---

## 3. Project Structure
```
orders-api/
├── database/
│   ├── schema.sql           # Database DDL schema (Single Source of Truth)
│   └── seed.sql             # Database initial seed data
├── src/
│   ├── app.js               # Express application setup & middleware setup
│   ├── server.js            # Server entry point & process event handling
│   ├── config/
│   │   └── database.js      # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   └── order.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── product.repository.js
│   │   ├── order.repository.js
│   │   └── orderItem.repository.js
│   ├── routes/
│   │   ├── index.js         # API v1 route aggregator
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   └── order.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   └── order.service.js
│   ├── utils/
│   │   ├── apiResponse.js   # Standard JSON response formatters
│   │   ├── appError.js      # Custom error class
│   │   ├── asyncHandler.js  # Async error handler wrapper
│   │   └── jwt.js           # JWT token generator & verifier
│   └── validations/
│       ├── auth.validation.js
│       ├── product.validation.js
│       └── order.validation.js
├── .env.example             # Environment variables template
├── .env                     # Local environment configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Installation
Ensure Node.js (v18+) and MySQL (8.0+) are installed.

```bash
# Clone or navigate to the project directory
cd c:/laragon/www/orders-api

# Install dependencies
npm install
```

---

## 5. Environment Setup
Create a `.env` file in the project root directory (copied from `.env.example`):

```env
PORT=3000
NODE_ENV=development

DB_HOST=zephyr.proxy.rlwy.net
DB_PORT=27654
DB_NAME=order_management
DB_USER=root
DB_PASSWORD=xDvHqbAMQihVyrDQGXhyFWRzyvFSnPrF

JWT_SECRET=supersecret_jwt_key_orders_api_2026_change_in_production
JWT_EXPIRES_IN=1d
```

---

## 6. Database Setup
Create the MySQL database manually if using a local server:

```sql
CREATE DATABASE IF NOT EXISTS order_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 7. Import schema.sql
Import the database schema:

```bash
mysql -h zephyr.proxy.rlwy.net -P 27654 -u root -pxDvHqbAMQihVyrDQGXhyFWRzyvFSnPrF order_management < database/schema.sql
```

---

## 8. Import seed.sql
Import the initial seed data:

```bash
mysql -h zephyr.proxy.rlwy.net -P 27654 -u root -pxDvHqbAMQihVyrDQGXhyFWRzyvFSnPrF order_management < database/seed.sql
```

---

## 9. Run Project

### Development Mode (with hot reloading):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

---

## 10. API Endpoint Summary

| Category | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Register new user account |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Authenticate user & get JWT |
| **Auth** | `GET` | `/api/v1/auth/me` | Bearer Token | Get current user profile |
| **Products** | `GET` | `/api/v1/products` | Public | Get paginated products list |
| **Products** | `GET` | `/api/v1/products/:id` | Public | Get product details by ID |
| **Products** | `POST` | `/api/v1/products` | Bearer Token | Create new product |
| **Products** | `PUT` | `/api/v1/products/:id` | Bearer Token | Update existing product |
| **Products** | `DELETE` | `/api/v1/products/:id` | Bearer Token | Delete product |
| **Orders** | `POST` | `/api/v1/orders` | Bearer Token | Create order (Atomic Transaction) |
| **Orders** | `GET` | `/api/v1/orders` | Bearer Token | Get user's order history |
| **Orders** | `GET` | `/api/v1/orders/:id` | Bearer Token | Get order details & items |
| **Orders** | `PATCH` | `/api/v1/orders/:id/status` | Bearer Token | Update status / cancel order |

---

## 11. Authentication Flow
1. Client sends `POST /api/v1/auth/login` with `{ email, password }`.
2. Service verifies password hash with `bcryptjs`.
3. System generates JWT containing `{ id, email, name }` (No passwords or secrets in payload).
4. Client includes token in HTTP Header: `Authorization: Bearer <JWT_TOKEN>`.
5. `authenticateToken` middleware verifies token validity and populates `req.user`.

---

## 12. Authorization & Ownership Validation
Each request to protected order resources checks ownership:
```javascript
if (order.user_id !== req.user.id) {
    throw new AppError('Access denied. You do not own this order.', 403, 'FORBIDDEN_RESOURCE');
}
```

---

## 13. Business Logic (Order Creation)
When a user creates an order:
1. Verify authenticated user identity.
2. Validate order items payload (`quantity > 0`).
3. Acquire connection from MySQL pool & execute `BEGIN`.
4. Lock product rows `FOR UPDATE` to prevent stock race conditions.
5. Check stock availability for each requested item.
6. Capture product price snapshot and compute item `subtotal` and order `total_amount`.
7. Deduct stock for each purchased product inside transaction.
8. Create record in `orders` table.
9. Batch insert records into `order_items` table.
10. Execute `COMMIT` and release connection.
11. If any step fails, execute `ROLLBACK` to guarantee database consistency.

---

## 14. Transaction Flow
```
Client Request (POST /api/v1/orders)
              │
              ▼
getConnection() from Pool
              │
      beginTransaction()
              │
    SELECT ... FOR UPDATE (Lock products)
              │
  Check Stock >= Requested Quantity?
       ├── NO  ──► ROLLBACK ──► Release Connection ──► Error 400
       └── YES
              │
    Deduct Product Stock (UPDATE products)
              │
    INSERT INTO orders
              │
    INSERT INTO order_items
              │
            COMMIT
              │
      release() Connection
              │
     Return 201 Created Response
```

---

## 15. Security Checklist
- [x] **Password Hashing**: `bcryptjs` (salt round 10). Passwords are never returned or logged.
- [x] **Parameterized Queries**: 100% of queries use placeholders (`?`) via `mysql2` to prevent SQL Injection.
- [x] **JWT Security**: Signed with strong secret from environment variables (`JWT_SECRET`). Expiration enforced.
- [x] **HTTP Security Headers**: `helmet` enabled.
- [x] **CORS Control**: `cors` middleware enabled.
- [x] **Rate Limiting**: `express-rate-limit` prevents brute-force login and API flooding.
- [x] **Payload Limits**: Request body size restricted to `10kb`.
- [x] **Centralized Error Masking**: Operational errors return sanitized JSON. Stack traces and raw SQL error codes are hidden in production.

---

## 16. Testing Strategy
Test endpoints using Postman or cURL:
1. **Register User** (`POST /api/v1/auth/register`).
2. **Login User** (`POST /api/v1/auth/login`) -> Save received `token`.
3. **List Products** (`GET /api/v1/products`).
4. **Create Order** (`POST /api/v1/orders`) with Bearer Token.
5. **Attempt Over-buying** -> Verify HTTP 400 Insufficient Stock response and transaction rollback.

---

## 17. Example Request & Response

### Create Order Request:
`POST /api/v1/orders`  
Header: `Authorization: Bearer <TOKEN>`

**Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 2,
      "quantity": 2
    }
  ]
}
```

### Success Response (HTTP 201 Created):
```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "status": "pending",
      "total_amount": "15500000.00",
      "created_at": "2026-08-18T14:00:00.000Z",
      "updated_at": "2026-08-18T14:00:00.000Z",
      "items": [
        {
          "id": 1,
          "order_id": 1,
          "product_id": 1,
          "product_name": "Laptop Pro 15",
          "product_sku": "PROD-LPT-001",
          "quantity": 1,
          "unit_price": "15000000.00",
          "subtotal": "15000000.00"
        },
        {
          "id": 2,
          "order_id": 1,
          "product_id": 2,
          "product_name": "Wireless Mouse",
          "product_sku": "PROD-MSE-002",
          "quantity": 2,
          "unit_price": "250000.00",
          "subtotal": "500000.00"
        }
      ]
    }
  }
}
```

### Insufficient Stock Error Response (HTTP 400 Bad Request):
```json
{
  "success": false,
  "message": "Insufficient stock for product 'Laptop Pro 15' (SKU: PROD-LPT-001). Available stock: 0, requested: 5.",
  "error": {
    "code": "INSUFFICIENT_STOCK"
  }
}
```

---

## 18. Postman Collection Documentation

> [!TIP]
> **Quick Import**: File Postman Collection siap pakai sudah tersedia di root proyek: [`Order_Management_API.postman_collection.json`](file:///c:/laragon/www/orders-api/Order_Management_API.postman_collection.json).
> Anda dapat langsung meng-import file ini ke Postman. Token JWT akan otomatis tersimpan di collection variable setelah memanggil request **Login User**.

### 1. Register User
- **METHOD**: `POST`
- **URL**: `http://localhost:3000/api/v1/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123"
  }
  ```
- **Authentication**: None
- **Expected Response**: `201 Created`

### 2. Login User
- **METHOD**: `POST`
- **URL**: `http://localhost:3000/api/v1/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password"
  }
  ```
- **Authentication**: None
- **Expected Response**: `200 OK` (Returns JWT token)

### 3. Get Authenticated User Profile
- **METHOD**: `GET`
- **URL**: `http://localhost:3000/api/v1/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Authentication**: Bearer Token
- **Expected Response**: `200 OK`

### 4. Get Products List
- **METHOD**: `GET`
- **URL**: `http://localhost:3000/api/v1/products?page=1&limit=10`
- **Authentication**: None
- **Expected Response**: `200 OK`

### 5. Create Order
- **METHOD**: `POST`
- **URL**: `http://localhost:3000/api/v1/orders`
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "items": [
      { "product_id": 1, "quantity": 1 },
      { "product_id": 2, "quantity": 2 }
    ]
  }
  ```
- **Authentication**: Bearer Token
- **Expected Response**: `201 Created`

### 6. Get User Orders
- **METHOD**: `GET`
- **URL**: `http://localhost:3000/api/v1/orders`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Authentication**: Bearer Token
- **Expected Response**: `200 OK`

### 7. Get Order Details
- **METHOD**: `GET`
- **URL**: `http://localhost:3000/api/v1/orders/1`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Authentication**: Bearer Token
- **Expected Response**: `200 OK`

### 8. Cancel Order
- **METHOD**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/orders/1/status`
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "status": "cancelled"
  }
  ```
- **Authentication**: Bearer Token
- **Expected Response**: `200 OK`
