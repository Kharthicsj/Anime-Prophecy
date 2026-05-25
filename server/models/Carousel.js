import mongoose from 'mongoose';

const carouselSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Carousel title is required'],
            trim: true,
            maxlength: [100, 'Title must not exceed 100 characters'],
        },
        // Product-picker mode: admin selects products whose images build the carousel
        productIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
            default: [],
        },
        // Legacy / manual-upload items (backward compat)
        items: {
            type: [
                {
                    image: {
                        url:      { type: String, required: true },
                        publicId: { type: String, required: true },
                    },
                    title:       String,
                    description: String,
                    link:        String,
                },
            ],
            default: [],
        },
        country: {
            type: String,
            enum: ['US', 'IN', 'JP', 'KR', 'GB', 'DE', 'CA', 'AU', 'ALL'],
            default: 'ALL',
        },
        isActive:         { type: Boolean, default: true },
        autoPlayInterval: { type: Number,  default: 5000 },
    },
    { timestamps: true }
);

export default mongoose.model('Carousel', carouselSchema);
