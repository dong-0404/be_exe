const SubjectModel = require('../models/subject.model');

/**
 * Subject Repository - Data Access Layer
 */
class SubjectRepository {
  /**
   * Find subject by ID
   */
  async findById(id) {
    return SubjectModel.findById(id);
  }

  /**
   * Find subject by code
   */
  async findByCode(code) {
    return SubjectModel.findOne({ code: code.toUpperCase() });
  }

  /**
   * Create new subject
   */
  async create(subjectData) {
    return SubjectModel.create(subjectData);
  }

  /**
   * Update subject by ID
   */
  async updateById(id, updateData) {
    return SubjectModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete subject by ID
   */
  async deleteById(id) {
    return SubjectModel.findByIdAndDelete(id);
  }

  /**
   * Find all subjects with pagination
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      SubjectModel.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      SubjectModel.countDocuments(filter),
    ]);

    return { subjects, total };
  }

  /**
   * Find all active subjects
   */
  async findAllActive() {
    return SubjectModel.find({ status: 1 }).sort({ name: 1 });
  }

  /**
   * Search subjects by name
   */
  async search(searchText) {
    return SubjectModel.find({
      $text: { $search: searchText },
      status: 1,
    });
  }

  /**
   * Check if code exists
   */
  async codeExists(code, excludeId = null) {
    const query = { code: code.toUpperCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await SubjectModel.countDocuments(query);
    return count > 0;
  }
}

module.exports = SubjectRepository;
