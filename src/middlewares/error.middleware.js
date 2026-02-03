const config = require('../config/env');

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
    // Log error in development
    if (config.nodeEnv === 'development') {
        console.error('Error:', err);
    }

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        const errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));

        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Send error response
    const response = {
        success: false,
        message,
    };

    // Include stack trace in development
    if (config.nodeEnv === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * Handle 404 Not Found errors
 */
function notFound(req, res) {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
}

module.exports = {
    errorHandler,
    notFound,
};
