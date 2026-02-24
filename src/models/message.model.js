const { Schema, model } = require('mongoose');
const { MessageType } = require('../constants/enums');

const messageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation ID is required'],
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender ID is required'],
            index: true,
        },
        content: {
            type: String,
            required: false, // Not required if attachments are provided
            trim: true,
            maxlength: [5000, 'Content cannot exceed 5000 characters'],
            default: '', // Default to empty string
        },
        messageType: {
            type: Number,
            enum: Object.values(MessageType),
            default: MessageType.TEXT,
            index: true,
        },
        attachments: [{
            type: Schema.Types.ObjectId,
            ref: 'Attachment',
        }],
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Compound indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: 1 }); // Get messages by conversation, sorted by date
messageSchema.index({ senderId: 1 }); // Find messages by sender

const MessageModel = model('Message', messageSchema);

module.exports = MessageModel;
