/**
 * ChatSidebar Component
 * Displays conversation list with search and filters
 */

import React, { useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../../../app/hooks'
import {
  selectFilteredConversations,
  selectCurrentConversationId,
  selectSelectedTab,
  selectSearchQuery,
  selectConversationsLoading,
} from '../../chatSelectors'
import { setCurrentConversation, setSelectedTab, setSearchQuery } from '../../chatSlice'
import { ConversationItem } from '../ConversationItem'
import { getCurrentUser } from '../../../auth/utils/authHelpers'
import './ChatSidebar.css'

export const ChatSidebar: React.FC = () => {
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(selectFilteredConversations)
  const currentConversationId = useAppSelector(selectCurrentConversationId)
  const selectedTab = useAppSelector(selectSelectedTab)
  const searchQuery = useAppSelector(selectSearchQuery)
  const loading = useAppSelector(selectConversationsLoading)
  
  const currentUser = getCurrentUser()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  
  // Debounced search
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setLocalSearchQuery(value)
      
      // Debounce search query update
      const timeoutId = setTimeout(() => {
        dispatch(setSearchQuery(value))
      }, 300)
      
      return () => clearTimeout(timeoutId)
    },
    [dispatch]
  )
  
  const handleTabChange = (tab: 'all' | 'unread' | 'read') => {
    dispatch(setSelectedTab(tab))
  }
  
  const handleConversationClick = (conversationId: string) => {
    dispatch(setCurrentConversation(conversationId))
  }
  
  return (
    <div className="chat-sidebar">
      {/* Search Bar */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Tìm kiếm tên phụ huynh/học sinh"
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          Tất cả
        </button>
        <button
          className={`tab-button ${selectedTab === 'unread' ? 'active' : ''}`}
          onClick={() => handleTabChange('unread')}
        >
          Chưa đọc
        </button>
        <button
          className={`tab-button ${selectedTab === 'read' ? 'active' : ''}`}
          onClick={() => handleTabChange('read')}
        >
          Đã đọc
        </button>
      </div>
      
      {/* Conversation List */}
      <div className="conversation-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <svg
              width="64"
              height="64"
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
            <p>Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              currentUserId={currentUser?._id || ''}
              isActive={conversation._id === currentConversationId}
              onClick={() => handleConversationClick(conversation._id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
