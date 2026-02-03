const UserModel = require('../models/user.model');

/**
 * User Repository - Data Access Layer
 * Handles all database operations for User entity
 */
class UserRepository {
  /**
   * Find user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object|null>} User document
   */
  async findByEmail(email, includePassword = false) {
    const query = UserModel.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User document
   */
  async findById(id) {
    return UserModel.findById(id);
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user document
   */
  async create(userData) {
    return UserModel.create(userData);
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user document
   */
  async updateById(id, updateData) {
    return UserModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    });
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Deleted user document
   */
  async deleteById(id) {
    return UserModel.findByIdAndDelete(id);
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {Object} options.filter - Filter criteria
   * @returns {Promise<Object>} Users and pagination info
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
    };
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeId - User ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeId = null) {
    const query = { email };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await UserModel.countDocuments(query);
    return count > 0;
  }

  /**
   * Update last login timestamp
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user document
   */
  async updateLastLogin(id) {
    return UserModel.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    );
  }
}

module.exports = UserRepository;
