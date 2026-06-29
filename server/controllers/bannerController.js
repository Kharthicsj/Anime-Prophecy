import Banner from '../models/Banner.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Helper: upload a file buffer to Cloudinary via upload_stream
 * Works with multer memoryStorage() — no temp file needed
 */
const uploadBufferToCloudinary = (buffer, folder = 'kames-app/banners') =>
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

// Get all banners
export const getBanners = asyncHandler(async (req, res) => {
    const { country, isActive } = req.query;
    const filter = {};

    if (country) filter.country = country;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const banners = await Banner.find(filter).sort({ position: 1, createdAt: -1 });
    res.json({ success: true, data: banners });
});

// Get banner by ID
export const getBannerById = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
        return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
});

// Create banner
export const createBanner = asyncHandler(async (req, res) => {
    const { title, description, link, country, position } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Banner image is required' });
    }

    // Upload buffer to Cloudinary (multer memoryStorage gives req.file.buffer)
    const result = await uploadBufferToCloudinary(req.file.buffer);

    const banner = await Banner.create({
        title,
        description,
        link,
        country,
        position: position ? parseInt(position) : 0,
        image: {
            url: result.secure_url,
            publicId: result.public_id,
        },
    });

    res.status(201).json({ success: true, data: banner });
});

// Update banner
export const updateBanner = asyncHandler(async (req, res) => {
    const { title, description, link, country, position, isActive } = req.body;
    let updateData = { title, description, link, country, position, isActive };

    if (req.file) {
        // Delete old image from Cloudinary if it exists
        const existingBanner = await Banner.findById(req.params.id);
        if (existingBanner?.image?.publicId) {
            await cloudinary.uploader.destroy(existingBanner.image.publicId);
        }

        // Upload new buffer to Cloudinary
        const result = await uploadBufferToCloudinary(req.file.buffer);
        updateData.image = {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!banner)
        return res.status(404).json({ success: false, message: 'Banner not found' });

    res.json({ success: true, data: banner });
});

// Delete banner
export const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
        return res.status(404).json({ success: false, message: 'Banner not found' });

    if (banner.image?.publicId) {
        await cloudinary.uploader.destroy(banner.image.publicId);
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted successfully' });
});

// Reorder banners
export const reorderBanners = asyncHandler(async (req, res) => {
    const { banners } = req.body;
    if (!banners || !Array.isArray(banners)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const bulkOps = banners.map((b) => ({
        updateOne: {
            filter: { _id: b.id },
            update: { position: b.position }
        }
    }));

    await Banner.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Banners reordered successfully' });
});
