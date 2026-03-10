const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { requireApprovedTutor } = require('../middlewares/tutorApproval.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
const { UserRole } = require('../constants/enums');
const ClassController = require('../controllers/class.controller');
const ScheduleController = require('../controllers/schedule.controller');
const AttendanceController = require('../controllers/attendance.controller');

const router = express.Router();
const classController = new ClassController();
const scheduleController = new ScheduleController();
const attendanceController = new AttendanceController();

// =====================
// Validation schemas
// =====================

const createClassSchema = {
  required: ['name', 'maxStudents'],
  fields: {
    name: {
      type: 'string',
      maxLength: 100,
    },
    maxStudents: {
      type: 'number',
      custom: (value) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 50) {
          return 'maxStudents phải là số nguyên từ 1 đến 50';
        }
        return null;
      },
    },
    subjectId: {
      type: 'string',
      pattern: /^[0-9a-fA-F]{24}$/,
      patternMessage: 'subjectId không hợp lệ',
    },
    gradeId: {
      type: 'string',
      pattern: /^[0-9a-fA-F]{24}$/,
      patternMessage: 'gradeId không hợp lệ',
    },
  },
};

const updateClassSchema = {
  fields: {
    name: {
      type: 'string',
      maxLength: 100,
    },
    maxStudents: {
      type: 'number',
      custom: (value) => {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 50) {
          return 'maxStudents phải là số nguyên từ 1 đến 50';
        }
        return null;
      },
    },
  },
};

const createScheduleSchema = {
  required: ['date', 'startTime', 'endTime'],
  fields: {
    date: {
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      patternMessage: 'date phải có định dạng YYYY-MM-DD',
    },
    startTime: {
      type: 'string',
      pattern: /^\d{2}:\d{2}$/,
      patternMessage: 'startTime phải có định dạng HH:mm',
    },
    endTime: {
      type: 'string',
      pattern: /^\d{2}:\d{2}$/,
      patternMessage: 'endTime phải có định dạng HH:mm',
    },
    title: {
      type: 'string',
      maxLength: 200,
    },
  },
};

const updateScheduleSchema = {
  fields: {
    date: {
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      patternMessage: 'date phải có định dạng YYYY-MM-DD',
    },
    startTime: {
      type: 'string',
      pattern: /^\d{2}:\d{2}$/,
      patternMessage: 'startTime phải có định dạng HH:mm',
    },
    endTime: {
      type: 'string',
      pattern: /^\d{2}:\d{2}$/,
      patternMessage: 'endTime phải có định dạng HH:mm',
    },
    title: {
      type: 'string',
      maxLength: 200,
    },
  },
};

// =====================
// Class Routes
// =====================

/**
 * @route  POST /classes/join
 * @desc   Student joins a class via invite code
 * @access Student
 * IMPORTANT: Must be defined before /:id routes to avoid match conflict
 */
router.post(
  '/join',
  authenticate,
  authorize(UserRole.STUDENT),
  classController.joinClass.bind(classController)
);

/**
 * @route  POST /classes
 * @desc   Create a new class
 * @access Tutor
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.TUTOR),
  requireApprovedTutor,
  validateBody(createClassSchema),
  classController.createClass.bind(classController)
);

/**
 * @route  GET /classes/:id
 * @desc   Get class detail (members + schedules)
 * @access Tutor (owner) or Student (member)
 */
router.get(
  '/:id',
  authenticate,
  classController.getClassDetail.bind(classController)
);

/**
 * @route  PATCH /classes/:id
 * @desc   Update class info
 * @access Tutor (owner)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.TUTOR),
  validateBody(updateClassSchema),
  classController.updateClass.bind(classController)
);

/**
 * @route  POST /classes/:id/regenerate-invite
 * @desc   Regenerate invite code
 * @access Tutor (owner)
 */
router.post(
  '/:id/regenerate-invite',
  authenticate,
  authorize(UserRole.TUTOR),
  classController.regenerateInvite.bind(classController)
);

// =====================
// Schedule Routes
// =====================

/**
 * @route  GET /classes/:classId/schedules
 * @desc   Get schedules for a class
 * @access Tutor (owner) or Student (member)
 */
router.get(
  '/:classId/schedules',
  authenticate,
  scheduleController.getClassSchedules.bind(scheduleController)
);

/**
 * @route  POST /classes/:classId/schedules
 * @desc   Create a schedule for a class
 * @access Tutor (owner)
 */
router.post(
  '/:classId/schedules',
  authenticate,
  authorize(UserRole.TUTOR),
  validateBody(createScheduleSchema),
  scheduleController.createSchedule.bind(scheduleController)
);

/**
 * @route  PATCH /classes/:classId/schedules/:scheduleId
 * @desc   Update a schedule
 * @access Tutor (owner)
 */
router.patch(
  '/:classId/schedules/:scheduleId',
  authenticate,
  authorize(UserRole.TUTOR),
  validateBody(updateScheduleSchema),
  scheduleController.updateSchedule.bind(scheduleController)
);

/**
 * @route  DELETE /classes/:classId/schedules/:scheduleId
 * @desc   Delete a schedule
 * @access Tutor (owner)
 */
router.delete(
  '/:classId/schedules/:scheduleId',
  authenticate,
  authorize(UserRole.TUTOR),
  scheduleController.deleteSchedule.bind(scheduleController)
);

// =====================
// Attendance Routes
// =====================

/**
 * @route  POST /classes/:classId/schedules/:scheduleId/attend
 * @desc   Student self-attendance
 * @access Student (member)
 */
router.post(
  '/:classId/schedules/:scheduleId/attend',
  authenticate,
  authorize(UserRole.STUDENT),
  attendanceController.attendSchedule.bind(attendanceController)
);

/**
 * @route  GET /classes/:classId/schedules/:scheduleId/attendance
 * @desc   Tutor views attendance for a schedule
 * @access Tutor (owner)
 */
router.get(
  '/:classId/schedules/:scheduleId/attendance',
  authenticate,
  authorize(UserRole.TUTOR),
  attendanceController.getScheduleAttendance.bind(attendanceController)
);

module.exports = router;
