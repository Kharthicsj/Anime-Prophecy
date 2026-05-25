import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Banner title is required'],
            trim: true,
            maxlength: [100, 'Title must not exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description must not exceed 500 characters'],
        },
        image: {
            url: {
                type: String,
                required: [true, 'Banner image URL is required'],
            },
            publicId: {
                type: String,
                required: [true, 'Banner image publicId is required'],
            },
        },
        link: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            enum: [
                'US',
                'IN',
                'JP',
                'KR',
                'GB',
                'DE',
                'CA',
                'AU',
                'ALL',
            ],
            default: 'ALL',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        position: {
            type: Number,
            default: 0,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
