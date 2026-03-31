// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];
    let code = err.code || 'INTERNAL_ERROR';

    // Mongoose CastError (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
        code = 'CAST_ERROR';
    }

    // Mongoose ValidationError
    else if (err.name === 'ValidationError') {
        statusCode = 422;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // MongoDB duplicate key
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate value for ${field}`;
        code = 'DUPLICATE_KEY';
    }

    // Unhandled errors — log and return generic message
    else if (statusCode === 500) {
        console.error('[Error]', err);
        message = 'Internal Server Error';
    }

    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        code
    });
};

module.exports = errorHandler;