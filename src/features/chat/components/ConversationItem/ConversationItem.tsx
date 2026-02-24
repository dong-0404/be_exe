/**
 * ConversationItem Component
 * Displays a single conversation in the sidebar
 */

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Conversation, User } from '../../types'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: Conversation
  currentUserId: string
  isActive: boolean
  onClick: () => void
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  isActive,
  onClick,
}) => {
  // Get the other participant (not current user)
  const otherParticipant = conversation.participants.find(
    (p: User) => p._id !== currentUserId
  )
  
  if (!otherParticipant) {
    return null
  }
  
  // Get display name with fallback
  const displayName = otherParticipant.fullName || otherParticipant.email || 'Người dùng'
  const avatarInitial = displayName.charAt(0).toUpperCase()
  
  // Format timestamp
  const timeAgo = conversation.lastMessage
    ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
        addSuffix: true,
        locale: vi,
      })
    : ''
  
  // Truncate last message
  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.content.length > 50
      ? conversation.lastMessage.content.substring(0, 50) + '...'
      : conversation.lastMessage.content
    : 'Chưa có tin nhắn'
  
  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        {otherParticipant.avatarUrl ? (
          <img src={otherParticipant.avatarUrl} alt={displayName} />
        ) : (
          <div className="avatar-placeholder">
            {avatarInitial}
          </div>
        )}
      </div>
      
      <div className="conversation-content">
        <div className="conversation-header">
          <h4 className="conversation-name">{displayName}</h4>
          {conversation.lastMessage && (
            <span className="conversation-time">{timeAgo}</span>
          )}
        </div>
        
        <div className="conversation-footer">
          <p className="conversation-preview">{lastMessagePreview}</p>
          {conversation.unreadCount > 0 && (
            <span className="unread-badge">{conversation.unreadCount}</span>
          )}
        </div>
      </div>
      
      {conversation.unreadCount > 0 && <div className="unread-dot" />}
    </div>
  )
}
