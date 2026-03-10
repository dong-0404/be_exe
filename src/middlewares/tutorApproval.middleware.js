const UserModel = require('../models/user.model');
const TutorModel = require('../models/tutor.model');
const { UserRole, UserStatus, TutorProfileStatus } = require('../constants/enums');
const { error } = require('../utils/response');

/**
 * Chỉ cho phép gia sư đã được duyệt:
 * - User.status phải ACTIVE
 * - Tutor.profileStatus phải APPROVED
 */
async function requireApprovedTutor(req, res, next) {
  try {
    if (!req.user || req.user.role !== UserRole.TUTOR) {
      return error(res, { message: 'You do not have permission to access this resource', statusCode: 403 });
    }

    const user = await UserModel.findById(req.user.id).select('status role').lean();
    if (!user || user.role !== UserRole.TUTOR) {
      return error(res, { message: 'User not found', statusCode: 404 });
    }

    if (user.status !== UserStatus.ACTIVE) {
      return error(res, { message: 'Tài khoản gia sư đang chờ duyệt hoặc bị khóa', statusCode: 403 });
    }

    const tutor = await TutorModel.findOne({ userId: user._id }).select('profileStatus isProfileComplete').lean();
    if (!tutor) {
      return error(res, { message: 'Tutor profile not found', statusCode: 404 });
    }

    if (tutor.profileStatus !== TutorProfileStatus.APPROVED) {
      return error(res, { message: 'Hồ sơ gia sư chưa được duyệt', statusCode: 403 });
    }

    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = { requireApprovedTutor };

