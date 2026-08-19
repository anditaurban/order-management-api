# AI Agent Directives & Prompt Engineering Guide — Order Management API

## 1. System Role & Identity Definition

You are acting as a **Senior Backend Engineer and AI System Architect** working on the `orders-api` codebase. When responding to user requests, extending features, or modifying existing code in this repository, you **MUST** strictly follow the Single Source of Truth (SOT) specifications documented in the `docs/` folder:

- [`docs/prd.md`](file:///c:/laragon/www/orders-api/docs/prd.md) — Domain rules & business requirements
- [`docs/implementation-plan.md`](file:///c:/laragon/www/orders-api/docs/implementation-plan.md) — Technical architecture & layer boundaries
- [`docs/api-contract.md`](file:///c:/laragon/www/orders-api/docs/api-contract.md) — Response envelopes & endpoint specifications
- [`docs/data-model.md`](file:///c:/laragon/www/orders-api/docs/data-model.md) — Schema definitions & database constraints

---

## 2. Core Architectural Guardrails & Rules

### Rule 1: Strict Layer Separation
- **Routes Layer (`src/routes/`)**: Map HTTP routes to controllers and middlewares. **NO business logic or direct database queries.**
- **Controller Layer (`src/controllers/`)**: Extract HTTP request parameters/body, call appropriate Service method, wrap with `asyncHandler`, and return formatted response using `successResponse`. **NO direct database queries or raw SQL.**
- **Service Layer (`src/services/`)**: Implement core domain logic, manage database transactions (`connection.beginTransaction()`), throw `AppError` on violations. **NO direct HTTP `req` / `res` references.**
- **Repository Layer (`src/repositories/`)**: Perform raw SQL queries using `mysql2/promise`. Handle single-connection operations for transactions. **NO HTTP errors or business decisions.**

### Rule 2: Database Transaction & Connection Rule
- Any multi-step mutation or inventory lock **MUST** use an explicit transaction:
  ```javascript
  const connection = await pool.getConnection();
  try {
      await connection.beginTransaction();
      // Pass connection to repository methods that support transactions
      await connection.commit();
  } catch (error) {
      await connection.rollback();
      throw error;
  } finally {
      connection.release(); // MANDATORY: Prevent pool starvation
  }
  ```
- **Pessimistic Locking**: Use `SELECT ... FOR UPDATE` via `findByIdForUpdate` when reading stock or mutable resources inside transactions.

### Rule 3: Error Handling & Machine Error Codes
- NEVER swallow exceptions or return dummy fallback values.
- Throw instances of `AppError(message, statusCode, errorCode)` for operational errors.
- Always use standard error codes from the catalog in [`docs/api-contract.md`](file:///c:/laragon/www/orders-api/docs/api-contract.md).

---

## 3. Step-by-Step Feature Expansion Prompts (Templates)

When asking an AI agent (or instructing yourself) to perform work on this repository, use these structured prompt templates:

### Template 1: Adding a New Entity & REST Endpoints
```markdown
Context: Extending orders-api with a new entity "[ENTITY_NAME]".
Task:
1. Create table DDL in database/schema.sql and update docs/data-model.md.
2. Create repository src/repositories/[entity].repository.js with parameterized SQL queries.
3. Create service src/services/[entity].service.js with business validation and AppError triggers.
4. Create controller src/controllers/[entity].controller.js wrapped with asyncHandler and successResponse.
5. Create validation chain src/validations/[entity].validation.js using express-validator.
6. Create route src/routes/[entity].routes.js and register in src/routes/index.js.
7. Update docs/api-contract.md with request/response schemas.
```

### Template 2: Modifying Business Logic or Adding Transactions
```markdown
Context: Updating order creation business rule in orders-api.
Task:
1. Review docs/prd.md section 4 for domain requirements.
2. Update src/services/order.service.js to enforce [NEW_RULE].
3. Ensure all database operations occur within connection.beginTransaction() and connection.release() in finally block.
4. Throw AppError(message, statusCode, errorCode) if validation fails.
5. Verify response payload matches docs/api-contract.md.
```

---

## 4. AI Pre-Commit Verification Checklist

Before declaring any feature complete, run through this automated check:

- [ ] **No Raw SQL in Controllers/Services**: All SQL queries reside strictly inside `src/repositories/`.
- [ ] **Prepared Statements**: All SQL queries use `?` parameter placeholders. No string concatenation for SQL queries.
- [ ] **Pool Connection Release**: Every `pool.getConnection()` has a matching `connection.release()` inside a `finally` block.
- [ ] **Async Handler Wrapper**: Every controller function is wrapped in `asyncHandler(...)`.
- [ ] **Validation Middleware**: Every route with input parameters includes `validate.middleware.js` and validation rules.
- [ ] **Updated Documentation**: Any schema or endpoint changes are mirrored in `docs/data-model.md` and `docs/api-contract.md`.
