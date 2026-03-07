const ClassModel = require('../models/class.model');
const ClassMemberModel = require('../models/classMember.model');

/**
 * Class Repository - Data Access Layer
 */
class ClassRepository {
  /**
   * Create new class
   */
  async create(classData) {
    return ClassModel.create(classData);
  }

  /**
   * Find class by ID with subject and grade populated
   */
  async findById(id) {
    return ClassModel.findById(id)
      .populate('subjectId', 'name')
      .populate('gradeId', 'name');
  }

  /**
   * Find classes by tutor ID with subject and grade populated
   */
  async findByTutorId(tutorId) {
    return ClassModel.find({ tutorId })
      .populate('subjectId', 'name')
      .populate('gradeId', 'name')
      .sort({ createdAt: -1 });
  }

  /**
   * Find class by invite code
   */
  async findByInviteCode(inviteCode) {
    return ClassModel.findOne({ inviteCode: inviteCode.toUpperCase() })
      .populate('subjectId', 'name')
      .populate('gradeId', 'name');
  }

  /**
   * Update class by ID
   */
  async updateById(id, updateData) {
    return ClassModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('subjectId', 'name')
      .populate('gradeId', 'name');
  }

  /**
   * Check if invite code already exists
   */
  async inviteCodeExists(code) {
    const count = await ClassModel.countDocuments({ inviteCode: code.toUpperCase() });
    return count > 0;
  }

  /**
   * Count current students in a class (dynamic count from ClassMember)
   */
  async countCurrentStudents(classId) {
    return ClassMemberModel.countDocuments({ classId });
  }
}

module.exports = ClassRepository;
