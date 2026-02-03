const UserRepository = require('../repositories/user.repository');
const OtpService = require('./otp.service');
const EmailService = require('./email.service');
const { hashPassword } = require('../utils/hash');
const { UserStatus } = require('../constants/enums');

/**
 * User Service - Business Logic Layer
 * Handles all business logic for User operations
 */
class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.otpService = new OtpService();
    this.emailService = new EmailService();
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
}

module.exports = UserService;
