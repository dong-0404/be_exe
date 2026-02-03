const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('TOKEN_EXPIRED');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('INVALID_TOKEN');
        }
        throw error;
    }
}

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload
 */
function decodeToken(token) {
    return jwt.decode(token);
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
};
