const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {
    createOrderValidation,
    getOrderByIdValidation,
    updateOrderStatusValidation
} = require('../validations/order.validation');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All Order Endpoints Require Authentication
router.use(authenticateToken);

router.post('/', createOrderValidation, validate, orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', getOrderByIdValidation, validate, orderController.getOrderById);
router.patch('/:id/status', updateOrderStatusValidation, validate, orderController.updateOrderStatus);

module.exports = router;
