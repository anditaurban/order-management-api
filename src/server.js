console.log('1. Starting server...');

const app = require('./app');

console.log('2. app.js loaded successfully');

const { testConnection } = require('./config/database');

console.log('3. database module loaded successfully');

const PORT = process.env.PORT || 3000;

console.log('4. PORT:', PORT);

const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(
        `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );

    await testConnection();
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', err);

    server.close(() => {
        process.exit(1);
    });
});