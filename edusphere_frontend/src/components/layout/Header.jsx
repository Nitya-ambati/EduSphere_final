import { useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, Flame, Menu } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'
import { getGreeting } from '../../utils/helpers'
import clsx from 'clsx'

export default function Header({ title, onMenuToggle }) {
  const navigate = useNavigate()
  const notif = useNotifications()
  const { isDark, toggle } = useTheme()
  const { user } = useAuth()

  useEffect(() => { notif?.fetchCount() }, [])

  const greeting = getGreeting()
  const streak = user?.streakDays ?? 0
  const maxStreak = user?.maxStreakDays ?? 0

  return (
    <header
      className="sticky top-0 z-20 border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3 backdrop-blur"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-sidebar) 85%, transparent)', borderColor: 'var(--border)' }}
    >
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30 flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {greeting}, {user?.firstName}!
          </p>
        </div>
      </div>

      {/* Right: streak + theme toggle + notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Streak badge — hidden on very small screens */}
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
            <Flame size={14} className="text-amber-500" />
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{streak} day streak</span>
              {maxStreak > 0 && (
                <span className="text-[10px] text-amber-500 dark:text-amber-400">Best: {maxStreak} days</span>
              )}
            </div>
          </div>
        )}

        {/* Streak icon — only on mobile if streak > 0 */}
        {streak > 0 && (
          <div className="flex sm:hidden items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{streak}</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/30"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark
            ? <Sun size={18} className="text-amber-400" />
            : <Moon size={18} className="text-slate-500" />
          }
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        >
          <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
          {notif?.unreadCount > 0 && (
            <span className={clsx(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center',
              'bg-rose-500 animate-pulse-soft'
            )}>
              {notif.unreadCount > 99 ? '99+' : notif.unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
