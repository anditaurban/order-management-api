const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'order_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

/**
 * Tests database pool connection
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connection established successfully.');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
};

module.exports = {
    pool,
    testConnection
};
