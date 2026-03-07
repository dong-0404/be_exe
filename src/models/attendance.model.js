const { Schema, model } = require('mongoose');

const attendanceSchema = new Schema(
  {
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      required: [true, 'Schedule ID is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: [true, 'Attendance status is required'],
      default: 'present',
    },
    checkedAt: {
      type: Date,
      required: [true, 'Checked at time is required'],
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

attendanceSchema.index({ scheduleId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ scheduleId: 1 });

const AttendanceModel = model('Attendance', attendanceSchema);

module.exports = AttendanceModel;
