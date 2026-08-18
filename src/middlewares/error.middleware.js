const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An unexpected internal server error occurred.';
    let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

    // Handle MySQL Database Specific Errors safely
    if (err.code && typeof err.code === 'string') {
        if (err.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            message = 'A resource with this unique field (email/sku) already exists.';
            errorCode = 'DUPLICATE_ENTRY';
        } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
            statusCode = 400;
            message = 'Database integrity constraint violation.';
            errorCode = 'FOREIGN_KEY_CONSTRAINT';
        } else if (err.code === 'ER_DATA_TOO_LONG') {
            statusCode = 400;
            message = 'Input data exceeds allowed column length.';
            errorCode = 'DATA_TOO_LONG';
        }
    }

    // Log error in non-production environments
    if (process.env.NODE_ENV !== 'production') {
        console.error('💥 ERROR DETAILS:', {
            name: err.name,
            message: err.message,
            statusCode,
            errorCode,
            stack: err.stack
        });
    }

    return errorResponse(res, statusCode, message, errorCode);
};

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
    return errorResponse(
        res,
        404,
        `Cannot find resource at ${req.originalUrl} on this server.`,
        'RESOURCE_NOT_FOUND'
    );
};

module.exports = {
    errorHandler,
    notFoundHandler
};
