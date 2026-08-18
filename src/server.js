const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Start Server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    await testConnection();
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
        process.exit(1);
    });
});
