const { pool } = require('../config/database');

class OrderRepository {
    /**
     * Create order within transaction connection
     */
    async createWithConnection(connection, { userId, status = 'pending', totalAmount }) {
        const sql = `
            INSERT INTO orders (user_id, status, total_amount)
            VALUES (?, ?, ?)
        `;
        const [result] = await connection.execute(sql, [userId, status, totalAmount]);
        return result.insertId;
    }

    /**
     * Find order by ID including user info
     */
    async findById(id) {
        const sql = `
            SELECT 
                o.id,
                o.user_id,
                u.name AS user_name,
                u.email AS user_email,
                o.status,
                o.total_amount,
                o.created_at,
                o.updated_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0] || null;
    }

    /**
     * Find order by ID locked FOR UPDATE within transaction connection
     */
    async findByIdForUpdateWithConnection(connection, id) {
        const sql = `
            SELECT id, user_id, status, total_amount, created_at
            FROM orders
            WHERE id = ?
            FOR UPDATE
        `;
        const [rows] = await connection.execute(sql, [id]);
        return rows[0] || null;
    }

    /**
     * Find all orders belonging to a specific user
     */
    async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
        const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
        const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

        const sql = `
            SELECT 
                o.id,
                o.user_id,
                o.status,
                o.total_amount,
                o.created_at,
                o.updated_at,
                COUNT(oi.id) AS total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.id DESC
            LIMIT ${parsedLimit} OFFSET ${parsedOffset}
        `;
        const [rows] = await pool.execute(sql, [userId]);
        
        const countSql = `SELECT COUNT(*) AS total FROM orders WHERE user_id = ?`;
        const [countRows] = await pool.execute(countSql, [userId]);
        
        return {
            orders: rows,
            total: countRows[0].total
        };
    }

    /**
     * Update order status within transaction connection
     */
    async updateStatusWithConnection(connection, id, status) {
        const sql = `
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `;
        await connection.execute(sql, [status, id]);
    }
}

module.exports = new OrderRepository();
