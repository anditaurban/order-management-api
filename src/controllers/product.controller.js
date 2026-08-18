const productService = require('../services/product.service');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class ProductController {
    /**
     * GET /api/v1/products
     */
    getProducts = asyncHandler(async (req, res) => {
        const result = await productService.getAllProducts(req.query);
        return successResponse(res, 200, 'Products retrieved successfully.', result);
    });

    /**
     * GET /api/v1/products/:id
     */
    getProductById = asyncHandler(async (req, res) => {
        const productId = req.params.id;
        const product = await productService.getProductById(productId);
        return successResponse(res, 200, 'Product retrieved successfully.', { product });
    });

    /**
     * POST /api/v1/products
     */
    createProduct = asyncHandler(async (req, res) => {
        const { name, sku, price, stock } = req.body;
        const product = await productService.createProduct({ name, sku, price, stock });
        return successResponse(res, 201, 'Product created successfully.', { product });
    });

    /**
     * PUT /api/v1/products/:id
     */
    updateProduct = asyncHandler(async (req, res) => {
        const productId = req.params.id;
        const product = await productService.updateProduct(productId, req.body);
        return successResponse(res, 200, 'Product updated successfully.', { product });
    });

    /**
     * DELETE /api/v1/products/:id
     */
    deleteProduct = asyncHandler(async (req, res) => {
        const productId = req.params.id;
        await productService.deleteProduct(productId);
        return successResponse(res, 200, 'Product deleted successfully.');
    });
}

module.exports = new ProductController();
