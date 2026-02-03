const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * Authenticate user by JWT token
 * Attaches user payload to req.user
 */
function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, {
                message: 'Authentication token is required',
                statusCode: 401,
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (err) {
        if (err.message === 'TOKEN_EXPIRED') {
            return error(res, {
                message: 'Token has expired',
                statusCode: 401,
            });
        }

        if (err.message === 'INVALID_TOKEN') {
            return error(res, {
                message: 'Invalid authentication token',
                statusCode: 401,
            });
        }

        return error(res, {
            message: 'Authentication failed',
            statusCode: 401,
        });
    }
}

/**
 * Authorize user by roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, {
                message: 'User not authenticated',
                statusCode: 401,
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return error(res, {
                message: 'You do not have permission to access this resource',
                statusCode: 403,
            });
        }

        next();
    };
}

/**
 * Flexible Authentication
 * Accepts both JWT token (for logged-in users) or email (for onboarding)
 * Does not throw error if no auth provided - lets controller handle it
 */
function flexibleAuth(req, res, next) {
    // Try to get token
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            // Attach user info
            req.user = decoded;
            req.authMethod = 'token';
            return next();
        } catch (err) {
            // Token invalid, continue without throwing error
            // Controller will check for email instead
        }
    }

    // No token or invalid token
    req.authMethod = 'email';
    next();
}

module.exports = {
    authenticate,
    authorize,
    flexibleAuth,
};
