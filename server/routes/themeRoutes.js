import express from 'express';
import { getThemes, saveTheme, deleteTheme } from '../controllers/themeController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Publicly available to fetch themes (for ProductCard)
router.get('/', getThemes);

// Protected routes (Admin only) for saving and deleting themes
router.post('/', verifyToken, isAdmin, saveTheme);
router.delete('/:id', verifyToken, isAdmin, deleteTheme);

export default router;
