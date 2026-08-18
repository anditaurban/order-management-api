const { pool } = require('../config/database');

class OrderItemRepository {
    /**
     * Bulk insert order items inside active transaction connection
     * @param {object} connection - MySQL connection object
     * @param {Array<object>} items - Array of { orderId, productId, quantity, price, subtotal }
     */
    async createBatchWithConnection(connection, items) {
        if (!items || items.length === 0) return;

        const values = [];
        const placeholders = items.map(item => {
            values.push(item.orderId, item.productId, item.quantity, item.price, item.subtotal);
            return '(?, ?, ?, ?, ?)';
        }).join(', ');

        const sql = `
            INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
            VALUES ${placeholders}
        `;
        
        await connection.execute(sql, values);
    }

    /**
     * Get order items for a specific order with product details
     * @param {number} orderId 
     */
    async findByOrderId(orderId) {
        const sql = `
            SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                p.name AS product_name,
                p.sku AS product_sku,
                oi.quantity,
                oi.price AS unit_price,
                oi.subtotal,
                oi.created_at
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        `;
        const [rows] = await pool.execute(sql, [orderId]);
        return rows;
    }
}

module.exports = new OrderItemRepository();
