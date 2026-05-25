import express from 'express';
import {
    subscribe,
    unsubscribe,
    getSubscribers,
    broadcastNewsletter,
} from '../controllers/newsletterController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin only
router.get('/subscribers', verifyToken, isAdmin, getSubscribers);
router.post('/broadcast', verifyToken, isAdmin, broadcastNewsletter);

export default router;
