const NotificationRepository = require('../repositories/notification.repository');

/**
 * Notification Service - Business Logic Layer
 */
class NotificationService {
    constructor() {
        this.notificationRepo = new NotificationRepository();
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Notifications with pagination data
     */
    async getNotifications(userId, filters = {}) {
        const { notifications, total } = await this.notificationRepo.findByUser(
            userId,
            filters
        );

        return {
            notifications,
            total,
        };
    }

    /**
     * Create a new notification
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(notificationData) {
        return this.notificationRepo.create(notificationData);
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID (verify ownership)
     * @returns {Promise<Object>} Updated notification
     */
    async markAsRead(notificationId, userId) {
        const notification = await this.notificationRepo.findById(notificationId);

        if (!notification) {
            const error = new Error('Thông báo không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (notification.userId.toString() !== userId.toString()) {
            const error = new Error('Bạn không có quyền truy cập thông báo này');
            error.statusCode = 403;
            throw error;
        }

        return this.notificationRepo.markAsRead(notificationId);
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Update result with count
     */
    async markAllAsRead(userId) {
        return this.notificationRepo.markAllAsRead(userId);
    }
}

module.exports = NotificationService;
