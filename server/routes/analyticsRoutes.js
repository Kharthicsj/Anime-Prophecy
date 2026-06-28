import express from 'express';
import { getAnalyticsData } from '../controllers/analyticsController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', verifyToken, isAdmin, getAnalyticsData);

export default router;
