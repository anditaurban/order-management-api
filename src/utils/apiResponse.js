/**
 * Send standard success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object|array|null} data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
    const responsePayload = {
        success: true,
        message
    };

    if (data !== null && data !== undefined) {
        responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
};

/**
 * Send standard error response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string} errorCode
 * @param {object|null} details
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR', details = null) => {
    const responsePayload = {
        success: false,
        message,
        error: {
            code: errorCode
        }
    };

    if (details) {
        responsePayload.error.details = details;
    }

    return res.status(statusCode).json(responsePayload);
};

module.exports = {
    successResponse,
    errorResponse
};
