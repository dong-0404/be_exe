/**
 * ChatPage
 * Main chat page container
 */

import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ChatSidebar } from '../../features/chat/components/ChatSidebar'
import { ChatWindow } from '../../features/chat/components/ChatWindow'
import { useChat } from '../../features/chat/hooks/useChat'
import { useWebSocket } from '../../features/chat/hooks/useWebSocket'
import './ChatPage.css'

export const ChatPage: React.FC = () => {
  const location = useLocation()
  const initialConversationId = location.state?.conversationId
  
  // Initialize chat and WebSocket
  useChat(initialConversationId)
  useWebSocket()
  
  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatSidebar />
        <ChatWindow />
      </div>
    </div>
  )
}
