const express = require('express');
const ChatController = require('../controllers/chat.controller');
const MessageController = require('../controllers/message.controller');
const ChatUploadController = require('../controllers/chatUpload.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody, validateQuery } = require('../middlewares/validation.middleware');
const { uploadSingle, uploadMultiple } = require('../middlewares/chatUpload.middleware');
const { MessageType } = require('../constants/enums');

const router = express.Router();
const chatController = new ChatController();
const chatUploadController = new ChatUploadController();

/**
 * Validation Schemas
 */

// Validation for creating a conversation
const createConversationSchema = {
    required: ['participantIds'],
    fields: {
        participantIds: {
            type: 'object', // Array
            custom: (value) => {
                if (!Array.isArray(value) || value.length === 0) {
                    return 'participantIds must be a non-empty array';
                }
                // Validate each ID is a string
                if (!value.every((id) => typeof id === 'string' && id.length > 0)) {
                    return 'All participant IDs must be valid strings';
                }
                return null;
            },
        },
    },
};

// Validation for sending a message
const sendMessageSchema = {
    required: ['conversationId'],
    fields: {
        conversationId: {
            type: 'string',
        },
        content: {
            type: 'string',
            maxLength: 5000,
            // Content is optional if attachments are provided
        },
        messageType: {
            type: 'number',
            enum: Object.values(MessageType),
        },
        attachments: {
            type: 'object', // Array, optional
            custom: (value, body) => {
                if (value !== undefined && value !== null && !Array.isArray(value)) {
                    return 'Attachments must be an array';
                }
                // Validate: must have either content or attachments
                const hasContent = body.content && body.content.trim().length > 0;
                const hasAttachments = Array.isArray(value) && value.length > 0;
                if (!hasContent && !hasAttachments) {
                    return 'Message must have either content or attachments';
                }
                return null;
            },
        },
        attachmentIds: {
            type: 'object', // Array, optional (alternative to attachments)
            custom: (value, body) => {
                if (value !== undefined && value !== null && !Array.isArray(value)) {
                    return 'attachmentIds must be an array';
                }
                // Validate: must have either content or attachments
                const hasContent = body.content && body.content.trim().length > 0;
                const hasAttachments = Array.isArray(body.attachments) && body.attachments.length > 0;
                const hasAttachmentIds = Array.isArray(value) && value.length > 0;
                if (!hasContent && !hasAttachments && !hasAttachmentIds) {
                    return 'Message must have either content or attachments';
                }
                return null;
            },
        },
    },
};

// Validation for query parameters (conversations)
const getConversationsQuerySchema = {
    fields: {
        page: {
            type: 'number',
            min: 1,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 100,
        },
    },
};

// Validation for query parameters (messages)
const getMessagesQuerySchema = {
    fields: {
        page: {
            type: 'number',
            min: 1,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 100,
        },
        before: {
            type: 'string',
        },
    },
};

// MessageController will be initialized with websocketService later
// For now, create without websocket service
let messageController = new MessageController();

/**
 * Set message controller with websocket service
 * This will be called from server.js after websocket is initialized
 */
function setMessageController(controller) {
    messageController = controller;
}

/**
 * CONVERSATION ROUTES
 * All routes require authentication
 */

/**
 * @route   GET /chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 * @query   page, limit
 */
router.get(
    '/conversations',
    authenticate,
    validateQuery(getConversationsQuerySchema),
    chatController.getConversations.bind(chatController)
);

/**
 * @route   GET /chat/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private
 */
router.get('/conversations/:id', authenticate, chatController.getConversationById.bind(chatController));

/**
 * @route   POST /chat/conversations
 * @desc    Create new conversation
 * @access  Private
 * @body    participantIds - Array of participant IDs
 */
router.post(
    '/conversations',
    authenticate,
    validateBody(createConversationSchema),
    chatController.createConversation.bind(chatController)
);

/**
 * MESSAGE ROUTES
 * All routes require authentication
 */

/**
 * @route   GET /chat/conversations/:conversationId/messages
 * @desc    Get messages for a conversation
 * @access  Private
 * @query   page, limit, before (messageId)
 */
router.get(
    '/conversations/:conversationId/messages',
    authenticate,
    validateQuery(getMessagesQuerySchema),
    (req, res, next) => messageController.getMessages(req, res, next)
);

/**
 * @route   POST /chat/messages
 * @desc    Send a new message
 * @access  Private
 * @body    conversationId, content, messageType (optional), attachments (optional)
 */
router.post(
    '/messages',
    authenticate,
    validateBody(sendMessageSchema),
    (req, res, next) => messageController.sendMessage(req, res, next)
);

/**
 * @route   PUT /chat/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put(
    '/messages/:messageId/read',
    authenticate,
    (req, res, next) => messageController.markMessageAsRead(req, res, next)
);

/**
 * @route   PUT /chat/messages/read-multiple
 * @desc    Mark multiple messages as read
 * @access  Private
 * @body    messageIds - Array of message IDs
 */
router.put(
    '/messages/read-multiple',
    authenticate,
    (req, res, next) => messageController.markMultipleMessagesAsRead(req, res, next)
);

/**
 * @route   PUT /chat/conversations/:conversationId/messages/read-all
 * @desc    Mark all messages in conversation as read
 * @access  Private
 */
router.put(
    '/conversations/:conversationId/messages/read-all',
    authenticate,
    (req, res, next) => messageController.markAllMessagesAsRead(req, res, next)
);

/**
 * FILE UPLOAD ROUTES
 * All routes require authentication
 */

/**
 * @route   POST /chat/messages/upload
 * @desc    Upload single file/image for chat
 * @access  Private
 * @body    file - File to upload
 */
router.post(
    '/messages/upload',
    authenticate,
    uploadSingle('file'),
    chatUploadController.uploadFile.bind(chatUploadController)
);

/**
 * @route   POST /chat/upload/multiple
 * @desc    Upload multiple files/images for chat
 * @access  Private
 * @body    files - Files to upload (max 5)
 */
router.post(
    '/upload/multiple',
    authenticate,
    uploadMultiple('files', 5),
    chatUploadController.uploadMultipleFiles.bind(chatUploadController)
);

module.exports = { router, setMessageController };
