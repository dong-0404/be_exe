/**
 * Chat Redux Slice
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatState, Conversation, Message, ChatNotification } from './types'
import {
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    markConversationMessagesAsRead,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    findOrCreateConversation,
} from './chatThunks'

const initialState: ChatState = {
    // Conversations
    conversations: [],
    currentConversationId: null,
    conversationsLoading: false,

    // Messages
    messages: {},
    messagesLoading: false,

    // Notifications
    notifications: [],
    unreadNotificationCount: 0,

    // UI State
    selectedTab: 'all',
    searchQuery: '',
    typingUsers: {},

    // WebSocket
    wsConnected: false,

    // Error
    error: null,
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Conversation actions
        setCurrentConversation: (state, action: PayloadAction<string | null>) => {
            state.currentConversationId = action.payload

            // Reset unread count for this conversation
            if (action.payload) {
                const conversation = state.conversations.find(c => c._id === action.payload)
                if (conversation) {
                    conversation.unreadCount = 0
                }
            }
        },

        updateConversation: (state, action: PayloadAction<Conversation>) => {
            const index = state.conversations.findIndex(c => c._id === action.payload._id)
            if (index !== -1) {
                state.conversations[index] = action.payload
            } else {
                state.conversations.unshift(action.payload)
            }

            // Sort by updatedAt
            state.conversations.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
        },

        // Message actions
        addMessage: (state, action: PayloadAction<Message>) => {
            const { conversationId } = action.payload
            const message = action.payload

            if (!state.messages[conversationId]) {
                state.messages[conversationId] = []
            }

            // Check if message already exists
            const existingMessage = state.messages[conversationId].find(m => m._id === message._id)
            const isNewMessage = !existingMessage

            if (isNewMessage) {
                state.messages[conversationId].push(message)
            } else {
                // Update existing message (in case of optimistic updates)
                const index = state.messages[conversationId].findIndex(m => m._id === message._id)
                if (index !== -1) {
                    state.messages[conversationId][index] = message
                }
            }

            // Update conversation's last message
            const conversation = state.conversations.find(c => c._id === conversationId)
            if (conversation) {
                conversation.lastMessage = message
                conversation.updatedAt = message.createdAt

                // Increment unread count only if:
                // 1. Message is new (not already in list)
                // 2. Not current conversation (user is not viewing it)
                // 3. Message is not read (backend will set isRead=false for messages from other users)
                // Note: Messages from current user are typically marked as read by backend
                // Note: unreadCount will be synced with backend when fetchConversations is called
                if (isNewMessage && 
                    conversationId !== state.currentConversationId && 
                    !message.isRead) {
                    conversation.unreadCount++
                }
            }

            // Sort conversations
            state.conversations.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
        },

        markMessagesAsRead: (state, action: PayloadAction<{ conversationId: string, messageIds: string[] }>) => {
            const { conversationId, messageIds } = action.payload

            if (state.messages[conversationId]) {
                let unreadCountDecrease = 0
                state.messages[conversationId].forEach(message => {
                    if (messageIds.includes(message._id) && !message.isRead) {
                        message.isRead = true
                        unreadCountDecrease++
                    }
                })

                // Decrease conversation unread count
                if (unreadCountDecrease > 0) {
                    const conversation = state.conversations.find(c => c._id === conversationId)
                    if (conversation) {
                        conversation.unreadCount = Math.max(0, conversation.unreadCount - unreadCountDecrease)
                    }
                }
            }
        },

        // Notification actions
        addNotification: (state, action: PayloadAction<ChatNotification>) => {
            const exists = state.notifications.some(n => n._id === action.payload._id)
            if (!exists) {
                state.notifications.unshift(action.payload)
                if (!action.payload.isRead) {
                    state.unreadNotificationCount++
                }
            }
        },

        updateNotification: (state, action: PayloadAction<ChatNotification>) => {
            const index = state.notifications.findIndex(n => n._id === action.payload._id)
            if (index !== -1) {
                const wasUnread = !state.notifications[index].isRead
                state.notifications[index] = action.payload

                // Update unread count
                if (wasUnread && action.payload.isRead) {
                    state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1)
                }
            }
        },

        // Typing actions
        setTyping: (state, action: PayloadAction<{ conversationId: string, userId: string, isTyping: boolean }>) => {
            const { conversationId, userId, isTyping } = action.payload

            if (!state.typingUsers[conversationId]) {
                state.typingUsers[conversationId] = []
            }

            if (isTyping) {
                if (!state.typingUsers[conversationId].includes(userId)) {
                    state.typingUsers[conversationId].push(userId)
                }
            } else {
                state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId)
            }
        },

        // UI actions
        setSelectedTab: (state, action: PayloadAction<'all' | 'unread' | 'read'>) => {
            state.selectedTab = action.payload
        },

        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload
        },

        // WebSocket actions
        setWsConnected: (state, action: PayloadAction<boolean>) => {
            state.wsConnected = action.payload
        },

        // Error actions
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },

        clearError: (state) => {
            state.error = null
        },

        // Reset state
        resetChat: () => initialState,
    },

    extraReducers: (builder) => {
        // Fetch conversations
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.conversationsLoading = true
                state.error = null
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.conversationsLoading = false
                // Sync conversations from backend - trust backend unreadCount
                // This ensures unreadCount is always in sync with backend
                state.conversations = action.payload
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.conversationsLoading = false
                state.error = action.payload as string
            })

        // Fetch messages
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.messagesLoading = true
                state.error = null
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.messagesLoading = false
                const { conversationId, messages } = action.payload
                state.messages[conversationId] = messages
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.messagesLoading = false
                state.error = action.payload as string
            })

        // Send message
        builder
            .addCase(sendMessage.pending, (state) => {
                state.error = null
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                // Message will be added via WebSocket event
                // But we can add it optimistically here
                const message = action.payload
                const { conversationId } = message

                if (!state.messages[conversationId]) {
                    state.messages[conversationId] = []
                }

                const exists = state.messages[conversationId].some(m => m._id === message._id)
                if (!exists) {
                    state.messages[conversationId].push(message)
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.error = action.payload as string
            })

        // Mark message as read
        builder
            .addCase(markMessageAsRead.fulfilled, (state, action) => {
                const { conversationId, messageId } = action.payload

                if (state.messages[conversationId]) {
                    const message = state.messages[conversationId].find(m => m._id === messageId)
                    if (message && !message.isRead) {
                        message.isRead = true
                        
                        // Decrease conversation unread count
                        const conversation = state.conversations.find(c => c._id === conversationId)
                        if (conversation) {
                            conversation.unreadCount = Math.max(0, conversation.unreadCount - 1)
                        }
                    }
                }
            })

        // Mark all conversation messages as read
        builder
            .addCase(markConversationMessagesAsRead.fulfilled, (state, action) => {
                const { conversationId, messageIds } = action.payload
                
                // Use markMessagesAsRead reducer to handle the state update
                if (state.messages[conversationId] && messageIds.length > 0) {
                    // Mark messages as read and decrease unread count
                    let unreadCountDecrease = 0
                    state.messages[conversationId].forEach(message => {
                        if (messageIds.includes(message._id) && !message.isRead) {
                            message.isRead = true
                            unreadCountDecrease++
                        }
                    })

                    // Decrease conversation unread count
                    if (unreadCountDecrease > 0) {
                        const conversation = state.conversations.find(c => c._id === conversationId)
                        if (conversation) {
                            conversation.unreadCount = Math.max(0, conversation.unreadCount - unreadCountDecrease)
                        }
                    }
                }
            })

        // Fetch notifications
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.error = null
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.notifications = action.payload
                state.unreadNotificationCount = action.payload.filter(n => !n.isRead).length
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.error = action.payload as string
            })

        // Mark notification as read
        builder
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n._id === action.payload)
                if (notification && !notification.isRead) {
                    notification.isRead = true
                    state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1)
                }
            })

        // Mark all notifications as read
        builder
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => {
                    n.isRead = true
                })
                state.unreadNotificationCount = 0
            })

        // Find or create conversation
        builder
            .addCase(findOrCreateConversation.pending, (state) => {
                state.conversationsLoading = true
                state.error = null
            })
            .addCase(findOrCreateConversation.fulfilled, (state, action) => {
                state.conversationsLoading = false
                const conversation = action.payload

                // Check if conversation already in list
                const exists = state.conversations.some(c => c._id === conversation._id)
                if (!exists) {
                    state.conversations.unshift(conversation)
                }

                // Set as current conversation
                state.currentConversationId = conversation._id
            })
            .addCase(findOrCreateConversation.rejected, (state, action) => {
                state.conversationsLoading = false
                state.error = action.payload as string
            })
    },
})

export const {
    setCurrentConversation,
    updateConversation,
    addMessage,
    markMessagesAsRead,
    addNotification,
    updateNotification,
    setTyping,
    setSelectedTab,
    setSearchQuery,
    setWsConnected,
    setError,
    clearError,
    resetChat,
} = chatSlice.actions

export default chatSlice.reducer
