const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(cors());

// 3. Request Body Parsers (with size limits)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Rate Limiting Middleware
app.use('/api', apiLimiter);

// 5. Root & Health Check Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Order Management REST API',
        version: '1.0.0',
        documentation: '/api/v1'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Orders API is running'
    });
});

// 6. Mount API v1 Routes
app.use('/api/v1', routes);

// 7. Handle Unmatched Routes (404)
app.use(notFoundHandler);

// 8. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
