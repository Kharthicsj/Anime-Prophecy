import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
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
import productSuggestionRoutes from './routes/productSuggestionRoutes.js';
import scraperRoutes from './routes/scraperRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust proxy to correctly resolve user IPs from Render load balancer
app.set('trust proxy', 1);

// Initialize Cloudinary
initCloudinary();

// Connect to database
await connectDB();

// ===== Middleware =====
// Base Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - handle both development and production
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');

const corsOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL, 'https://animeprophecy.onrender.com', 'https://animeprophecy.com']
    : ['http://localhost:5173', 'https://animeprophecy.onrender.com', 'https://animeprophecy.com'];

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

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 300 requests per `window` (here, per 15 minutes)
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

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
    ['/api/suggestions', '/suggestions', productSuggestionRoutes],
    ['/api/scraper', '/scraper', scraperRoutes],
];

for (const [apiPath, legacyPath, router] of routeMounts) {
    app.use(apiPath, router);
    app.use(legacyPath, router);
}

// ===== Root Route =====
app.get('/', (req, res) => {
    res.status(200).type('text').send('Server is running');
});

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
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

import { initSocket } from './socket.js';
initSocket(server);

export default app;