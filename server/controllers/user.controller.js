const {
    Users
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    getPagination,
    paginationMeta
} = require('../utils/pagination');

const sanitize = (user) => {
    const {
        password,
        refreshToken,
        ...safe
    } = user;
    return safe;
};

const getProfile = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        if (!user) return errorResponse(res, 'User not found', 404);
        return successResponse(res, {
            user: sanitize(user)
        }, 'Profile fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const updateProfile = async (req, res) => {
    try {
        const allowed = ['name', 'college', 'phone', 'avatar'];
        const updates = {};
        allowed.forEach((f) => {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        });
        const user = await Users.update(req.user._id, updates);
        return successResponse(res, {
            user: sanitize(user)
        }, 'Profile updated');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const listUsers = async (req, res) => {
    try {
        const {
            page,
            limit,
            skip
        } = getPagination(req.query);
        const users = await Users.findAll({
            limit,
            offset: skip
        });
        const total = await Users.count();
        return successResponse(res, {
            users: users.map(sanitize),
            meta: paginationMeta(total, page, limit)
        }, 'Users fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) return errorResponse(res, 'User not found', 404);
        const updated = await Users.update(req.params.id, {
            isActive: !user.isActive
        });
        return successResponse(res, {
            user: sanitize(updated)
        }, 'Status updated');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    listUsers,
    toggleUserStatus
};