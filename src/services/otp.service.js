const OtpModel = require('../models/otp.model');
const EmailService = require('./email.service');

/**
 * OTP Service - Handles OTP generation and verification
 */
class OtpService {
    constructor() {
        this.emailService = new EmailService();
    }

    /**
     * Generate random 4-digit OTP
     */
    generateOtp() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Create and send OTP for registration
     * Store registration data temporarily
     */
    async sendRegistrationOtp(email, registrationData = null) {
        try {
            // Delete existing OTPs for this email and type
            await OtpModel.deleteMany({
                email,
                type: 'REGISTRATION',
            });

            // Generate new OTP
            const otpCode = this.generateOtp();

            // Save OTP to database (expires in 10 minutes)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await OtpModel.create({
                email,
                otp: otpCode,
                type: 'REGISTRATION',
                expiresAt,
                registrationData, // Store registration data temporarily
            });

            // Send OTP email
            await this.emailService.sendOtpEmail(email, otpCode, email);

            return {
                success: true,
                message: 'OTP sent successfully',
                expiresAt,
            };
        } catch (error) {
            console.error('Error sending registration OTP:', error);
            throw new Error('Failed to send OTP');
        }
    }

    /**
     * Verify OTP and return registration data if exists
     */
    async verifyOtp(email, otpCode, type = 'REGISTRATION') {
        try {
            // Find OTP
            const otpRecord = await OtpModel.findOne({
                email,
                type,
                verified: false,
            }).sort({ createdAt: -1 }); // Get latest

            if (!otpRecord) {
                const error = new Error('OTP not found or already verified');
                error.statusCode = 400;
                throw error;
            }

            // Check if expired
            if (new Date() > otpRecord.expiresAt) {
                const error = new Error('OTP has expired');
                error.statusCode = 400;
                throw error;
            }

            // Check attempts
            if (otpRecord.attempts >= 5) {
                const error = new Error('Maximum verification attempts exceeded');
                error.statusCode = 429;
                throw error;
            }

            // Verify OTP
            if (otpRecord.otp !== otpCode) {
                // Increment attempts
                otpRecord.attempts += 1;
                await otpRecord.save();

                const error = new Error(
                    `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`
                );
                error.statusCode = 400;
                throw error;
            }

            // Mark as verified
            otpRecord.verified = true;
            await otpRecord.save();

            return {
                success: true,
                message: 'OTP verified successfully',
                registrationData: otpRecord.registrationData, // Return stored registration data
            };
        } catch (error) {
            if (error.statusCode) {
                throw error;
            }
            console.error('Error verifying OTP:', error);
            throw new Error('Failed to verify OTP');
        }
    }

    /**
     * Resend OTP (keep old registration data if exists)
     */
    async resendOtp(email, type = 'REGISTRATION', userName = 'User') {
        try {
            // Check if user has recent OTP (rate limiting)
            const recentOtp = await OtpModel.findOne({
                email,
                type,
                createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // Within 1 minute
            });

            if (recentOtp) {
                const error = new Error('Please wait 1 minute before requesting new OTP');
                error.statusCode = 429;
                throw error;
            }

            // Get old registration data before deleting
            const oldOtp = await OtpModel.findOne({ email, type }).sort({ createdAt: -1 });
            const registrationData = oldOtp?.registrationData || null;

            // Delete old OTPs
            await OtpModel.deleteMany({ email, type });

            // Generate and send new OTP
            const otpCode = this.generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await OtpModel.create({
                email,
                otp: otpCode,
                type,
                expiresAt,
                registrationData, // Keep old registration data
            });

            await this.emailService.sendOtpEmail(email, otpCode, userName);

            return {
                success: true,
                message: 'OTP resent successfully',
                expiresAt,
            };
        } catch (error) {
            if (error.statusCode) {
                throw error;
            }
            console.error('Error resending OTP:', error);
            throw new Error('Failed to resend OTP');
        }
    }

    /**
     * Send password reset OTP
     */
    async sendPasswordResetOtp(email, userName = 'User') {
        try {
            // Delete existing OTPs
            await OtpModel.deleteMany({
                email,
                type: 'FORGOT_PASSWORD',
            });

            // Generate OTP
            const otpCode = this.generateOtp();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await OtpModel.create({
                email,
                otp: otpCode,
                type: 'FORGOT_PASSWORD',
                expiresAt,
            });

            // Send password reset email
            await this.emailService.sendPasswordResetEmail(email, otpCode, userName);

            return {
                success: true,
                message: 'Password reset OTP sent successfully',
                expiresAt,
            };
        } catch (error) {
            console.error('Error sending password reset OTP:', error);
            throw new Error('Failed to send password reset OTP');
        }
    }

    /**
     * Clean up expired OTPs (can be run as cron job)
     */
    async cleanupExpiredOtps() {
        try {
            const result = await OtpModel.deleteMany({
                expiresAt: { $lt: new Date() },
            });

            console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up OTPs:', error);
            return 0;
        }
    }
}

module.exports = OtpService;
