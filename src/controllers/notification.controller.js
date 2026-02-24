const NotificationService = require('../services/notification.service');
const { success, paginated } = require('../utils/response');

/**
 * Notification Controller - Handle notification-related requests
 */
class NotificationController {
    constructor() {
        this.notificationService = new NotificationService();
    }

    /**
     * Get notifications for current user
     * GET /api/v1/notifications
     * @query type - Filter type: 'unread', 'read', or null for all (optional)
     * @query page - Page number (default: 1)
     * @query limit - Items per page (default: 50)
     */
    async getNotifications(req, res, next) {
        try {
            const {
                type = null,
                page = 1,
                limit = 50,
            } = req.query;
            const userId = req.user.id;

            // Validate and parse pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const filters = {
                type,
                page: pageNum,
                limit: limitNum,
            };

            const { notifications, total } = await this.notificationService.getNotifications(
                userId,
                filters
            );

            return paginated(res, {
                data: notifications,
                page: pageNum,
                limit: limitNum,
                total,
                message: 'Lấy danh sách thông báo thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     * PUT /api/v1/notifications/:id/read
     */
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const notification = await this.notificationService.markAsRead(
                id,
                userId
            );

            return success(res, {
                data: notification,
                message: 'Đã đánh dấu thông báo là đã đọc',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     * PUT /api/v1/notifications/read-all
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;

            const result = await this.notificationService.markAllAsRead(userId);

            return success(res, {
                data: { count: result.count },
                message: `Đã đánh dấu ${result.count} thông báo là đã đọc`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = NotificationController;
