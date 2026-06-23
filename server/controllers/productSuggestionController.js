import ProductSuggestion from '../models/ProductSuggestion.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

// @desc    Create a product suggestion
// @route   POST /api/suggestions
// @access  Public
export const createSuggestion = asyncHandler(async (req, res, next) => {
    const { name, email, country, productDetails, relevantLink } = req.body;

    const suggestion = await ProductSuggestion.create({
        name,
        email,
        country,
        productDetails,
        relevantLink
    });

    res.status(201).json({
        success: true,
        data: suggestion
    });
});

// @desc    Get all product suggestions
// @route   GET /api/suggestions
// @access  Private/Admin
export const getSuggestions = asyncHandler(async (req, res, next) => {
    const suggestions = await ProductSuggestion.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: suggestions.length,
        data: suggestions
    });
});

// @desc    Update suggestion (e.g. toggle save status)
// @route   PUT /api/suggestions/:id
// @access  Private/Admin
export const updateSuggestion = asyncHandler(async (req, res, next) => {
    let suggestion = await ProductSuggestion.findById(req.params.id);

    if (!suggestion) {
        throw new AppError(`Suggestion not found with id of ${req.params.id}`, 404);
    }

    suggestion = await ProductSuggestion.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: suggestion
    });
});

// @desc    Delete single suggestion
// @route   DELETE /api/suggestions/:id
// @access  Private/Admin
export const deleteSuggestion = asyncHandler(async (req, res, next) => {
    const suggestion = await ProductSuggestion.findById(req.params.id);

    if (!suggestion) {
        throw new AppError(`Suggestion not found with id of ${req.params.id}`, 404);
    }

    await suggestion.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Delete multiple suggestions
// @route   POST /api/suggestions/delete-multiple
// @access  Private/Admin
export const deleteMultipleSuggestions = asyncHandler(async (req, res, next) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('Please provide an array of suggestion IDs', 400);
    }

    await ProductSuggestion.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Delete all suggestions
// @route   DELETE /api/suggestions
// @access  Private/Admin
export const deleteAllSuggestions = asyncHandler(async (req, res, next) => {
    await ProductSuggestion.deleteMany({});

    res.status(200).json({
        success: true,
        data: {}
    });
});
