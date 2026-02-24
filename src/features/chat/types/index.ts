/**
 * Chat Feature Type Definitions
 */

// User type (reuse from community)
export interface User {
  _id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: number
}

// Attachment type
export interface Attachment {
  _id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

// Message type
export interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderInfo: User
  content: string
  messageType: 'text' | 'image' | 'file'
  attachments?: Attachment[]
  isRead: boolean
  createdAt: string
  updatedAt?: string
}

// Conversation type
export interface Conversation {
  _id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
  createdAt: string
}

// Notification type
export interface ChatNotification {
  _id: string
  userId: string
  type: 'new_message' | 'message_read'
  content: string
  relatedId: string // conversationId or messageId
  isRead: boolean
  createdAt: string
}

// WebSocket event types
export type WSEventType = 
  | 'message:new'
  | 'message:read'
  | 'typing:start'
  | 'typing:stop'
  | 'user:online'
  | 'user:offline'

export interface WSEvent {
  type: WSEventType
  data: any
}

export interface MessageNewEvent extends WSEvent {
  type: 'message:new'
  data: Message
}

export interface MessageReadEvent extends WSEvent {
  type: 'message:read'
  data: {
    conversationId: string
    messageIds: string[]
  }
}

export interface TypingEvent extends WSEvent {
  type: 'typing:start' | 'typing:stop'
  data: {
    conversationId: string
    userId: string
  }
}

export interface UserStatusEvent extends WSEvent {
  type: 'user:online' | 'user:offline'
  data: {
    userId: string
  }
}

// Redux state type
export interface ChatState {
  // Conversations
  conversations: Conversation[]
  currentConversationId: string | null
  conversationsLoading: boolean
  
  // Messages
  messages: Record<string, Message[]> // Key: conversationId
  messagesLoading: boolean
  
  // Notifications
  notifications: ChatNotification[]
  unreadNotificationCount: number
  
  // UI State
  selectedTab: 'all' | 'unread' | 'read'
  searchQuery: string
  typingUsers: Record<string, string[]> // Key: conversationId, Value: userIds
  
  // WebSocket
  wsConnected: boolean
  
  // Error
  error: string | null
}

// Message type enum for backend (numbers)
export enum MessageType {
  TEXT = 1,
  IMAGE = 2,
  FILE = 3,
}

// Helper function to convert messageType string to number
export const getMessageTypeNumber = (messageType: 'text' | 'image' | 'file' | undefined): number => {
  switch (messageType) {
    case 'text':
      return MessageType.TEXT
    case 'image':
      return MessageType.IMAGE
    case 'file':
      return MessageType.FILE
    default:
      return MessageType.TEXT // Default to text
  }
}

// API Request/Response types
export interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: 'text' | 'image' | 'file' // Frontend uses string
  attachmentIds?: string[] // Attachment IDs after upload
}

// Internal API request type (with number for backend)
export interface SendMessageApiRequest {
  conversationId: string
  content: string
  messageType: number // Backend expects number
  attachmentIds?: string[] // Backend expects attachment IDs after upload
}

export interface CreateConversationRequest {
  participantIds: string[]
}

export interface MarkMessageReadRequest {
  messageId: string
}

export interface UploadFileResponse {
  _id?: string // Attachment ID from backend
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}
