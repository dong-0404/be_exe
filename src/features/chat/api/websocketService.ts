/**
 * WebSocket Service for Real-time Chat using Socket.io
 */

import { io, type Socket } from 'socket.io-client'
import type { WSEvent, Message, MessageReadEvent, TypingEvent, UserStatusEvent } from '../types'

type MessageCallback = (event: WSEvent) => void
type ConnectCallback = () => void
type DisconnectCallback = () => void
type ErrorCallback = (error: Error) => void

class WebSocketService {
    private socket: Socket | null = null
    private isIntentionalClose = false

    // Callbacks
    private messageCallbacks: MessageCallback[] = []
    private connectCallbacks: ConnectCallback[] = []
    private disconnectCallbacks: DisconnectCallback[] = []
    private errorCallbacks: ErrorCallback[] = []

    /**
     * Connect to Socket.io server
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            console.log('Socket.io already connected')
            return
        }

        this.isIntentionalClose = false

        try {
            // Get Socket.io URL from env (use HTTP, Socket.io will upgrade to WebSocket)
            const serverUrl = import.meta.env.VITE_ENV
                ? import.meta.env.VITE_WS_BASE_URL
                : "http://localhost:3000"

            // Create Socket.io connection with auth token
            this.socket = io(serverUrl, {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            })

            // Setup event listeners
            this.socket.on('connect', this.handleConnect.bind(this))
            this.socket.on('disconnect', this.handleDisconnect.bind(this))
            this.socket.on('error', this.handleError.bind(this))

            // Listen for custom events (message:new, typing:start, etc.)
            this.socket.on('message:new', (data: Message) => {
                console.log('📨 Socket.io received message:new event:', data)
                this.handleSocketEvent({
                    type: 'message:new',
                    data: data
                })
            })

            this.socket.on('message:read', (data: MessageReadEvent['data']) => {
                this.handleSocketEvent({
                    type: 'message:read',
                    data: data
                })
            })

            this.socket.on('typing:start', (data: TypingEvent['data']) => {
                this.handleSocketEvent({
                    type: 'typing:start',
                    data: data
                })
            })

            this.socket.on('typing:stop', (data: TypingEvent['data']) => {
                this.handleSocketEvent({
                    type: 'typing:stop',
                    data: data
                })
            })

            this.socket.on('user:online', (data: UserStatusEvent['data']) => {
                this.handleSocketEvent({
                    type: 'user:online',
                    data: data
                })
            })

            this.socket.on('user:offline', (data: UserStatusEvent['data']) => {
                this.handleSocketEvent({
                    type: 'user:offline',
                    data: data
                })
            })

            // Listen for generic events
            this.socket.onAny((eventName: string, ...args: unknown[]) => {
                // Handle any other events that might come through
                if (!['connect', 'disconnect', 'error', 'message:new', 'message:read', 'typing:start', 'typing:stop', 'user:online', 'user:offline'].includes(eventName)) {
                    this.handleSocketEvent({
                        type: eventName as WSEvent['type'],
                        data: (args[0] as Record<string, unknown>) || {}
                    })
                }
            })

            console.log('Socket.io connecting...')
        } catch (error) {
            console.error('Socket.io connection error:', error)
            this.handleError(error as Error)
        }
    }

    /**
     * Disconnect from Socket.io server
     */
    disconnect(): void {
        this.isIntentionalClose = true

        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }

        console.log('Socket.io disconnected')
    }

    /**
     * Send message through Socket.io
     * @param silent - If true, don't log errors when not connected (useful for typing events)
     */
    sendMessage(event: WSEvent, silent: boolean = false): void {
        if (!this.socket || !this.socket.connected) {
            if (!silent) {
                console.error('Socket.io is not connected')
            }
            return
        }

        try {
            // Emit event based on type
            switch (event.type) {
                case 'typing:start':
                case 'typing:stop':
                    console.log(`📤 Emitting ${event.type} event:`, event.data)
                    this.socket.emit(event.type, event.data)
                    break
                case 'message:new':
                case 'message:read':
                    this.socket.emit(event.type, event.data)
                    break
                default:
                    // For other events, emit with the event type as the event name
                    this.socket.emit(event.type, event.data)
            }
        } catch (error) {
            if (!silent) {
                console.error('Failed to send Socket.io message:', error)
            }
        }
    }

    /**
     * Register message callback
     */
    onMessage(callback: MessageCallback): () => void {
        this.messageCallbacks.push(callback)

        // Return unsubscribe function
        return () => {
            this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
        }
    }

    /**
     * Register connect callback
     */
    onConnect(callback: ConnectCallback): () => void {
        this.connectCallbacks.push(callback)

        return () => {
            this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback)
        }
    }

    /**
     * Register disconnect callback
     */
    onDisconnect(callback: DisconnectCallback): () => void {
        this.disconnectCallbacks.push(callback)

        return () => {
            this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback)
        }
    }

    /**
     * Register error callback
     */
    onError(callback: ErrorCallback): () => void {
        this.errorCallbacks.push(callback)

        return () => {
            this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback)
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false
    }

    /**
     * Join a conversation room
     */
    joinConversation(conversationId: string): void {
        if (!this.socket || !this.socket.connected) {
            console.warn('Cannot join conversation: Socket.io is not connected')
            return
        }

        console.log(`🔌 Joining conversation room: ${conversationId}`)
        this.socket.emit('conversation:join', { conversationId })
    }

    /**
     * Leave a conversation room
     */
    leaveConversation(conversationId: string): void {
        if (!this.socket || !this.socket.connected) {
            console.warn('Cannot leave conversation: Socket.io is not connected')
            return
        }

        console.log(`🔌 Leaving conversation room: ${conversationId}`)
        this.socket.emit('conversation:leave', { conversationId })
    }

    // Private methods

    private handleConnect(): void {
        console.log('✅ Socket.io connected successfully')
        console.log('🔌 Socket ID:', this.socket?.id)
        console.log('📡 Transport:', this.socket?.io.engine.transport.name)

        // Notify all connect callbacks
        this.connectCallbacks.forEach(callback => {
            try {
                callback()
            } catch (error) {
                console.error('Error in connect callback:', error)
            }
        })
    }

    private handleDisconnect(reason: string): void {
        console.log('Socket.io disconnected:', reason)

        // Notify all disconnect callbacks
        this.disconnectCallbacks.forEach(callback => {
            try {
                callback()
            } catch (error) {
                console.error('Error in disconnect callback:', error)
            }
        })

        // Attempt to reconnect if not intentional close
        // Socket.io handles reconnection automatically, but we can track it
        if (!this.isIntentionalClose && reason === 'io server disconnect') {
            // Server disconnected, Socket.io will try to reconnect automatically
            console.log('Server disconnected, Socket.io will attempt to reconnect')
        }
    }

    private handleError(error: Error | string): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error
        console.error('Socket.io error:', errorObj)

        // Notify all error callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorObj)
            } catch (err) {
                console.error('Error in error callback:', err)
            }
        })
    }

    private handleSocketEvent(event: WSEvent): void {
        console.log('📬 Socket.io event received:', event.type, event.data)

        // Notify all message callbacks
        this.messageCallbacks.forEach(callback => {
            try {
                callback(event)
            } catch (error) {
                console.error('Error in message callback:', error)
            }
        })
    }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Export class for testing
export { WebSocketService }
