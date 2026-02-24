const ChatService = require('../services/chat.service');
const { success, paginated } = require('../utils/response');

/**
 * Chat Controller - Handle conversation-related requests
 */
class ChatController {
    constructor() {
        this.chatService = new ChatService();
    }

    /**
     * Get all conversations for current user
     * GET /api/v1/chat/conversations
     * @query page - Page number (default: 1)
     * @query limit - Items per page (default: 20)
     */
    async getConversations(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
            } = req.query;

            const userId = req.user.id;

            // Validate and parse pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const options = {
                page: pageNum,
                limit: limitNum,
            };

            const { conversations, total } = await this.chatService.getConversations(
                userId,
                options
            );

            return paginated(res, {
                data: conversations,
                page: pageNum,
                limit: limitNum,
                total,
                message: 'Lấy danh sách cuộc trò chuyện thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get conversation by ID
     * GET /api/v1/chat/conversations/:id
     */
    async getConversationById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const conversation = await this.chatService.getConversationById(
                id,
                userId
            );

            return success(res, {
                data: conversation,
                message: 'Lấy thông tin cuộc trò chuyện thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new conversation
     * POST /api/v1/chat/conversations
     * @body participantIds - Array of participant IDs (required)
     */
    async createConversation(req, res, next) {
        try {
            const { participantIds } = req.body;
            const userId = req.user.id;

            const conversation = await this.chatService.createConversation(
                participantIds,
                userId
            );

            return success(res, {
                data: conversation,
                message: 'Tạo cuộc trò chuyện thành công',
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatController;
