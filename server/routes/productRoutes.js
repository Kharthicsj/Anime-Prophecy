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
    bulkPinterestExport,
    getPinterestExports,
    deletePinterestExport,
    downloadPinterestExport,
    bulkImageExport,
    getImageExports,
    downloadImageExport,
    deleteImageExport,
    checkExistingIds,
    getCronLogs,
    deleteCronLog,
    triggerAffiliateSync,
    getSyncStatus
} from '../controllers/productController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';
import multer from 'multer';
import { fetchCjProductsByKeyword, fetchCjProductsByIds } from '../controllers/cjController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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
 * @route POST /api/products/admin/cj/search
 * @desc Fetch bulk products from CJ Affiliate API via keyword search
 * @access Private/Admin
 */
router.post('/admin/cj/search', verifyToken, isAdmin, fetchCjProductsByKeyword);

/**
 * @route POST /api/products/admin/cj/fetch-ids
 * @desc Fetch bulk products from CJ Affiliate API via IDs
 * @access Private/Admin
 */
router.post('/admin/cj/fetch-ids', verifyToken, isAdmin, fetchCjProductsByIds);

/**
 * @route POST /api/products/admin/bulk
 * @desc Bulk create products
 * @access Private/Admin
 */
router.post('/admin/bulk', verifyToken, isAdmin, bulkCreateProducts);

/**
 * @route POST /api/products/admin/check-existing
 * @desc Check which affiliate IDs already exist in the database
 * @access Private/Admin
 */
router.post('/admin/check-existing', verifyToken, isAdmin, checkExistingIds);

/**
 * @route GET /api/products/admin/cron-logs
 * @desc Get all cron logs (last 30 days)
 * @access Private/Admin
 */
router.get('/admin/cron-logs', verifyToken, isAdmin, getCronLogs);

/**
 * @route DELETE /api/products/admin/cron-logs/:id
 * @desc Delete a specific cron log
 * @access Private/Admin
 */
router.delete('/admin/cron-logs/:id', verifyToken, isAdmin, deleteCronLog);

/**
 * @route POST /api/products/admin/trigger-sync
 * @desc Manually trigger affiliate price sync
 * @access Private/Admin
 */
router.post('/admin/trigger-sync', verifyToken, isAdmin, triggerAffiliateSync);

/**
 * @route GET /api/products/admin/sync-status
 * @desc Get current sync progress status
 * @access Private/Admin
 */
router.get('/admin/sync-status', verifyToken, isAdmin, getSyncStatus);

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
 * @route POST /api/products/admin/pinterest-export
 * @desc Record a bulk pinterest export in the DB
 * @access Private/Admin
 */
router.post('/admin/pinterest-export', verifyToken, isAdmin, bulkPinterestExport);

/**
 * @route GET /api/products/admin/pinterest-export
 * @desc Get all bulk pinterest exports
 * @access Private/Admin
 */
router.get('/admin/pinterest-export', verifyToken, isAdmin, getPinterestExports);

/**
 * @route GET /api/products/admin/pinterest-export/:id/download
 * @desc Download a pinterest export record CSV
 * @access Private/Admin
 */
router.get('/admin/pinterest-export/:id/download', verifyToken, isAdmin, downloadPinterestExport);

/**
 * @route DELETE /api/products/admin/pinterest-export/:id
 * @desc Delete a pinterest export record
 * @access Private/Admin
 */
router.delete('/admin/pinterest-export/:id', verifyToken, isAdmin, deletePinterestExport);

/**
 * @route POST /api/products/admin/image-export
 * @desc Record a bulk image export in the DB
 * @access Private/Admin
 */
router.post('/admin/image-export', verifyToken, isAdmin, bulkImageExport);

/**
 * @route GET /api/products/admin/image-export
 * @desc Get all bulk image exports
 * @access Private/Admin
 */
router.get('/admin/image-export', verifyToken, isAdmin, getImageExports);

/**
 * @route GET /api/products/admin/image-export/:id/download
 * @desc Download an image export record
 * @access Private/Admin
 */
router.get('/admin/image-export/:id/download', verifyToken, isAdmin, downloadImageExport);

/**
 * @route DELETE /api/products/admin/image-export/:id
 * @desc Delete an image export record
 * @access Private/Admin
 */
router.delete('/admin/image-export/:id', verifyToken, isAdmin, deleteImageExport);

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
