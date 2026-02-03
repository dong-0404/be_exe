const { Schema, model } = require('mongoose');
const { EntityStatus } = require('../constants/enums');

const subjectSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Code cannot exceed 50 characters'],
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [255, 'Name cannot exceed 255 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      enum: Object.values(EntityStatus),
      default: EntityStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subjectSchema.index({ code: 1 }, { unique: true });
subjectSchema.index({ status: 1 });
subjectSchema.index({ name: 'text' }); // For text search

const SubjectModel = model('Subject', subjectSchema);

module.exports = SubjectModel;
