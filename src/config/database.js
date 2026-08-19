const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;

const poolConfig = connectionUri
    ? { uri: connectionUri, waitForConnections: true, connectionLimit: 10, queueLimit: 0, timezone: '+00:00' }
    : {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'order_management',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+00:00'
    };

const pool = mysql.createPool(poolConfig);

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
