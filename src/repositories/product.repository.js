const { pool } = require('../config/database');

class ProductRepository {
    /**
     * Get products list with optional search and filters
     */
    async findAll({ search, minPrice, maxPrice, limit = 20, offset = 0 }) {
        let sql = `
            SELECT id, name, sku, price, stock, created_at, updated_at
            FROM products
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ` AND (name LIKE ? OR sku LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (minPrice !== undefined && minPrice !== null) {
            sql += ` AND price >= ?`;
            params.push(minPrice);
        }

        if (maxPrice !== undefined && maxPrice !== null) {
            sql += ` AND price <= ?`;
            params.push(maxPrice);
        }

        const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
        const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

        sql += ` ORDER BY id DESC LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;

        const [rows] = await pool.execute(sql, params);
        
        // Count query for pagination meta
        let countSql = `SELECT COUNT(*) AS total FROM products WHERE 1=1`;
        const countParams = [];

        if (search) {
            countSql += ` AND (name LIKE ? OR sku LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (minPrice !== undefined && minPrice !== null) {
            countSql += ` AND price >= ?`;
            countParams.push(minPrice);
        }
        if (maxPrice !== undefined && maxPrice !== null) {
            countSql += ` AND price <= ?`;
            countParams.push(maxPrice);
        }

        const [countRows] = await pool.execute(countSql, countParams);
        const total = countRows[0].total;

        return { products: rows, total };
    }

    /**
     * Find product by ID
     */
    async findById(id) {
        const sql = `
            SELECT id, name, sku, price, stock, created_at, updated_at
            FROM products
            WHERE id = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0] || null;
    }

    /**
     * Find product by SKU
     */
    async findBySku(sku) {
        const sql = `
            SELECT id, name, sku, price, stock
            FROM products
            WHERE sku = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [sku]);
        return rows[0] || null;
    }

    /**
     * Create product
     */
    async create({ name, sku, price, stock }) {
        const sql = `
            INSERT INTO products (name, sku, price, stock)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [name, sku, price, stock]);
        return this.findById(result.insertId);
    }

    /**
     * Update product
     */
    async update(id, { name, sku, price, stock }) {
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (sku !== undefined) {
            updates.push('sku = ?');
            params.push(sku);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            params.push(price);
        }
        if (stock !== undefined) {
            updates.push('stock = ?');
            params.push(stock);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);
        const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);

        return this.findById(id);
    }

    /**
     * Delete product
     */
    async delete(id) {
        const sql = `DELETE FROM products WHERE id = ?`;
        const [result] = await pool.execute(sql, [id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // TRANSACTION-SPECIFIC METHODS
    // ==========================================

    /**
     * Lock product row for update within an active database connection/transaction
     */
    async findByIdForUpdate(connection, id) {
        const sql = `
            SELECT id, name, sku, price, stock
            FROM products
            WHERE id = ?
            FOR UPDATE
        `;
        const [rows] = await connection.execute(sql, [id]);
        return rows[0] || null;
    }

    /**
     * Update product stock within transaction (reduce or restore)
     */
    async updateStockWithConnection(connection, id, newStock) {
        const sql = `
            UPDATE products
            SET stock = ?
            WHERE id = ?
        `;
        await connection.execute(sql, [newStock, id]);
    }
}

module.exports = new ProductRepository();
