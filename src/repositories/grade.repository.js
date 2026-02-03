const GradeModel = require('../models/grade.model');

/**
 * Grade Repository - Data Access Layer
 */
class GradeRepository {
  /**
   * Find grade by ID
   */
  async findById(id) {
    return GradeModel.findById(id);
  }

  /**
   * Find grade by code
   */
  async findByCode(code) {
    return GradeModel.findOne({ code: code.toUpperCase() });
  }

  /**
   * Find grade by order number
   */
  async findByOrderNumber(orderNumber) {
    return GradeModel.findOne({ orderNumber });
  }

  /**
   * Create new grade
   */
  async create(gradeData) {
    return GradeModel.create(gradeData);
  }

  /**
   * Update grade by ID
   */
  async updateById(id, updateData) {
    return GradeModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete grade by ID
   */
  async deleteById(id) {
    return GradeModel.findByIdAndDelete(id);
  }

  /**
   * Find all grades with pagination
   */
  async findAll({ page = 1, limit = 12, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [grades, total] = await Promise.all([
      GradeModel.find(filter).skip(skip).limit(limit).sort({ orderNumber: 1 }),
      GradeModel.countDocuments(filter),
    ]);

    return { grades, total };
  }

  /**
   * Find all active grades
   */
  async findAllActive() {
    return GradeModel.find({ status: 1 }).sort({ orderNumber: 1 });
  }

  /**
   * Check if code exists
   */
  async codeExists(code, excludeId = null) {
    const query = { code: code.toUpperCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await GradeModel.countDocuments(query);
    return count > 0;
  }

  /**
   * Check if order number exists
   */
  async orderNumberExists(orderNumber, excludeId = null) {
    const query = { orderNumber };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await GradeModel.countDocuments(query);
    return count > 0;
  }
}

module.exports = GradeRepository;
