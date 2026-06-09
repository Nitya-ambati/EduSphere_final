import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { departmentService } from '../../services/departmentService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { Search, Trash2, Upload, Users, Building2, LayoutGrid, List, RefreshCw } from 'lucide-react'
import { getInitials } from '../../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_BADGE = { STUDENT: 'blue', INSTRUCTOR: 'green', COORDINATOR: 'amber', ADMIN: 'rose' }
const ROLE_GRADIENT = { STUDENT: 'from-blue-400 to-indigo-500', INSTRUCTOR: 'from-emerald-400 to-teal-500', COORDINATOR: 'from-amber-400 to-orange-500', ADMIN: 'from-rose-400 to-pink-500' }

export default function UserManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('card') // 'card' | 'table'
  const [uploadModal, setUploadModal] = useState(false)
  const [file, setFile] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  })

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  const deptMap = (deptData?.data?.data || []).reduce((acc, d) => {
    acc[d.departmentId] = d.departmentName
    return acc
  }, {})

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User deactivated')
      setDeleteConfirm(null)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: (id) => adminService.reactivateUser(id),
    onSuccess: () => {
      toast.success('User reactivated successfully')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Failed to reactivate user'),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => adminService.uploadUsers(file),
    onSuccess: (res) => {
      const data = res?.data?.data || {}
      const created = data.totalCreated ?? 0
      const updated = data.totalUpdated ?? 0
      const errCount = data.totalErrors ?? 0
      const notifFails = data.totalNotificationFailures ?? 0
      setImportResult(data)
      if (created > 0 || updated > 0) {
        const suffix = notifFails > 0 ? ` (${notifFails} email(s) failed)` : ''
        toast.success(`Import complete: ${created} created, ${updated} updated${errCount > 0 ? `, ${errCount} errors` : ''}${suffix}`)
      } else if (errCount > 0) {
        toast.error(`Import failed: ${errCount} error(s). No users added.`)
      } else {
        toast.success('No changes — all rows already up to date.')
      }
      setFile(null)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => { setImportResult(null) },
  })

  if (isLoading) return <PageLoader />

  const allUsers = data?.data?.data || []
  const activeUsers = allUsers.filter((u) => u.active && !u.deleted)
  const inactiveUsers = allUsers.filter((u) => u.deleted || !u.active)

  const users = (statusFilter === 'ACTIVE' ? activeUsers : inactiveUsers).filter((u) => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {activeUsers.length} active · {inactiveUsers.length} inactive
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setUploadModal(true)} className="btn-secondary">
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--border)' }}>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'ACTIVE' ? 'shadow-sm text-emerald-700 dark:text-emerald-300' : 'hover:text-slate-700 dark:hover:text-slate-200'
            )}
            style={statusFilter === 'ACTIVE' ? { backgroundColor: 'var(--bg-card)', color: undefined } : { color: 'var(--text-muted)' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Active ({activeUsers.length})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'INACTIVE' ? 'shadow-sm text-rose-600 dark:text-rose-400' : 'hover:text-slate-700 dark:hover:text-slate-200'
            )}
            style={statusFilter === 'INACTIVE' ? { backgroundColor: 'var(--bg-card)' } : { color: 'var(--text-muted)' }}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Inactive ({inactiveUsers.length})
          </button>
        </div>
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="input pl-9 w-full" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto max-w-full" style={{ backgroundColor: 'var(--border)' }}>
          {['ALL', 'STUDENT', 'INSTRUCTOR', 'COORDINATOR', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap')}
              style={roleFilter === r ? { backgroundColor: 'var(--bg-card)', color: '#7c3aed' } : { color: 'var(--text-muted)' }}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--border)' }}>
          <button
            onClick={() => setViewMode('card')}
            className={clsx('p-1.5 rounded-lg transition-all')}
            style={viewMode === 'card' ? { backgroundColor: 'var(--bg-card)', color: '#7c3aed' } : { color: 'var(--text-muted)' }}
            title="Card view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={clsx('p-1.5 rounded-lg transition-all')}
            style={viewMode === 'table' ? { backgroundColor: 'var(--bg-card)', color: '#7c3aed' } : { color: 'var(--text-muted)' }}
            title="Table view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Card view */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((u) => (
            <div key={u.userId} className="card hover:shadow-soft transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br', ROLE_GRADIENT[u.role] || 'from-slate-400 to-slate-500')}>
                  {getInitials(u.firstName, u.lastName)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  {(u.deleted || !u.active) ? (
                    <button
                      onClick={() => reactivateMutation.mutate(u.userId)}
                      className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Reactivate user"
                    >
                      <RefreshCw size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(u)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
              {u.departmentId && deptMap[u.departmentId] && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                  <Building2 size={11} />
                  {deptMap[u.departmentId]}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <Badge variant={ROLE_BADGE[u.role] || 'slate'}>{u.role}</Badge>
                <Badge variant={u.deleted ? 'rose' : u.active ? 'green' : 'slate'}>
                  {u.deleted ? 'Deactivated' : u.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {u.studentOrEmployeeId && (
                <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>{u.studentOrEmployeeId}</p>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="col-span-full card text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Department</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>ID</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-900/10" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br', ROLE_GRADIENT[u.role] || 'from-slate-400 to-slate-500')}>
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td className="py-3 px-4"><Badge variant={ROLE_BADGE[u.role] || 'slate'}>{u.role}</Badge></td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {u.departmentId && deptMap[u.departmentId] ? deptMap[u.departmentId] : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.deleted ? 'rose' : u.active ? 'green' : 'slate'}>
                        {u.deleted ? 'Deactivated' : u.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {u.studentOrEmployeeId || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {(u.deleted || !u.active) ? (
                        <button
                          onClick={() => reactivateMutation.mutate(u.userId)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Reactivate user"
                        >
                          <RefreshCw size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title="Deactivate user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload modal */}
      <Modal open={uploadModal} onClose={() => { setUploadModal(false); setImportResult(null) }} title="Import Users via Excel">
        <div className="space-y-4">
          {!importResult ? (
            <>
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300">
                <p className="font-medium mb-1">Excel format required:</p>
                <p className="text-xs font-mono">firstName | lastName | email | role | departmentCode | studentOrEmployeeId</p>
                <p className="text-xs mt-1 opacity-70">Existing users will be updated if any field changed.</p>
              </div>
              <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-8 text-center">
                <Upload size={28} className="mx-auto text-primary-300 mb-2" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select your Excel (.xlsx) file</p>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="mt-3 text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }} />
              </div>
              {file && <p className="text-sm text-emerald-600 font-medium">✓ {file.name}</p>}
              <div className="flex gap-3">
                <button onClick={() => setUploadModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => uploadMutation.mutate(file)} disabled={!file || uploadMutation.isPending} className="btn-primary flex-1">
                  {uploadMutation.isPending ? 'Importing…' : 'Import'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">New users created</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200">{importResult.totalCreated ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Existing users updated</span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">{importResult.totalUpdated ?? 0}</span>
                </div>
                {(importResult.totalErrors ?? 0) > 0 && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-sm">
                    <p className="text-rose-700 dark:text-rose-300 font-medium mb-2">Row Errors ({importResult.totalErrors})</p>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {(importResult.errorRows || []).map((err, idx) => (
                        <li key={idx} className="text-xs text-rose-600 dark:text-rose-400">Row {err.row} ({err.email}): {err.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={() => { setUploadModal(false); setImportResult(null) }} className="btn-primary w-full">Done</button>
            </>
          )}
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate User" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to deactivate <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteConfirm?.userId)} disabled={deleteMutation.isPending} className="btn-danger flex-1">
              {deleteMutation.isPending ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
