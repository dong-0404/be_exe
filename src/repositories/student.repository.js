const StudentModel = require('../models/student.model');

/**
 * Student Repository - Data Access Layer
 */
class StudentRepository {
  /**
   * Find student by ID
   */
  async findById(id) {
    return StudentModel.findById(id)
      .populate('userId', 'email phone status')
      .populate('parentId', 'fullName avatarUrl')
      .lean();
  }

  /**
   * Find student by user ID
   */
  async findByUserId(userId) {
    return StudentModel.findOne({ userId })
      .populate('userId', 'email phone status')
      .populate('parentId', 'fullName avatarUrl')
      .lean();
  }

  /**
   * Find students by parent ID
   */
  async findByParentId(parentId) {
    return StudentModel.find({ parentId })
      .populate('userId', 'email phone status')
      .lean();
  }

  /**
   * Create new student
   */
  async create(studentData) {
    return StudentModel.create(studentData);
  }

  /**
   * Update student by ID
   */
  async updateById(id, updateData) {
    return StudentModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'email phone status')
      .populate('parentId', 'fullName avatarUrl')
      .lean();
  }

  /**
   * Delete student by ID
   */
  async deleteById(id) {
    return StudentModel.findByIdAndDelete(id);
  }

  /**
   * Find all students with pagination
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      StudentModel.find(filter)
        .populate('userId', 'email phone status')
        .populate('parentId', 'fullName avatarUrl')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      StudentModel.countDocuments(filter),
    ]);

    return { students, total };
  }

  /**
   * Check if user already has student profile
   */
  async existsByUserId(userId) {
    const count = await StudentModel.countDocuments({ userId });
    return count > 0;
  }
}

module.exports = StudentRepository;
