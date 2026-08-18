const { pool } = require('../config/database');
const orderRepository = require('../repositories/order.repository');
const orderItemRepository = require('../repositories/orderItem.repository');
const productRepository = require('../repositories/product.repository');
const AppError = require('../utils/appError');

class OrderService {
    /**
     * Create Order with Database Transaction & Optimistic/Pessimistic Row Locking
     * @param {number} userId - Authenticated user ID
     * @param {Array<{product_id: number, quantity: number}>} items - Order items
     */
    async createOrder(userId, items) {
        if (!items || items.length === 0) {
            throw new AppError('Order must contain at least one item.', 400, 'EMPTY_ORDER_ITEMS');
        }

        // 1. Obtain connection from pool for atomic transaction
        const connection = await pool.getConnection();

        try {
            // 2. Begin MySQL Transaction
            await connection.beginTransaction();

            let totalAmount = 0;
            const preparedItems = [];

            // Prevent duplicate product IDs in single order request
            const uniqueProductIds = new Set();

            for (const item of items) {
                const productId = parseInt(item.product_id, 10);
                const quantity = parseInt(item.quantity, 10);

                if (uniqueProductIds.has(productId)) {
                    throw new AppError(`Duplicate product_id ${productId} found in order request items.`, 400, 'DUPLICATE_ORDER_PRODUCT');
                }
                uniqueProductIds.add(productId);

                // 3. Pessimistic lock row FOR UPDATE to prevent race conditions on stock
                const product = await productRepository.findByIdForUpdate(connection, productId);

                if (!product) {
                    throw new AppError(`Product with ID ${productId} was not found.`, 404, 'PRODUCT_NOT_FOUND');
                }

                // 4. Validate stock availability
                if (product.stock < quantity) {
                    throw new AppError(
                        `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.stock}, requested: ${quantity}.`,
                        400,
                        'INSUFFICIENT_STOCK'
                    );
                }

                // 5. Calculate snapshot price and subtotal
                const unitPrice = parseFloat(product.price);
                const subtotal = unitPrice * quantity;
                totalAmount += subtotal;

                // 6. Deduct stock for product within transaction
                const newStock = product.stock - quantity;
                await productRepository.updateStockWithConnection(connection, productId, newStock);

                preparedItems.push({
                    productId,
                    quantity,
                    price: unitPrice,
                    subtotal
                });
            }

            // 7. Insert order record into database
            const orderId = await orderRepository.createWithConnection(connection, {
                userId,
                status: 'pending',
                totalAmount
            });

            // 8. Attach generated orderId to items
            const itemsWithOrderId = preparedItems.map(item => ({
                orderId,
                ...item
            }));

            // 9. Insert order items in batch
            await orderItemRepository.createBatchWithConnection(connection, itemsWithOrderId);

            // 10. Commit MySQL Transaction
            await connection.commit();

            // 11. Return full created order detail
            return await this.getOrderById(orderId, userId);

        } catch (error) {
            // Rollback transaction on any error
            await connection.rollback();
            throw error;
        } finally {
            // Always return connection back to pool
            connection.release();
        }
    }

    /**
     * Get paginated orders for authenticated user
     */
    async getUserOrders(userId, { page = 1, limit = 20 } = {}) {
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
        
        const { orders, total } = await orderRepository.findByUserId(userId, {
            limit: parseInt(limit, 10),
            offset
        });

        const totalPages = Math.ceil(total / parseInt(limit, 10)) || 1;

        return {
            orders,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages
            }
        };
    }

    /**
     * Get order details by ID with ownership authorization check
     */
    async getOrderById(orderId, userId) {
        const order = await orderRepository.findById(orderId);
        if (!order) {
            throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
        }

        // Ownership authorization check
        if (order.user_id !== userId) {
            throw new AppError('Access denied. You do not own this order.', 403, 'FORBIDDEN_RESOURCE');
        }

        const items = await orderItemRepository.findByOrderId(orderId);

        return {
            ...order,
            items
        };
    }

    /**
     * Update order status or cancel order (with stock restoration transaction)
     */
    async updateOrderStatus(orderId, userId, newStatus) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const order = await orderRepository.findByIdForUpdateWithConnection(connection, orderId);
            if (!order) {
                throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
            }

            if (order.user_id !== userId) {
                throw new AppError('Access denied. You do not own this order.', 403, 'FORBIDDEN_RESOURCE');
            }

            if (order.status === 'cancelled') {
                throw new AppError('Order is already cancelled.', 400, 'ORDER_ALREADY_CANCELLED');
            }

            if (order.status === 'completed' && newStatus === 'cancelled') {
                throw new AppError('Completed orders cannot be cancelled.', 400, 'CANNOT_CANCEL_COMPLETED_ORDER');
            }

            // Restore product stock if cancelling order
            if (newStatus === 'cancelled' && order.status !== 'cancelled') {
                const items = await orderItemRepository.findByOrderId(orderId);
                for (const item of items) {
                    const product = await productRepository.findByIdForUpdate(connection, item.product_id);
                    if (product) {
                        const restoredStock = product.stock + item.quantity;
                        await productRepository.updateStockWithConnection(connection, product.id, restoredStock);
                    }
                }
            }

            await orderRepository.updateStatusWithConnection(connection, orderId, newStatus);
            await connection.commit();

            return await this.getOrderById(orderId, userId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new OrderService();
