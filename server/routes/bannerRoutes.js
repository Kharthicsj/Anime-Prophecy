import express from 'express';
import multer from 'multer';
import {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
} from '../controllers/bannerController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', getBanners);
router.get('/:id', getBannerById);

// Protected routes (admin only)
router.post('/', verifyToken, isAdmin, upload.single('image'), createBanner);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), updateBanner);
router.delete('/:id', verifyToken, isAdmin, deleteBanner);

export default router;
