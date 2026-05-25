import express from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register new admin user
 * @access Public
 */
router.post('/register', registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', loginUser);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', verifyToken, logoutUser);

/**
 * @route GET /api/auth/me
 * @desc Get current logged-in user
 * @access Private
 */
router.get('/me', verifyToken, getCurrentUser);

/**
 * @route PUT /api/auth/update-profile
 * @desc Update user profile
 * @access Private
 */
router.put('/update-profile', verifyToken, updateUserProfile);

export default router;
