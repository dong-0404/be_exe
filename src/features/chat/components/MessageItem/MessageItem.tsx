/**
 * MessageItem Component
 * Displays a single message in the chat window
 */

import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Message } from '../../types'
import './MessageItem.css'

interface MessageItemProps {
  message: Message
  isOwnMessage: boolean
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage }) => {
  const formattedTime = format(new Date(message.createdAt), 'HH:mm', { locale: vi })
  
  // Get display name with fallback
  const senderDisplayName = message.senderInfo.fullName || message.senderInfo.email || 'Người dùng'
  const senderInitial = senderDisplayName.charAt(0).toUpperCase()
  
  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      {!isOwnMessage && (
        <div className="message-avatar">
          {message.senderInfo.avatarUrl ? (
            <img src={message.senderInfo.avatarUrl} alt={senderDisplayName} />
          ) : (
            <div className="avatar-placeholder">
              {senderInitial}
            </div>
          )}
        </div>
      )}
      
      <div className="message-content-wrapper">
        {!isOwnMessage && (
          <div className="message-sender-name">{senderDisplayName}</div>
        )}
        
        <div className="message-bubble">
          {message.messageType === 'text' && (
            <p className="message-text">{message.content}</p>
          )}
          
          {message.messageType === 'image' && message.attachments && (
            <div className="message-images">
              {message.attachments.map((attachment) => (
                <img
                  key={attachment._id}
                  src={attachment.url}
                  alt={attachment.fileName}
                  className="message-image"
                />
              ))}
              {message.content && <p className="message-text">{message.content}</p>}
            </div>
          )}
          
          {message.messageType === 'file' && message.attachments && (
            <div className="message-files">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment._id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 2v7h7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{attachment.fileName}</span>
                </a>
              ))}
              {message.content && <p className="message-text">{message.content}</p>}
            </div>
          )}
        </div>
        
        <div className="message-footer">
          <span className="message-time">{formattedTime}</span>
          {isOwnMessage && message.isRead && (
            <svg
              className="message-read-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="#0066cc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 6L9 17"
                stroke="#0066cc"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(4, 0)"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
