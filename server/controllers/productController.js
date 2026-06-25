import Product from '../models/Product.js';
import GlobalSettings from '../models/GlobalSettings.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Get all products with filters
 * @route GET /api/products
 * @access Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
    const {
        country = 'US',
        regionCountry,
        animeTag,
        store,
        category,
        search,
        sort = '-createdAt',
        page = 1,
        limit = 12,
    } = req.query;

    const filter = {
        isActive: true,
        $and: [
            {
                $or: [
                    { scheduledUploadTime: null },
                    { scheduledUploadTime: { $lte: new Date() } },
                ],
            },
        ],
    };

    if (country === 'Worldwide') {
        if (regionCountry && regionCountry !== 'All Countries') {
            const regionCountriesArr = regionCountry.split(',');
            filter.$and.push({
                $or: [
                    { countries: { $in: regionCountriesArr } },
                    { countries: 'Worldwide' },
                ],
            });
        }
    } else {
        filter.$and.push({
            $or: [
                { countries: country },
                { countries: 'Worldwide' },
            ],
        });
    }

    if (animeTag && animeTag !== 'All Anime') {
        filter.animeTag = { $in: animeTag.split(',') };
    }

    if (store && store !== 'All Stores') {
        filter.store = { $in: store.split(',') };
    }

    if (category && category !== 'All Categories') {
        filter.category = { $in: category.split(',') };
    }

    if (req.query.subCategory && req.query.subCategory !== 'All') {
        filter.subCategory = { $in: req.query.subCategory.split(',') };
    }

    if (search?.trim()) {
        const q = search.trim();
        filter.$and.push({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { animeTag: { $regex: q, $options: 'i' } },
            ],
        });
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    // Execute query
    const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean();

    const total = await Product.countDocuments(filter);

    res.json({
        success: true,
        data: {
            products,
            pagination: {
                currentPage: pageNum,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize),
            },
        },
    });
});

/**
 * Get single product
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('createdBy', 'username email');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Deduplicate views: one view per IP per product per session/day
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const viewKey = `view_${ip}_${req.params.id}`;

    if (!global._viewCache) global._viewCache = new Set();

    if (!global._viewCache.has(viewKey)) {
        global._viewCache.add(viewKey);
        if (global._viewCache.size > 50000) global._viewCache.clear();

        // Increment view count
        product.views += 1;
        await product.save({ validateBeforeSave: false });
    }


    res.json({
        success: true,
        data: { product },
    });
});

/**
 * Track product click
 * @route POST /api/products/:id/click
 * @access Public
 */
export const trackProductClick = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    if (!global._clickRateLimit) global._clickRateLimit = new Map();
    let rateData = global._clickRateLimit.get(ip);

    if (!rateData) {
        rateData = { timestamps: [], blockedUntil: 0 };
        global._clickRateLimit.set(ip, rateData);
    }

    if (rateData.blockedUntil > now) {
        return res.json({ success: true, message: 'Rate limited' });
    }

    rateData.timestamps = rateData.timestamps.filter(t => now - t < 60000);

    if (rateData.timestamps.length >= 10) {
        rateData.blockedUntil = now + 600000; // 10 minutes
        return res.json({ success: true, message: 'Rate limit exceeded' });
    }

    rateData.timestamps.push(now);

    if (global._clickRateLimit.size > 50000) global._clickRateLimit.clear();

    product.clicks += 1;
    await product.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Click tracked' });
});

/**
 * Track product buy now click
 * @route POST /api/products/:id/buy-now-click
 * @access Public
 */
export const trackProductBuyNowClick = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Product not found', 404);

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    if (!global._buyNowRateLimit) global._buyNowRateLimit = new Map();
    let rateData = global._buyNowRateLimit.get(ip);

    if (!rateData) {
        rateData = { timestamps: [], blockedUntil: 0 };
        global._buyNowRateLimit.set(ip, rateData);
    }

    if (rateData.blockedUntil > now) {
        return res.json({ success: true, message: 'Rate limited' });
    }

    rateData.timestamps = rateData.timestamps.filter(t => now - t < 60000);

    if (rateData.timestamps.length >= 10) {
        rateData.blockedUntil = now + 600000; // 10 minutes
        return res.json({ success: true, message: 'Rate limit exceeded' });
    }

    rateData.timestamps.push(now);

    if (global._buyNowRateLimit.size > 50000) global._buyNowRateLimit.clear();

    product.buyNowClicks = (product.buyNowClicks || 0) + 1;
    await product.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Buy Now click tracked' });
});

/**
 * Get all products for admin (no filters)
 * @route GET /api/products/admin/all
 * @access Private/Admin
 */
export const getAllProductsAdmin = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        sort = '-createdAt',
        search,
        country,
        animeTag,
        store,
        category,
        subCategory,
        status,
    } = req.query;

    const filter = {};

    if (status) {
        if (status === 'active') {
            filter.isActive = true;
            filter.$or = [
                { scheduledUploadTime: null },
                { scheduledUploadTime: { $lte: new Date() } }
            ];
        } else if (status === 'inactive') {
            filter.isActive = false;
        } else if (status === 'scheduled') {
            filter.scheduledUploadTime = { $gt: new Date() };
        }
    }

    if (country && country !== 'All Countries' && country !== 'ALL') {
        if (country === 'Worldwide') {
            filter.countries = 'Worldwide';
        } else {
            filter.countries = country;
        }
    }

    if (animeTag && animeTag !== 'All Anime') {
        filter.animeTag = { $in: animeTag.split(',') };
    }

    if (store && store !== 'All Stores') {
        filter.store = { $in: store.split(',') };
    }

    if (category && category !== 'All Categories') {
        filter.category = { $in: category.split(',') };
    }

    if (subCategory && subCategory !== 'All') {
        filter.subCategory = { $in: subCategory.split(',') };
    }

    if (search?.trim()) {
        const q = search.trim();
        filter.$or = [
            { title: { $regex: q, $options: 'i' } },
            { animeTag: { $regex: q, $options: 'i' } },
        ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(pageSize)
            .lean(),
        Product.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: {
            products,
            pagination: {
                currentPage: pageNum,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize),
            },
        },
    });
});

/**
 * Create product (Admin only)
 * @route POST /api/products
 * @access Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
    const { title, description, images, videos, animeTag, store, affiliateLink, price, currency, colors, sizes, category, subCategory, countries, scheduledUploadTime, isActive } =
        req.body;

    // Validation
    if (!title || !description || !animeTag || !store || !affiliateLink || !price || !category || !countries || !images) {
        throw new AppError('All required fields must be provided', 400);
    }

    // Create product
    const newProduct = new Product({
        title,
        description,
        images,
        videos: Array.isArray(videos) ? videos : [],
        animeTag,
        store,
        affiliateLink,
        price,
        currency: currency || 'USD',
        colors: colors || [],
        sizes: sizes || [],
        category,
        subCategory: subCategory || '',
        countries: Array.isArray(countries) ? countries : [countries],
        scheduledUploadTime: scheduledUploadTime || null,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id,
    });

    await newProduct.save();

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product: newProduct },
    });
});

/**
 * Update product (Admin only)
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
    const { title, description, animeTag, store, affiliateLink, price, currency, colors, sizes, category, subCategory, countries, inStock, images, videos, scheduledUploadTime, isActive } =
        req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (req.user.id !== product.createdBy.toString() && req.user.role !== 'admin') {
        throw new AppError('Not authorized to update this product', 403);
    }

    // Update fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (animeTag) product.animeTag = animeTag;
    if (store) product.store = store;
    if (affiliateLink) product.affiliateLink = affiliateLink;
    if (price) product.price = price;
    if (currency) product.currency = currency;
    if (colors) product.colors = colors;
    if (sizes) product.sizes = sizes;
    if (category) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (countries) product.countries = Array.isArray(countries) ? countries : [countries];
    if (inStock !== undefined) product.inStock = inStock;
    if (images) product.images = images;
    if (videos !== undefined) product.videos = Array.isArray(videos) ? videos : [];
    if (scheduledUploadTime !== undefined) product.scheduledUploadTime = scheduledUploadTime;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
    });
});

/**
 * Delete product (Admin only)
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (req.user.id !== product.createdBy.toString() && req.user.role !== 'admin') {
        throw new AppError('Not authorized to delete this product', 403);
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
        await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' });
    }

    // Delete videos from Cloudinary
    for (const video of (product.videos || [])) {
        await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: 'Product deleted successfully',
    });
});

/**
 * Get distinct metadata values (animeTag, category, store, subCategory, countries) from active products
 * @route GET /api/products/meta/filters
 * @access Public
 */
export const getDistinctMeta = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const subCategoryFilter = { isActive: true };
    if (category && category !== 'All Categories') {
        subCategoryFilter.category = category;
    }

    const [animeTags, categories, stores, subCategories, countries] = await Promise.all([
        Product.distinct('animeTag', { isActive: true }),
        Product.distinct('category', { isActive: true }),
        Product.distinct('store', { isActive: true }),
        Product.distinct('subCategory', subCategoryFilter),
        Product.distinct('countries', { isActive: true }),
    ]);
    res.json({
        success: true,
        data: {
            animeTags: animeTags.filter(Boolean).sort(),
            categories: categories.filter(Boolean).sort(),
            stores: stores.filter(Boolean).sort(),
            subCategories: subCategories.filter(Boolean).sort(),
            countries: countries.filter(Boolean).sort(),
        },
    });
});

/**
 * Get distinct country values stored in active products
 * @route GET /api/products/meta/countries
 * @access Public
 */
export const getDistinctCountries = asyncHandler(async (req, res) => {
    const countries = await Product.distinct('countries', { isActive: true });
    const sorted = [...countries].sort();
    res.json({ success: true, data: { countries: sorted } });
});

/**
 * Get product analytics
 * @route GET /api/products/analytics/stats
 * @access Private/Admin
 */
export const getProductAnalytics = asyncHandler(async (req, res) => {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalViews = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
    const totalClicks = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$clicks' } } }]);
    const totalBuyNowClicks = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$buyNowClicks' } } }]);

    const productsByCategory = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const productsByAnime = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$animeTag', count: { $sum: 1 } } },
    ]);

    res.json({
        success: true,
        data: {
            totalProducts,
            totalViews: totalViews[0]?.total || 0,
            totalClicks: totalClicks[0]?.total || 0,
            totalBuyNowClicks: totalBuyNowClicks[0]?.total || 0,
            productsByCategory,
            productsByAnime,
        },
    });
});

/**
 * Get lean product records for admin analytics dashboard charts
 * @route GET /api/products/analytics/products
 * @access Private/Admin
 */
export const getAnalyticsProducts = asyncHandler(async (req, res) => {
    const filter = {
        isActive: true,
        $or: [
            { scheduledUploadTime: null },
            { scheduledUploadTime: { $lte: new Date() } },
        ],
    };

    const products = await Product.find(filter)
        .select(
            'title animeTag category subCategory store countries price inStock views clicks buyNowClicks images',
        )
        .sort({ views: -1 })
        .lean();

    res.json({
        success: true,
        data: { products },
    });
});

/**
 * Get global settings
 * @route GET /api/settings/:country
 * @access Public
 */
export const getGlobalSettings = asyncHandler(async (req, res) => {
    const { country = 'Worldwide' } = req.params;

    let settings = await GlobalSettings.findOne({ country });

    if (!settings) {
        settings = await GlobalSettings.findOne({ country: 'Worldwide' });
    }

    if (!settings) {
        throw new AppError('Settings not found', 404);
    }

    res.json({
        success: true,
        data: { settings },
    });
});

/**
 * Update global settings (Admin only)
 * @route PUT /api/settings/:country
 * @access Private/Admin
 */
export const updateGlobalSettings = asyncHandler(async (req, res) => {
    const { country } = req.params;
    const { siteTitle, seoDescription, translations, affiliateDisclaimer, socialLinks, footerLinks, contactEmail, contactPhone, copyrightText } = req.body;

    let settings = await GlobalSettings.findOne({ country });

    if (!settings) {
        settings = new GlobalSettings({ country });
    }

    if (siteTitle) settings.siteTitle = siteTitle;
    if (seoDescription) settings.seoDescription = seoDescription;
    if (translations) settings.translations = { ...settings.translations, ...translations };
    if (affiliateDisclaimer) settings.affiliateDisclaimer = affiliateDisclaimer;
    if (socialLinks) settings.socialLinks = { ...settings.socialLinks, ...socialLinks };
    if (footerLinks) settings.footerLinks = { ...settings.footerLinks, ...footerLinks };
    if (contactEmail) settings.contactEmail = contactEmail;
    if (contactPhone) settings.contactPhone = contactPhone;
    if (copyrightText) settings.copyrightText = copyrightText;

    await settings.save();

    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: { settings },
    });
});
