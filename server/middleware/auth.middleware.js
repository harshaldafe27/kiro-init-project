const jwt = require('jsonwebtoken');
const {
    JWT_ACCESS_SECRET
} = require('../config/env');
const {
    errorResponse
} = require('../utils/apiResponse');

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return errorResponse(res, 'Invalid or expired token', 401);
    }
};

module.exports = {
    protect
};