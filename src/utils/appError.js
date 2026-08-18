class AppError extends Error {
    /**
     * Custom Application Error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP Status Code (default: 500)
     * @param {string} errorCode - Machine-readable error code (default: 'INTERNAL_SERVER_ERROR')
     */
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
