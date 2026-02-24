/**
 * NotificationPanel Component
 * Dropdown panel showing notifications
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useAppDispatch, useAppSelector } from '../../../../app/hooks'
import {
  selectUnreadNotifications,
  selectReadNotifications,
} from '../../chatSelectors'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../chatThunks'
import { routes } from '../../../../config/routes'
import './NotificationPanel.css'

interface NotificationPanelProps {
  onClose: () => void
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const unreadNotifications = useAppSelector(selectUnreadNotifications)
  const readNotifications = useAppSelector(selectReadNotifications)
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
  
  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])
  
  const notifications = activeTab === 'unread' ? unreadNotifications : readNotifications
  
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }
  
  const handleNotificationClick = async (notificationId: string, relatedId: string) => {
    try {
      // Mark as read
      await dispatch(markNotificationAsRead(notificationId)).unwrap()
      
      // Navigate to chat with the conversation
      navigate(routes.chat, { state: { conversationId: relatedId } })
      
      // Close panel
      onClose()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
  
  return (
    <div className="notification-panel">
      {/* Header */}
      <div className="notification-header">
        <h3>Thông báo</h3>
        {unreadNotifications.length > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="notification-tabs">
        <button
          className={`notification-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Chưa đọc ({unreadNotifications.length})
        </button>
        <button
          className={`notification-tab ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          Đã đọc ({readNotifications.length})
        </button>
      </div>
      
      {/* Notification List */}
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>Không có thông báo</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: vi,
            })
            
            return (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification._id, notification.relatedId)}
              >
                <div className="notification-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="notification-content">
                  <p className="notification-text">{notification.content}</p>
                  <span className="notification-time">{timeAgo}</span>
                </div>
                {!notification.isRead && <div className="notification-dot" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
