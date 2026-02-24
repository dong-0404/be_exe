/**
 * useWebSocket Hook
 * Custom hook for WebSocket connection
 */

import { useEffect } from 'react'
import { useAppDispatch } from '../../../app/hooks'
import { websocketService } from '../api/websocketService'
import { setWsConnected, addMessage, addNotification, setTyping, markMessagesAsRead } from '../chatSlice'
import { getAuthToken } from '../../auth/utils/authHelpers'
import type { WSEvent, MessageNewEvent, MessageReadEvent, TypingEvent } from '../types'

export const useWebSocket = () => {
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    const token = getAuthToken()
    
    if (!token) {
      console.warn('⚠️ No auth token found, skipping WebSocket connection')
      return
    }
    
    console.log('🔌 useWebSocket: Connecting to Socket.io...')
    
    // Connect to WebSocket
    websocketService.connect(token)
    
    // Setup event listeners
    const unsubscribeConnect = websocketService.onConnect(() => {
      console.log('✅ useWebSocket: Socket.io connected, updating Redux state')
      dispatch(setWsConnected(true))
    })
    
    const unsubscribeDisconnect = websocketService.onDisconnect(() => {
      console.log('❌ useWebSocket: Socket.io disconnected, updating Redux state')
      dispatch(setWsConnected(false))
    })
    
    const unsubscribeMessage = websocketService.onMessage((event: WSEvent) => {
      handleWebSocketEvent(event)
    })
    
    const unsubscribeError = websocketService.onError((error: Error) => {
      console.error('WebSocket error:', error)
    })
    
    // Handle WebSocket events
    const handleWebSocketEvent = (event: WSEvent) => {
      console.log('🔔 useWebSocket received event:', event.type)
      
      switch (event.type) {
        case 'message:new': {
          const messageEvent = event as MessageNewEvent
          console.log('💬 Adding new message to state:', messageEvent.data)
          dispatch(addMessage(messageEvent.data))
          break
        }
        
        case 'message:read': {
          const readEvent = event as MessageReadEvent
          dispatch(markMessagesAsRead(readEvent.data))
          break
        }
        
        case 'typing:start': {
          const typingEvent = event as TypingEvent
          console.log('⌨️ Received typing:start event:', typingEvent.data)
          dispatch(setTyping({
            conversationId: typingEvent.data.conversationId,
            userId: typingEvent.data.userId,
            isTyping: true,
          }))
          break
        }
        
        case 'typing:stop': {
          const typingEvent = event as TypingEvent
          console.log('⌨️ Received typing:stop event:', typingEvent.data)
          dispatch(setTyping({
            conversationId: typingEvent.data.conversationId,
            userId: typingEvent.data.userId,
            isTyping: false,
          }))
          break
        }
        
        case 'user:online':
        case 'user:offline':
          // TODO: Handle user online/offline status
          break
        
        default:
          console.warn('Unknown WebSocket event type:', event.type)
      }
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribeConnect()
      unsubscribeDisconnect()
      unsubscribeMessage()
      unsubscribeError()
      websocketService.disconnect()
    }
  }, [dispatch])
  
  return {
    isConnected: websocketService.isConnected(),
  }
}
