const MessageRepository = require('../repositories/message.repository');
const ConversationRepository = require('../repositories/conversation.repository');
const NotificationRepository = require('../repositories/notification.repository');
const { MessageType, NotificationType } = require('../constants/enums');
const { formatMessages, formatMessage } = require('../utils/chatHelpers');

/**
 * Message Service - Business Logic Layer
 */
class MessageService {
    constructor(websocketService = null) {
        this.messageRepo = new MessageRepository();
        this.conversationRepo = new ConversationRepository();
        this.notificationRepo = new NotificationRepository();
        this.websocketService = websocketService;
    }

    /**
     * Get messages for a conversation with verification
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Messages with pagination data
     */
    async getMessages(conversationId, userId, options = {}) {
        // Verify user is participant
        const conversation = await this.conversationRepo.findById(conversationId);

        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền truy cập cuộc trò chuyện này');
            error.statusCode = 403;
            throw error;
        }

        // Get messages
        const { messages, total } = await this.messageRepo.findByConversation(
            conversationId,
            options
        );

        // Format messages with senderInfo and messageType as string
        const formattedMessages = await formatMessages(messages);

        return {
            messages: formattedMessages,
            total,
        };
    }

    /**
     * Send a new message
     * @param {Object} messageData - Message data
     * @param {string} userId - Sender ID
     * @returns {Promise<Object>} Created message
     */
    async sendMessage(messageData, userId) {
        const { conversationId, content, messageType, attachments } = messageData;

        // Validate: must have either content or attachments
        const hasContent = content && content.trim().length > 0;
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!hasContent && !hasAttachments) {
            const error = new Error('Tin nhắn phải có nội dung hoặc đính kèm file/ảnh');
            error.statusCode = 400;
            throw error;
        }

        // Verify user is participant
        const conversation = await this.conversationRepo.findById(conversationId);

        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này');
            error.statusCode = 403;
            throw error;
        }

        // Determine message type if not provided
        let finalMessageType = messageType;
        if (!finalMessageType) {
            if (hasAttachments) {
                // Default to IMAGE if has attachments, can be overridden
                finalMessageType = MessageType.IMAGE;
            } else {
                finalMessageType = MessageType.TEXT;
            }
        }

        // Create message
        const message = await this.messageRepo.create({
            conversationId,
            senderId: userId,
            content: hasContent ? content.trim() : '', // Allow empty content if has attachments
            messageType: finalMessageType,
            attachments: attachments || [],
        });

        // Update conversation last message
        await this.conversationRepo.updateLastMessage(conversationId, message._id);

        // Increment unread count for other participants
        const otherParticipants = conversation.participants.filter((p) => {
            const participantId = p._id ? p._id.toString() : p.toString();
            return participantId !== userId.toString();
        });

        for (const participant of otherParticipants) {
            const participantId = participant._id ? participant._id : participant;
            await this.conversationRepo.incrementUnread(
                conversationId,
                participantId
            );

            // Create notification for new message
            await this.notificationRepo.create({
                userId: participantId,
                type: NotificationType.NEW_MESSAGE,
                content: `Bạn có tin nhắn mới từ ${userId}`,
                relatedId: conversationId,
            });
        }

        // Format message for response
        const formattedMessage = await formatMessage(message);

        // Emit WebSocket event for new message
        if (this.websocketService) {
            await this.websocketService.emitNewMessage(
                conversationId,
                formattedMessage,
                userId
            );
        }

        return formattedMessage;
    }

    /**
     * Mark message as read
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated message
     */
    async markMessageAsRead(messageId, userId) {
        const message = await this.messageRepo.findById(messageId);

        if (!message) {
            const error = new Error('Tin nhắn không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Verify user is participant in conversation
        const conversation = await this.conversationRepo.findById(
            message.conversationId
        );

        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền truy cập tin nhắn này');
            error.statusCode = 403;
            throw error;
        }

        // Mark as read
        const updatedMessage = await this.messageRepo.markAsRead(messageId, userId);

        // Decrement unread count
        await this.conversationRepo.decrementUnread(
            message.conversationId,
            userId
        );

        // Create notification for message read (to sender)
        const senderId = message.senderId.toString();
        if (senderId !== userId.toString()) {
            await this.notificationRepo.create({
                userId: senderId,
                type: NotificationType.MESSAGE_READ,
                content: `Tin nhắn của bạn đã được đọc`,
                relatedId: messageId,
            });

            // Emit WebSocket event for message read
            if (this.websocketService) {
                await this.websocketService.emitMessageRead(
                    message.conversationId.toString(),
                    [messageId],
                    userId
                );
            }
        }

        // Format message for response
        const formattedMessage = await formatMessage(updatedMessage);

        return formattedMessage;
    }

    /**
     * Mark multiple messages as read
     * @param {Array<string>} messageIds - Array of message IDs
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async markMultipleMessagesAsRead(messageIds, userId) {
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            const error = new Error('Danh sách message IDs không được để trống');
            error.statusCode = 400;
            throw error;
        }

        // Get first message to verify conversation
        const firstMessage = await this.messageRepo.findById(messageIds[0]);
        if (!firstMessage) {
            const error = new Error('Tin nhắn không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const conversationId = firstMessage.conversationId;

        // Verify user is participant
        const conversation = await this.conversationRepo.findById(conversationId);
        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền truy cập tin nhắn này');
            error.statusCode = 403;
            throw error;
        }

        // Mark all messages as read
        const result = await this.messageRepo.markMultipleAsRead(messageIds, userId);

        // Decrement unread count (one time per conversation, not per message)
        // We'll reset unread count to 0 since user has read messages
        await this.conversationRepo.resetUnread(conversationId, userId);

        // Get unique sender IDs to notify
        const messages = await Promise.all(
            messageIds.map(id => this.messageRepo.findById(id))
        );
        const senderIds = new Set();
        messages.forEach(msg => {
            if (msg && msg.senderId.toString() !== userId.toString()) {
                senderIds.add(msg.senderId.toString());
            }
        });

        // Create notifications and emit WebSocket events
        for (const senderId of senderIds) {
            await this.notificationRepo.create({
                userId: senderId,
                type: NotificationType.MESSAGE_READ,
                content: `Tin nhắn của bạn đã được đọc`,
                relatedId: conversationId,
            });
        }

        // Emit WebSocket event
        if (this.websocketService) {
            await this.websocketService.emitMessageRead(
                conversationId.toString(),
                messageIds,
                userId
            );
        }

        return {
            updated: result.updated,
            messageIds,
        };
    }

    /**
     * Mark all messages in conversation as read
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async markAllMessagesAsRead(conversationId, userId) {
        // Verify user is participant
        const conversation = await this.conversationRepo.findById(conversationId);
        if (!conversation) {
            const error = new Error('Cuộc trò chuyện không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
        );

        if (!isParticipant) {
            const error = new Error('Bạn không có quyền truy cập cuộc trò chuyện này');
            error.statusCode = 403;
            throw error;
        }

        // Get all unread messages in conversation where user is not sender
        const MessageModel = require('../models/message.model');
        const unreadMessages = await MessageModel.find({
            conversationId,
            senderId: { $ne: userId },
            readBy: { $ne: userId },
        }).select('_id');

        if (unreadMessages.length === 0) {
            return {
                updated: 0,
                messageIds: [],
            };
        }

        const messageIds = unreadMessages.map(msg => msg._id.toString());

        // Mark all as read
        const result = await this.messageRepo.markMultipleAsRead(messageIds, userId);

        // Reset unread count
        await this.conversationRepo.resetUnread(conversationId, userId);

        // Get unique sender IDs to notify
        const messages = await Promise.all(
            messageIds.map(id => this.messageRepo.findById(id))
        );
        const senderIds = new Set();
        messages.forEach(msg => {
            if (msg && msg.senderId.toString() !== userId.toString()) {
                senderIds.add(msg.senderId.toString());
            }
        });

        // Create notifications
        for (const senderId of senderIds) {
            await this.notificationRepo.create({
                userId: senderId,
                type: NotificationType.MESSAGE_READ,
                content: `Tin nhắn của bạn đã được đọc`,
                relatedId: conversationId,
            });
        }

        // Emit WebSocket event
        if (this.websocketService) {
            await this.websocketService.emitMessageRead(
                conversationId.toString(),
                messageIds,
                userId
            );
        }

        return {
            updated: result.updated,
            messageIds,
        };
    }
}

module.exports = MessageService;
