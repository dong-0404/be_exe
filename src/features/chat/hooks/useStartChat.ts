/**
 * Hook to start a chat conversation with a specific user
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../../app/hooks'
import { findOrCreateConversation } from '../chatThunks'
import { routes } from '../../../config/routes'
import { getCurrentUser } from '../../auth/utils/authHelpers'

export const useStartChat = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  
  const startChat = useCallback(async (targetUserId: string) => {
    try {
      const currentUser = getCurrentUser()
      
      // Check if user is logged in
      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate(routes.login, { 
          state: { 
            message: 'Vui lòng đăng nhập để nhắn tin',
            returnTo: window.location.pathname
          } 
        })
        return
      }
      
      // Check if trying to chat with self
      if (currentUser._id === targetUserId) {
        alert('Bạn không thể nhắn tin với chính mình')
        return
      }
      
      // Find or create conversation
      const conversation = await dispatch(
        findOrCreateConversation(targetUserId)
      ).unwrap()
      
      // Navigate to chat page with conversation
      navigate(routes.chat, {
        state: { conversationId: conversation._id }
      })
    } catch (error) {
      console.error('Failed to start chat:', error)
      alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
    }
  }, [dispatch, navigate])
  
  return { startChat }
}
