const NotificationModel = require('../models/notification.model');

/**
 * Notification Repository - Data Access Layer
 */
class NotificationRepository {
    /**
     * Find notifications by user with filters
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Notifications array and total count
     */
    async findByUser(userId, filters = {}) {
        const {
            type = null, // 'unread' or 'read' or null for all
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Build query
        const query = { userId };
        
        if (type === 'unread') {
            query.isRead = false;
        } else if (type === 'read') {
            query.isRead = true;
        }

        const [notifications, total] = await Promise.all([
            NotificationModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            NotificationModel.countDocuments(query),
        ]);

        return { notifications, total };
    }

    /**
     * Create new notification
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
    async create(notificationData) {
        return NotificationModel.create(notificationData);
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} Updated notification
     */
    async markAsRead(notificationId) {
        return NotificationModel.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result with count
     */
    async markAllAsRead(userId) {
        const result = await NotificationModel.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        return { count: result.modifiedCount };
    }

    /**
     * Find notification by ID
     * @param {string} id - Notification ID
     * @returns {Promise<Object>} Notification document
     */
    async findById(id) {
        return NotificationModel.findById(id);
    }
}

module.exports = NotificationRepository;
