import express from 'express';
import multer from 'multer';
import { uploadImage, uploadImageFromUrl, deleteImage } from '../controllers/uploadController.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Memory storage — no temp files needed, buffer streamed directly to Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP allowed.'));
    },
});

router.post('/', verifyToken, isAdmin, upload.single('image'), uploadImage);
router.post('/url', verifyToken, isAdmin, uploadImageFromUrl);
router.delete('/:publicId', verifyToken, isAdmin, deleteImage);

export default router;
