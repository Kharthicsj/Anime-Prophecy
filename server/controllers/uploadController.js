import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

// ─── Generic buffer-to-cloudinary helper ───────────────────────────────────
const uploadBufferToCloudinary = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        stream.end(buffer);
    });

// ── IMAGE HANDLERS ──────────────────────────────────────────────────────────

// POST /api/upload — upload image from multipart file (memoryStorage buffer)
export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400);

    const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'prophecy-hub/products',
        resource_type: 'auto',
        quality: 'auto:good',
    });

    res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        },
    });
});

// POST /api/upload/url — upload image from URL
export const uploadImageFromUrl = asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) throw new AppError('Image URL is required', 400);

    const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'prophecy-hub/products',
        resource_type: 'auto',
        quality: 'auto:good',
    });

    res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        },
    });
});

// DELETE /api/upload/:publicId — delete image
export const deleteImage = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    if (!publicId) throw new AppError('Public ID is required', 400);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    res.json({ success: true, message: 'Image deleted successfully' });
});

// ── VIDEO HANDLERS ──────────────────────────────────────────────────────────

// POST /api/upload/video — upload video from multipart file
export const uploadVideo = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No video file provided', 400);

    // Upload to Cloudinary as video; eager-transform to auto-quality streaming
    const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'prophecy-hub/products/videos',
        resource_type: 'video',
        // Eager transformation: generate an MP4 and a WebM fallback at auto quality
        eager: [
            { format: 'mp4', quality: 'auto:good', video_codec: 'h264' },
            { format: 'webm', quality: 'auto:good', video_codec: 'vp9' },
        ],
        eager_async: false, // wait for transformations before responding
    });

    // Prefer the eager mp4 URL; fall back to the original upload URL
    const mp4Eager = result.eager?.find(e => e.format === 'mp4');
    const webmEager = result.eager?.find(e => e.format === 'webm');

    res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
            url: mp4Eager?.secure_url || result.secure_url,
            webmUrl: webmEager?.secure_url || null,
            publicId: result.public_id,
            duration: result.duration || null,
            width: result.width,
            height: result.height,
            format: result.format,
        },
    });
});

// DELETE /api/upload/video/:publicId — delete video from Cloudinary
export const deleteVideo = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    if (!publicId) throw new AppError('Public ID is required', 400);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    res.json({ success: true, message: 'Video deleted successfully' });
});
