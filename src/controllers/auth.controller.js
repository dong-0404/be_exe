const AuthService = require('../services/auth.service');
const { success } = require('../utils/response');

const authService = new AuthService();

/**
 * Auth Controller - HTTP Layer
 * Handles HTTP requests and responses for authentication operations
 */
class AuthController {
    /**
     * Login
     * POST /auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            return success(res, {
                data: result,
                message: 'Login successful',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current authenticated user
     * GET /auth/me
     */
    async getCurrentUser(req, res, next) {
        try {
            const user = await authService.verifyUser(req.user.id);

            return success(res, {
                data: user,
                message: 'User retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     * POST /auth/change-password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            await authService.changePassword(req.user.id, currentPassword, newPassword);

            return success(res, {
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout (client-side token removal)
     * POST /auth/logout
     */
    async logout(req, res, next) {
        try {
            // In JWT-based auth, logout is typically handled on client side
            // by removing the token. This endpoint can be used for logging
            // or token blacklisting if needed in the future.

            return success(res, {
                message: 'Logout successful',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
