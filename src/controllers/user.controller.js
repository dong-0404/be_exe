const UserService = require('../services/user.service');
const { success } = require('../utils/response');

const userService = new UserService();

/**
 * User Controller - HTTP Layer
 * Handles HTTP requests and responses for User operations
 */
class UserController {
    /**
     * Register new user with OTP
     * POST /users/register
     */
    async register(req, res, next) {
        try {
            const result = await userService.registerUser(req.body);
            return success(res, {
                data: result,
                message: result.message,
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify OTP
     * POST /users/verify-otp
     */
    async verifyOtp(req, res, next) {
        try {
            const { email, otp } = req.body;
            const result = await userService.verifyRegistrationOtp(email, otp);
            return success(res, {
                data: result,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resend OTP
     * POST /users/resend-otp
     */
    async resendOtp(req, res, next) {
        try {
            const { email } = req.body;
            const result = await userService.resendOtp(email);
            return success(res, {
                data: result,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new user (Admin only - no OTP)
     * POST /users
     */
    async create(req, res, next) {
        try {
            const user = await userService.createUser(req.body);
            return success(res, {
                data: user,
                message: 'User created successfully',
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user by ID
     * GET /users/:id
     */
    async getById(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            return success(res, {
                data: user,
                message: 'User retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user
     * PUT /users/:id
     */
    async update(req, res, next) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            return success(res, {
                data: user,
                message: 'User updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user
     * DELETE /users/:id
     */
    async delete(req, res, next) {
        try {
            await userService.deleteUser(req.params.id);
            return success(res, {
                message: 'User deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all users
     * GET /users
     */
    async getAll(req, res, next) {
        try {
            const { users, total } = await userService.getAllUsers(req.query);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            return res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     * GET /users/me
     */
    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.id);
            return success(res, {
                data: user,
                message: 'Profile retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update current user profile
     * PUT /users/me
     */
    async updateProfile(req, res, next) {
        try {
            const user = await userService.updateProfile(req.user.id, req.body);
            return success(res, {
                data: user,
                message: 'Profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UserController;
