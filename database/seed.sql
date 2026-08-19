USE railway;

-- Clear existing data (optional / idempotent execution)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS (3 users)
-- Password hashes use bcrypt placeholder ($2y$10$... hash of 'password')
INSERT INTO users (id, name, email, password) VALUES
(1, 'John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 'Jane Smith', 'jane@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'Bob Johnson', 'bob@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 2. PRODUCTS (5 products with price and stock variations)
INSERT INTO products (id, name, sku, price, stock) VALUES
(1, 'Laptop Pro 15', 'PROD-LPT-001', 15000000.00, 25),
(2, 'Wireless Mouse', 'PROD-MSE-002', 250000.00, 100),
(3, 'Mechanical Keyboard', 'PROD-KBD-003', 850000.00, 50),
(4, '27 Inch Monitor', 'PROD-MNT-004', 3200000.00, 15),
(5, 'USB-C Cable 1m', 'PROD-CBL-005', 75000.00, 200);

-- 3. ORDERS (3 orders for different users)
INSERT INTO orders (id, user_id, status, total_amount) VALUES
(1, 1, 'completed', 15500000.00),
(2, 2, 'processing', 1950000.00),
(3, 3, 'pending', 3275000.00);

-- 4. ORDER_ITEMS (Multiple items per order, unit price is snapshot of product price at transaction time)
INSERT INTO order_items (id, order_id, product_id, quantity, price, subtotal) VALUES
-- Order 1 items (User 1)
(1, 1, 1, 1, 15000000.00, 15000000.00),
(2, 1, 2, 2, 250000.00, 500000.00),

-- Order 2 items (User 2)
(3, 2, 2, 1, 250000.00, 250000.00),
(4, 2, 3, 2, 850000.00, 1700000.00),

-- Order 3 items (User 3)
(5, 3, 4, 1, 3200000.00, 3200000.00),
(6, 3, 5, 1, 75000.00, 75000.00);
