import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            enum: ['US', 'Japan', 'UK', 'South Korea', 'India', 'Worldwide'],
            required: true,
            unique: true,
        },
        bannerImage: {
            url: {
                type: String,
                default: '',
            },
            publicId: {
                type: String,
                default: '',
            },
        },
        siteTitle: {
            type: String,
            default: 'Prophecy Hub - Anime Merchandise',
            maxlength: [200, 'Title must not exceed 200 characters'],
        },
        seoDescription: {
            type: String,
            default: 'Discover exclusive anime merchandise and affiliate products',
            maxlength: [500, 'SEO description must not exceed 500 characters'],
        },
        language: {
            type: String,
            enum: ['en', 'ja', 'ko', 'hi'],
            default: 'en',
        },
        translations: {
            header: {
                type: String,
                default: 'Prophecy Hub',
            },
            subtitle: {
                type: String,
                default: 'Your Ultimate Anime Merchandise Destination',
            },
            disclaimer: {
                type: String,
                default: 'Translations may vary in accuracy. This site uses affiliate links.',
            },
        },
        affiliateDisclaimer: {
            type: String,
            default:
                'As an Amazon Associate and affiliate partner, we earn from qualifying purchases. Our recommendations are unbiased and based on quality.',
        },
        socialLinks: {
            youtube: String,
            pinterest: String,
            facebook: String,
            instagram: String,
        },
        footerLinks: {
            aboutUs: String,
            contactUs: String,
            affiliateDisclosure: String,
            privacyPolicy: String,
            termsConditions: String,
            disclaimer: String,
        },
        contactEmail: {
            type: String,
            default: 'contact@prophecyhub.com',
        },
        contactPhone: {
            type: String,
            default: '+1-800-PROPHECY',
        },
        copyrightText: {
            type: String,
            default: '© 2024 Prophecy Hub. All rights reserved.',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model('GlobalSettings', globalSettingsSchema);
