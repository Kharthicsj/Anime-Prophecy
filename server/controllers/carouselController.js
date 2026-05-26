import Carousel from '../models/Carousel.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Resolve a carousel's productIds into slide items.
 * Each product becomes: { image, title, description, link (affiliateLink) }
 */
const resolveProductItems = async (productIds = []) => {
    if (!productIds.length) return [];
    const products = await Product.find({ _id: { $in: productIds } })
        .select('title description affiliateLink images countries')
        .lean();
    // Preserve the admin-chosen order
    return productIds
        .map((id) => products.find((p) => p._id.toString() === id.toString()))
        .filter(Boolean)
        .map((p) => {
            const mainImg = p.images?.find((i) => i.isMain) || p.images?.[0];
            return {
                productId: p._id,
                image: { url: mainImg?.url || '', publicId: mainImg?.publicId || '' },
                title: p.title,
                description: p.description || '',
                link: p.affiliateLink || '',
                countries: p.countries || [],
            };
        });
};

// GET all carousels
export const getCarousels = asyncHandler(async (req, res) => {
    const { country, isActive } = req.query;
    const filter = {};
    if (country)    filter.country  = country;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const carousels = await Carousel.find(filter).sort({ createdAt: -1 }).lean();

    // Hydrate product-based carousels for the frontend
    const hydrated = await Promise.all(
        carousels.map(async (c) => {
            if (c.productIds?.length) {
                c.items = await resolveProductItems(c.productIds);
            }
            return c;
        })
    );

    res.json({ success: true, data: hydrated });
});

// GET single carousel by ID
export const getCarouselById = asyncHandler(async (req, res) => {
    const carousel = await Carousel.findById(req.params.id).lean();
    if (!carousel)
        return res.status(404).json({ success: false, message: 'Carousel not found' });

    if (carousel.productIds?.length) {
        carousel.items = await resolveProductItems(carousel.productIds);
    }
    res.json({ success: true, data: carousel });
});

// POST create carousel
export const createCarousel = asyncHandler(async (req, res) => {
    const { title, country, autoPlayInterval, productIds, items } = req.body;

    if ((!productIds || !productIds.length) && (!items || !items.length)) {
        return res.status(400).json({
            success: false,
            message: 'Provide either productIds or manual items.',
        });
    }

    const carousel = await Carousel.create({
        title,
        country: country || 'ALL',
        autoPlayInterval: Number(autoPlayInterval) || 5000,
        productIds: productIds || [],
        items: items || [],
    });

    res.status(201).json({ success: true, data: carousel });
});

// PUT update carousel
export const updateCarousel = asyncHandler(async (req, res) => {
    const { title, country, autoPlayInterval, isActive, productIds, items } = req.body;

    const carousel = await Carousel.findById(req.params.id);
    if (!carousel)
        return res.status(404).json({ success: false, message: 'Carousel not found' });

    const updated = await Carousel.findByIdAndUpdate(
        req.params.id,
        {
            title,
            country,
            autoPlayInterval: Number(autoPlayInterval) || carousel.autoPlayInterval,
            isActive,
            productIds: productIds || [],
            items: items || [],
        },
        { new: true, runValidators: false }
    ).lean();

    if (updated.productIds?.length) {
        updated.items = await resolveProductItems(updated.productIds);
    }

    res.json({ success: true, data: updated });
});

// DELETE carousel
export const deleteCarousel = asyncHandler(async (req, res) => {
    const carousel = await Carousel.findById(req.params.id);
    if (!carousel)
        return res.status(404).json({ success: false, message: 'Carousel not found' });

    await Carousel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Carousel deleted successfully' });
});
