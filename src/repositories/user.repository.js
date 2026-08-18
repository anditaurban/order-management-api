const { pool } = require('../config/database');

class UserRepository {
    /**
     * Find user by email address
     * @param {string} email 
     * @returns {Promise<object|null>}
     */
    async findByEmail(email) {
        const sql = `
            SELECT id, name, email, password, created_at, updated_at
            FROM users
            WHERE email = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [email]);
        return rows[0] || null;
    }

    /**
     * Find user by ID
     * @param {number} id 
     * @returns {Promise<object|null>}
     */
    async findById(id) {
        const sql = `
            SELECT id, name, email, created_at, updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0] || null;
    }

    /**
     * Create a new user record
     * @param {object} userData { name, email, password }
     * @returns {Promise<object>} created user record excluding password
     */
    async create({ name, email, password }) {
        const sql = `
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [name, email, password]);
        
        return {
            id: result.insertId,
            name,
            email
        };
    }
}

module.exports = new UserRepository();
