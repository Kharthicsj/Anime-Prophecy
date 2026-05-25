import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            maxlength: [150, 'Title must not exceed 150 characters'],
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
            maxlength: [2000, 'Description must not exceed 2000 characters'],
        },
        images: {
            type: [
                {
                    url: {
                        type: String,
                        required: true,
                    },
                    publicId: {
                        type: String,
                        required: true,
                    },
                    isMain: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            required: [true, 'At least one image is required'],
            validate: {
                validator: function (v) {
                    return v.length > 0 && v.length <= 10;
                },
                message: 'Product must have between 1 and 10 images',
            },
        },
        animeTag: {
            type: String,
            enum: [
                'AOT',
                'JJK',
                'Naruto',
                'One Piece',
                'Demon Slayer',
                'MHA',
                'Steins;Gate',
                'Death Note',
                'Code Geass',
                'Spy x Family',
                'Chainsaw Man',
                'Solo Leveling',
                'Other',
            ],
            required: [true, 'Anime tag is required'],
        },
        store: {
            type: String,
            enum: ['Amazon', 'Flipkart', 'Etsy', 'eBay', 'AliExpress', 'Other'],
            required: [true, 'Store is required'],
        },
        affiliateLink: {
            type: String,
            required: [true, 'Affiliate link is required'],
            match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be a positive number'],
        },
        currency: {
            type: String,
            enum: ['USD', 'INR', 'JPY', 'KRW', 'GBP', 'EUR'],
            default: 'USD',
        },
        colors: {
            type: [String],
            default: [],
        },
        sizes: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            enum: [
                'T-Shirts',
                'Hoodies',
                'Figures',
                'Posters',
                'Keychains',
                'Mouse Pads',
                'Accessories',
                'Cosplay',
                'Stickers',
                'Phone Cases',
                'Mugs',
                'More',
            ],
            required: [true, 'Category is required'],
        },
        subCategory: {
            type: String,
            trim: true,
            default: '',
        },
        countries: {
            type: [String],
            enum: ['US', 'Japan', 'UK', 'South Korea', 'India', 'Worldwide'],
            required: [true, 'At least one country is required'],
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        reviews: {
            type: Number,
            default: 0,
        },
        inStock: {
            type: Boolean,
            default: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        clicks: {
            type: Number,
            default: 0,
        },
        buyNowClicks: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        scheduledUploadTime: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Index for better query performance
productSchema.index({ animeTag: 1, store: 1, category: 1, subCategory: 1 });
productSchema.index({ countries: 1 });
productSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
