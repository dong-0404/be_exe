const ConversationRepository = require('../repositories/conversation.repository');
const UserRepository = require('../repositories/user.repository');
const { formatConversations, formatConversation } = require('../utils/chatHelpers');

/**
 * Chat Service - Business Logic Layer
 */
class ChatService {
    constructor() {
        this.conversationRepo = new ConversationRepository();
        this.userRepo = new UserRepository();
    }

    /**
     * Get conversations for a user with last message populated
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Conversations with pagination data
     */
    async getConversations(userId, options = {}) {
        const { conversations, total } = await this.conversationRepo.findByParticipant(
            userId,
            options
        );

        // Format conversations with enriched participants and lastMessage
        const formattedConversations = await formatConversations(conversations, userId);

        return {
            conversations: formattedConversations,
            total,
        };
    }

    /**
     * Get conversation by ID and verify user is participant
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Conversation
     */
    async getConversationById(conversationId, userId) {
        const conversation = await this.conversationRepo.findById(conversationId);

        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Verify user is participant
        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền truy cập cuộc trò chuyện này');
            error.statusCode = 403;
            throw error;
        }

        // Format conversation with enriched participants and lastMessage
        const formatted = await formatConversation({
            ...(conversation.toObject ? conversation.toObject() : conversation),
            currentUserId: userId,
        });

        return formatted;
    }

    /**
     * Create new conversation or return existing one
     * @param {Array<string>} participantIds - Array of participant IDs
     * @param {string} userId - Current user ID (creator)
     * @returns {Promise<Object>} Conversation
     */
    async createConversation(participantIds, userId) {
        // Validate participants
        if (!participantIds || participantIds.length === 0) {
            const error = new Error('Phải có ít nhất một người tham gia');
            error.statusCode = 400;
            throw error;
        }

        // Add current user to participants if not already included
        const allParticipants = [...new Set([userId, ...participantIds])];

        // Validate all participants exist
        const users = await Promise.all(
            allParticipants.map((id) => this.userRepo.findById(id))
        );

        const invalidUsers = users.filter((u) => !u);
        if (invalidUsers.length > 0) {
            const error = new Error('Một hoặc nhiều người dùng không tồn tại');
            error.statusCode = 400;
            throw error;
        }

        // Check if conversation already exists (for 2 participants)
        if (allParticipants.length === 2) {
            const existing = await this.conversationRepo.findByParticipants(
                allParticipants
            );
            if (existing) {
                return existing;
            }
        }

        // Create new conversation
        const conversation = await this.conversationRepo.create(allParticipants);

        // Format conversation with enriched participants
        const formatted = await formatConversation({
            ...(conversation.toObject ? conversation.toObject() : conversation),
            currentUserId: userId,
        });

        return formatted;
    }
}

module.exports = ChatService;
