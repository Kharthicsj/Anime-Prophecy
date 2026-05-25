import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import initCloudinary from './config/cloudinary.js';
import { requestLogger, errorHandler } from './middlewares/auth.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import carouselRoutes from './routes/carouselRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import trendingRoutes from './routes/trendingRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Initialize Cloudinary
initCloudinary();

// Connect to database
await connectDB();

// ===== Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// CORS configuration - handle both development and production
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');

const corsOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, 'https://animeprophecy.onrender.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://animeprophecy.onrender.com', 'https://animeprophecy.com'];

const allowedOrigins = new Set(
    corsOrigins
        .flatMap((origin) => (origin ? origin.split(',') : []))
        .map(normalizeOrigin)
        .filter(Boolean)
);


app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }

            const normalizedOrigin = normalizeOrigin(origin);
            if (allowedOrigins.has(normalizedOrigin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);
app.use(requestLogger);

// ===== API Routes =====
const routeMounts = [
    ['/api/auth', '/auth', authRoutes],
    ['/api/products', '/products', productRoutes],
    ['/api/upload', '/upload', uploadRoutes],
    // NOTE: Renamed /api/banners → /api/slides to avoid ad-blocker false positives
    ['/api/slides', '/slides', bannerRoutes],
    ['/api/carousels', '/carousels', carouselRoutes],
    ['/api/newsletter', '/newsletter', newsletterRoutes],
    ['/api/settings', '/settings', settingsRoutes],
    ['/api/trending', '/trending', trendingRoutes],
];

for (const [apiPath, legacyPath, router] of routeMounts) {
    app.use(apiPath, router);
    app.use(legacyPath, router);
}

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running healthy',
        timestamp: new Date().toISOString(),
    });
});

// ===== 404 Handler =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});

// ===== Error Handler =====
app.use(errorHandler);

// ===== Server Start =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;