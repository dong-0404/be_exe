const { Schema, model } = require('mongoose');
const { EducationStatus } = require('../constants/enums');

const certificateSchema = new Schema(
    {
        tutorId: {
            type: Schema.Types.ObjectId,
            ref: 'Tutor',
            required: true,
        },
        schoolName: {
            type: String,
            required: [true, 'School name is required'],
            trim: true,
            maxlength: [255, 'School name cannot exceed 255 characters'],
        },
        major: {
            type: String,
            required: [true, 'Major is required'],
            trim: true,
            maxlength: [255, 'Major cannot exceed 255 characters'],
        },
        educationStatus: {
            type: Number,
            enum: Object.values(EducationStatus),
            required: [true, 'Education status is required'],
        },
        images: [{
            type: String,
            trim: true,
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes
certificateSchema.index({ tutorId: 1 });

const CertificateModel = model('Certificate', certificateSchema);

module.exports = CertificateModel;
