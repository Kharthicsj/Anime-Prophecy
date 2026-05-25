import express from 'express';
import multer from 'multer';
import { getLandingImage, updateLandingImage, deleteLandingImage } from '../controllers/settingsController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public
router.get('/landing-image', getLandingImage);

// Admin only
router.put('/landing-image', verifyToken, isAdmin, upload.single('image'), updateLandingImage);
router.delete('/landing-image', verifyToken, isAdmin, deleteLandingImage);

export default router;
