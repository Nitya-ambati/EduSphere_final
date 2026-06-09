import { createContext, useContext, useState, useCallback } from 'react'
import { notificationService } from '../services/notificationService'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationService.getUnreadCount()
      setUnreadCount(data.data ?? 0)
    } catch {}
  }, [user])

  const decrementCount = useCallback(() => {
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchCount, decrementCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
