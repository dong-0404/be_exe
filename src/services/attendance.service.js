const AttendanceRepository = require('../repositories/attendance.repository');
const ClassScheduleRepository = require('../repositories/classSchedule.repository');
const ClassMemberRepository = require('../repositories/classMember.repository');
const ClassRepository = require('../repositories/class.repository');
const TutorRepository = require('../repositories/tutor.repository');
const StudentRepository = require('../repositories/student.repository');

/**
 * AttendanceService - Business Logic for Attendance
 */
class AttendanceService {
  constructor() {
    this.attendanceRepo = new AttendanceRepository();
    this.scheduleRepo = new ClassScheduleRepository();
    this.memberRepo = new ClassMemberRepository();
    this.classRepo = new ClassRepository();
    this.tutorRepo = new TutorRepository();
    this.studentRepo = new StudentRepository();
  }

  /**
   * Get student profile from userId
   */
  async getStudentByUserId(userId) {
    const student = await this.studentRepo.findByUserId(userId);
    if (!student) {
      const err = new Error('Student profile not found');
      err.statusCode = 403;
      throw err;
    }
    return student;
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
   * Check if current time is within schedule window [startTime, endTime] on the session date.
   * Only allowed when: date === today AND currentTime >= startTime AND currentTime <= endTime.
   */
  isWithinAttendanceWindow(schedule) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (schedule.date !== today) {
      return false;
    }
    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  }

  /**
   * API 14 - POST /classes/:classId/schedules/:scheduleId/attend
   * Student self-attendance (idempotent). Only class members.
   * Chỉ cho phép khi buổi học đang trong khung giờ: ngày là hôm nay, giờ hiện tại >= startTime và <= endTime.
   */
  async attendSchedule(classId, scheduleId, userId) {
    const student = await this.getStudentByUserId(userId);

    const isMember = await this.memberRepo.isMember(classId, student._id);
    if (!isMember) {
      const err = new Error('Bạn không phải thành viên của lớp học này.');
      err.statusCode = 403;
      throw err;
    }

    const schedule = await this.scheduleRepo.findByIdAndClassId(scheduleId, classId);
    if (!schedule) {
      const err = new Error('Không tìm thấy buổi học.');
      err.statusCode = 404;
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];
    if (schedule.date !== today) {
      const err = new Error('Chỉ được điểm danh vào ngày diễn ra buổi học.');
      err.statusCode = 400;
      throw err;
    }

    if (!this.isWithinAttendanceWindow(schedule)) {
      const err = new Error(
        'Chỉ được điểm danh trong khung giờ của buổi học (từ startTime đến endTime).'
      );
      err.statusCode = 400;
      throw err;
    }

    const { record } = await this.attendanceRepo.createOrGet(scheduleId, student._id);
    return record;
  }

  /**
   * API 15 - GET /students/me/attendances
   * Get all attendance records for the logged-in student
   */
  async getMyAttendances(userId) {
    const student = await this.getStudentByUserId(userId);
    return this.attendanceRepo.listByStudentId(student._id);
  }

  /**
   * API 16 - GET /classes/:classId/schedules/:scheduleId/attendance
   * Tutor views attendance list for a specific schedule
   */
  async getScheduleAttendance(classId, scheduleId, userId) {
    const tutor = await this.getTutorByUserId(userId);

    const classDoc = await this.classRepo.findById(classId);
    if (!classDoc) {
      const err = new Error('Lớp học không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (String(classDoc.tutorId) !== String(tutor._id)) {
      const err = new Error('Bạn không phải chủ lớp');
      err.statusCode = 403;
      throw err;
    }

    const schedule = await this.scheduleRepo.findByIdAndClassId(scheduleId, classId);
    if (!schedule) {
      const err = new Error('Không tìm thấy buổi học');
      err.statusCode = 404;
      throw err;
    }

    return this.attendanceRepo.listByScheduleId(scheduleId);
  }
}

module.exports = AttendanceService;
