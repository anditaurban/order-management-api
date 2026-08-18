const productRepository = require('../repositories/product.repository');
const AppError = require('../utils/appError');

class ProductService {
    /**
     * Get paginated products list with filters
     */
    async getAllProducts(queryParams) {
        const { search, minPrice, maxPrice, page = 1, limit = 20 } = queryParams;
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

        const { products, total } = await productRepository.findAll({
            search,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            limit: parseInt(limit, 10),
            offset
        });

        const totalPages = Math.ceil(total / parseInt(limit, 10)) || 1;

        return {
            products,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages
            }
        };
    }

    /**
     * Get product details by ID
     */
    async getProductById(id) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
        }
        return product;
    }

    /**
     * Create a new product
     */
    async createProduct({ name, sku, price, stock }) {
        const existingSku = await productRepository.findBySku(sku);
        if (existingSku) {
            throw new AppError(`Product with SKU '${sku}' already exists.`, 409, 'SKU_EXISTS');
        }

        return await productRepository.create({
            name,
            sku,
            price: parseFloat(price),
            stock: parseInt(stock, 10)
        });
    }

    /**
     * Update an existing product
     */
    async updateProduct(id, updateData) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
        }

        if (updateData.sku && updateData.sku !== product.sku) {
            const existingSku = await productRepository.findBySku(updateData.sku);
            if (existingSku) {
                throw new AppError(`Product with SKU '${updateData.sku}' already exists.`, 409, 'SKU_EXISTS');
            }
        }

        const payload = {};
        if (updateData.name !== undefined) payload.name = updateData.name;
        if (updateData.sku !== undefined) payload.sku = updateData.sku;
        if (updateData.price !== undefined) payload.price = parseFloat(updateData.price);
        if (updateData.stock !== undefined) payload.stock = parseInt(updateData.stock, 10);

        return await productRepository.update(id, payload);
    }

    /**
     * Delete a product
     */
    async deleteProduct(id) {
        const product = await productRepository.findById(id);
        if (!product) {
            throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
        }

        try {
            return await productRepository.delete(id);
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new AppError('Cannot delete product because it is linked to existing order items.', 400, 'PRODUCT_IN_USE');
            }
            throw error;
        }
    }
}

module.exports = new ProductService();
