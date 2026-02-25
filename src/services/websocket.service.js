/**
 * WebSocket Service - Handle Socket.io events and broadcasting
 */
class WebSocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // Map userId -> Set of socketIds
        this.socketUsers = new Map(); // Map socketId -> userId
    }

    /**
     * Initialize WebSocket service with Socket.io instance
     * @param {Object} io - Socket.io server instance
     */
    initialize(io) {
        this.io = io;

        console.log('🚀 WebSocket service initialized');

        // Handle connection
        io.on('connection', (socket) => {
            console.log('🔌 New socket connection attempt:', socket.id);
            this.handleConnection(socket);
        });

        // Handle connection errors
        io.on('connection_error', (error) => {
            console.error('❌ Socket.io connection error:', error);
        });
    }

    /**
     * Handle new socket connection
     * @param {Object} socket - Socket instance
     */
    handleConnection(socket) {
        const userId = socket.data.userId;

        if (!userId) {
            console.warn('Socket connection rejected: userId not found in socket.data');
            socket.disconnect();
            return;
        }

        // Convert userId to string for consistency
        const userIdStr = userId.toString();

        console.log(`✅ Socket connected: userId=${userIdStr}, socketId=${socket.id}`);

        // Track user socket
        if (!this.userSockets.has(userIdStr)) {
            this.userSockets.set(userIdStr, new Set());
        }
        this.userSockets.get(userIdStr).add(socket.id);
        this.socketUsers.set(socket.id, userIdStr);

        // Join user's personal room
        socket.join(`user:${userIdStr}`);
        console.log(`📦 Socket joined room: user:${userIdStr}`);

        // Emit connection success to client
        socket.emit('connected', {
            message: 'Connected to chat server',
            userId: userIdStr,
        });

        // Emit user online event to all conversation participants
        this.emitUserOnline(userIdStr);

        // Handle typing events from client
        socket.on('typing:start', (data) => {
            console.log(`⌨️  Received typing:start from userId=${userIdStr}`, data);
            this.handleTypingStart(socket, data);
        });

        socket.on('typing:stop', (data) => {
            console.log(`⌨️  Received typing:stop from userId=${userIdStr}`, data);
            this.handleTypingStop(socket, data);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ Socket disconnected: userId=${userIdStr}, reason=${reason}`);
            this.handleDisconnection(socket, userIdStr);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`❌ Socket error for userId=${userIdStr}:`, error);
        });
    }

    /**
     * Handle socket disconnection
     * @param {Object} socket - Socket instance
     * @param {string} userId - User ID
     */
    handleDisconnection(socket, userId) {
        // Remove socket tracking
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socket.id);
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.socketUsers.delete(socket.id);

        // Emit user offline event
        this.emitUserOffline(userId);
    }

    /**
     * Handle typing start event
     * @param {Object} socket - Socket instance
     * @param {Object} data - Event data { conversationId }
     */
    async handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.data.userId;

        // Validate data
        if (!conversationId) {
            console.warn('⚠️  typing:start event missing conversationId');
            socket.emit('error', { message: 'conversationId is required' });
            return;
        }

        if (!userId) {
            console.warn('⚠️  typing:start event: userId not found in socket.data');
            return;
        }

        const userIdStr = userId.toString();
        console.log(`📤 Broadcasting typing:start to conversation ${conversationId} (excluding userId=${userIdStr})`);

        // Broadcast to other participants in conversation (exclude sender)
        await this.emitToConversation(
            conversationId,
            'typing:start',
            {
                conversationId,
                userId: userIdStr,
            },
            userIdStr
        );
    }

    /**
     * Handle typing stop event
     * @param {Object} socket - Socket instance
     * @param {Object} data - Event data { conversationId }
     */
    async handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.data.userId;

        // Validate data
        if (!conversationId) {
            console.warn('⚠️  typing:stop event missing conversationId');
            socket.emit('error', { message: 'conversationId is required' });
            return;
        }

        if (!userId) {
            console.warn('⚠️  typing:stop event: userId not found in socket.data');
            return;
        }

        const userIdStr = userId.toString();
        console.log(`📤 Broadcasting typing:stop to conversation ${conversationId} (excluding userId=${userIdStr})`);

        // Broadcast to other participants in conversation (exclude sender)
        await this.emitToConversation(
            conversationId,
            'typing:stop',
            {
                conversationId,
                userId: userIdStr,
            },
            userIdStr
        );
    }

    /**
     * Emit event to all participants in a conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @param {string} excludeUserId - User ID to exclude from broadcast
     */
    async emitToConversation(conversationId, event, data, excludeUserId = null) {
        if (!this.io) {
            console.warn('⚠️  Cannot emit: io instance not initialized');
            return;
        }

        try {
            // Get conversation participants
            const ConversationRepository = require('../repositories/conversation.repository');
            const conversationRepo = new ConversationRepository();
            const conversation = await conversationRepo.findById(conversationId);

            if (!conversation) {
                console.warn(`⚠️  Conversation not found: ${conversationId}`);
                return;
            }

            const excludeUserIdStr = excludeUserId ? excludeUserId.toString() : null;
            let broadcastCount = 0;

            // Emit to each participant's room
            conversation.participants.forEach((participant) => {
                // Handle both populated and non-populated participants
                const participantId = participant._id
                    ? participant._id.toString()
                    : participant.toString();

                // Skip excluded user
                if (excludeUserIdStr && participantId === excludeUserIdStr) {
                    return;
                }

                // Emit to participant's room
                this.io.to(`user:${participantId}`).emit(event, data);
                broadcastCount++;
                console.log(`  📨 Emitted ${event} to user:${participantId}`);
            });

            console.log(`✅ Broadcasted ${event} to ${broadcastCount} participant(s) in conversation ${conversationId}`);
        } catch (error) {
            console.error(`❌ Error emitting ${event} to conversation ${conversationId}:`, error);
        }
    }

    /**
     * Emit event to a specific user
     * @param {string} userId - User ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emitToUser(userId, event, data) {
        if (!this.io) {
            return;
        }
        this.io.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Emit new message event
     * @param {string} conversationId - Conversation ID
     * @param {Object} message - Message object (already formatted with senderInfo)
     * @param {string} senderId - Sender ID (to exclude from broadcast)
     */
    async emitNewMessage(conversationId, message, senderId) {
        // Message should already be formatted by MessageService
        // Just emit it as is
        await this.emitToConversation(
            conversationId,
            'message:new',
            message,
            senderId
        );
    }

    /**
     * Emit message read event
     * @param {string} conversationId - Conversation ID
     * @param {Array<string>} messageIds - Array of message IDs
     * @param {string} readerId - User ID who read the messages
     */
    async emitMessageRead(conversationId, messageIds, readerId) {
        await this.emitToConversation(
            conversationId,
            'message:read',
            {
                conversationId,
                messageIds,
                readerId,
            },
            readerId
        );
    }

    /**
     * Emit user online event
     * @param {string} userId - User ID
     */
    async emitUserOnline(userId) {
        // Get all conversations for this user
        const ConversationRepository = require('../repositories/conversation.repository');
        const conversationRepo = new ConversationRepository();
        const { conversations } = await conversationRepo.findByParticipant(userId, {
            limit: 1000, // Get all conversations
        });

        // Emit to all participants
        conversations.forEach((conv) => {
            conv.participants.forEach((participant) => {
                // Handle both populated and non-populated participants
                const participantId = participant._id
                    ? participant._id.toString()
                    : participant.toString();
                if (participantId !== userId.toString()) {
                    this.emitToUser(participantId, 'user:online', { userId });
                }
            });
        });
    }

    /**
     * Emit user offline event
     * @param {string} userId - User ID
     */
    async emitUserOffline(userId) {
        // Get all conversations for this user
        const ConversationRepository = require('../repositories/conversation.repository');
        const conversationRepo = new ConversationRepository();
        const { conversations } = await conversationRepo.findByParticipant(userId, {
            limit: 1000, // Get all conversations
        });

        // Emit to all participants
        conversations.forEach((conv) => {
            conv.participants.forEach((participant) => {
                // Handle both populated and non-populated participants
                const participantId = participant._id
                    ? participant._id.toString()
                    : participant.toString();
                if (participantId !== userId.toString()) {
                    this.emitToUser(participantId, 'user:offline', { userId });
                }
            });
        });
    }
}

module.exports = WebSocketService;
