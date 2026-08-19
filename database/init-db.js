const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Resolves database configuration from standard DB_* or Railway MYSQL* environment variables.
 */
function getDbConfig() {
    const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
    
    if (connectionUri) {
        return { connectionUri };
    }

    return {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'order_management'
    };
}

/**
 * Waits for MySQL database connection with retry backoff.
 */
async function connectWithRetry(maxRetries = 10, delayMs = 3000) {
    const config = getDbConfig();
    let connection;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`⏳ [DB Init] Connecting to MySQL (Attempt ${attempt}/${maxRetries})...`);
            
            if (config.connectionUri) {
                const url = new URL(config.connectionUri);
                const dbName = url.pathname.replace(/^\//, '') || process.env.DB_NAME || process.env.MYSQLDATABASE || 'order_management';
                
                url.pathname = '/';
                connection = await mysql.createConnection({
                    uri: url.toString(),
                    multipleStatements: true
                });
                return { connection, dbName };
            } else {
                connection = await mysql.createConnection({
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    password: config.password,
                    multipleStatements: true
                });
                return { connection, dbName: config.database };
            }
        } catch (error) {
            console.error(`⚠️ [DB Init] Connection failed (${error.message}). Retrying in ${delayMs / 1000}s...`);
            if (attempt === maxRetries) {
                throw new Error(`Failed to connect to MySQL after ${maxRetries} attempts: ${error.message}`);
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

/**
 * Main Database Initialization Function
 */
async function initDatabase() {
    let connection;
    try {
        const { connection: conn, dbName } = await connectWithRetry();
        connection = conn;

        console.log(`✅ [DB Init] MySQL connection established.`);
        
        // 1. Ensure target database exists
        console.log(`📦 [DB Init] Ensuring database '${dbName}' exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.query(`USE \`${dbName}\`;`);

        // 2. Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`schema.sql not found at path: ${schemaPath}`);
        }

        console.log(`📜 [DB Init] Executing schema.sql...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log(`✅ [DB Init] Tables & Schema created successfully.`);

        // 3. Check if --seed flag is passed or SEED_DATABASE env is true
        const shouldSeed = process.argv.includes('--seed') || process.env.SEED_DATABASE === 'true';
        if (shouldSeed) {
            const seedPath = path.join(__dirname, 'seed.sql');
            if (fs.existsSync(seedPath)) {
                console.log(`🌱 [DB Init] Executing seed.sql...`);
                const seedSql = fs.readFileSync(seedPath, 'utf8');
                await connection.query(seedSql);
                console.log(`✅ [DB Init] Seed data inserted successfully.`);
            } else {
                console.warn(`⚠️ [DB Init] seed.sql specified but file not found at ${seedPath}`);
            }
        }

        console.log(`🎉 [DB Init] Database initialization completed successfully!`);
    } catch (error) {
        console.error(`💥 [DB Init] Initialization error:`, error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Execute if run directly via Node CLI
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase, getDbConfig };
