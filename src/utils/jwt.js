const jwt = require('jsonwebtoken');
const AppError = require('./appError');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Generate JWT token for user identity
 * @param {object} payload - Identity object containing id, email, name
 * @returns {string} token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Authentication token has expired. Please login again.', 401, 'TOKEN_EXPIRED');
        }
        throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }
};

module.exports = {
    generateToken,
    verifyToken
};
