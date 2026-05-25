import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        country: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        source: {
            type: String,
            enum: ['landing', 'country', 'admin'],
            default: 'landing',
        },
    },
    { timestamps: true }
);

export default mongoose.model('Newsletter', newsletterSchema);
