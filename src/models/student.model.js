const { Schema, model } = require('mongoose');
const { Gender } = require('../constants/enums');

const studentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      default: null,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [255, 'Full name cannot exceed 255 characters'],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: Number,
      enum: Object.values(Gender),
      default: null,
    },
    grade: {
      type: String,
      default: null,
    },
    school: {
      type: String,
      trim: true,
      maxlength: [255, 'School name cannot exceed 255 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
studentSchema.index({ userId: 1 }, { unique: true });
studentSchema.index({ parentId: 1 });
studentSchema.index({ grade: 1 });

// Virtual for age
studentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

const StudentModel = model('Student', studentSchema);

module.exports = StudentModel;
