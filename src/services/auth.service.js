const UserRepository = require('../repositories/user.repository');
const StudentRepository = require('../repositories/student.repository');
const TutorRepository = require('../repositories/tutor.repository');
const ParentRepository = require('../repositories/parent.repository');
const { comparePassword, hashPassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { UserRole, UserStatus } = require('../constants/enums');

/**
 * Auth Service - Business Logic Layer
 * Handles authentication business logic
 */
class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
    this.studentRepo = new StudentRepository();
    this.tutorRepo = new TutorRepository();
    this.parentRepo = new ParentRepository();
  }

  /**
   * Check if user has profile based on role
   */
  async checkProfileCompletion(userId, role) {
    let profile = null;
    let profileCompleted = false;
    let currentStep = null;
    let completedSteps = [];

    switch (role) {
      case UserRole.STUDENT:
        profile = await this.studentRepo.findByUserId(userId);
        profileCompleted = !!profile;
        break;

      case UserRole.TUTOR:
        profile = await this.tutorRepo.findByUserId(userId);
        if (profile) {
          profileCompleted = profile.isProfileComplete || false;
          currentStep = profile.currentStep;
          completedSteps = profile.completedSteps || [];
        } else {
          // No profile yet - need to start from step 1
          profileCompleted = false;
          currentStep = 1;
          completedSteps = [];
        }
        break;

      case UserRole.PARENT:
        profile = await this.parentRepo.findByUserId(userId);
        profileCompleted = !!profile;
        break;

      default:
        profileCompleted = true; // For other roles, no profile needed
        break;
    }

    return {
      profileCompleted,
      profile,
      currentStep,
      completedSteps,
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   * @throws {Error} If credentials are invalid
   */
  async login(email, password) {
    // Find user with password
    const user = await this.userRepo.findByEmail(email, true);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      const error = new Error('Account is deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await this.userRepo.updateLastLogin(user._id);

    // Check profile completion
    const { profileCompleted, profile, currentStep, completedSteps } = await this.checkProfileCompletion(
      user._id,
      user.role
    );

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Remove password from user object
    const userObject = user.toObject();
    delete userObject.password;

    // Build profile status object
    const profileStatus = {
      completed: profileCompleted,
      currentStep,
      completedSteps,
    };

    return {
      user: userObject,
      token,
      profileCompleted,
      profileStatus,
      profile: profile ? profile._id : null,
    };
  }

  /**
   * Verify token and get user
   * @param {string} userId - User ID from token
   * @returns {Promise<Object>} User data
   * @throws {Error} If user not found or inactive
   */
  async verifyUser(userId) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    return user;
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @throws {Error} If current password is invalid
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Get user with password
    const userWithPassword = await this.userRepo.findByEmail(user.email, true);

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, userWithPassword.password);

    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      const error = new Error('New password must be different from current password');
      error.statusCode = 400;
      throw error;
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepo.updateById(userId, { password: hashedPassword });
  }
}

module.exports = AuthService;
