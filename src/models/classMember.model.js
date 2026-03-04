const { Schema, model } = require('mongoose');

const classMemberSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID is required'],
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student profile ID is required'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

classMemberSchema.index({ classId: 1, studentProfileId: 1 }, { unique: true });
classMemberSchema.index({ classId: 1 });
classMemberSchema.index({ studentProfileId: 1 });

const ClassMemberModel = model('ClassMember', classMemberSchema);

module.exports = ClassMemberModel;
