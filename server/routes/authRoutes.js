import express from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile, getAdminsAndSessions, approveAdmin, rejectAdmin, terminateSession } from '../controllers/authController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

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

/**
 * @route GET /api/auth/admins
 * @desc Get all admins and pending requests
 * @access Private
 */
router.get('/admins', verifyToken, isAdmin, getAdminsAndSessions);

/**
 * @route POST /api/auth/approve/:id
 * @desc Approve an admin request
 * @access Private
 */
router.post('/approve/:id', verifyToken, isAdmin, approveAdmin);

/**
 * @route POST /api/auth/reject/:id
 * @desc Reject an admin request
 * @access Private
 */
router.post('/reject/:id', verifyToken, isAdmin, rejectAdmin);

/**
 * @route DELETE /api/auth/session/:userId/:sessionId
 * @desc Terminate an admin session
 * @access Private
 */
router.delete('/session/:userId/:sessionId', verifyToken, isAdmin, terminateSession);

export default router;
