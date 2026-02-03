const bcrypt = require('bcrypt');
const config = require('../config/env');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    return bcrypt.hash(password, config.bcryptRounds);
}

/**
 * Compare password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword,
};
