const { Schema, model } = require('mongoose');
const { Gender, TutorProfileStatus } = require('../constants/enums');

const tutorSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [255, 'Full name cannot exceed 255 characters'],
        },
        avatarUrl: {
            type: String,
            trim: true,
        },
        gender: {
            type: Number,
            enum: Object.values(Gender),
            required: [true, 'Gender is required'],
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        placeOfBirth: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        teachingArea: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
        },
        hourlyRate: {
            type: Number,
            required: [true, 'Hourly rate is required'],
            min: [0, 'Hourly rate must be positive'],
        },
        profileStatus: {
            type: Number,
            enum: Object.values(TutorProfileStatus),
            default: TutorProfileStatus.DRAFT,
        },
        currentStep: {
            type: Number,
            default: 1,
            min: [1, 'Current step must be at least 1'],
            max: [4, 'Current step cannot exceed 4'],
        },
        completedSteps: [{
            type: Number,
            min: 1,
            max: 4,
        }],
        isProfileComplete: {
            type: Boolean,
            default: false,
        },
        identityNumber: {
            type: String,
            trim: true,
            sparse: true,
        },
        identityImages: [{
            type: String,
        }],
        availableDays: [{
            type: Number,
            min: 2,
            max: 8,
        }],
        availableTimeSlots: [{
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night'],
        }],
        averageRating: {
            type: Number,
            default: 0,
            min: [0, 'Rating cannot be negative'],
            max: [5, 'Rating cannot exceed 5'],
        },
        totalFeedback: {
            type: Number,
            default: 0,
            min: [0, 'Total feedback cannot be negative'],
        },
        subjects: [{
            type: Schema.Types.ObjectId,
            ref: 'Subject',
        }],
        grades: [{
            type: Schema.Types.ObjectId,
            ref: 'Grade',
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes
tutorSchema.index({ userId: 1 }, { unique: true });
tutorSchema.index({ profileStatus: 1 });
tutorSchema.index({ averageRating: -1 });
tutorSchema.index({ hourlyRate: 1 });

// Virtual for age
tutorSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

tutorSchema.set('toJSON', { virtuals: true });
tutorSchema.set('toObject', { virtuals: true });

const TutorModel = model('Tutor', tutorSchema);

module.exports = TutorModel;
