import GlobalSettings from '../models/GlobalSettings.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { v2 as cloudinary } from 'cloudinary';

// Helper: upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder = 'kames-app/settings') =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });

// GET landing hero image (public)
export const getLandingImage = asyncHandler(async (req, res) => {
    let settings = await GlobalSettings.findOne({ country: 'Worldwide' });

    // Auto-create if not exists
    if (!settings) {
        settings = await GlobalSettings.create({ country: 'Worldwide' });
    }

    res.json({
        success: true,
        data: {
            url: settings.bannerImage?.url || '',
            publicId: settings.bannerImage?.publicId || '',
        },
    });
});

// PUT landing hero image (admin only, multipart)
export const updateLandingImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    let settings = await GlobalSettings.findOne({ country: 'Worldwide' });
    if (!settings) {
        settings = await GlobalSettings.create({ country: 'Worldwide' });
    }

    // Delete old image from Cloudinary if exists
    if (settings.bannerImage?.publicId) {
        await cloudinary.uploader.destroy(settings.bannerImage.publicId);
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    settings.bannerImage = {
        url: result.secure_url,
        publicId: result.public_id,
    };
    await settings.save();

    res.json({
        success: true,
        message: 'Landing image updated successfully',
        data: {
            url: result.secure_url,
            publicId: result.public_id,
        },
    });
});

// DELETE landing hero image (admin only)
export const deleteLandingImage = asyncHandler(async (req, res) => {
    const settings = await GlobalSettings.findOne({ country: 'Worldwide' });
    if (settings?.bannerImage?.publicId) {
        await cloudinary.uploader.destroy(settings.bannerImage.publicId);
        settings.bannerImage = { url: '', publicId: '' };
        await settings.save();
    }
    res.json({ success: true, message: 'Landing image removed. Site will use default.' });
});
