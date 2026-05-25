import Trending from '../models/Trending.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/errorHandler.js';

const resolveProducts = async (productIds = []) => {
    if (!productIds.length) return [];
    const products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
    })
        .lean();
    return productIds
        .map((id) => products.find((p) => p._id.toString() === id.toString()))
        .filter(Boolean);
};

export const getTrendingLists = asyncHandler(async (req, res) => {
    const { country, isActive } = req.query;
    const filter = {};
    if (country) filter.country = country;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const lists = await Trending.find(filter).sort({ country: 1 }).lean();
    const hydrated = await Promise.all(
        lists.map(async (list) => ({
            ...list,
            products: await resolveProducts(list.productIds),
        }))
    );

    res.json({ success: true, data: hydrated });
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
    const { country = 'Worldwide' } = req.query;
    const list = await Trending.findOne({ country, isActive: true }).lean();

    if (!list || !list.productIds?.length) {
        return res.json({ success: true, data: { products: [] } });
    }

    const products = await resolveProducts(list.productIds);
    res.json({ success: true, data: { products } });
});

export const getTrendingById = asyncHandler(async (req, res) => {
    const list = await Trending.findById(req.params.id).lean();
    if (!list) {
        return res.status(404).json({ success: false, message: 'Trending list not found' });
    }
    list.products = await resolveProducts(list.productIds);
    res.json({ success: true, data: list });
});

export const upsertTrending = asyncHandler(async (req, res) => {
    const { country, productIds = [], isActive = true } = req.body;

    if (!country) {
        return res.status(400).json({ success: false, message: 'Country is required' });
    }
    if (!productIds.length) {
        return res.status(400).json({
            success: false,
            message: 'Select at least one product',
        });
    }

    const list = await Trending.findOneAndUpdate(
        { country },
        { country, productIds, isActive },
        { new: true, upsert: true, runValidators: true }
    ).lean();

    list.products = await resolveProducts(list.productIds);
    res.json({ success: true, data: list });
});

export const deleteTrending = asyncHandler(async (req, res) => {
    const list = await Trending.findByIdAndDelete(req.params.id);
    if (!list) {
        return res.status(404).json({ success: false, message: 'Trending list not found' });
    }
    res.json({ success: true, message: 'Trending list deleted' });
});
