/**
 * useChat Hook
 * Custom hook for chat logic
 */

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { fetchConversations, fetchMessages } from '../chatThunks'
import { setCurrentConversation } from '../chatSlice'
import { selectCurrentConversationId } from '../chatSelectors'

export const useChat = (initialConversationId?: string) => {
  const dispatch = useAppDispatch()
  const currentConversationId = useAppSelector(selectCurrentConversationId)
  
  // Fetch conversations on mount
  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])
  
  // Set initial conversation if provided
  useEffect(() => {
    if (initialConversationId) {
      dispatch(setCurrentConversation(initialConversationId))
    }
  }, [initialConversationId, dispatch])
  
  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      dispatch(fetchMessages(currentConversationId))
    }
  }, [currentConversationId, dispatch])
  
  return {
    currentConversationId,
  }
}
