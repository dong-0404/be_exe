const ClassService = require('../services/class.service');
const { success, error } = require('../utils/response');

const classService = new ClassService();

/**
 * ClassController - HTTP Layer for Class management
 */
class ClassController {
  /**
   * API 1 - GET /tutors/me/classes
   * Get all classes created by logged-in tutor
   */
  async getMyClasses(req, res, next) {
    try {
      const classes = await classService.getMyClasses(req.user.id);
      return success(res, { data: classes });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 2 - POST /classes
   * Create new class
   */
  async createClass(req, res, next) {
    try {
      const { name, maxStudents, subjectId, gradeId } = req.body;
      const newClass = await classService.createClass(req.user.id, {
        name,
        maxStudents,
        subjectId,
        gradeId,
      });
      return success(res, { data: newClass, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 3 - GET /classes/:id
   * Get class detail (members + schedules)
   */
  async getClassDetail(req, res, next) {
    try {
      const { id } = req.params;
      const detail = await classService.getClassDetail(id, req.user.id, req.user.role);
      return success(res, { data: detail });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 4 - PATCH /classes/:id
   * Update class info (name, maxStudents)
   */
  async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const { name, maxStudents } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (maxStudents !== undefined) updateData.maxStudents = maxStudents;

      const updated = await classService.updateClass(id, req.user.id, updateData);
      return success(res, { data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 5 - POST /classes/:id/regenerate-invite
   * Regenerate invite code
   */
  async regenerateInvite(req, res, next) {
    try {
      const { id } = req.params;
      const result = await classService.regenerateInvite(id, req.user.id);
      return success(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 11 - GET /tutors/me/students
   * Get all students across all tutor's classes
   */
  async getMyStudents(req, res, next) {
    try {
      const students = await classService.getMyStudents(req.user.id);
      return success(res, { data: students });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 12 - POST /classes/join
   * Student joins a class via invite code
   */
  async joinClass(req, res, next) {
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) {
        return error(res, { message: 'inviteCode là bắt buộc', statusCode: 400 });
      }
      const result = await classService.joinClass(req.user.id, inviteCode);
      return success(res, { data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 13 - GET /students/me/classes
   * Get all classes student belongs to (with schedules)
   */
  async getMyStudentClasses(req, res, next) {
    try {
      const classes = await classService.getMyStudentClasses(req.user.id);
      return success(res, { data: classes });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClassController;
