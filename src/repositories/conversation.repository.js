const ConversationModel = require('../models/conversation.model');

/**
 * Conversation Repository - Data Access Layer
 */
class ConversationRepository {
    /**
     * Find conversations by participant
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Conversations array and total count
     */
    async findByParticipant(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const query = { participants: userId };

        const [conversations, total] = await Promise.all([
            ConversationModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('participants', 'email phone role')
                .populate({
                    path: 'lastMessage',
                    populate: {
                        path: 'senderId',
                        select: 'email phone role'
                    }
                })
                .lean(),
            ConversationModel.countDocuments(query),
        ]);

        return { conversations, total };
    }

    /**
     * Find conversation by ID
     * @param {string} id - Conversation ID
     * @returns {Promise<Object>} Conversation document
     */
    async findById(id) {
        return ConversationModel.findById(id)
            .populate('participants', 'email phone role')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'senderId',
                    select: 'email phone role'
                }
            });
    }

    /**
     * Find conversation by participants (check duplicate)
     * @param {Array<string>} participantIds - Array of participant IDs
     * @returns {Promise<Object|null>} Conversation if exists, null otherwise
     */
    async findByParticipants(participantIds) {
        // Sort participant IDs to ensure consistent comparison
        const sortedIds = participantIds.map(id => id.toString()).sort();
        
        // Find conversations where all participants match
        const conversations = await ConversationModel.find({
            participants: { $all: participantIds, $size: participantIds.length }
        })
        .populate('participants', 'email phone role')
        .lean();

        // Filter to exact match (same participants, same count)
        const exactMatch = conversations.find(conv => {
            const convIds = conv.participants.map(p => p._id.toString()).sort();
            return JSON.stringify(convIds) === JSON.stringify(sortedIds);
        });

        return exactMatch || null;
    }

    /**
     * Create new conversation
     * @param {Array<string>} participantIds - Array of participant IDs
     * @returns {Promise<Object>} Created conversation
     */
    async create(participantIds) {
        const conversation = await ConversationModel.create({
            participants: participantIds,
            unreadCount: new Map(),
        });

        return conversation.populate('participants', 'email phone role');
    }

    /**
     * Update last message of conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} messageId - Message ID
     * @returns {Promise<Object>} Updated conversation
     */
    async updateLastMessage(conversationId, messageId) {
        return ConversationModel.findByIdAndUpdate(
            conversationId,
            { 
                lastMessage: messageId,
                updatedAt: new Date(),
            },
            { new: true }
        );
    }

    /**
     * Increment unread count for a user in conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated conversation
     */
    async incrementUnread(conversationId, userId) {
        const conversation = await ConversationModel.findById(conversationId);
        
        if (!conversation) {
            return null;
        }

        const currentCount = conversation.unreadCount.get(userId.toString()) || 0;
        conversation.unreadCount.set(userId.toString(), currentCount + 1);
        
        await conversation.save();
        return conversation;
    }

    /**
     * Decrement unread count for a user in conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated conversation
     */
    async decrementUnread(conversationId, userId) {
        const conversation = await ConversationModel.findById(conversationId);
        
        if (!conversation) {
            return null;
        }

        const currentCount = conversation.unreadCount.get(userId.toString()) || 0;
        const newCount = Math.max(0, currentCount - 1);
        
        if (newCount === 0) {
            conversation.unreadCount.delete(userId.toString());
        } else {
            conversation.unreadCount.set(userId.toString(), newCount);
        }
        
        await conversation.save();
        return conversation;
    }

    /**
     * Reset unread count for a user in conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated conversation
     */
    async resetUnread(conversationId, userId) {
        const conversation = await ConversationModel.findById(conversationId);
        
        if (!conversation) {
            return null;
        }

        conversation.unreadCount.delete(userId.toString());
        await conversation.save();
        return conversation;
    }
}

module.exports = ConversationRepository;
