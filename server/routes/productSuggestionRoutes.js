import express from 'express';
import {
    createSuggestion,
    getSuggestions,
    updateSuggestion,
    deleteSuggestion,
    deleteMultipleSuggestions,
    deleteAllSuggestions
} from '../controllers/productSuggestionController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
    .get(verifyToken, isAdmin, getSuggestions)
    .post(createSuggestion)
    .delete(verifyToken, isAdmin, deleteAllSuggestions);

router.post('/delete-multiple', verifyToken, isAdmin, deleteMultipleSuggestions);

router.route('/:id')
    .put(verifyToken, isAdmin, updateSuggestion)
    .delete(verifyToken, isAdmin, deleteSuggestion);

export default router;
