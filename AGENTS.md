# AI Coding Directives & Repository Context — Order Management REST API

Welcome AI Coding Assistant (Gemini, Claude, Antigravity, Cursor, Copilot).

This repository (`orders-api`) operates under a strict **Single Source of Truth (SOT)** documentation model located in the `docs/` directory.

Before performing any code generation, refactoring, or bug fixes, you **MUST** read and adhere to the following SOT documentation files:

1. 📖 [**Product Requirement Document (PRD)**](file:///c:/laragon/www/orders-api/docs/prd.md): Domain rules, state transitions (`pending` -> `processing` -> `completed` / `cancelled`), stock reservation policies.
2. 🏗️ [**Technical Implementation Plan**](file:///c:/laragon/www/orders-api/docs/implementation-plan.md): Layered architecture boundaries, connection pool mechanics, error envelope standards.
3. 🔌 [**API Contract & Specification**](file:///c:/laragon/www/orders-api/docs/api-contract.md): Request/response payload schemas, HTTP status codes, error code catalog.
4. 🗄️ [**Data Model & ERD**](file:///c:/laragon/www/orders-api/docs/data-model.md): Table definitions, foreign key constraints, check constraints, indexing strategy.
5. 🤖 [**AI Agent Directives & Prompt Guide**](file:///c:/laragon/www/orders-api/docs/agents.md): Mandatory coding guardrails, transaction rules, pre-commit checklist.

---

## Quick Reference Guardrails

- **Layering Rules**: Routes -> Middlewares -> Controllers -> Services -> Repositories -> MySQL.
- **Transactions**: Multi-step DB writes MUST use `pool.getConnection()`, `beginTransaction()`, `FOR UPDATE` row locking, `commit()`, `rollback()`, and `release()` in `finally`.
- **Errors**: Throw `AppError(message, statusCode, errorCode)`. Never swallow errors.
- **Security**: Parameterize all SQL queries using `?`. Never concatenate raw strings into SQL.
