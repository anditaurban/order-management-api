const { body, param } = require('express-validator');

const createOrderValidation = [
    body('items')
        .isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    body('items.*.product_id')
        .notEmpty().withMessage('product_id is required for each item.')
        .isInt({ min: 1 }).withMessage('product_id must be a positive integer.'),
    body('items.*.quantity')
        .notEmpty().withMessage('quantity is required for each item.')
        .isInt({ min: 1 }).withMessage('quantity must be an integer greater than 0.')
];

const getOrderByIdValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Order ID must be a positive integer.')
];

const updateOrderStatusValidation = [
    param('id')
        .isInt({ min: 1 }).withMessage('Order ID must be a positive integer.'),
    body('status')
        .notEmpty().withMessage('Status is required.')
        .isIn(['pending', 'processing', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, processing, completed, cancelled.')
];

module.exports = {
    createOrderValidation,
    getOrderByIdValidation,
    updateOrderStatusValidation
};
