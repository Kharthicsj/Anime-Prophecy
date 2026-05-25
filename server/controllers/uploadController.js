import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

const uploadBufferToCloudinary = (buffer, folder = 'prophecy-hub/products') =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto', quality: 'auto:good' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });

// POST /api/upload — upload from multipart file (memoryStorage buffer)
export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400);

    const result = await uploadBufferToCloudinary(req.file.buffer);

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

// POST /api/upload/url — upload from URL
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

// DELETE /api/upload/:publicId
export const deleteImage = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    if (!publicId) throw new AppError('Public ID is required', 400);
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted successfully' });
});
