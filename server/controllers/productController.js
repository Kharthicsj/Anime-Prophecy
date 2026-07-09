import Product from '../models/Product.js';
import GlobalSettings from '../models/GlobalSettings.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { getAliExpressProductDetails } from '../utils/aliexpressApi.js';

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
				countries: { $in: regionCountriesArr }
			});
		}
	} else {
		filter.$and.push({
			countries: country
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
 * Fetch products from AliExpress in bulk for preview
 * @route POST /api/products/admin/aliexpress/fetch
 * @access Private/Admin
 */
export const fetchAliExpressBulk = asyncHandler(async (req, res) => {
    const { productIds, targetCountry = 'Worldwide', targetCurrency = 'USD' } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError('productIds array is required', 400);
    }

    if (productIds.length > 500) {
        throw new AppError('Cannot fetch more than 500 products at a time to avoid timeout', 400);
    }
    
    // Map currency to language loosely, default to EN
    let targetLanguage = 'EN';
    if (targetCurrency === 'JPY') targetLanguage = 'JA';
    if (targetCurrency === 'EUR') targetLanguage = 'ES'; // Could be IT, FR, etc. Defaults to ES or EN in Ali
    if (targetCurrency === 'KRW') targetLanguage = 'KO';

    const results = [];
    const errors = [];

    // Chunk into arrays of 50 (AliExpress limit)
    const chunkSize = 50;
    for (let i = 0; i < productIds.length; i += chunkSize) {
        const chunk = productIds.slice(i, i + chunkSize);
        try {
            const apiRes = await getAliExpressProductDetails(chunk, targetCurrency, targetLanguage);
            if (apiRes?.resp_result?.result?.current_record_count > 0) {
                const products = apiRes.resp_result.result.products.product || [];
                // Standardize the response to match our preview UI needs
                const formatted = products.map(p => ({
                    affiliateProductId: p.product_id,
                    affiliatePlatform: 'AliExpress',
                    title: p.product_title,
                    price: p.target_sale_price || p.target_original_price,
                    currency: p.target_sale_price_currency || targetCurrency,
                    images: [p.product_main_image_url, ...(p.product_small_image_urls?.string || [])].filter(Boolean),
                    affiliateLink: p.promotion_link,
                    category: p.first_level_category_name || 'Other',
                    subCategory: p.second_level_category_name || '',
                    store: 'AliExpress',
                    rating: p.evaluate_rate ? Math.round((parseFloat(p.evaluate_rate) / 20) * 10) / 10 : 0,
                    // Apply dynamic defaults
                    animeTag: 'Other', 
                    countries: Array.isArray(targetCountry) ? targetCountry : [targetCountry]
                }));
                results.push(...formatted);
            } else {
                console.error("AliExpress API returned no products. Response:", JSON.stringify(apiRes));
                errors.push(`Chunk starting at index ${i} returned no products. Response: ${apiRes?.resp_result?.resp_msg || 'Unknown API format'}`);
            }
        } catch (err) {
            errors.push(`Failed chunk starting at index ${i}: ${err.message}`);
        }
        
        // Wait 500ms between chunk requests to avoid rate limits
        if (i + chunkSize < productIds.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    res.json({
        success: true,
        data: {
            products: results,
            errors: errors.length > 0 ? errors : undefined,
            totalFetched: results.length
        }
    });
});

/**
 * Bulk create products (Admin only) - Used for AliExpress bulk upload
 * @route POST /api/products/admin/bulk
 * @access Private/Admin
 */
export const bulkCreateProducts = asyncHandler(async (req, res) => {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
        throw new AppError('Products array is required', 400);
    }

    if (products.length > 500) {
        throw new AppError('Cannot create more than 500 products at once', 400);
    }

    const productsToInsert = products.map(p => {
        // Validate minimally required fields per product
        if (!p.title || !p.animeTag || !p.store || !p.affiliateLink || !p.price || !p.category || !p.countries || !p.images) {
            throw new AppError(`Missing required fields for product: ${p.title || 'Unknown'}`, 400);
        }

        // Format images
        const formattedImages = Array.isArray(p.images) && typeof p.images[0] === 'string'
            ? p.images.slice(0, 10).map((url, i) => ({ url, publicId: `external_ali_${Date.now()}_${i}`, isMain: i === 0 }))
            : p.images;

        return {
            title: p.title,
            description: p.description || p.title,
            images: formattedImages,
            videos: [],
            animeTag: p.animeTag,
            store: p.store,
            affiliateLink: p.affiliateLink,
            affiliatePlatform: p.affiliatePlatform || p.store,
            affiliateProductId: p.affiliateProductId || null,
            price: Number(p.price) || 0,
            currency: p.currency || 'USD',
            colors: p.colors || [],
            sizes: p.sizes || [],
            category: p.category,
            subCategory: p.subCategory || '',
            countries: Array.isArray(p.countries) ? p.countries : [p.countries],
            inStock: p.inStock !== undefined ? p.inStock : true,
            isActive: p.isActive !== undefined ? p.isActive : true,
            rating: typeof p.rating === 'string' && p.rating.includes('%') 
                ? Math.round((parseFloat(p.rating) / 20) * 10) / 10 
                : Number(p.rating) || 0,
            createdBy: req.user.id,
        };
    });

    const result = await Product.insertMany(productsToInsert);

    res.status(201).json({
        success: true,
        message: `${result.length} products created successfully.`,
        data: { count: result.length },
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
 * Bulk update product visibility (private/active) in one DB operation
 * @route PATCH /api/products/bulk-visibility
 * @access Private/Admin
 * @body { ids?: string[], isActive: boolean, applyToAll?: boolean, filters?: object }
 *
 * Two modes:
 *   1. Specific IDs  — send { ids: ["...", ...], isActive: bool }
 *   2. Filter-based  — send { applyToAll: true, filters: { animeTag, category, ... }, isActive: bool }
 *      This applies to ALL matching DB records without loading them on the client.
 */
export const bulkUpdateVisibility = asyncHandler(async (req, res) => {
    const { ids, isActive, applyToAll, filters = {} } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400);
    }

    let query = {};

    if (applyToAll) {
        // Build the same filter logic as getAllProductsAdmin so the admin's
        // current filter selection is honoured.
        if (filters.status) {
            if (filters.status === 'active') {
                query.isActive = true;
                query.$or = [
                    { scheduledUploadTime: null },
                    { scheduledUploadTime: { $lte: new Date() } },
                ];
            } else if (filters.status === 'inactive') {
                query.isActive = false;
            } else if (filters.status === 'scheduled') {
                query.scheduledUploadTime = { $gt: new Date() };
            }
        }
        if (filters.animeTag && filters.animeTag !== 'All Anime') {
            query.animeTag = { $in: filters.animeTag.split(',') };
        }
        if (filters.category && filters.category !== 'All Categories') {
            query.category = { $in: filters.category.split(',') };
        }
        if (filters.store && filters.store !== 'All Stores') {
            query.store = { $in: filters.store.split(',') };
        }
        if (filters.country && filters.country !== 'All Countries') {
            query.countries = filters.country;
        }
        if (filters.search?.trim()) {
            const q = filters.search.trim();
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { animeTag: { $regex: q, $options: 'i' } },
            ];
        }
    } else {
        // Specific IDs mode
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError('ids must be a non-empty array', 400);
        }
        // Hard cap: prevent accidentally huge payloads
        if (ids.length > 5000) {
            throw new AppError('Maximum 5000 IDs allowed per bulk operation', 400);
        }
        const objectIds = ids
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        if (objectIds.length === 0) {
            throw new AppError('No valid product IDs provided', 400);
        }
        query._id = { $in: objectIds };
    }

    // Single updateMany — one DB round-trip regardless of how many products
    const result = await Product.updateMany(query, { $set: { isActive } });

    res.json({
        success: true,
        message: `${result.modifiedCount} product(s) updated to ${
            isActive ? 'active' : 'private'
        } mode.`,
        data: {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        },
    });
});

/**
 * Bulk delete products in one DB operation
 * @route DELETE /api/products/bulk-delete
 * @access Private/Admin
 */
export const bulkDeleteProducts = asyncHandler(async (req, res) => {
    const { ids, applyToAll, filters } = req.body;
    let query = {};

    if (applyToAll) {
        if (!filters || typeof filters !== 'object') {
            throw new AppError('Filters object is required when applyToAll is true', 400);
        }
        if (filters.animeTag && filters.animeTag !== 'All Anime') query.animeTag = filters.animeTag;
        if (filters.category && filters.category !== 'All Categories') query.category = filters.category;
        if (filters.store && filters.store !== 'All Stores') query.store = filters.store;
        if (filters.status) {
            if (filters.status === 'inactive') query.isActive = false;
            else if (filters.status === 'active') query.isActive = true;
        }
        if (filters.country && filters.country !== 'All Countries') query.countries = filters.country;
        if (filters.search?.trim()) {
            const q = filters.search.trim();
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { animeTag: { $regex: q, $options: 'i' } },
            ];
        }
    } else {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError('ids must be a non-empty array', 400);
        }
        if (ids.length > 5000) {
            throw new AppError('Maximum 5000 IDs allowed per bulk operation', 400);
        }
        const objectIds = ids
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        if (objectIds.length === 0) {
            throw new AppError('No valid product IDs provided', 400);
        }
        query._id = { $in: objectIds };
    }

    const result = await Product.deleteMany(query);

    res.json({
        success: true,
        message: `${result.deletedCount} product(s) deleted successfully.`,
        data: {
            deletedCount: result.deletedCount,
        },
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
    const { includePrivate } = req.query;

    // When includePrivate=true the analytics panel needs all products (including
    // inactive ones) so the "Private Products" KPI card is accurate.
    const filter = includePrivate === 'true'
        ? {}   // no restriction — return every product
        : {
            isActive: true,
            $or: [
                { scheduledUploadTime: null },
                { scheduledUploadTime: { $lte: new Date() } },
            ],
        };

    const products = await Product.find(filter)
        .select(
            'title animeTag category subCategory store countries price currency rating inStock views clicks buyNowClicks images isActive',
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
