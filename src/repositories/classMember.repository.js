const ClassMemberModel = require('../models/classMember.model');

/**
 * ClassMember Repository - Data Access Layer
 */
class ClassMemberRepository {
  /**
   * Create new class member
   */
  async create(memberData) {
    return ClassMemberModel.create(memberData);
  }

  /**
   * Find member by classId and studentProfileId
   */
  async findByClassAndStudent(classId, studentProfileId) {
    return ClassMemberModel.findOne({ classId, studentProfileId });
  }

  /**
   * List all members of a class with student and user info populated
   */
  async listByClassId(classId) {
    return ClassMemberModel.find({ classId })
      .populate({
        path: 'studentProfileId',
        select: 'fullName avatarUrl userId',
        populate: {
          path: 'userId',
          select: 'email phone',
        },
      })
      .sort({ joinedAt: 1 });
  }

  /**
   * List all class members where classId is in provided list (for tutor's students)
   */
  async listByClassIds(classIds) {
    return ClassMemberModel.find({ classId: { $in: classIds } })
      .populate({
        path: 'studentProfileId',
        select: 'fullName avatarUrl userId',
        populate: {
          path: 'userId',
          select: 'email phone',
        },
      })
      .populate('classId', 'name')
      .sort({ joinedAt: 1 });
  }

  /**
   * List all classes a student belongs to (with subject and grade populated)
   */
  async listByStudentProfileId(studentProfileId) {
    return ClassMemberModel.find({ studentProfileId })
      .populate({
        path: 'classId',
        populate: [
          { path: 'subjectId', select: 'name' },
          { path: 'gradeId', select: 'name' },
        ],
      })
      .sort({ joinedAt: -1 });
  }

  /**
   * Count members in a class
   */
  async countByClassId(classId) {
    return ClassMemberModel.countDocuments({ classId });
  }

  /**
   * Check if student is member of a class
   */
  async isMember(classId, studentProfileId) {
    const count = await ClassMemberModel.countDocuments({ classId, studentProfileId });
    return count > 0;
  }
}

module.exports = ClassMemberRepository;
