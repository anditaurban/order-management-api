const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const {
    createProductValidation,
    updateProductValidation,
    getProductByIdValidation
} = require('../validations/product.validation');
const validate = require('../middlewares/validate.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Public Product Read Endpoints
router.get('/', productController.getProducts);
router.get('/:id', getProductByIdValidation, validate, productController.getProductById);

// Protected Product Write Endpoints
router.post('/', authenticateToken, createProductValidation, validate, productController.createProduct);
router.put('/:id', authenticateToken, updateProductValidation, validate, productController.updateProduct);
router.delete('/:id', authenticateToken, getProductByIdValidation, validate, productController.deleteProduct);

module.exports = router;
