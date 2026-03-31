const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
    Users
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES,
    JWT_REFRESH_EXPIRES
} = require('../config/env');

const signAccess = (payload) => jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES
});
const signRefresh = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES
});
const cookieOpts = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
};

const sanitize = (user) => {
    const {
        password,
        refreshToken,
        ...safe
    } = user;
    return safe;
};

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            college,
            role,
            adminCode
        } = req.body;

        // Role validation
        const allowedRoles = ['student', 'admin', 'principal'];
        const requestedRole = allowedRoles.includes(role) ? role : 'student';

        // Admin/Principal require a secret code
        if (requestedRole === 'admin' || requestedRole === 'principal') {
            const validCode = process.env.ADMIN_SECRET_CODE || 'eventflex@admin2024';
            if (adminCode !== validCode) {
                return errorResponse(res, 'Invalid admin code', 403);
            }
        }

        const existing = await Users.findByEmail(email);
        if (existing) return errorResponse(res, 'Email already in use', 409);
        const hashed = await bcrypt.hash(password, 10);
        const user = await Users.create({
            name,
            email,
            password: hashed,
            role: requestedRole,
            college: college || ''
        });
        const payload = {
            _id: user._id,
            role: user.role
        };
        const accessToken = signAccess(payload);
        const refreshToken = signRefresh(payload);
        await Users.update(user._id, {
            refreshToken
        });
        res.cookie('refreshToken', refreshToken, cookieOpts);
        return successResponse(res, {
            user: sanitize(user),
            accessToken
        }, 'Registered successfully', 201);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;
        const user = await Users.findByEmail(email);
        if (!user) return errorResponse(res, 'Invalid credentials', 401);
        const match = await bcrypt.compare(password, user.password);
        if (!match) return errorResponse(res, 'Invalid credentials', 401);
        const payload = {
            _id: user._id,
            role: user.role
        };
        const accessToken = signAccess(payload);
        const refreshToken = signRefresh(payload);
        await Users.update(user._id, {
            refreshToken
        });
        res.cookie('refreshToken', refreshToken, cookieOpts);
        return successResponse(res, {
            user: sanitize(user),
            accessToken
        }, 'Logged in successfully');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const logout = async (req, res) => {
    try {
        if (req.user) await Users.update(req.user._id, {
            refreshToken: null
        });
        res.clearCookie('refreshToken', cookieOpts);
        return successResponse(res, null, 'Logged out');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const refresh = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return errorResponse(res, 'No refresh token', 401);
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        } catch {
            return errorResponse(res, 'Invalid refresh token', 401);
        }
        const user = await Users.findById(decoded._id);
        if (!user || user.refreshToken !== token) return errorResponse(res, 'Refresh token mismatch', 401);
        const accessToken = signAccess({
            _id: user._id,
            role: user.role
        });
        return successResponse(res, {
            accessToken
        }, 'Token refreshed');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getMe = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        return successResponse(res, {
            user: sanitize(user)
        }, 'Current user');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    register,
    login,
    logout,
    refresh,
    getMe
};