const ParentModel = require('../models/parent.model');

/**
 * Parent Repository - Data Access Layer
 */
class ParentRepository {
  /**
   * Find parent by ID
   */
  async findById(id) {
    return ParentModel.findById(id).populate('userId', 'email status');
  }

  /**
   * Find parent by user ID
   */
  async findByUserId(userId) {
    return ParentModel.findOne({ userId }).populate('userId', 'email status');
  }

  /**
   * Create new parent
   */
  async create(parentData) {
    return ParentModel.create(parentData);
  }

  /**
   * Update parent by ID
   */
  async updateById(id, updateData) {
    return ParentModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('userId', 'email status');
  }

  /**
   * Delete parent by ID
   */
  async deleteById(id) {
    return ParentModel.findByIdAndDelete(id);
  }

  /**
   * Find all parents with pagination
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [parents, total] = await Promise.all([
      ParentModel.find(filter)
        .populate('userId', 'email status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ParentModel.countDocuments(filter),
    ]);

    return { parents, total };
  }

  /**
   * Check if user already has parent profile
   */
  async existsByUserId(userId) {
    const count = await ParentModel.countDocuments({ userId });
    return count > 0;
  }
}

module.exports = ParentRepository;
