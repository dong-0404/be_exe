/**
 * Chat Async Thunks
 */

import { createAsyncThunk } from '@reduxjs/toolkit'
import * as chatApi from './api/chatApi'
import type { SendMessageRequest, CreateConversationRequest, Message } from './types'
import type { RootState } from '../../app/store'
import { setCurrentConversation } from './chatSlice'
import { getCurrentUser } from '../auth/utils/authHelpers'

// Fetch conversations
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.getConversations()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conversations'
      return rejectWithValue(errorMessage)
    }
  }
)

// Fetch messages for a conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const messages = await chatApi.getMessages(conversationId)
      return { conversationId, messages }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages'
      return rejectWithValue(errorMessage)
    }
  }
)

// Create new conversation
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (data: CreateConversationRequest, { rejectWithValue }) => {
    try {
      return await chatApi.createConversation(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation'
      return rejectWithValue(errorMessage)
    }
  }
)

// Send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (data: SendMessageRequest, { rejectWithValue }) => {
    try {
      return await chatApi.sendMessage(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      return rejectWithValue(errorMessage)
    }
  }
)

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  'chat/markMessageAsRead',
  async ({ conversationId, messageId }: { conversationId: string, messageId: string }, { rejectWithValue }) => {
    try {
      await chatApi.markMessageAsRead(messageId)
      return { conversationId, messageId }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark message as read'
      return rejectWithValue(errorMessage)
    }
  }
)

// Mark all unread messages in a conversation as read
export const markConversationMessagesAsRead = createAsyncThunk(
  'chat/markConversationMessagesAsRead',
  async (conversationId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const messages: Message[] = state.chat.messages[conversationId] || []
      const currentUser = getCurrentUser()

      // Get all unread message IDs from other users (not from current user)
      const unreadMessageIds = messages
        .filter((msg: Message) => !msg.isRead && msg.senderId !== currentUser?._id)
        .map((msg: Message) => msg._id)

      // Mark each unread message as read (in parallel)
      if (unreadMessageIds.length > 0) {
        await Promise.all(
          unreadMessageIds.map((messageId: string) =>
            chatApi.markMessageAsRead(messageId).catch((err: unknown) => {
              // Log error but don't fail the whole operation
              const errorMessage = err instanceof Error ? err.message : 'Unknown error'
              console.warn(`Failed to mark message ${messageId} as read:`, errorMessage)
            })
          )
        )
      }

      return { conversationId, messageIds: unreadMessageIds }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark conversation messages as read'
      return rejectWithValue(errorMessage)
    }
  }
)

// Upload file
export const uploadFile = createAsyncThunk(
  'chat/uploadFile',
  async (file: File, { rejectWithValue }) => {
    try {
      return await chatApi.uploadFile(file)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      return rejectWithValue(errorMessage)
    }
  }
)

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'chat/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.getNotifications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications'
      return rejectWithValue(errorMessage)
    }
  }
)

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'chat/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await chatApi.markNotificationAsRead(notificationId)
      return notificationId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read'
      return rejectWithValue(errorMessage)
    }
  }
)

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'chat/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await chatApi.markAllNotificationsAsRead()
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      return rejectWithValue(errorMessage)
    }
  }
)

// Find or create conversation with specific user
export const findOrCreateConversation = createAsyncThunk(
  'chat/findOrCreateConversation',
  async (targetUserId: string, { rejectWithValue, dispatch }) => {
    try {
      // First, try to find existing conversation
      const conversations = await chatApi.getConversations()
      const existingConversation = conversations.find(conv =>
        conv.participants.some(p => p._id === targetUserId) &&
        conv.participants.length === 2
      )

      if (existingConversation) {
        // Conversation exists, return it
        dispatch(setCurrentConversation(existingConversation._id))
        return existingConversation
      }

      // No existing conversation, create new one
      const newConversation = await chatApi.createConversation({
        participantIds: [targetUserId]
      })

      dispatch(setCurrentConversation(newConversation._id))
      return newConversation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find or create conversation'
      return rejectWithValue(errorMessage)
    }
  }
)
