const { Schema, model } = require('mongoose');

const conversationSchema = new Schema(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Indexes for efficient queries
conversationSchema.index({ participants: 1, updatedAt: -1 }); // Find conversations by participant, sorted by updatedAt
conversationSchema.index({ updatedAt: -1 }); // Sort conversations by last activity

const ConversationModel = model('Conversation', conversationSchema);

module.exports = ConversationModel;
