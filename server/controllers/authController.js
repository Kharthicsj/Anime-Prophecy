import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId, role: 'admin' }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
        expiresIn: '7d',
    });
};

/**
 * Register user (Admin)
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        throw new AppError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new AppError('User with this email or username already exists', 409);
    }

    // Create new user
    const newUser = new User({
        username,
        email,
        password,
        role: 'admin', // Registration creates admin users
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
        success: true,
        message: 'Admin user registered successfully',
        data: {
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
            token,
        },
    });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    // Find user and get password (normally excluded from queries)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            token,
        },
    });
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie('token');

    res.json({
        success: true,
        message: 'Logout successful',
    });
});

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
            },
        },
    });
});

/**
 * Update user profile
 * @route PUT /api/auth/update-profile
 * @access Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (username) {
        const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
        if (existingUsername) {
            throw new AppError('Username already taken', 409);
        }
        user.username = username;
    }

    if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingEmail) {
            throw new AppError('Email already in use', 409);
        }
        user.email = email;
    }

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
    });
});
