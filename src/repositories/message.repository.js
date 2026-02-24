const MessageModel = require('../models/message.model');

/**
 * Message Repository - Data Access Layer
 */
class MessageRepository {
    /**
     * Find messages by conversation with pagination
     * @param {string} conversationId - Conversation ID
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>} Messages array and total count
     */
    async findByConversation(conversationId, options = {}) {
        const {
            page = 1,
            limit = 50,
            before = null, // Message ID to get messages before this
            sortBy = 'createdAt',
            sortOrder = 'asc', // Oldest first for chat
        } = options;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Build query
        const query = { conversationId };
        
        // If before is specified, get messages created before that message
        if (before) {
            const beforeMessage = await MessageModel.findById(before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        const [messages, total] = await Promise.all([
            MessageModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('senderId', 'email phone role')
                .populate('attachments')
                .lean(),
            MessageModel.countDocuments(query),
        ]);

        return { messages, total };
    }

    /**
     * Create new message
     * @param {Object} messageData - Message data
     * @returns {Promise<Object>} Created message
     */
    async create(messageData) {
        const message = await MessageModel.create(messageData);
        // Populate multiple paths at once
        await message.populate([
            { path: 'senderId', select: 'email phone role' },
            { path: 'attachments' }
        ]);
        return message;
    }

    /**
     * Mark message as read by user
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated message
     */
    async markAsRead(messageId, userId) {
        const message = await MessageModel.findById(messageId);
        
        if (!message) {
            return null;
        }

        const userIdStr = userId.toString();
        const senderIdStr = message.senderId.toString();

        // Don't mark as read if user is the sender
        if (userIdStr === senderIdStr) {
            return message;
        }

        // Add user to readBy if not already there
        const alreadyRead = message.readBy.some(
            (id) => id.toString() === userIdStr
        );

        if (!alreadyRead) {
            message.readBy.push(userId);
            message.isRead = message.readBy.length > 0;
            await message.save();
        }

        // Populate multiple paths at once
        await message.populate([
            { path: 'senderId', select: 'email phone role' },
            { path: 'attachments' }
        ]);
        return message;
    }

    /**
     * Mark multiple messages as read by user
     * @param {Array<string>} messageIds - Array of message IDs
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result with count
     */
    async markMultipleAsRead(messageIds, userId) {
        const messages = await MessageModel.find({
            _id: { $in: messageIds },
        });

        const userIdStr = userId.toString();
        let updatedCount = 0;

        const updatePromises = messages.map(async (message) => {
            const senderIdStr = message.senderId.toString();

            // Don't mark as read if user is the sender
            if (userIdStr === senderIdStr) {
                return null;
            }

            const alreadyRead = message.readBy.some(
                (id) => id.toString() === userIdStr
            );

            if (!alreadyRead) {
                message.readBy.push(userId);
                message.isRead = message.readBy.length > 0;
                await message.save();
                updatedCount++;
                return message;
            }

            return null;
        });

        await Promise.all(updatePromises);
        return { updated: updatedCount };
    }

    /**
     * Find message by ID
     * @param {string} id - Message ID
     * @returns {Promise<Object>} Message document
     */
    async findById(id) {
        return MessageModel.findById(id)
            .populate('senderId', 'email phone role')
            .populate('attachments');
    }
}

module.exports = MessageRepository;
