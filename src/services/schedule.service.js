const ClassRepository = require('../repositories/class.repository');
const ClassScheduleRepository = require('../repositories/classSchedule.repository');
const TutorRepository = require('../repositories/tutor.repository');

/**
 * ScheduleService - Business Logic for Class Schedules
 */
class ScheduleService {
  constructor() {
    this.classRepo = new ClassRepository();
    this.scheduleRepo = new ClassScheduleRepository();
    this.tutorRepo = new TutorRepository();
  }

  /**
   * Get tutor profile from userId
   */
  async getTutorByUserId(userId) {
    const tutor = await this.tutorRepo.findByUserId(userId);
    if (!tutor) {
      const err = new Error('Tutor profile not found');
      err.statusCode = 403;
      throw err;
    }
    return tutor;
  }

  /**
   * Verify tutor owns the class
   */
  async assertOwner(classId, userId) {
    const classDoc = await this.classRepo.findById(classId);
    if (!classDoc) {
      const err = new Error('Lớp học không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const tutor = await this.getTutorByUserId(userId);
    if (String(classDoc.tutorId) !== String(tutor._id)) {
      const err = new Error('Bạn không phải chủ lớp');
      err.statusCode = 403;
      throw err;
    }

    return classDoc;
  }

  /**
   * Validate time: endTime must be > startTime
   */
  validateTime(startTime, endTime) {
    if (startTime && endTime && endTime <= startTime) {
      const err = new Error('Giờ kết thúc phải sau giờ bắt đầu');
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Format schedule response with className
   */
  formatSchedule(schedule, className) {
    const s = schedule.toObject ? schedule.toObject() : { ...schedule };
    return {
      _id: s._id,
      classId: s.classId?._id || s.classId,
      className: s.classId?.name || className || null,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.title,
      createdAt: s.createdAt,
    };
  }

  /**
   * API 6 - GET /tutors/me/schedules
   * Get all schedules across all tutor's classes
   */
  async getMySchedules(userId, { from, to } = {}) {
    const tutor = await this.getTutorByUserId(userId);
    const classes = await this.classRepo.findByTutorId(tutor._id);

    if (!classes.length) return [];

    const classIds = classes.map((c) => c._id);
    const schedules = await this.scheduleRepo.listByClassIds(classIds, { from, to });

    return schedules.map((s) => this.formatSchedule(s));
  }

  /**
   * API 7 - GET /classes/:classId/schedules
   * Get schedules for a specific class (tutor owner or student member)
   */
  async getClassSchedules(classId, { from, to } = {}) {
    const schedules = await this.scheduleRepo.listByClassId(classId, { from, to });
    return schedules.map((s) => this.formatSchedule(s));
  }

  /**
   * API 8 - POST /classes/:classId/schedules
   * Create a new schedule. Only owner tutor.
   */
  async createSchedule(classId, userId, { date, startTime, endTime, title }) {
    const classDoc = await this.assertOwner(classId, userId);

    this.validateTime(startTime, endTime);

    const schedule = await this.scheduleRepo.create({
      classId,
      date,
      startTime,
      endTime,
      title: title || null,
    });

    return this.formatSchedule(schedule, classDoc.name);
  }

  /**
   * API 9 - PATCH /classes/:classId/schedules/:scheduleId
   * Update a schedule. Only owner tutor.
   */
  async updateSchedule(classId, scheduleId, userId, updateData) {
    await this.assertOwner(classId, userId);

    const existing = await this.scheduleRepo.findByIdAndClassId(scheduleId, classId);
    if (!existing) {
      const err = new Error('Buổi học không tồn tại hoặc không thuộc lớp này');
      err.statusCode = 404;
      throw err;
    }

    const newStart = updateData.startTime || existing.startTime;
    const newEnd = updateData.endTime || existing.endTime;
    this.validateTime(newStart, newEnd);

    const updated = await this.scheduleRepo.updateById(scheduleId, updateData);
    return this.formatSchedule(updated);
  }

  /**
   * API 10 - DELETE /classes/:classId/schedules/:scheduleId
   * Delete a schedule (cascade delete attendances). Only owner tutor.
   */
  async deleteSchedule(classId, scheduleId, userId) {
    await this.assertOwner(classId, userId);

    const existing = await this.scheduleRepo.findByIdAndClassId(scheduleId, classId);
    if (!existing) {
      const err = new Error('Buổi học không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    await this.scheduleRepo.deleteById(scheduleId);
  }
}

module.exports = ScheduleService;
