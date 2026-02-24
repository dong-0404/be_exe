const { verifyToken } = require('../utils/jwt');

/**
 * Socket.io Authentication Middleware
 * Verifies JWT token from query string and attaches userId to socket.data
 * @param {Object} socket - Socket.io socket instance
 * @param {Function} next - Next function
 */
function socketAuth(socket, next) {
    try {
        // Get token from query string or handshake auth
        const token = socket.handshake.query.token || socket.handshake.auth?.token;

        if (!token) {
            console.warn('⚠️  Socket auth failed: No token provided');
            return next(new Error('Authentication token is required'));
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to socket data
        socket.data.userId = decoded.id;
        socket.data.user = decoded;

        console.log(`🔐 Socket authenticated: userId=${decoded.id}, email=${decoded.email}`);
        next();
    } catch (err) {
        console.error('❌ Socket auth error:', err.message);
        if (err.message === 'TOKEN_EXPIRED') {
            return next(new Error('Token has expired'));
        }

        if (err.message === 'INVALID_TOKEN') {
            return next(new Error('Invalid authentication token'));
        }

        return next(new Error('Authentication failed'));
    }
}

module.exports = socketAuth;
