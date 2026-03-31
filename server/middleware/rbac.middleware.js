const {
    errorResponse
} = require('../utils/apiResponse');

/**
 * Restrict access to users whose role is in the provided list.
 * @param {...string} roles
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return errorResponse(res, 'Forbidden: insufficient role', 403);
    }
    next();
};

/**
 * Restrict access to the owner of a resource.
 * @param {(req: Request) => string|ObjectId} getResourceOwnerId - function that extracts owner id from req
 */
const isOwner = (getResourceOwnerId) => async (req, res, next) => {
    try {
        const ownerId = await getResourceOwnerId(req);
        if (!req.user || String(ownerId) !== String(req.user._id)) {
            return errorResponse(res, 'Forbidden: not the owner', 403);
        }
        next();
    } catch (err) {
        return errorResponse(res, 'Forbidden', 403);
    }
};

module.exports = {
    authorize,
    isOwner
};