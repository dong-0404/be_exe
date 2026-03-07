const AttendanceService = require('../services/attendance.service');
const { success } = require('../utils/response');

const attendanceService = new AttendanceService();

/**
 * AttendanceController - HTTP Layer for Attendance management
 */
class AttendanceController {
  /**
   * API 14 - POST /classes/:classId/schedules/:scheduleId/attend
   * Student self-attendance
   */
  async attendSchedule(req, res, next) {
    try {
      const { classId, scheduleId } = req.params;
      const record = await attendanceService.attendSchedule(classId, scheduleId, req.user.id);
      return success(res, { data: record });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 15 - GET /students/me/attendances
   * Get all attendance records for student
   */
  async getMyAttendances(req, res, next) {
    try {
      const records = await attendanceService.getMyAttendances(req.user.id);
      return success(res, { data: records });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 16 - GET /classes/:classId/schedules/:scheduleId/attendance
   * Tutor views attendance for a schedule
   */
  async getScheduleAttendance(req, res, next) {
    try {
      const { classId, scheduleId } = req.params;
      const records = await attendanceService.getScheduleAttendance(classId, scheduleId, req.user.id);
      return success(res, { data: records });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AttendanceController;
