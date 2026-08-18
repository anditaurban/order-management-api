const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/apiResponse');

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes window
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(
            res,
            429,
            'Too many requests from this IP, please try again after 15 minutes.',
            'RATE_LIMIT_EXCEEDED'
        );
    }
});

/**
 * Auth Rate Limiter
 * 10 requests per 15 minutes window to prevent brute force
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return errorResponse(
            res,
            429,
            'Too many login/register attempts. Please try again after 15 minutes.',
            'AUTH_RATE_LIMIT_EXCEEDED'
        );
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
