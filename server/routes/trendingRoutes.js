import express from 'express';
import {
    getTrendingLists,
    getTrendingProducts,
    getTrendingById,
    upsertTrending,
    deleteTrending,
} from '../controllers/trendingController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/products', getTrendingProducts);
router.get('/', getTrendingLists);
router.get('/:id', getTrendingById);

router.put('/', verifyToken, isAdmin, upsertTrending);
router.delete('/:id', verifyToken, isAdmin, deleteTrending);

export default router;
