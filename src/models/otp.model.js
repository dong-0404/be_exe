const { Schema, model } = require('mongoose');

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: [true, 'OTP is required'],
        },
        type: {
            type: String,
            enum: ['REGISTRATION', 'FORGOT_PASSWORD'],
            required: [true, 'OTP type is required'],
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - tự động xóa khi hết hạn
        },
        verified: {
            type: Boolean,
            default: false,
        },
        attempts: {
            type: Number,
            default: 0,
            max: [5, 'Maximum verification attempts exceeded'],
        },
        // Registration data (temporary storage until verified)
        registrationData: {
            type: Object,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 });

const OtpModel = model('Otp', otpSchema);

module.exports = OtpModel;
