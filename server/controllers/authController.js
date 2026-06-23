import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { getIO } from '../socket.js';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {string} JWT token
 */
const generateToken = (userId, sessionId = null) => {
    return jwt.sign({ id: userId, role: 'admin', sessionId }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
        expiresIn: '7d',
    });
};

const normalizeEmail = (email) => email?.trim().toLowerCase();

/**
 * Register user (Admin)
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!username || !normalizedEmail || !password || !confirmPassword) {
        throw new AppError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username }],
    });

    if (existingUser) {
        throw new AppError('User with this email or username already exists', 409);
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    const assignedRole = adminCount === 0 ? 'admin' : 'pending_admin';

    // Create new user
    const newUser = new User({
        username,
        email: normalizedEmail,
        password,
        role: assignedRole,
    });

    await newUser.save();

    if (assignedRole === 'pending_admin') {
        try {
            const io = getIO();
            io.emit('new_admin_request', { user: { id: newUser._id, username: newUser.username, email: newUser.email } });
        } catch(e) {}
    }

    const token = generateToken(newUser._id);

    res.status(201).json({
        success: true,
        message: assignedRole === 'admin' ? 'Admin user registered successfully' : 'Registration successful, pending admin approval',
        data: {
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
            token: assignedRole === 'admin' ? token : null,
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
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedEmail || !password) {
        throw new AppError('Email and password are required', 400);
    }

    // Find user and get password (normally excluded from queries)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (user.role === 'pending_admin') {
        throw new AppError('Your account is pending admin approval', 403);
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();

    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const deviceType = parser.getDevice().type || 'Desktop';
    const sessionId = crypto.randomUUID();
    let ipAddress = req.ip || req.connection.remoteAddress;
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
        ipAddress = '127.0.0.1 (Localhost)';
    }

    user.sessions.push({
        sessionId,
        deviceType,
        browser,
        os,
        ipAddress,
        loginTime: new Date(),
        lastActive: new Date(),
        isOnline: true
    });

    await user.save();

    const token = generateToken(user._id, sessionId);

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
                sessionId
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
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            if (decoded.id && decoded.sessionId) {
                await User.updateOne(
                    { _id: decoded.id },
                    { $pull: { sessions: { sessionId: decoded.sessionId } } }
                );
                try {
                    const io = getIO();
                    io.emit('admin_status_change', { userId: decoded.id, sessionId: decoded.sessionId, isOnline: false });
                } catch(e){}
            }
        } catch(e) {}
    }

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
                sessionId: req.user.sessionId,
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
    const normalizedEmail = normalizeEmail(email);

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

    if (normalizedEmail) {
        const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existingEmail) {
            throw new AppError('Email already in use', 409);
        }
        user.email = normalizedEmail;
    }

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
    });
});

export const getAdminsAndSessions = asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'admin' }).select('-password');
    const pendingAdmins = await User.find({ role: 'pending_admin' }).select('-password');
    res.json({ success: true, data: { admins, pendingAdmins } });
});

export const approveAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'pending_admin') throw new AppError('User is not pending approval', 400);

    user.role = 'admin';
    await user.save();

    try {
        const io = getIO();
        io.emit('admin_approved', { user: { id: user._id, username: user.username } });
    } catch(e) {}

    res.json({ success: true, message: 'Admin approved successfully', data: { user } });
});

export const rejectAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'pending_admin') throw new AppError('User is not pending approval', 400);

    await User.findByIdAndDelete(id);

    try {
        const io = getIO();
        io.emit('admin_rejected', { userId: id });
    } catch(e) {}

    res.json({ success: true, message: 'Admin request rejected' });
});

export const terminateSession = asyncHandler(async (req, res) => {
    const { userId, sessionId } = req.params;
    await User.updateOne(
        { _id: userId },
        { $pull: { sessions: { sessionId } } }
    );
    try {
        const io = getIO();
        io.emit('session_terminated', { userId, sessionId });
    } catch(e) {}
    res.json({ success: true, message: 'Session terminated' });
});
