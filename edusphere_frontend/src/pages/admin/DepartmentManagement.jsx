import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentService } from '../../services/departmentService'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { Building2, ChevronDown, ChevronRight, Users, Search, Plus, Trash2 } from 'lucide-react'
import { getInitials } from '../../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_BADGE = { STUDENT: 'blue', INSTRUCTOR: 'green', COORDINATOR: 'amber', ADMIN: 'rose' }
const ROLE_GRADIENT = { STUDENT: 'from-blue-400 to-indigo-500', INSTRUCTOR: 'from-emerald-400 to-teal-500', COORDINATOR: 'from-amber-400 to-orange-500', ADMIN: 'from-rose-400 to-pink-500' }

export default function DepartmentManagement() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // dept object to confirm deletion
  const [newDept, setNewDept] = useState({ departmentName: '', departmentCode: '', description: '' })

  const { data: deptData, isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  })

  const createDeptMutation = useMutation({
    mutationFn: (data) => departmentService.create(data),
    onSuccess: () => {
      toast.success('Department created!')
      setCreateModal(false)
      setNewDept({ departmentName: '', departmentCode: '', description: '' })
      qc.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create department'),
  })

  const deleteDeptMutation = useMutation({
    mutationFn: (deptId) => departmentService.deleteDepartment(deptId),
    onSuccess: () => {
      toast.success('Department deleted')
      setDeleteConfirm(null)
      qc.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete department'),
  })

  if (deptsLoading || usersLoading) return <PageLoader />

  const departments = deptData?.data?.data || []
  const allUsers = userData?.data?.data || []

  const usersByDept = allUsers.reduce((acc, u) => {
    const key = u.departmentId || '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})

  const filtered = departments.filter((d) =>
    `${d.departmentName} ${d.departmentCode}`.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {departments.length} department{departments.length !== 1 ? 's' : ''} · {allUsers.length} total users
        </p>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto">
          <Plus size={15} /> New Department
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search departments…"
          className="input pl-9"
        />
      </div>

      {/* Unassigned users */}
      {(usersByDept['__none__'] || []).length > 0 && (
        <div className="card border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toggle('__none__')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-slate-400" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No Department</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Users without a department assignment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="slate">{(usersByDept['__none__'] || []).length} user{(usersByDept['__none__'] || []).length !== 1 ? 's' : ''}</Badge>
              {expanded['__none__'] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </div>
          </button>
          {expanded['__none__'] && (
            <div className="mt-4 pt-4 border-t overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>#</th>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Name</th>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Email</th>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>ID</th>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Role</th>
                    <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersByDept['__none__'] || []).map((u, idx) => (
                    <tr key={u.userId} className="border-b transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-900/10" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br', ROLE_GRADIENT[u.role] || 'from-slate-400 to-slate-500')}>
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td className="py-2.5 px-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.studentOrEmployeeId || '—'}</td>
                      <td className="py-2.5 px-3"><Badge variant={ROLE_BADGE[u.role] || 'slate'}>{u.role.charAt(0) + u.role.slice(1).toLowerCase()}</Badge></td>
                      <td className="py-2.5 px-3">
                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', u.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create department modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Department">
        <div className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input
              value={newDept.departmentName}
              onChange={(e) => setNewDept((p) => ({ ...p, departmentName: e.target.value }))}
              placeholder="e.g. Computer Science"
              className="input"
            />
          </div>
          <div>
            <label className="label">Department Code</label>
            <input
              value={newDept.departmentCode}
              onChange={(e) => setNewDept((p) => ({ ...p, departmentCode: e.target.value.toUpperCase() }))}
              placeholder="e.g. CS"
              className="input"
            />
          </div>
          <div>
            <label className="label">Description <span style={{ color: 'var(--text-muted)' }} className="font-normal">(optional)</span></label>
            <textarea
              value={newDept.description}
              onChange={(e) => setNewDept((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description…"
              rows={3}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => createDeptMutation.mutate(newDept)}
              disabled={!newDept.departmentName || !newDept.departmentCode || createDeptMutation.isPending}
              className="btn-primary flex-1"
            >
              {createDeptMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal (Admin only) */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Department" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
            <Trash2 size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Delete "{deleteConfirm?.departmentName}"?
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                This will soft-delete the department. Users assigned to it will become unassigned. This action cannot be undone from the UI.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => deleteDeptMutation.mutate(deleteConfirm?.departmentId)}
              disabled={deleteDeptMutation.isPending}
              className="btn-danger flex-1"
            >
              {deleteDeptMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Department list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <Building2 size={48} className="mx-auto mb-4 opacity-20" />
            <p>No departments found</p>
          </div>
        )}
        {filtered.map((dept) => {
          const deptUsers = usersByDept[dept.departmentId] || []
          const isOpen = expanded[dept.departmentId]
          return (
            <div key={dept.departmentId} className="card border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
              <div className="flex items-center justify-between w-full">
                {/* Clickable expand area */}
                <button
                  onClick={() => toggle(dept.departmentId)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{dept.departmentName}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{dept.departmentCode}</p>
                    {dept.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{dept.description}</p>
                    )}
                  </div>
                </button>

                {/* Right-side actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <Badge variant={deptUsers.length > 0 ? 'blue' : 'slate'} className="hidden sm:inline-flex">
                    {deptUsers.length} user{deptUsers.length !== 1 ? 's' : ''}
                  </Badge>

                  {/* Delete button — Admin only */}
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(dept) }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      title="Delete department"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <button onClick={() => toggle(dept.departmentId)} className="p-1">
                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  {deptUsers.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No users in this department</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>#</th>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Name</th>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Email</th>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>ID</th>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Role</th>
                            <th className="text-left py-2 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptUsers.map((u, idx) => (
                            <tr
                              key={u.userId}
                              className="border-b transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-900/10"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br', ROLE_GRADIENT[u.role] || 'from-slate-400 to-slate-500')}>
                                    {getInitials(u.firstName, u.lastName)}
                                  </div>
                                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                              <td className="py-2.5 px-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.studentOrEmployeeId || '—'}</td>
                              <td className="py-2.5 px-3">
                                <Badge variant={ROLE_BADGE[u.role] || 'slate'}>
                                  {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', u.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                                  {u.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UserChip({ user: u }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br', ROLE_GRADIENT[u.role] || 'from-slate-400 to-slate-500')}>
        {getInitials(u.firstName, u.lastName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
      </div>
      <Badge variant={ROLE_BADGE[u.role] || 'slate'} className="flex-shrink-0 ml-auto">
        {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
      </Badge>
    </div>
  )
}
