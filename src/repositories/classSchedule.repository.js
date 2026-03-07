const ClassScheduleModel = require('../models/classSchedule.model');
const AttendanceModel = require('../models/attendance.model');

/**
 * ClassSchedule Repository - Data Access Layer
 */
class ClassScheduleRepository {
  /**
   * Create new schedule
   */
  async create(scheduleData) {
    return ClassScheduleModel.create(scheduleData);
  }

  /**
   * Find schedule by ID
   */
  async findById(id) {
    return ClassScheduleModel.findById(id).populate('classId', 'name');
  }

  /**
   * List schedules by classId with optional date range filter
   */
  async listByClassId(classId, { from, to } = {}) {
    const filter = { classId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    return ClassScheduleModel.find(filter)
      .populate('classId', 'name')
      .sort({ date: 1, startTime: 1 });
  }

  /**
   * List schedules for multiple class IDs with optional date range filter
   */
  async listByClassIds(classIds, { from, to } = {}) {
    const filter = { classId: { $in: classIds } };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    return ClassScheduleModel.find(filter)
      .populate('classId', 'name')
      .sort({ date: 1, startTime: 1 });
  }

  /**
   * Update schedule by ID
   */
  async updateById(id, updateData) {
    return ClassScheduleModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('classId', 'name');
  }

  /**
   * Delete schedule by ID and cascade delete related attendances
   */
  async deleteById(id) {
    await AttendanceModel.deleteMany({ scheduleId: id });
    return ClassScheduleModel.findByIdAndDelete(id);
  }

  /**
   * Find schedule by ID and classId (ownership check)
   */
  async findByIdAndClassId(id, classId) {
    return ClassScheduleModel.findOne({ _id: id, classId }).populate('classId', 'name');
  }
}

module.exports = ClassScheduleRepository;
