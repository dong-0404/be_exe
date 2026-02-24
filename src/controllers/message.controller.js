const MessageService = require('../services/message.service');
const { success, paginated } = require('../utils/response');

/**
 * Message Controller - Handle message-related requests
 */
class MessageController {
    constructor(websocketService = null) {
        this.messageService = new MessageService(websocketService);
    }

    /**
     * Get messages for a conversation
     * GET /api/v1/chat/conversations/:conversationId/messages
     * @query page - Page number (default: 1)
     * @query limit - Items per page (default: 50)
     * @query before - Message ID to get messages before this (optional)
     */
    async getMessages(req, res, next) {
        try {
            const { conversationId } = req.params;
            const {
                page = 1,
                limit = 50,
                before = null,
            } = req.query;
            const userId = req.user.id;

            // Validate and parse pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const options = {
                page: pageNum,
                limit: limitNum,
                before,
            };

            const { messages, total } = await this.messageService.getMessages(
                conversationId,
                userId,
                options
            );

            return paginated(res, {
                data: messages,
                page: pageNum,
                limit: limitNum,
                total,
                message: 'Lấy danh sách tin nhắn thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send a new message
     * POST /api/v1/chat/messages
     * @body conversationId - Conversation ID (required)
     * @body content - Message content (required)
     * @body messageType - Message type (optional, default: TEXT)
     * @body attachments - Array of attachment IDs (optional)
     */
    async sendMessage(req, res, next) {
        try {
            const { conversationId, content, messageType, attachments, attachmentIds } = req.body;
            const userId = req.user.id;

            // Support both attachments and attachmentIds
            const finalAttachments = attachments || attachmentIds || [];

            const message = await this.messageService.sendMessage(
                {
                    conversationId,
                    content,
                    messageType,
                    attachments: finalAttachments,
                },
                userId
            );

            return success(res, {
                data: message,
                message: 'Gửi tin nhắn thành công',
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark message as read
     * PUT /api/v1/chat/messages/:messageId/read
     */
    async markMessageAsRead(req, res, next) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const message = await this.messageService.markMessageAsRead(
                messageId,
                userId
            );

            return success(res, {
                data: message,
                message: 'Đã đánh dấu tin nhắn là đã đọc',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark multiple messages as read
     * PUT /api/v1/chat/messages/read-multiple
     * @body messageIds - Array of message IDs
     */
    async markMultipleMessagesAsRead(req, res, next) {
        try {
            const { messageIds } = req.body;
            const userId = req.user.id;

            const result = await this.messageService.markMultipleMessagesAsRead(
                messageIds,
                userId
            );

            return success(res, {
                data: result,
                message: `Đã đánh dấu ${result.updated} tin nhắn là đã đọc`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all messages in conversation as read
     * PUT /api/v1/chat/conversations/:conversationId/messages/read-all
     */
    async markAllMessagesAsRead(req, res, next) {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            const result = await this.messageService.markAllMessagesAsRead(
                conversationId,
                userId
            );

            return success(res, {
                data: result,
                message: `Đã đánh dấu ${result.updated} tin nhắn là đã đọc`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MessageController;
