/**
 * Chat REST API
 */

import { apiClient } from '../../../api/client'
import type {
  Conversation,
  Message,
  ChatNotification,
  SendMessageRequest,
  SendMessageApiRequest,
  CreateConversationRequest,
  UploadFileResponse,
} from '../types'
import { getMessageTypeNumber } from '../types'

// API endpoints
const ENDPOINTS = {
  CONVERSATIONS: '/chat/conversations',
  CONVERSATION: (id: string) => `/chat/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  SEND_MESSAGE: '/chat/messages',
  MESSAGE_READ: (id: string) => `/chat/messages/${id}/read`,
  UPLOAD: '/chat/messages/upload',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
} as const

// Chat API
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<{ data: Conversation[] }>(ENDPOINTS.CONVERSATIONS)
  return response.data
}

export const getConversationById = async (id: string): Promise<Conversation> => {
  const response = await apiClient.get<{ data: Conversation }>(ENDPOINTS.CONVERSATION(id))
  return response.data
}

export const createConversation = async (data: CreateConversationRequest): Promise<Conversation> => {
  const response = await apiClient.post<{ data: Conversation }>(ENDPOINTS.CONVERSATIONS, data)
  return response.data
}

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await apiClient.get<{ data: Message[] }>(ENDPOINTS.MESSAGES(conversationId))
  return response.data
}

export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  // Convert messageType from string to number for backend
  const apiRequest: SendMessageApiRequest = {
    conversationId: data.conversationId,
    content: data.content,
    messageType: getMessageTypeNumber(data.messageType),
    attachmentIds: data.attachmentIds,
  }
  
  const response = await apiClient.post<{ data: Message }>(ENDPOINTS.SEND_MESSAGE, apiRequest)
  return response.data
}

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await apiClient.put(ENDPOINTS.MESSAGE_READ(messageId))
}

export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post<{ data: UploadFileResponse }>(
    ENDPOINTS.UPLOAD,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  
  return response.data
}

export const getNotifications = async (): Promise<ChatNotification[]> => {
  const response = await apiClient.get<{ data: ChatNotification[] }>(ENDPOINTS.NOTIFICATIONS)
  return response.data
}

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(ENDPOINTS.NOTIFICATION_READ(notificationId))
}

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.put(ENDPOINTS.NOTIFICATIONS_READ_ALL)
}
