const AttendanceModel = require('../models/attendance.model');

/**
 * Attendance Repository - Data Access Layer
 */
class AttendanceRepository {
  /**
   * Find attendance by scheduleId and studentId
   */
  async findByScheduleAndStudent(scheduleId, studentId) {
    return AttendanceModel.findOne({ scheduleId, studentId });
  }

  /**
   * Create attendance record
   */
  async create(attendanceData) {
    return AttendanceModel.create(attendanceData);
  }

  /**
   * Idempotent createOrGet: returns existing record if already attended
   */
  async createOrGet(scheduleId, studentId) {
    const existing = await this.findByScheduleAndStudent(scheduleId, studentId);
    if (existing) {
      return { record: existing, created: false };
    }

    const record = await this.create({
      scheduleId,
      studentId,
      status: 'present',
      checkedAt: new Date(),
    });

    return { record, created: true };
  }

  /**
   * List all attendance records for a schedule
   */
  async listByScheduleId(scheduleId) {
    return AttendanceModel.find({ scheduleId }).sort({ checkedAt: 1 });
  }

  /**
   * List all attendance records for a student
   */
  async listByStudentId(studentId) {
    return AttendanceModel.find({ studentId }).sort({ checkedAt: -1 });
  }
}

module.exports = AttendanceRepository;
