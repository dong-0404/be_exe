/**
 * Mock Data for Chat Feature Testing
 */

import type { Conversation, Message, ChatNotification, User } from '../types'

// Mock users
export const mockUsers: User[] = [
  {
    _id: 'user-1',
    email: 'nguyen.van.a@example.com',
    fullName: 'Nguyễn Văn A',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 1,
  },
  {
    _id: 'user-2',
    email: 'tran.thi.b@example.com',
    fullName: 'Trần Thị B',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    role: 2,
  },
  {
    _id: 'user-3',
    email: 'le.van.c@example.com',
    fullName: 'Lê Văn C',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    role: 1,
  },
  {
    _id: 'current-user',
    email: 'current.user@example.com',
    fullName: 'Người dùng hiện tại',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
    role: 1,
  },
]

// Mock messages
export const mockMessages: Message[] = [
  {
    _id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderInfo: mockUsers[0],
    content: 'Xin chào! Tôi muốn tìm gia sư dạy Toán cho con.',
    messageType: 'text',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'current-user',
    senderInfo: mockUsers[3],
    content: 'Chào bạn! Tôi có thể giúp được. Con bạn học lớp mấy?',
    messageType: 'text',
    isRead: true,
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    _id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderInfo: mockUsers[0],
    content: 'Con tôi học lớp 10. Cần ôn tập Toán 10 và chuẩn bị thi học kỳ.',
    messageType: 'text',
    isRead: true,
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    _id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'current-user',
    senderInfo: mockUsers[3],
    content: 'Được ạ. Tôi có kinh nghiệm dạy Toán 10. Bạn muốn học vào thời gian nào?',
    messageType: 'text',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'msg-5',
    conversationId: 'conv-2',
    senderId: 'user-2',
    senderInfo: mockUsers[1],
    content: 'Chào anh! Em muốn hỏi về lịch dạy tuần sau.',
    messageType: 'text',
    isRead: false,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    _id: 'msg-6',
    conversationId: 'conv-3',
    senderId: 'user-3',
    senderInfo: mockUsers[2],
    content: 'Cảm ơn anh đã dạy tốt. Con em tiến bộ rất nhiều!',
    messageType: 'text',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    _id: 'conv-1',
    participants: [mockUsers[0], mockUsers[3]],
    lastMessage: mockMessages[3],
    unreadCount: 1,
    updatedAt: mockMessages[3].createdAt,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'conv-2',
    participants: [mockUsers[1], mockUsers[3]],
    lastMessage: mockMessages[4],
    unreadCount: 1,
    updatedAt: mockMessages[4].createdAt,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    _id: 'conv-3',
    participants: [mockUsers[2], mockUsers[3]],
    lastMessage: mockMessages[5],
    unreadCount: 0,
    updatedAt: mockMessages[5].createdAt,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

// Mock notifications
export const mockNotifications: ChatNotification[] = [
  {
    _id: 'notif-1',
    userId: 'current-user',
    type: 'new_message',
    content: 'Bạn có 1 tin nhắn mới từ Nguyễn Văn A',
    relatedId: 'conv-1',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'notif-2',
    userId: 'current-user',
    type: 'new_message',
    content: 'Bạn có 1 tin nhắn mới từ Trần Thị B',
    relatedId: 'conv-2',
    isRead: false,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    _id: 'notif-3',
    userId: 'current-user',
    type: 'message_read',
    content: 'Lê Văn C đã đọc tin nhắn của bạn',
    relatedId: 'conv-3',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Helper functions for mock API
export const getMockConversations = (): Promise<Conversation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockConversations)
    }, 500)
  })
}

export const getMockMessages = (conversationId: string): Promise<Message[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const messages = mockMessages.filter((m) => m.conversationId === conversationId)
      resolve(messages)
    }, 300)
  })
}

export const getMockNotifications = (): Promise<ChatNotification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockNotifications)
    }, 300)
  })
}

export const sendMockMessage = (
  conversationId: string,
  content: string
): Promise<Message> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMessage: Message = {
        _id: `msg-${Date.now()}`,
        conversationId,
        senderId: 'current-user',
        senderInfo: mockUsers[3],
        content,
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      resolve(newMessage)
    }, 300)
  })
}
