const { body, param, query } = require('express-validator');

const createProductValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required.')
        .isLength({ min: 2, max: 150 }).withMessage('Product name must be between 2 and 150 characters.'),
    body('sku')
        .trim()
        .notEmpty().withMessage('SKU is required.')
        .isLength({ min: 2, max: 100 }).withMessage('SKU must be between 2 and 100 characters.'),
    body('price')
        .notEmpty().withMessage('Price is required.')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
    body('stock')
        .notEmpty().withMessage('Stock is required.')
        .isInt({ min: 0 }).withMessage('Stock must be an integer greater than or equal to 0.')
];

const updateProductValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 150 }).withMessage('Product name must be between 2 and 150 characters.'),
    body('sku')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('SKU must be between 2 and 100 characters.'),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be an integer greater than or equal to 0.')
];

const getProductByIdValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.')
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    getProductByIdValidation
};
