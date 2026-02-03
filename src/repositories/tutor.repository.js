const TutorModel = require('../models/tutor.model');

/**
 * Tutor Repository - Data Access Layer
 */
class TutorRepository {
  /**
   * Find tutor by ID
   */
  async findById(id) {
    return TutorModel.findById(id)
      .populate('userId', 'email status phone')
      .populate('subjects', 'code name')
      .populate('grades', 'code name orderNumber');
  }

  /**
   * Find tutor by ID with detailed info (for public view)
   * Only returns approved and completed profiles
   */
  async findByIdDetailed(id) {
    return TutorModel.findOne({
      _id: id,
      isProfileComplete: true,
      profileStatus: 3, // APPROVED
    })
      .populate('userId', 'email phone')
      .populate('subjects', 'code name')
      .populate('grades', 'code name orderNumber')
      .lean();
  }

  /**
   * Find tutor by user ID
   */
  async findByUserId(userId) {
    return TutorModel.findOne({ userId })
      .populate('userId', 'email status')
      .populate('subjects', 'code name')
      .populate('grades', 'code name orderNumber');
  }

  /**
   * Create new tutor
   */
  async create(tutorData) {
    return TutorModel.create(tutorData);
  }

  /**
   * Update tutor by ID
   */
  async updateById(id, updateData) {
    return TutorModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'email status')
      .populate('subjects', 'code name')
      .populate('grades', 'code name orderNumber');
  }

  /**
   * Delete tutor by ID
   */
  async deleteById(id) {
    return TutorModel.findByIdAndDelete(id);
  }

  /**
   * Find all tutors with pagination and filters
   * Always enforces pagination with max limit
   */
  async findAll({ page = 1, limit = 10, filter = {}, sort = { createdAt: -1 } } = {}) {
    // Enforce pagination limits
    const MAX_LIMIT = 100;
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit)));
    const skip = (validPage - 1) * validLimit;

    const [tutors, total] = await Promise.all([
      TutorModel.find(filter)
        .populate('userId', 'email status')
        .populate('subjects', 'code name')
        .populate('grades', 'code name orderNumber')
        .skip(skip)
        .limit(validLimit)
        .sort(sort),
      TutorModel.countDocuments(filter),
    ]);

    return {
      tutors,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit)
    };
  }

  /**
   * Search tutors by various criteria
   */
  async search({ subjectIds, gradeIds, minRating, maxHourlyRate, page = 1, limit = 10 }) {
    const filter = {};

    if (subjectIds && subjectIds.length > 0) {
      filter.subjects = { $in: subjectIds };
    }

    if (gradeIds && gradeIds.length > 0) {
      filter.grades = { $in: gradeIds };
    }

    if (minRating) {
      filter.averageRating = { $gte: minRating };
    }

    if (maxHourlyRate) {
      filter.hourlyRate = { $lte: maxHourlyRate };
    }

    return this.findAll({ page, limit, filter, sort: { averageRating: -1 } });
  }

  /**
   * Search and filter tutors with advanced criteria
   * Always enforces pagination with max limit
   */
  async searchTutors({
    name,
    subjects,
    grades,
    teachingArea,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = {}) {
    // Enforce pagination limits
    const MAX_LIMIT = 100;
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit)));
    const skip = (validPage - 1) * validLimit;

    // Build filter query
    const filter = {
      isProfileComplete: true,  // Only show completed profiles
      profileStatus: 3,  // APPROVED tutors only (3 = APPROVED)
    };

    // Filter by name (case-insensitive, partial match)
    if (name) {
      filter.fullName = { $regex: name, $options: 'i' };
    }

    // Filter by subjects (array contains any of the provided subject IDs)
    if (subjects && subjects.length > 0) {
      filter.subjects = { $in: subjects };
    }

    // Filter by grades (array contains any of the provided grade IDs)
    if (grades && grades.length > 0) {
      filter.grades = { $in: grades };
    }

    // Filter by teaching area (case-insensitive, partial match)
    if (teachingArea) {
      filter.teachingArea = { $regex: teachingArea, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [tutors, total] = await Promise.all([
      TutorModel.find(filter)
        .populate('subjects', 'code name')
        .populate('grades', 'code name orderNumber')
        .populate('userId', 'email phone')
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .lean(),
      TutorModel.countDocuments(filter)
    ]);

    return {
      tutors,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Get all approved tutors (for public listing)
   * Always enforces pagination with max limit
   */
  async findAllApproved({ page = 1, limit = 10 } = {}) {
    // Enforce pagination limits
    const MAX_LIMIT = 100;
    const validPage = Math.max(1, parseInt(page));
    const validLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit)));
    const skip = (validPage - 1) * validLimit;

    const [tutors, total] = await Promise.all([
      TutorModel.find({
        isProfileComplete: true,
        profileStatus: 3  // APPROVED
      })
        .populate('subjects', 'code name')
        .populate('grades', 'code name orderNumber')
        .populate('userId', 'email phone')
        .sort({ averageRating: -1, createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean(),
      TutorModel.countDocuments({
        isProfileComplete: true,
        profileStatus: 3
      })
    ]);

    return {
      tutors,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Update tutor rating after feedback
   */
  async updateRating(id, newAverageRating, newTotalFeedback) {
    return TutorModel.findByIdAndUpdate(
      id,
      {
        averageRating: newAverageRating,
        totalFeedback: newTotalFeedback,
      },
      { new: true }
    );
  }

  /**
   * Check if user already has tutor profile
   */
  async existsByUserId(userId) {
    const count = await TutorModel.countDocuments({ userId });
    return count > 0;
  }
}

module.exports = TutorRepository;
