const { Schema, model } = require('mongoose');

const attachmentSchema = new Schema(
    {
        url: {
            type: String,
            required: [true, 'URL is required'],
            trim: true,
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
            min: [0, 'File size cannot be negative'],
        },
        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
            trim: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader ID is required'],
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Indexes
attachmentSchema.index({ uploadedBy: 1, createdAt: -1 }); // Find attachments by uploader

const AttachmentModel = model('Attachment', attachmentSchema);

module.exports = AttachmentModel;
