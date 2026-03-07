const ScheduleService = require('../services/schedule.service');
const { success } = require('../utils/response');

const scheduleService = new ScheduleService();

/**
 * ScheduleController - HTTP Layer for ClassSchedule management
 */
class ScheduleController {
  /**
   * API 6 - GET /tutors/me/schedules
   * Get all schedules across all tutor's classes
   */
  async getMySchedules(req, res, next) {
    try {
      const { from, to } = req.query;
      const schedules = await scheduleService.getMySchedules(req.user.id, { from, to });
      return success(res, { data: schedules });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 7 - GET /classes/:classId/schedules
   * Get schedules for a specific class
   */
  async getClassSchedules(req, res, next) {
    try {
      const { classId } = req.params;
      const { from, to } = req.query;
      const schedules = await scheduleService.getClassSchedules(classId, { from, to });
      return success(res, { data: schedules });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 8 - POST /classes/:classId/schedules
   * Create a new schedule
   */
  async createSchedule(req, res, next) {
    try {
      const { classId } = req.params;
      const { date, startTime, endTime, title } = req.body;

      const schedule = await scheduleService.createSchedule(classId, req.user.id, {
        date,
        startTime,
        endTime,
        title,
      });

      return success(res, { data: schedule, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 9 - PATCH /classes/:classId/schedules/:scheduleId
   * Update a schedule
   */
  async updateSchedule(req, res, next) {
    try {
      const { classId, scheduleId } = req.params;
      const { date, startTime, endTime, title } = req.body;

      const updateData = {};
      if (date !== undefined) updateData.date = date;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (title !== undefined) updateData.title = title;

      const updated = await scheduleService.updateSchedule(classId, scheduleId, req.user.id, updateData);
      return success(res, { data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * API 10 - DELETE /classes/:classId/schedules/:scheduleId
   * Delete a schedule
   */
  async deleteSchedule(req, res, next) {
    try {
      const { classId, scheduleId } = req.params;
      await scheduleService.deleteSchedule(classId, scheduleId, req.user.id);
      return success(res, { data: null });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ScheduleController;
