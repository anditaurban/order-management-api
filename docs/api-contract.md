# API Specification & Contract — Order Management REST API

## 1. Overview & Conventions

- **Base URL**: `http://localhost:3000/api/v1`
- **Protocol**: HTTP / HTTPS
- **Content Type**: `application/json`
- **Authentication**: Bearer JWT in Request Headers: `Authorization: Bearer <JWT_TOKEN>`

---

## 2. Standard Response Envelopes

### 2.1 Success Envelope Schema
All successful API responses return HTTP 2xx status code with the following JSON envelope:

```json
{
  "success": true,
  "message": "Human-readable summary message",
  "data": { ... } // Object, Array, or omitted if no data payload
}
```

### 2.2 Error Envelope Schema
All error API responses return HTTP 4xx or 5xx status code with the following JSON envelope:

```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "error": {
    "code": "MACHINE_READABLE_ERROR_CODE",
    "details": null // Object containing validation error arrays if applicable
  }
}
```

---

## 3. Machine-Readable Error Code Catalog

| Error Code | HTTP Status | Trigger Condition |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 Bad Request | Payload validation failed (missing required fields, bad data types). |
| `EMPTY_ORDER_ITEMS` | 400 Bad Request | Request `items` array is empty or missing. |
| `DUPLICATE_ORDER_PRODUCT` | 400 Bad Request | Same `product_id` submitted multiple times in single order request. |
| `INSUFFICIENT_STOCK` | 400 Bad Request | Requested quantity exceeds available product stock in database. |
| `ORDER_ALREADY_CANCELLED` | 400 Bad Request | Attempted to update or cancel an order that is already `cancelled`. |
| `CANNOT_CANCEL_COMPLETED_ORDER` | 400 Bad Request | Attempted to cancel an order with `completed` status. |
| `PRODUCT_IN_USE` | 400 Bad Request | Attempted to delete product linked to existing order items. |
| `UNAUTHENTICATED` | 401 Unauthorized | Missing or malformed `Authorization` header. |
| `INVALID_TOKEN` | 401 Unauthorized | Provided JWT token is invalid or signature check failed. |
| `TOKEN_EXPIRED` | 401 Unauthorized | Provided JWT token has passed its expiration lifespan. |
| `INVALID_CREDENTIALS` | 401 Unauthorized | Email address not found or password hash mismatch during login. |
| `FORBIDDEN_RESOURCE` | 403 Forbidden | User attempts to view or modify an order belonging to another user. |
| `NOT_FOUND` | 404 Not Found | Requested URL route does not exist. |
| `USER_NOT_FOUND` | 404 Not Found | Specified user ID does not exist in database. |
| `PRODUCT_NOT_FOUND` | 404 Not Found | Specified product ID does not exist in database. |
| `ORDER_NOT_FOUND` | 404 Not Found | Specified order ID does not exist in database. |
| `EMAIL_EXISTS` | 409 Conflict | Email address is already registered in database during signup. |
| `SKU_EXISTS` | 409 Conflict | SKU code is already assigned to another product in database. |
| `TOO_MANY_REQUESTS` | 429 Too Many Requests | Client exceeded rate limit request quotas. |
| `INTERNAL_ERROR` | 500 Internal Error | Unhandled backend exception or database failure. |

---

## 4. Endpoints Specification

### 4.1 Authentication Module

#### `POST /auth/register`
Create a new user account.

- **Auth Required**: No (Public Endpoint)
- **Rate Limit**: Auth Limiter (10 req / 15 min)
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Validation Rules**:
  - `name`: string, required, 2 - 100 characters.
  - `email`: string, required, valid email format.
  - `password`: string, required, minimum 6 characters.
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": 4,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "created_at": "2026-08-19T09:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkXVCJ9..."
  }
}
```
- **Error Responses**: `400 VALIDATION_ERROR`, `409 EMAIL_EXISTS`

---

#### `POST /auth/login`
Authenticate existing user and issue access token.

- **Auth Required**: No (Public Endpoint)
- **Rate Limit**: Auth Limiter (10 req / 15 min)
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "user": {
      "id": 4,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkXVCJ9..."
  }
}
```
- **Error Responses**: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`

---

#### `GET /auth/me`
Retrieve authenticated user profile.

- **Auth Required**: Yes (Bearer Token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "user": {
      "id": 4,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "created_at": "2026-08-19T09:00:00.000Z",
      "updated_at": "2026-08-19T09:00:00.000Z"
    }
  }
}
```
- **Error Responses**: `401 UNAUTHENTICATED`, `401 INVALID_TOKEN`, `404 USER_NOT_FOUND`

---

### 4.2 Product Catalog Module

#### `GET /products`
Retrieve paginated product catalog with optional search & price filters.

- **Auth Required**: No (Public Endpoint)
- **Query Parameters**:
  - `page` (optional): integer >= 1 (default: 1)
  - `limit` (optional): integer 1-100 (default: 20)
  - `search` (optional): string (matches product `name` or `sku`)
  - `minPrice` (optional): numeric >= 0
  - `maxPrice` (optional): numeric >= 0
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Products retrieved successfully.",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Laptop Pro 15",
        "sku": "PROD-LPT-001",
        "price": "15000000.00",
        "stock": 25,
        "created_at": "2026-08-19T08:00:00.000Z",
        "updated_at": "2026-08-19T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

#### `GET /products/:id`
Get single product detail by ID.

- **Auth Required**: No (Public Endpoint)
- **Path Parameters**: `id` (integer, required)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product retrieved successfully.",
  "data": {
    "product": {
      "id": 1,
      "name": "Laptop Pro 15",
      "sku": "PROD-LPT-001",
      "price": "15000000.00",
      "stock": 25,
      "created_at": "2026-08-19T08:00:00.000Z",
      "updated_at": "2026-08-19T08:00:00.000Z"
    }
  }
}
```
- **Error Responses**: `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND`

---

#### `POST /products`
Create a new product item.

- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
```json
{
  "name": "Ergonomic Office Chair",
  "sku": "PROD-CHR-006",
  "price": 2450000.00,
  "stock": 30
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Product created successfully.",
  "data": {
    "product": {
      "id": 6,
      "name": "Ergonomic Office Chair",
      "sku": "PROD-CHR-006",
      "price": "2450000.00",
      "stock": 30,
      "created_at": "2026-08-19T09:30:00.000Z",
      "updated_at": "2026-08-19T09:30:00.000Z"
    }
  }
}
```
- **Error Responses**: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `409 SKU_EXISTS`

---

#### `PUT /products/:id`
Update an existing product item.

- **Auth Required**: Yes (Bearer Token)
- **Request Body** (Partial or full update permitted):
```json
{
  "price": 2300000.00,
  "stock": 45
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product updated successfully.",
  "data": {
    "product": {
      "id": 6,
      "name": "Ergonomic Office Chair",
      "sku": "PROD-CHR-006",
      "price": "2300000.00",
      "stock": 45,
      "created_at": "2026-08-19T09:30:00.000Z",
      "updated_at": "2026-08-19T09:35:00.000Z"
    }
  }
}
```
- **Error Responses**: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `404 PRODUCT_NOT_FOUND`, `409 SKU_EXISTS`

---

#### `DELETE /products/:id`
Delete a product item.

- **Auth Required**: Yes (Bearer Token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Product deleted successfully."
}
```
- **Error Responses**: `400 PRODUCT_IN_USE`, `401 UNAUTHENTICATED`, `404 PRODUCT_NOT_FOUND`

---

### 4.3 Order Management Module

#### `POST /orders`
Create a new transactional order and deduct stock.

- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
```json
{
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 2, "quantity": 2 }
  ]
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "order": {
      "id": 10,
      "user_id": 4,
      "user_name": "Jane Smith",
      "user_email": "jane@example.com",
      "status": "pending",
      "total_amount": "15500000.00",
      "created_at": "2026-08-19T09:40:00.000Z",
      "updated_at": "2026-08-19T09:40:00.000Z",
      "items": [
        {
          "id": 15,
          "order_id": 10,
          "product_id": 1,
          "product_name": "Laptop Pro 15",
          "product_sku": "PROD-LPT-001",
          "quantity": 1,
          "unit_price": "15000000.00",
          "subtotal": "15000000.00",
          "created_at": "2026-08-19T09:40:00.000Z"
        },
        {
          "id": 16,
          "order_id": 10,
          "product_id": 2,
          "product_name": "Wireless Mouse",
          "product_sku": "PROD-MSE-002",
          "quantity": 2,
          "unit_price": "250000.00",
          "subtotal": "500000.00",
          "created_at": "2026-08-19T09:40:00.000Z"
        }
      ]
    }
  }
}
```
- **Error Responses**: `400 EMPTY_ORDER_ITEMS`, `400 DUPLICATE_ORDER_PRODUCT`, `400 INSUFFICIENT_STOCK`, `401 UNAUTHENTICATED`, `404 PRODUCT_NOT_FOUND`

---

#### `GET /orders`
Get user's personal paginated order list.

- **Auth Required**: Yes (Bearer Token)
- **Query Parameters**:
  - `page` (optional): integer >= 1 (default: 1)
  - `limit` (optional): integer 1-100 (default: 20)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User orders retrieved successfully.",
  "data": {
    "orders": [
      {
        "id": 10,
        "user_id": 4,
        "status": "pending",
        "total_amount": "15500000.00",
        "created_at": "2026-08-19T09:40:00.000Z",
        "updated_at": "2026-08-19T09:40:00.000Z",
        "total_items": 2
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

#### `GET /orders/:id`
Get full details of a specific order by ID.

- **Auth Required**: Yes (Bearer Token)
- **Path Parameters**: `id` (integer, required)
- **Success Response (200 OK)**: (Same structure as `POST /orders` data payload)
- **Error Responses**: `401 UNAUTHENTICATED`, `403 FORBIDDEN_RESOURCE`, `404 ORDER_NOT_FOUND`

---

#### `PATCH /orders/:id/status`
Update order status (e.g. `processing`, `completed`, `cancelled`).

- **Auth Required**: Yes (Bearer Token)
- **Path Parameters**: `id` (integer, required)
- **Request Body**:
```json
{
  "status": "cancelled"
}
```
- **Valid Status Values**: `'pending'`, `'processing'`, `'completed'`, `'cancelled'`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order status updated to 'cancelled'.",
  "data": {
    "order": {
      "id": 10,
      "user_id": 4,
      "status": "cancelled",
      "total_amount": "15500000.00",
      "items": [ ... ]
    }
  }
}
```
- **Error Responses**: `400 ORDER_ALREADY_CANCELLED`, `400 CANNOT_CANCEL_COMPLETED_ORDER`, `401 UNAUTHENTICATED`, `403 FORBIDDEN_RESOURCE`, `404 ORDER_NOT_FOUND`
