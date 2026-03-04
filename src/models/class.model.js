const { Schema, model } = require('mongoose');

const classSchema = new Schema(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: [true, 'Tutor ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [100, 'Class name cannot exceed 100 characters'],
    },
    maxStudents: {
      type: Number,
      required: [true, 'Max students is required'],
      min: [1, 'Max students must be at least 1'],
      max: [50, 'Max students cannot exceed 50'],
    },
    inviteCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    gradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Grade',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ tutorId: 1 });
classSchema.index({ inviteCode: 1 }, { unique: true });

const ClassModel = model('Class', classSchema);

module.exports = ClassModel;
