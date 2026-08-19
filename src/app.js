const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const {
    errorHandler,
    notFoundHandler
} = require('./middlewares/error.middleware');

const app = express();

console.log('APP: Express created');

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));

app.use('/api', apiLimiter);

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

console.log('APP: Before loading routes');

const routes = require('./routes');

console.log('APP: Routes loaded');

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

console.log('APP: Application configured');

module.exports = app;