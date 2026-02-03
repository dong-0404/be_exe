const { Schema, model } = require('mongoose');
const { FeedbackAuthorRole, FeedbackStatus } = require('../constants/enums');

const feedbackSchema = new Schema(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },
    authorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: Number,
      enum: Object.values(FeedbackAuthorRole),
      required: [true, 'Author role is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      enum: Object.values(FeedbackStatus),
      default: FeedbackStatus.VISIBLE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
feedbackSchema.index({ tutorId: 1 });
feedbackSchema.index({ authorUserId: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ tutorId: 1, authorUserId: 1 }, { unique: true });

const FeedbackModel = model('Feedback', feedbackSchema);

module.exports = FeedbackModel;
