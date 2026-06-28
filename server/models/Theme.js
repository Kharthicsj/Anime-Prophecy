import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema({
    tagType: {
        type: String,
        required: true,
        enum: ['anime', 'store', 'country', 'general'],
        description: 'The type of tag this theme applies to (e.g. anime, store, country, general)'
    },
    tag: {
        type: String,
        required: true,
        description: 'The actual tag value (e.g. Demon Slayer, Amazon, INDIA, US)'
    },
    backgroundColor: {
        type: String,
        default: '#9333ea', // default purple
    },
    textColor: {
        type: String,
        default: '#ffffff',
    },
    borderColor: {
        type: String,
        default: 'transparent',
    },
    buttonColor: {
        type: String,
        default: '#9333ea', // default purple
    },
    priceColor: {
        type: String,
        default: '#c084fc', // purple-400
    },
    categoryBgColor: {
        type: String,
        default: '#27272a', // zinc-800
    },
    categoryTextColor: {
        type: String,
        default: '#e4e4e7', // zinc-200
    },
    subCategoryBgColor: {
        type: String,
        default: 'rgba(76, 29, 149, 0.3)', // violet-900/30
    },
    subCategoryTextColor: {
        type: String,
        default: '#c4b5fd', // violet-300
    }
}, { timestamps: true });

// Ensure unique theme per tag type and tag value
themeSchema.index({ tagType: 1, tag: 1 }, { unique: true });

export default mongoose.model('Theme', themeSchema);
