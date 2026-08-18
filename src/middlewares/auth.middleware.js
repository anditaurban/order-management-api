const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Access denied. Authentication token is missing or malformed.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        throw new AppError('Access denied. Authentication token is missing.', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    
    // Attach authenticated user identity to request
    req.user = decoded;
    
    next();
});

module.exports = {
    authenticateToken
};
