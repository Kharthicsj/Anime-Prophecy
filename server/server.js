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
const corsOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];


app.use(
    cors({
        origin: corsOrigins,
        credentials: true,
    })
);
app.use(requestLogger);

// ===== API Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
// NOTE: Renamed /api/banners → /api/slides to avoid ad-blocker false positives
app.use('/api/slides', bannerRoutes);
app.use('/api/carousels', carouselRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/trending', trendingRoutes);

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