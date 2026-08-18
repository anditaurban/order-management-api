const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to check express-validator validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));

        return errorResponse(
            res,
            422,
            'Validation failed. Please check your request parameters.',
            'VALIDATION_ERROR',
            formattedErrors
        );
    }
    next();
};

module.exports = validate;
