const ClassRepository = require('../repositories/class.repository');
const ClassMemberRepository = require('../repositories/classMember.repository');
const ClassScheduleRepository = require('../repositories/classSchedule.repository');
const TutorRepository = require('../repositories/tutor.repository');
const StudentRepository = require('../repositories/student.repository');

/**
 * ClassService - Business Logic for Classes
 */
class ClassService {
  constructor() {
    this.classRepo = new ClassRepository();
    this.memberRepo = new ClassMemberRepository();
    this.scheduleRepo = new ClassScheduleRepository();
    this.tutorRepo = new TutorRepository();
    this.studentRepo = new StudentRepository();
  }

  /**
   * Generate unique invite code (7 chars uppercase alphanumeric)
   */
  async generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let attempts = 0;

    do {
      code = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      attempts++;
      if (attempts > 20) {
        throw new Error('Failed to generate unique invite code');
      }
    } while (await this.classRepo.inviteCodeExists(code));

    return code;
  }

  /**
   * Get tutor profile from userId, throw 403 if not found
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
   * Get student profile from userId, throw 403 if not found
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
   * Format class response (add subjectName, gradeName, currentStudents)
   */
  async formatClassResponse(classDoc) {
    const classObj = classDoc.toObject ? classDoc.toObject() : { ...classDoc };

    classObj.subjectName = classDoc.subjectId?.name || null;
    classObj.gradeName = classDoc.gradeId?.name || null;
    classObj.currentStudents = await this.memberRepo.countByClassId(classDoc._id);

    return classObj;
  }

  /**
   * API 1 - GET /tutors/me/classes
   * Get all classes created by the tutor
   */
  async getMyClasses(userId) {
    const tutor = await this.getTutorByUserId(userId);
    const classes = await this.classRepo.findByTutorId(tutor._id);

    return Promise.all(classes.map((c) => this.formatClassResponse(c)));
  }

  /**
   * API 2 - POST /classes
   * Create a new class
   */
  async createClass(userId, { name, maxStudents, subjectId, gradeId }) {
    const tutor = await this.getTutorByUserId(userId);

    const inviteCode = await this.generateInviteCode();

    const newClass = await this.classRepo.create({
      tutorId: tutor._id,
      name,
      maxStudents,
      inviteCode,
      subjectId: subjectId || null,
      gradeId: gradeId || null,
    });

    return this.formatClassResponse(newClass);
  }

  /**
   * API 3 - GET /classes/:id
   * Get class detail (members + schedules). Accessible by tutor (owner) or student (member).
   */
  async getClassDetail(classId, userId, userRole) {
    const classDoc = await this.classRepo.findById(classId);
    if (!classDoc) {
      const err = new Error('Lớp học không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const { UserRole } = require('../constants/enums');

    if (userRole === UserRole.TUTOR) {
      const tutor = await this.getTutorByUserId(userId);
      if (String(classDoc.tutorId) !== String(tutor._id)) {
        const err = new Error('Bạn không có quyền truy cập lớp học này');
        err.statusCode = 403;
        throw err;
      }
    } else if (userRole === UserRole.STUDENT) {
      const student = await this.getStudentByUserId(userId);
      const isMember = await this.memberRepo.isMember(classId, student._id);
      if (!isMember) {
        const err = new Error('Bạn không phải thành viên của lớp học này');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Không có quyền truy cập');
      err.statusCode = 403;
      throw err;
    }

    const [members, schedules, currentStudents] = await Promise.all([
      this.memberRepo.listByClassId(classId),
      this.scheduleRepo.listByClassId(classId),
      this.memberRepo.countByClassId(classId),
    ]);

    const classObj = classDoc.toObject();
    classObj.subjectName = classDoc.subjectId?.name || null;
    classObj.gradeName = classDoc.gradeId?.name || null;
    classObj.currentStudents = currentStudents;

    classObj.members = members.map((m) => ({
      _id: m._id,
      classId: m.classId,
      studentProfileId: m.studentProfileId?._id,
      fullName: m.studentProfileId?.fullName || null,
      email: m.studentProfileId?.userId?.email || null,
      phone: m.studentProfileId?.userId?.phone || null,
      avatarUrl: m.studentProfileId?.avatarUrl || null,
      joinedAt: m.joinedAt,
    }));

    classObj.schedules = schedules.map((s) => ({
      _id: s._id,
      classId: s.classId?._id || s.classId,
      className: s.classId?.name || null,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.title,
      createdAt: s.createdAt,
    }));

    return classObj;
  }

  /**
   * API 4 - PATCH /classes/:id
   * Update class (name, maxStudents). Only owner tutor.
   */
  async updateClass(classId, userId, updateData) {
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

    if (updateData.maxStudents !== undefined) {
      const currentStudents = await this.memberRepo.countByClassId(classId);
      if (updateData.maxStudents < currentStudents) {
        const err = new Error(
          `Không thể giảm số học sinh tối đa xuống dưới số thành viên hiện tại (${currentStudents})`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const updated = await this.classRepo.updateById(classId, updateData);
    return this.formatClassResponse(updated);
  }

  /**
   * API 5 - POST /classes/:id/regenerate-invite
   * Regenerate invite code. Only owner tutor.
   */
  async regenerateInvite(classId, userId) {
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

    const newCode = await this.generateInviteCode();
    await this.classRepo.updateById(classId, { inviteCode: newCode });

    return { inviteCode: newCode };
  }

  /**
   * API 11 - GET /tutors/me/students
   * Get all students across all tutor's classes
   */
  async getMyStudents(userId) {
    const tutor = await this.getTutorByUserId(userId);
    const classes = await this.classRepo.findByTutorId(tutor._id);

    if (!classes.length) return [];

    const classIds = classes.map((c) => c._id);
    const members = await this.memberRepo.listByClassIds(classIds);

    return members.map((m) => ({
      studentId: m.studentProfileId?._id,
      fullName: m.studentProfileId?.fullName || null,
      email: m.studentProfileId?.userId?.email || null,
      phone: m.studentProfileId?.userId?.phone || null,
      avatarUrl: m.studentProfileId?.avatarUrl || null,
      classId: m.classId?._id || m.classId,
      className: m.classId?.name || null,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * API 12 - POST /classes/join
   * Student joins a class via invite code
   */
  async joinClass(userId, inviteCode) {
    const classDoc = await this.classRepo.findByInviteCode(inviteCode);
    if (!classDoc) {
      const err = new Error('Mã mời không hợp lệ. Vui lòng kiểm tra lại.');
      err.statusCode = 404;
      throw err;
    }

    const student = await this.getStudentByUserId(userId);
    const currentStudents = await this.memberRepo.countByClassId(classDoc._id);

    if (currentStudents >= classDoc.maxStudents) {
      const err = new Error('Lớp học đã đủ số lượng học sinh.');
      err.statusCode = 400;
      throw err;
    }

    const alreadyMember = await this.memberRepo.isMember(classDoc._id, student._id);
    if (alreadyMember) {
      const err = new Error('Bạn đã là thành viên của lớp học này.');
      err.statusCode = 409;
      throw err;
    }

    const member = await this.memberRepo.create({
      classId: classDoc._id,
      studentProfileId: student._id,
      joinedAt: new Date(),
    });

    const updatedCount = currentStudents + 1;

    const classObj = classDoc.toObject();
    classObj.subjectName = classDoc.subjectId?.name || null;
    classObj.gradeName = classDoc.gradeId?.name || null;
    classObj.currentStudents = updatedCount;

    return {
      class: classObj,
      member: {
        _id: member._id,
        classId: member.classId,
        studentProfileId: member.studentProfileId,
        fullName: student.fullName,
        joinedAt: member.joinedAt,
      },
    };
  }

  /**
   * API 13 - GET /students/me/classes
   * Get all classes a student belongs to, including schedules
   */
  async getMyStudentClasses(userId) {
    const student = await this.getStudentByUserId(userId);
    const memberships = await this.memberRepo.listByStudentProfileId(student._id);

    if (!memberships.length) return [];

    return Promise.all(
      memberships.map(async (m) => {
        const classDoc = m.classId;
        if (!classDoc) return null;

        const schedules = await this.scheduleRepo.listByClassId(classDoc._id);

        const classObj = classDoc.toObject ? classDoc.toObject() : { ...classDoc };
        classObj.subjectName = classDoc.subjectId?.name || null;
        classObj.gradeName = classDoc.gradeId?.name || null;
        classObj.currentStudents = await this.memberRepo.countByClassId(classDoc._id);
        classObj.members = [];

        classObj.schedules = schedules.map((s) => ({
          _id: s._id,
          classId: s.classId?._id || s.classId,
          className: s.classId?.name || classDoc.name,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          title: s.title,
          createdAt: s.createdAt,
        }));

        return classObj;
      })
    ).then((results) => results.filter(Boolean));
  }
}

module.exports = ClassService;
