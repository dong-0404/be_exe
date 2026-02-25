const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const notificationController = new NotificationController();

/**
 * NOTIFICATION ROUTES
 * All routes require authentication
 */

/**
 * @route   GET /notifications
 * @desc    Get notifications for current user
 * @access  Private
 * @query   type (unread/read), page, limit
 */
router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));

/**
 * @route   PUT /notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));

/**
 * @route   PUT /notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead.bind(notificationController));

module.exports = router;
