import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../services/notificationService'
import { useNotifications } from '../../context/NotificationContext'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { Bell, BellOff, CheckCheck, Trash2, MessageCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { timeAgo } from '../../utils/helpers'
import clsx from 'clsx'
import toast from 'react-hot-toast'

function NotifIcon({ type }) {
  const props = { size: 20, className: 'flex-shrink-0 mt-0.5' }
  if (type === 'SUCCESS')  return <CheckCircle2  {...props} className={`${props.className} text-emerald-500`} />
  if (type === 'WARNING')  return <AlertTriangle {...props} className={`${props.className} text-amber-500`} />
  if (type === 'ERROR')    return <XCircle       {...props} className={`${props.className} text-rose-500`} />
  return <MessageCircle {...props} className={`${props.className} text-primary-400`} />
}

export default function Notifications() {
  const qc = useQueryClient()
  const { decrementCount } = useNotifications()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      decrementCount()
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => notificationService.delete(id)))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications cleared')
    },
  })

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead)
    await Promise.all(unread.map((n) => markReadMutation.mutateAsync(n.id || n.notificationId)))
    toast.success('All marked as read')
  }

  if (isLoading) return <PageLoader />

  const notifications = data?.data?.data || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          {unreadCount > 0 && (
            <p className="text-slate-500 text-sm">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-sm">
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => deleteAllMutation.mutate(notifications.map((n) => n.id || n.notificationId))}
              disabled={deleteAllMutation.isPending}
              className="btn-ghost text-sm text-rose-500 hover:text-rose-600"
            >
              <Trash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <BellOff size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const id = n.id || n.notificationId
            const isRead = n.isRead || n.read
            return (
              <div
                key={id}
                className={clsx(
                  'card flex items-start gap-4 transition-all',
                  !isRead ? 'border-l-4 border-l-primary-400 bg-primary-50/40' : 'hover:bg-slate-50'
                )}
              >
                <NotifIcon type={n.type} />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => !isRead && markReadMutation.mutate(id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx('text-sm font-medium', !isRead ? 'text-slate-900' : 'text-slate-600')}>
                      {n.title || n.subject || 'Notification'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.createdAt || n.sentAt)}</p>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message || n.body}</p>
                  {n.type && (
                    <div className="mt-2">
                      <Badge variant={n.type === 'SUCCESS' ? 'green' : n.type === 'WARNING' ? 'amber' : n.type === 'ERROR' ? 'rose' : 'purple'}>
                        {n.type}
                      </Badge>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex-shrink-0"
                  title="Delete notification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
