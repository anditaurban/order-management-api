console.log('========== SERVER START ==========');

console.log('1. Before loading app');

const app = require('./app');

console.log('2. App loaded successfully');

const PORT = process.env.PORT || 3000;

console.log('3. PORT =', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('4. SERVER LISTENING');
    console.log(`🚀 Orders API running on port ${PORT}`);
});

console.log('5. app.listen() called');

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION:', err);
});