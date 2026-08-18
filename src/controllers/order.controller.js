const orderService = require('../services/order.service');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class OrderController {
    /**
     * POST /api/v1/orders
     */
    createOrder = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { items } = req.body;
        const order = await orderService.createOrder(userId, items);
        return successResponse(res, 201, 'Order created successfully.', { order });
    });

    /**
     * GET /api/v1/orders
     */
    getUserOrders = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const result = await orderService.getUserOrders(userId, req.query);
        return successResponse(res, 200, 'User orders retrieved successfully.', result);
    });

    /**
     * GET /api/v1/orders/:id
     */
    getOrderById = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const orderId = req.params.id;
        const order = await orderService.getOrderById(orderId, userId);
        return successResponse(res, 200, 'Order detail retrieved successfully.', { order });
    });

    /**
     * PATCH /api/v1/orders/:id/status
     */
    updateOrderStatus = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const orderId = req.params.id;
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(orderId, userId, status);
        return successResponse(res, 200, `Order status updated to '${status}'.`, { order });
    });
}

module.exports = new OrderController();
