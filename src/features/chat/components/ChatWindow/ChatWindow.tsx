/**
 * ChatWindow Component
 * Displays chat header, message list, and input
 */

import React, { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../../../app/hooks'
import {
  selectCurrentConversation,
  selectCurrentMessages,
  selectMessagesLoading,
  selectCurrentTypingUsers,
  selectWsConnected,
} from '../../chatSelectors'
import { markConversationMessagesAsRead } from '../../chatThunks'
import { MessageItem } from '../MessageItem'
import { MessageInput } from '../MessageInput'
import { getCurrentUser } from '../../../auth/utils/authHelpers'
import './ChatWindow.css'

export const ChatWindow: React.FC = () => {
  const dispatch = useAppDispatch()
  const currentConversation = useAppSelector(selectCurrentConversation)
  const messages = useAppSelector(selectCurrentMessages)
  const loading = useAppSelector(selectMessagesLoading)
  const typingUsers = useAppSelector(selectCurrentTypingUsers)
  const wsConnected = useAppSelector(selectWsConnected)
  
  const currentUser = getCurrentUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const hasMarkedAsReadRef = useRef<string | null>(null)
  
  // Auto mark messages as read when conversation is opened and messages are loaded
  useEffect(() => {
    if (currentConversation && !loading && messages.length > 0) {
      const conversationId = currentConversation._id
      
      // Only mark as read if we haven't already marked this conversation
      // and there are unread messages
      if (hasMarkedAsReadRef.current !== conversationId) {
        const hasUnreadMessages = messages.some(msg => !msg.isRead && msg.senderId !== currentUser?._id)
        
        if (hasUnreadMessages) {
          dispatch(markConversationMessagesAsRead(conversationId))
          hasMarkedAsReadRef.current = conversationId
        }
      }
    }
    
    // Reset when conversation changes
    if (currentConversation?._id !== hasMarkedAsReadRef.current) {
      hasMarkedAsReadRef.current = null
    }
  }, [currentConversation, messages, loading, dispatch, currentUser])
  
  // Auto scroll to bottom on new message (only scroll message container, not entire page)
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      // Scroll only the messages container, not the entire page
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])
  
  if (!currentConversation) {
    return (
      <div className="chat-window">
        <div className="chat-empty-state">
          <svg
            width="120"
            height="120"
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
          <h3>Chọn một cuộc trò chuyện</h3>
          <p>Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
        </div>
      </div>
    )
  }
  
  // Get other participant
  const otherParticipant = currentConversation.participants.find(
    (p) => p._id !== currentUser?._id
  )
  
  if (!otherParticipant) {
    return null
  }
  
  // Get display name with fallback
  const displayName = otherParticipant.fullName || otherParticipant.email || 'Người dùng'
  const avatarInitial = displayName.charAt(0).toUpperCase()
  
  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-avatar">
          {otherParticipant.avatarUrl ? (
            <img src={otherParticipant.avatarUrl} alt={displayName} />
          ) : (
            <div className="avatar-placeholder">
              {avatarInitial}
            </div>
          )}
        </div>
        <div className="chat-header-info">
          <h3 className="chat-header-name">{displayName}</h3>
          <div className="chat-header-status-wrapper">
            {typingUsers.length > 0 ? (
              <span className="chat-header-status typing">Đang nhập...</span>
            ) : (
              <span className="chat-header-status">Hoạt động</span>
            )}
            <span 
              className={`socket-status ${wsConnected ? 'connected' : 'disconnected'}`}
              title={wsConnected ? 'Socket.io đã kết nối' : 'Socket.io chưa kết nối'}
            >
              {wsConnected ? '🟢' : '🔴'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Message Area */}
      <div className="chat-messages" ref={messagesContainerRef}>
        {loading ? (
          <div className="messages-loading">
            <div className="spinner" />
            <p>Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                isOwnMessage={message.senderId === currentUser?._id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message Input */}
      <MessageInput conversationId={currentConversation._id} />
    </div>
  )
}
