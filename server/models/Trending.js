import mongoose from 'mongoose';

const trendingSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            enum: ['US', 'Japan', 'UK', 'South Korea', 'India', 'Worldwide'],
            required: true,
            unique: true,
        },
        productIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
            default: [],
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model('Trending', trendingSchema);
