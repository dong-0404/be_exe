const { Schema, model } = require('mongoose');
const { NotificationType } = require('../constants/enums');

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        type: {
            type: Number,
            enum: Object.values(NotificationType),
            required: [true, 'Notification type is required'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
        },
        relatedId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // Get unread notifications by user
notificationSchema.index({ userId: 1, createdAt: -1 }); // Get all notifications by user, sorted by date

const NotificationModel = model('Notification', notificationSchema);

module.exports = NotificationModel;
