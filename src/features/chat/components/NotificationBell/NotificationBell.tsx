/**
 * NotificationBell Component
 * Bell icon with notification badge in header
 */

import React, { useState, useRef, useEffect } from 'react'
import { useAppSelector } from '../../../../app/hooks'
import { selectUnreadNotificationCount } from '../../chatSelectors'
import { NotificationPanel } from '../NotificationPanel'
import './NotificationBell.css'

export const NotificationBell: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false)
  const unreadCount = useAppSelector(selectUnreadNotificationCount)
  const bellRef = useRef<HTMLDivElement>(null)
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowPanel(false)
      }
    }
    
    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel])
  
  const handleToggle = () => {
    setShowPanel(!showPanel)
  }
  
  return (
    <div className="notification-bell" ref={bellRef}>
      <button
        className="bell-button"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showPanel && <NotificationPanel onClose={() => setShowPanel(false)} />}
    </div>
  )
}
