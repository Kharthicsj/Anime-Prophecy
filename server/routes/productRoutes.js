import express from 'express';
import {
    getAllProducts,
    getAllProductsAdmin,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductAnalytics,
    getAnalyticsProducts,
    getGlobalSettings,
    updateGlobalSettings,
    trackProductClick,
    trackProductBuyNowClick,
    getDistinctCountries,
    getDistinctMeta,
    bulkUpdateVisibility,
    fetchAliExpressBulk,
    bulkCreateProducts,
    bulkDeleteProducts,
} from '../controllers/productController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route GET /api/products/admin/all
 * @desc Get all products for admin (no filters)
 * @access Private/Admin
 */
router.get('/admin/all', verifyToken, isAdmin, getAllProductsAdmin);

/**
 * @route POST /api/products/admin/aliexpress/fetch
 * @desc Fetch bulk products from AliExpress Affiliate API
 * @access Private/Admin
 */
router.post('/admin/aliexpress/fetch', verifyToken, isAdmin, fetchAliExpressBulk);

/**
 * @route POST /api/products/admin/bulk
 * @desc Bulk create products
 * @access Private/Admin
 */
router.post('/admin/bulk', verifyToken, isAdmin, bulkCreateProducts);

/**
 * @route GET /api/products/analytics/stats
 * @desc Get product analytics
 * @access Private/Admin
 */
router.get('/analytics/stats', verifyToken, isAdmin, getProductAnalytics);

/**
 * @route GET /api/products/analytics/products
 * @desc Get all active products for admin analytics charts
 * @access Private/Admin
 */
router.get('/analytics/products', verifyToken, isAdmin, getAnalyticsProducts);

/**
 * @route GET /api/products
 * @desc Get all products with filters
 * @access Public
 */
router.get('/', getAllProducts);

/**
 * @route GET /api/products/meta/filters
 * @desc Get all distinct filter values (anime, category, store, subCategory, countries) from active products
 * @access Public
 */
router.get('/meta/filters', getDistinctMeta);

/**
 * @route GET /api/products/meta/countries
 * @desc Get all distinct country values from active products
 * @access Public
 */
router.get('/meta/countries', getDistinctCountries);

/**
 * @route GET /api/products/:id
 * @desc Get single product
 * @access Public
 */
router.get('/:id', getProductById);

/**
 * @route POST /api/products/:id/click
 * @desc Track product click
 * @access Public
 */
router.post('/:id/click', trackProductClick);
router.post('/:id/buy-now-click', trackProductBuyNowClick);

/**
 * @route POST /api/products
 * @desc Create new product
 * @access Private/Admin
 */
router.post('/', verifyToken, isAdmin, createProduct);

/**
 * @route PATCH /api/products/bulk-visibility
 * @desc Bulk set isActive on many products — single DB updateMany, rate-limit safe
 * @access Private/Admin
 */
router.patch('/bulk-visibility', verifyToken, isAdmin, bulkUpdateVisibility);

/**
 * @route DELETE /api/products/bulk-delete
 * @desc Bulk delete products in one DB operation
 * @access Private/Admin
 */
router.delete('/bulk-delete', verifyToken, isAdmin, bulkDeleteProducts);

/**
 * @route PUT /api/products/:id
 * @desc Update product
 * @access Private/Admin
 */
router.put('/:id', verifyToken, isAdmin, updateProduct);

/**
 * @route DELETE /api/products/:id
 * @desc Delete product
 * @access Private/Admin
 */
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

// Settings routes
/**
 * @route GET /api/settings/:country
 * @desc Get global settings for country
 * @access Public
 */
router.get('/settings/:country', getGlobalSettings);

/**
 * @route PUT /api/settings/:country
 * @desc Update global settings
 * @access Private/Admin
 */
router.put('/settings/:country', verifyToken, isAdmin, updateGlobalSettings);

export default router;
