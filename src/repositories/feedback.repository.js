const FeedbackModel = require('../models/feedback.model');

/**
 * Feedback Repository - Data Access Layer
 */
class FeedbackRepository {
  /**
   * Find feedback by ID
   */
  async findById(id) {
    return FeedbackModel.findById(id)
      .populate('tutorId', 'fullName averageRating')
      .populate('authorUserId', 'email');
  }

  /**
   * Find feedbacks by tutor ID with pagination
   * Always enforces pagination with max limit
   * Includes author fullName from Student/Parent models
   */
  async findByTutorId(tutorId, { page = 1, limit = 10, status = null } = {}) {
    const StudentModel = require('../models/student.model');
    const ParentModel = require('../models/parent.model');
    const { FeedbackAuthorRole } = require('../constants/enums');

    // Enforce pagination limits
    const MAX_LIMIT = 100;
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit)));
    const skip = (validPage - 1) * validLimit;

    const filter = { tutorId };

    if (status) {
      filter.status = status;
    }

    const [feedbacks, total] = await Promise.all([
      FeedbackModel.find(filter)
        .populate('authorUserId', 'email phone')
        .skip(skip)
        .limit(validLimit)
        .sort({ createdAt: -1 })
        .lean(),
      FeedbackModel.countDocuments(filter),
    ]);

    // Get fullName from Student or Parent based on authorRole
    const feedbacksWithFullName = await Promise.all(
      feedbacks.map(async (feedback) => {
        if (!feedback.authorUserId) return feedback;

        let authorProfile = null;

        if (feedback.authorRole === FeedbackAuthorRole.STUDENT) {
          authorProfile = await StudentModel.findOne({ userId: feedback.authorUserId._id })
            .select('fullName')
            .lean();
        } else if (feedback.authorRole === FeedbackAuthorRole.PARENT) {
          authorProfile = await ParentModel.findOne({ userId: feedback.authorUserId._id })
            .select('fullName')
            .lean();
        }

        // Merge fullName into authorUserId
        if (authorProfile && authorProfile.fullName) {
          feedback.authorUserId.fullName = authorProfile.fullName;
        }

        return feedback;
      })
    );

    return {
      feedbacks: feedbacksWithFullName,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit)
    };
  }

  /**
   * Find feedback by tutor and author
   */
  async findByTutorAndAuthor(tutorId, authorUserId) {
    return FeedbackModel.findOne({ tutorId, authorUserId })
      .populate('tutorId', 'fullName')
      .populate('authorUserId', 'email');
  }

  /**
   * Create new feedback
   */
  async create(feedbackData) {
    return FeedbackModel.create(feedbackData);
  }

  /**
   * Update feedback by ID
   */
  async updateById(id, updateData) {
    return FeedbackModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('tutorId', 'fullName')
      .populate('authorUserId', 'email');
  }

  /**
   * Delete feedback by ID
   */
  async deleteById(id) {
    return FeedbackModel.findByIdAndDelete(id);
  }

  /**
   * Calculate average rating for tutor
   */
  async calculateAverageRating(tutorId) {
    const result = await FeedbackModel.aggregate([
      { $match: { tutorId, status: 1 } }, // Only visible feedbacks
      {
        $group: {
          _id: '$tutorId',
          averageRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { averageRating: 0, totalFeedback: 0 };
    }

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
      totalFeedback: result[0].totalFeedback,
    };
  }

  /**
   * Find all feedbacks with pagination
   * Includes author fullName from Student/Parent models
   */
  async findAll({ page = 1, limit = 10, filter = {} } = {}) {
    const StudentModel = require('../models/student.model');
    const ParentModel = require('../models/parent.model');
    const { FeedbackAuthorRole } = require('../constants/enums');

    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      FeedbackModel.find(filter)
        .populate('tutorId', 'fullName')
        .populate('authorUserId', 'email phone')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      FeedbackModel.countDocuments(filter),
    ]);

    // Get fullName from Student or Parent based on authorRole
    const feedbacksWithFullName = await Promise.all(
      feedbacks.map(async (feedback) => {
        if (!feedback.authorUserId) return feedback;

        let authorProfile = null;

        if (feedback.authorRole === FeedbackAuthorRole.STUDENT) {
          authorProfile = await StudentModel.findOne({ userId: feedback.authorUserId._id })
            .select('fullName')
            .lean();
        } else if (feedback.authorRole === FeedbackAuthorRole.PARENT) {
          authorProfile = await ParentModel.findOne({ userId: feedback.authorUserId._id })
            .select('fullName')
            .lean();
        }

        // Merge fullName into authorUserId
        if (authorProfile && authorProfile.fullName) {
          feedback.authorUserId.fullName = authorProfile.fullName;
        }

        return feedback;
      })
    );

    return { feedbacks: feedbacksWithFullName, total };
  }

  /**
   * Check if user already gave feedback to tutor
   */
  async existsByTutorAndAuthor(tutorId, authorUserId) {
    const count = await FeedbackModel.countDocuments({ tutorId, authorUserId });
    return count > 0;
  }
}

module.exports = FeedbackRepository;
