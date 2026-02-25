const UserService = require('../services/user.service');
const { MessageType, MessageTypeLabel } = require('../constants/enums');

const userService = new UserService();

/**
 * Enrich user object with fullName and avatarUrl
 * @param {Object} user - User object (can be ObjectId, populated, or plain object)
 * @returns {Promise<Object>} Enriched user object
 */
async function enrichUser(user) {
    if (!user) return null;

    // If user is just an ObjectId, we need to fetch it
    if (typeof user === 'string' || user.toString === user._id) {
        const UserRepository = require('../repositories/user.repository');
        const userRepo = new UserRepository();
        const fetchedUser = await userRepo.findById(user);
        if (!fetchedUser) return null;
        return await userService.enrichUserData(fetchedUser);
    }

    // If user is already an object, enrich it
    return await userService.enrichUserData(user);
}

/**
 * Enrich multiple users
 * @param {Array} users - Array of user objects
 * @returns {Promise<Array>} Array of enriched users
 */
async function enrichUsers(users) {
    if (!users || users.length === 0) return [];
    return await userService.enrichUsersData(users);
}

/**
 * Format message for response (convert messageType to string, add senderInfo)
 * @param {Object} message - Message object
 * @returns {Promise<Object>} Formatted message
 */
async function formatMessage(message) {
    if (!message) return null;

    const messageObj = message.toObject ? message.toObject() : message;

    // Enrich senderId to senderInfo
    const senderInfo = await enrichUser(messageObj.senderId || messageObj.sender);

    // Convert messageType from number to string
    const messageTypeNumber = messageObj.messageType;
    const messageTypeString = MessageTypeLabel[messageTypeNumber] 
        ? MessageTypeLabel[messageTypeNumber].toLowerCase() 
        : 'text';

    // Ensure senderInfo has fullName (fallback to email or default)
    const finalSenderInfo = senderInfo || {
        _id: messageObj.senderId?._id || messageObj.senderId,
        email: messageObj.senderId?.email || null,
        fullName: messageObj.senderId?.email || 'Người dùng',
        avatarUrl: null,
        role: messageObj.senderId?.role || null,
    };

    // Ensure fullName is never null/undefined
    if (!finalSenderInfo.fullName) {
        finalSenderInfo.fullName = finalSenderInfo.email || 'Người dùng';
    }

    return {
        ...messageObj,
        senderInfo: finalSenderInfo,
        messageType: messageTypeString,
        senderId: messageObj.senderId?._id || messageObj.senderId,
    };
}

/**
 * Format multiple messages
 * @param {Array} messages - Array of message objects
 * @returns {Promise<Array>} Array of formatted messages
 */
async function formatMessages(messages) {
    if (!messages || messages.length === 0) return [];
    return Promise.all(messages.map(msg => formatMessage(msg)));
}

/**
 * Format conversation for response (enrich participants, format lastMessage)
 * @param {Object} conversation - Conversation object
 * @returns {Promise<Object>} Formatted conversation
 */
async function formatConversation(conversation) {
    if (!conversation) return null;

    const convObj = conversation.toObject ? conversation.toObject() : conversation;

    // Enrich participants
    const enrichedParticipants = await enrichUsers(convObj.participants || []);

    // Format lastMessage if exists
    let formattedLastMessage = null;
    if (convObj.lastMessage) {
        if (typeof convObj.lastMessage === 'object' && convObj.lastMessage.content) {
            formattedLastMessage = await formatMessage(convObj.lastMessage);
        }
    }

    // Get unread count for current user (if userId provided)
    let unreadCount = 0;
    if (convObj.currentUserId) {
        if (convObj.unreadCount instanceof Map) {
            unreadCount = convObj.unreadCount.get(convObj.currentUserId.toString()) || 0;
        } else if (typeof convObj.unreadCount === 'object' && convObj.unreadCount !== null) {
            unreadCount = convObj.unreadCount[convObj.currentUserId.toString()] || 0;
        }
    }

    return {
        ...convObj,
        participants: enrichedParticipants.map(p => ({
            _id: p._id,
            email: p.email || null,
            fullName: p.fullName || p.email || 'Người dùng',
            avatarUrl: p.avatarUrl || null,
            role: p.role,
        })),
        lastMessage: formattedLastMessage,
        unreadCount: unreadCount,
    };
}

/**
 * Format multiple conversations
 * @param {Array} conversations - Array of conversation objects
 * @param {string} currentUserId - Current user ID for unreadCount
 * @returns {Promise<Array>} Array of formatted conversations
 */
async function formatConversations(conversations, currentUserId = null) {
    if (!conversations || conversations.length === 0) return [];
    
    return Promise.all(
        conversations.map(conv => {
            const convWithUserId = { ...conv, currentUserId };
            return formatConversation(convWithUserId);
        })
    );
}

module.exports = {
    enrichUser,
    enrichUsers,
    formatMessage,
    formatMessages,
    formatConversation,
    formatConversations,
};
