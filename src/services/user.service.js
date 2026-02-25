const UserRepository = require('../repositories/user.repository');
const StudentRepository = require('../repositories/student.repository');
const TutorRepository = require('../repositories/tutor.repository');
const ParentRepository = require('../repositories/parent.repository');
const OtpService = require('./otp.service');
const getEmailService = require('./email.service');
const { hashPassword } = require('../utils/hash');
const { UserStatus, UserRole } = require('../constants/enums');

/**
 * User Service - Business Logic Layer
 * Handles all business logic for User operations
 */
class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.studentRepo = new StudentRepository();
    this.tutorRepo = new TutorRepository();
    this.parentRepo = new ParentRepository();
    this.otpService = new OtpService();
    this.emailService = getEmailService(); // Get singleton instance
  }

  /**
   * Register new user - Send OTP (don't create user yet)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Registration info
   * @throws {Error} If email already exists
   */
  async registerUser(userData) {
    const { email, password } = userData;

    // Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password);

    // Store registration data temporarily and send OTP
    await this.otpService.sendRegistrationOtp(email, {
      ...userData,
      password: hashedPassword, // Store hashed password
    });

    return {
      email: email,
      message: 'OTP sent to your email. Please verify to complete registration.',
    };
  }

  /**
   * Verify OTP and CREATE user account
   * @param {string} email - User email
   * @param {string} otpCode - OTP code
   * @returns {Promise<Object>} Created user
   * @throws {Error} If OTP is invalid
   */
  async verifyRegistrationOtp(email, otpCode) {
    // Verify OTP and get registration data
    const verifyResult = await this.otpService.verifyOtp(email, otpCode, 'REGISTRATION');

    if (!verifyResult.registrationData) {
      const error = new Error('Registration data not found');
      error.statusCode = 400;
      throw error;
    }

    // Check again if email exists (in case user was created between register and verify)
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Create user with ACTIVE status
    const user = await this.userRepo.create({
      ...verifyResult.registrationData,
      status: UserStatus.ACTIVE, // User is active immediately after OTP verify
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, email);

    return {
      userId: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      message: 'Registration completed successfully. Please login to continue.',
    };
  }

  /**
   * Resend OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} Success message
   */
  async resendOtp(email) {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already registered. Please login.');
      error.statusCode = 400;
      throw error;
    }

    // Resend OTP (keep the old registration data)
    await this.otpService.resendOtp(email, 'REGISTRATION', email);

    return {
      message: 'OTP resent successfully',
    };
  }

  /**
   * Create new user (without OTP - for admin or direct creation)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   * @throws {Error} If email already exists
   */
  async createUser(userData) {
    const { email, password } = userData;

    // Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.userRepo.create({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User document
   * @throws {Error} If user not found
   */
  async getUserById(id) {
    const user = await this.userRepo.findById(id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   * @throws {Error} If user not found or email already exists
   */
  async updateUser(id, updateData) {
    // Check if user exists
    const user = await this.userRepo.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await this.userRepo.emailExists(updateData.email, id);
      if (emailExists) {
        const error = new Error('Email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Update user
    const updatedUser = await this.userRepo.updateById(id, updateData);

    return updatedUser;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<Object>} Deleted user
   * @throws {Error} If user not found
   */
  async deleteUser(id) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await this.userRepo.deleteById(id);

    return user;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  async getAllUsers(options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;

    // Build filter
    const filter = {};
    if (options.role) {
      filter.role = options.role;
    }
    if (options.isActive !== undefined) {
      filter.isActive = options.isActive === 'true';
    }
    if (options.search) {
      filter.$or = [
        { email: { $regex: options.search, $options: 'i' } },
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const result = await this.userRepo.findAll({ page, limit, filter });

    return result;
  }

  /**
   * Get user profile (authenticated user's own data)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    return this.getUserById(userId);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updateData) {
    // Remove sensitive fields that shouldn't be updated via profile
    delete updateData.role;
    delete updateData.isActive;

    return this.updateUser(userId, updateData);
  }

  /**
   * Enrich user data with fullName and avatarUrl from profile
   * @param {Object} user - User object with _id, email, phone, role
   * @returns {Promise<Object>} Enriched user data
   */
  async enrichUserData(user) {
    if (!user) return null;

    // Base user data
    const enrichedUser = {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      fullName: null,
      avatarUrl: null,
    };

    try {
      let profile = null;

      // Get profile based on role
      switch (user.role) {
        case UserRole.STUDENT:
          profile = await this.studentRepo.findByUserId(user._id);
          break;
        case UserRole.TUTOR:
          profile = await this.tutorRepo.findByUserId(user._id);
          break;
        case UserRole.PARENT:
          profile = await this.parentRepo.findByUserId(user._id);
          break;
        default:
          break;
      }

      // Add fullName and avatarUrl if profile exists
      if (profile) {
        enrichedUser.fullName = profile.fullName || null;
        enrichedUser.avatarUrl = profile.avatarUrl || null;
      }
    } catch (error) {
      // If error fetching profile, just return base user data
      console.error('Error enriching user data:', error);
    }

    return enrichedUser;
  }

  /**
   * Enrich multiple users data
   * @param {Array} users - Array of user objects
   * @returns {Promise<Array>} Array of enriched user data
   */
  async enrichUsersData(users) {
    if (!users || users.length === 0) return [];

    return Promise.all(users.map((user) => this.enrichUserData(user)));
  }
}

module.exports = UserService;
