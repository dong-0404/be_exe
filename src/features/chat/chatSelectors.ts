/**
 * Chat Redux Selectors
 */

import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { Conversation } from './types'

// Base selectors
export const selectChatState = (state: RootState) => state.chat

export const selectConversations = (state: RootState) => state.chat.conversations
export const selectCurrentConversationId = (state: RootState) => state.chat.currentConversationId
export const selectConversationsLoading = (state: RootState) => state.chat.conversationsLoading

export const selectMessages = (state: RootState) => state.chat.messages
export const selectMessagesLoading = (state: RootState) => state.chat.messagesLoading

export const selectNotifications = (state: RootState) => state.chat.notifications
export const selectUnreadNotificationCount = (state: RootState) => state.chat.unreadNotificationCount

export const selectSelectedTab = (state: RootState) => state.chat.selectedTab
export const selectSearchQuery = (state: RootState) => state.chat.searchQuery
export const selectTypingUsers = (state: RootState) => state.chat.typingUsers

export const selectWsConnected = (state: RootState) => state.chat.wsConnected
export const selectError = (state: RootState) => state.chat.error

// Memoized selectors

// Get current conversation
export const selectCurrentConversation = createSelector(
  [selectConversations, selectCurrentConversationId],
  (conversations, currentId) => {
    if (!currentId) return null
    return conversations.find(c => c._id === currentId) || null
  }
)

// Get messages for current conversation
export const selectCurrentMessages = createSelector(
  [selectMessages, selectCurrentConversationId],
  (messages, currentId) => {
    if (!currentId) return []
    return messages[currentId] || []
  }
)

// Get filtered conversations based on tab and search
export const selectFilteredConversations = createSelector(
  [selectConversations, selectSelectedTab, selectSearchQuery],
  (conversations, tab, searchQuery) => {
    let filtered = [...conversations]
    
    // Filter by tab
    if (tab === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0)
    } else if (tab === 'read') {
      filtered = filtered.filter(c => c.unreadCount === 0)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.participants.some(p => 
          (p.fullName?.toLowerCase().includes(query) || false) ||
          (p.email?.toLowerCase().includes(query) || false)
        )
      )
    }
    
    return filtered
  }
)

// Get total unread message count
export const selectTotalUnreadCount = createSelector(
  [selectConversations],
  (conversations) => {
    return conversations.reduce((total, c) => total + c.unreadCount, 0)
  }
)

// Get typing users for current conversation
export const selectCurrentTypingUsers = createSelector(
  [selectTypingUsers, selectCurrentConversationId, selectCurrentConversation],
  (typingUsers, currentId, currentConversation) => {
    if (!currentId || !currentConversation) return []
    
    const userIds = typingUsers[currentId] || []
    return currentConversation.participants.filter(p => userIds.includes(p._id))
  }
)

// Get unread notifications
export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    return notifications.filter(n => !n.isRead)
  }
)

// Get read notifications
export const selectReadNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    return notifications.filter(n => n.isRead)
  }
)

// Check if user is online (placeholder - would need real implementation)
export const selectIsUserOnline = (userId: string) => createSelector(
  [selectChatState],
  () => {
    // TODO: Implement online status tracking
    return false
  }
)
