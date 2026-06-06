import express from 'express';
import multer from 'multer';
import {
    uploadImage,
    uploadImageFromUrl,
    deleteImage,
    uploadVideo,
    deleteVideo,
} from '../controllers/uploadController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// ── Image upload multer config ─────────────────────────────────────────────
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP allowed.'));
    },
});

// ── Video upload multer config ─────────────────────────────────────────────
const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',  // .mov
            'video/x-msvideo',  // .avi
            'video/x-matroska', // .mkv
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Supported: MP4, WebM, OGG, MOV, AVI, MKV.'));
    },
});

// ── Image routes ───────────────────────────────────────────────────────────
router.post('/', verifyToken, isAdmin, imageUpload.single('image'), uploadImage);
router.post('/url', verifyToken, isAdmin, uploadImageFromUrl);
router.delete('/:publicId', verifyToken, isAdmin, deleteImage);

// ── Video routes ───────────────────────────────────────────────────────────
router.post('/video', verifyToken, isAdmin, videoUpload.single('video'), uploadVideo);
router.delete('/video/:publicId', verifyToken, isAdmin, deleteVideo);

export default router;
