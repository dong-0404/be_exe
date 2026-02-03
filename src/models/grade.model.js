const { Schema, model } = require('mongoose');
const { EntityStatus } = require('../constants/enums');

const gradeSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Grade code is required'],
      uppercase: true,
      trim: true,
      maxlength: [50, 'Code cannot exceed 50 characters'],
    },
    name: {
      type: String,
      required: [true, 'Grade name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    orderNumber: {
      type: Number,
      required: [true, 'Order number is required'],
      min: [1, 'Order number must be at least 1'],
      max: [12, 'Order number cannot exceed 12'],
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
gradeSchema.index({ code: 1 }, { unique: true });
gradeSchema.index({ orderNumber: 1 }, { unique: true });
gradeSchema.index({ status: 1 });

const GradeModel = model('Grade', gradeSchema);

module.exports = GradeModel;
