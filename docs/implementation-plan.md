# System Architecture & Technical Implementation Specification

## 1. System Architecture Overview

The **Order Management REST API** follows a clean **Layered Architecture Pattern** (N-Tier Architecture), ensuring total decoupling between transport protocol (HTTP/Express), request validation, business application logic, data persistence, and the relational database.

```mermaid
graph TD
    Client[Client / Mobile / Web App] -->|HTTP Requests| Helmet[Security & CORS Middlewares]
    Helmet --> RateLimiter[Rate Limiting Middleware]
    RateLimiter --> Router[Express Router /api/v1]
    
    subgraph Routing & Middleware Layer
        Router --> AuthMW[auth.middleware.js]
        Router --> ValMW[validate.middleware.js + express-validator]
    end
    
    subgraph Controller Layer
        AuthMW --> AuthCtrl[auth.controller.js]
        ValMW --> ProductCtrl[product.controller.js]
        ValMW --> OrderCtrl[order.controller.js]
    end
    
    subgraph Service Layer
        AuthCtrl --> AuthService[auth.service.js]
        ProductCtrl --> ProductService[product.service.js]
        OrderCtrl --> OrderService[order.service.js]
    end
    
    subgraph Repository Layer
        AuthService --> UserRepo[user.repository.js]
        ProductService --> ProductRepo[product.repository.js]
        OrderService --> OrderRepo[order.repository.js]
        OrderService --> OrderItemRepo[orderItem.repository.js]
        OrderService --> ProductRepo
    end
    
    subgraph Database Layer
        UserRepo --> Pool[(MySQL 8 Pool / InnoDB)]
        ProductRepo --> Pool
        OrderRepo --> Pool
        OrderItemRepo --> Pool
    end

    Controller Layer -. Catch Errors .-> AsyncHandler[asyncHandler.js]
    AsyncHandler -. Forward to .-> ErrorMW[Centralized error.middleware.js]
    ErrorMW -->|JSON Envelope| Client
```

---

## 2. Directory Structure & Responsibilities

```
orders-api/
├── database/
│   ├── schema.sql                 # MySQL Table DDL & Relational Schema
│   └── seed.sql                   # Database Seeder Data for Dev/Testing
├── docs/                          # Single Source of Truth (SOT) Documentation Suite
│   ├── prd.md                     # Product Requirement Document
│   ├── implementation-plan.md     # Architecture & System Design Specs
│   ├── api-contract.md            # REST API Endpoint Specifications
│   ├── data-model.md              # Database Schema & ERD Specifications
│   └── agents.md                  # AI Prompting & Coding Guidelines
├── src/
│   ├── config/
│   │   └── database.js            # MySQL2 Promise Connection Pool Singleton
│   ├── controllers/               # HTTP Request Parsers & Response Handlers
│   │   ├── auth.controller.js
│   │   ├── order.controller.js
│   │   └── product.controller.js
│   ├── middlewares/               # Custom Express Middlewares
│   │   ├── auth.middleware.js     # JWT Bearer Token Verification
│   │   ├── error.middleware.js    # Global Centralized Error Handler (404 & 500)
│   │   ├── rateLimiter.middleware.js # Express Rate Limiting Configuration
│   │   └── validate.middleware.js  # Express-Validator Result Processor
│   ├── repositories/              # Raw SQL Data Access Objects (DAO)
│   │   ├── order.repository.js
│   │   ├── orderItem.repository.js
│   │   ├── product.repository.js
│   │   └── user.repository.js
│   ├── routes/                    # API Route Definitions & Middleware Chaining
│   │   ├── auth.routes.js
│   │   ├── index.js               # Route Aggregator (/api/v1)
│   │   ├── order.routes.js
│   │   └── product.routes.js
│   ├── services/                  # Core Business & Transaction Logic
│   │   ├── auth.service.js
│   │   ├── order.service.js
│   │   └── product.service.js
│   ├── utils/                     # Utility Helper Functions
│   │   ├── apiResponse.js         # Standard JSON Response Envelope Builders
│   │   ├── appError.js            # Custom Operational Error Class
│   │   ├── asyncHandler.js         # Wrapper for Async Controller Exceptions
│   │   └── jwt.js                 # JWT Sign & Verify Utilities
│   ├── validations/               # Express-Validator Validation Chains
│   │   ├── auth.validation.js
│   │   ├── order.validation.js
│   │   └── product.validation.js
│   ├── app.js                     # Express Application Initialization & Middlewares
│   └── server.js                  # Node.js HTTP Server Entrypoint & Bootloader
├── .env                           # Environment Variables Configuration
├── .env.example                   # Environment Template File
├── Order_Management_API.postman_collection.json # API Testing Collection
├── package.json                   # Dependencies & Scripts Definition
└── README.md                      # Project Overview & Setup Instructions
```

### Layer Responsibilities Matrix

| Layer | Responsibility | Do's | Don'ts |
| :--- | :--- | :--- | :--- |
| **Routes** | Define HTTP verb, URL path, bind middlewares, delegate to controller. | Keep thin, use expressive route paths. | Never write business logic or SQL here. |
| **Validations** | Inspect `req.body`, `req.query`, `req.params` against schemas using `express-validator`. | Check data types, minimums, string lengths. | Do not query database for complex rules. |
| **Middlewares** | Cross-cutting concerns (Auth JWT, Rate Limiting, Error Handling, Request Validation). | Call `next()` or throw `AppError`. | Avoid mutating business payload arbitrarily. |
| **Controllers** | Extract HTTP request inputs, invoke service layer, return formatted response using `apiResponse`. | Wrap methods with `asyncHandler`. | Never construct SQL statements or perform database operations directly. |
| **Services** | Core business logic, transactional control (`connection.beginTransaction()`), domain validation. | Manage transactions, enforce row locks (`FOR UPDATE`). | Do not access `req` or `res` objects directly. |
| **Repositories** | Execute raw SQL statements against MySQL connection or pool. | Use parameterized queries (`?`). Return plain JS objects. | Never make business decisions (e.g. stock sufficiency checks belong in services). |

---

## 3. Core Technical Mechanics

### 3.1 MySQL Transaction Management Pattern

For multi-step atomic operations (e.g. `OrderService.createOrder` and `OrderService.updateOrderStatus`), the service layer acquires a single connection from the pool and handles the lifecycle:

```javascript
// Example Transaction Standard Pattern
const connection = await pool.getConnection();
try {
    await connection.beginTransaction();

    // 1. Lock rows with FOR UPDATE
    const product = await productRepository.findByIdForUpdate(connection, productId);

    // 2. Perform business checks & updates using the SAME connection
    await productRepository.updateStockWithConnection(connection, productId, newStock);
    const orderId = await orderRepository.createWithConnection(connection, orderData);

    // 3. Commit transaction
    await connection.commit();
    return result;
} catch (error) {
    // 4. Rollback on any failure
    await connection.rollback();
    throw error;
} finally {
    // 5. Always release connection back to pool
    connection.release();
}
```

### 3.2 Error Handling & Envelope Strategy

1. **Operational Errors (`AppError`)**:
   Constructed with custom `message`, `statusCode`, and machine-readable `errorCode`.
2. **Unhandled Exceptions**:
   Caught by global `errorHandler` middleware. Formatted cleanly into standard JSON envelope without leaking internal stack traces in production environment.

#### Success Envelope Format:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": { ... }
}
```

#### Error Envelope Format:
```json
{
  "success": false,
  "message": "Insufficient stock for product 'Laptop Pro 15'.",
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "details": null
  }
}
```

---

## 4. Environment Variables Configuration

| Variable | Description | Default Value | Required? |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP Server Listening Port | `3000` | No |
| `NODE_ENV` | Environment Runtime Mode (`development` / `production`) | `development` | No |
| `DB_HOST` | MySQL Server Hostname | `localhost` | Yes |
| `DB_PORT` | MySQL Server Port | `3306` | Yes |
| `DB_USER` | MySQL Username | `root` | Yes |
| `DB_PASSWORD` | MySQL Password | `""` | Yes |
| `DB_NAME` | MySQL Database Name | `order_management` | Yes |
| `JWT_SECRET` | Secret key for signing access tokens | `fallback_secret_for_dev_only` | Yes (in Prod) |
| `JWT_EXPIRES_IN` | Token validity duration | `1d` | No |
