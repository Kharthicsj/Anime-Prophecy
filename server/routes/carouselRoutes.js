import express from 'express';
import multer from 'multer';
import {
    getCarousels,
    getCarouselById,
    createCarousel,
    updateCarousel,
    deleteCarousel,
} from '../controllers/carouselController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', getCarousels);
router.get('/:id', getCarouselById);

// Protected routes (admin only)
router.post('/', verifyToken, isAdmin, upload.array('images', 10), createCarousel);
router.put('/:id', verifyToken, isAdmin, upload.array('images', 10), updateCarousel);
router.delete('/:id', verifyToken, isAdmin, deleteCarousel);

export default router;
