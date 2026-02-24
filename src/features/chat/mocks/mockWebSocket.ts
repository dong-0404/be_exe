/**
 * Mock WebSocket for Testing
 */

import type { WSEvent } from '../types'

export class MockWebSocket {
  private listeners: Map<string, Set<(event: WSEvent) => void>> = new Map()
  private connected = false
  
  connect(): void {
    this.connected = true
    console.log('[MockWebSocket] Connected')
    this.emit('connect', null)
  }
  
  disconnect(): void {
    this.connected = false
    console.log('[MockWebSocket] Disconnected')
    this.emit('disconnect', null)
  }
  
  send(event: WSEvent): void {
    if (!this.connected) {
      console.warn('[MockWebSocket] Cannot send - not connected')
      return
    }
    
    console.log('[MockWebSocket] Sending:', event)
    
    // Simulate server response
    setTimeout(() => {
      this.simulateServerResponse(event)
    }, 100)
  }
  
  on(eventType: string, callback: (event: WSEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
  }
  
  off(eventType: string, callback: (event: WSEvent) => void): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(callback)
    }
  }
  
  private emit(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error('[MockWebSocket] Error in listener:', error)
        }
      })
    }
  }
  
  private simulateServerResponse(event: WSEvent): void {
    switch (event.type) {
      case 'typing:start':
        // Echo back typing event
        this.emit('message', event)
        break
        
      case 'typing:stop':
        // Echo back typing stop event
        this.emit('message', event)
        break
        
      case 'message:new':
        // Simulate message sent confirmation
        this.emit('message', {
          type: 'message:new',
          data: event.data,
        })
        break
        
      default:
        console.log('[MockWebSocket] No simulation for event type:', event.type)
    }
  }
  
  // Simulate receiving a new message from another user
  simulateIncomingMessage(message: any): void {
    if (!this.connected) return
    
    this.emit('message', {
      type: 'message:new',
      data: message,
    })
  }
  
  // Simulate message read event
  simulateMessageRead(conversationId: string, messageIds: string[]): void {
    if (!this.connected) return
    
    this.emit('message', {
      type: 'message:read',
      data: { conversationId, messageIds },
    })
  }
  
  // Simulate typing event from another user
  simulateTyping(conversationId: string, userId: string, isTyping: boolean): void {
    if (!this.connected) return
    
    this.emit('message', {
      type: isTyping ? 'typing:start' : 'typing:stop',
      data: { conversationId, userId },
    })
  }
}

// Export singleton instance
export const mockWebSocket = new MockWebSocket()
