import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { Search, ShieldCheck, Download } from 'lucide-react'
import { formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ACTION_COLORS = {
  USER_LOGIN: 'green',
  USER_LOGOUT: 'slate',
  USER_DELETED: 'rose',
  USER_ENROLLED: 'teal',
  COURSE_CREATED: 'blue',
  COURSE_UPDATED: 'amber',
  COURSE_DELETED: 'rose',
  ASSIGNMENT_SUBMITTED: 'purple',
  CONTENT_ADDED: 'blue',
  CONTENT_DELETED: 'rose',
}

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
  })

  // Fetch users silently to resolve userId → name
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <PageLoader />

  // Handle plain array OR paginated { content: [] } response shapes
  const rawData = data?.data?.data
  const allLogs = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.content)
      ? rawData.content
      : Array.isArray(data?.data)
        ? data.data
        : []

  // Build userId → name lookup
  const users = usersData?.data?.data || []
  const userMap = Object.fromEntries(
    users.map((u) => [u.userId, `${u.firstName} ${u.lastName}`])
  )

  const getUserLabel = (userId) => {
    if (!userId) return '—'
    if (userMap[userId]) return userMap[userId]
    return `${userId.slice(0, 8)}…`
  }

  const logs = allLogs.filter((l) => {
    const action = l.action || l.actionType || ''
    const matchSearch = `${l.actorId ?? l.userId ?? ''} ${action} ${l.resourceType ?? l.entityType ?? ''} ${l.additionalData ?? l.details ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchAction = actionFilter === 'ALL' || action === actionFilter
    return matchSearch && matchAction
  })

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('No logs to export')
      return
    }
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Details']
    const rows = logs.map((log) => [
      log.timestamp || log.createdAt || log.performedAt || '',
      getUserLabel(log.actorId || log.userId || log.performedBy),
      log.action || log.actionType || '',
      log.resourceType || log.entityType || '',
      log.additionalData || log.details || log.description || log.message || '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit logs downloaded')
  }

  const actions = ['ALL', 'USER_LOGIN', 'USER_LOGOUT', 'USER_ENROLLED', 'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED', 'ASSIGNMENT_SUBMITTED', 'USER_DELETED']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-slate-500 text-sm">{logs.length} events shown</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={16} /> Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, entity…"
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                actionFilter === a
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {a === 'ALL' ? 'All' : a}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Entity</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id || log.logId || log.auditLogId || idx}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.timestamp || log.createdAt || log.performedAt)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 text-xs">
                      {getUserLabel(log.actorId || log.userId || log.performedBy)}
                    </span>
                    {log.actorRole && (
                      <span className="block text-xs text-slate-400">{log.actorRole}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={ACTION_COLORS[log.action || log.actionType] || 'slate'}>
                      {log.action || log.actionType || '—'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.resourceType || log.entityType || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-xs">
                    {log.additionalData || log.details || log.description || log.message || '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <ShieldCheck size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400">No audit logs found</p>
                    {allLogs.length === 0 && (
                      <p className="text-slate-300 text-xs mt-1">
                        The audit service may not have recorded any events yet
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
