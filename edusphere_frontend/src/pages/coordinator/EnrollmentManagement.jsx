import { useState } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { adminService } from '../../services/adminService'
import { userService } from '../../services/userService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import { UserPlus, Trash2, Users, Search, Clock, CheckCircle2, XCircle, History } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function EnrollmentManagement() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('manage')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [enrollModal, setEnrollModal] = useState(false)
  const [empId, setEmpId] = useState('')
  const [empIdQuery, setEmpIdQuery] = useState('')

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: enrollData, isLoading: loadingEnrolls } = useQuery({
    queryKey: ['enrollments', selectedCourse],
    queryFn: () => enrollmentService.getEnrollmentsByCourse(selectedCourse),
    enabled: !!selectedCourse,
  })

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-enrollments'],
    queryFn: () => enrollmentService.getPendingRequests(),
    enabled: tab === 'pending',
  })

  const { data: pastData, isLoading: loadingPast } = useQuery({
    queryKey: ['coordinator-past-enrollments'],
    queryFn: () => enrollmentService.getPastEnrollments(),
    enabled: tab === 'past',
  })

  const { data: lookupData, isFetching: lookingUp } = useQuery({
    queryKey: ['user-lookup', empIdQuery],
    queryFn: () => adminService.getUserByEmpId(empIdQuery),
    enabled: empIdQuery.length >= 2,
    retry: false,
  })

  const enrollMutation = useMutation({
    mutationFn: (data) => enrollmentService.enroll(data),
    onSuccess: () => {
      toast.success('Enrolled successfully!')
      setEnrollModal(false)
      setEmpId('')
      setEmpIdQuery('')
      qc.invalidateQueries({ queryKey: ['enrollments', selectedCourse] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Enrollment failed'),
  })

  const unenrollMutation = useMutation({
    mutationFn: (id) => enrollmentService.unenroll(id),
    onSuccess: () => {
      toast.success('Unenrolled')
      qc.invalidateQueries({ queryKey: ['enrollments', selectedCourse] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id) => enrollmentService.approveEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment approved!')
      qc.invalidateQueries({ queryKey: ['pending-enrollments'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Approval failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => enrollmentService.rejectEnrollment(id),
    onSuccess: () => {
      toast.success('Request rejected')
      qc.invalidateQueries({ queryKey: ['pending-enrollments'] })
    },
  })

  const enrollments = enrollData?.data?.data || []
  const pendingRequests = pendingData?.data?.data || []
  const pastEnrollments = pastData?.data?.data || []
  const uniqueUserIds = [...new Set(enrollments.map((e) => String(e.userId)))]

  const userProfileQueries = useQueries({
    queries: uniqueUserIds.map((userId) => ({
      queryKey: ['user-profile', userId],
      queryFn: () => userService.getProfile(userId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  // Fetch user profiles for pending requests
  const pendingUserIds = [...new Set(pendingRequests.map((e) => String(e.userId)))]
  const pendingUserQueries = useQueries({
    queries: pendingUserIds.map((userId) => ({
      queryKey: ['user-profile', userId],
      queryFn: () => userService.getProfile(userId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  // Fetch user profiles for past enrollments
  const pastUserIds = [...new Set(pastEnrollments.map((e) => String(e.userId)))]
  const pastUserQueries = useQueries({
    queries: pastUserIds.map((userId) => ({
      queryKey: ['user-profile', userId],
      queryFn: () => userService.getProfile(userId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const userMap = [...userProfileQueries, ...pendingUserQueries, ...pastUserQueries].reduce((acc, q) => {
    const u = q.data?.data?.data
    if (u?.userId) acc[String(u.userId)] = u
    return acc
  }, {})

  if (loadingCourses) return <PageLoader />

  const courses = coursesData?.data?.data || []
  const sortedEnrollments = [...enrollments].sort((a, b) => new Date(a.enrolledAt) - new Date(b.enrolledAt))
  const resolvedUser = lookupData?.data?.data ?? null

  const handleEnroll = () => {
    if (!resolvedUser) { toast.error('No user found with that ID'); return }
    enrollMutation.mutate({
      userId: resolvedUser.userId,
      userRole: resolvedUser.role,
      courseId: selectedCourse,
    })
  }

  const courseMap = Object.fromEntries(courses.map((c) => [c.courseId, c]))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage enrollments and review student requests</p>
        </div>
        {tab === 'manage' && selectedCourse && (
          <button onClick={() => setEnrollModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Enroll User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { key: 'manage',  label: 'Manage Enrollments', icon: Users },
          { key: 'pending', label: `Pending Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}`, icon: Clock },
          { key: 'past',    label: 'Past Enrollments', icon: History },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx('tab-btn', tab === t.key && 'active')}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Manage tab */}
      {tab === 'manage' && (
        <>
          <div className="card">
            <label className="label">Select Course to Manage</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input max-w-sm">
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseName} ({c.courseCode})
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title flex items-center gap-2">
                  <Users size={18} className="text-primary-500" />
                  Enrolled Users ({enrollments.length})
                </h3>
              </div>
              {loadingEnrolls ? <PageLoader /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left py-3 px-4 text-slate-500 font-medium">User</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium">Role</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium">Enrolled At</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEnrollments.map((e) => {
                        const u = userMap[String(e.userId)]
                        const name = u ? `${u.firstName} ${u.lastName}` : '…'
                        const email = u?.email ?? null
                        const initials = u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}` : '?'
                        return (
                          <tr key={e.enrollmentId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${e.userRole === 'STUDENT' ? 'bg-blue-400' : 'bg-emerald-400'}`}>
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{name}</p>
                                  {email && <p className="text-xs text-slate-400">{email}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={e.userRole === 'STUDENT' ? 'blue' : 'green'}>{e.userRole}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{formatDate(e.enrolledAt)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={e.status === 'ACTIVE' ? 'green' : 'slate'}>{e.status}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => unenrollMutation.mutate(e.enrollmentId)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove enrollment"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {enrollments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400">
                            No enrollments found for this course.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Pending requests tab */}
      {tab === 'pending' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-500" />
            <h3 className="section-title">Pending Enrollment Requests ({pendingRequests.length})</h3>
          </div>
          {loadingPending ? <PageLoader /> : (
            pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-3 text-slate-200" />
                <p>No pending enrollment requests.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Course</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Requested At</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((e) => {
                      const u = userMap[String(e.userId)]
                      const course = courseMap[e.courseId]
                      const name = u ? `${u.firstName} ${u.lastName}` : 'Loading…'
                      const initials = u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}` : '?'
                      return (
                        <tr key={e.enrollmentId} className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{name}</p>
                                {u?.email && <p className="text-xs text-slate-400">{u.email}</p>}
                                {u?.studentOrEmployeeId && (
                                  <p className="text-xs text-slate-400 font-mono">{u.studentOrEmployeeId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-800">{course?.courseName || '…'}</p>
                              {course && <Badge variant="purple" className="mt-0.5">{course.courseCode}</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{formatDate(e.enrolledAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => approveMutation.mutate(e.enrollmentId)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition-colors"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(e.enrollmentId)}
                                disabled={rejectMutation.isPending}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-medium transition-colors"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* Past Enrollments tab */}
      {tab === 'past' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-slate-500" />
            <h3 className="section-title">Past Enrollments ({pastEnrollments.length})</h3>
          </div>
          {loadingPast ? <PageLoader /> : pastEnrollments.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <History size={40} className="mx-auto mb-3 opacity-20" />
              <p>No past enrollments found.</p>
              <p className="text-xs mt-1">Deleted enrollments will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Course</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Enrolled At</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEnrollments.map((e) => {
                    const u = userMap[String(e.userId)]
                    const course = courseMap[e.courseId]
                    const name = u ? `${u.firstName} ${u.lastName}` : e.userId?.slice(0, 8) + '…'
                    const initials = u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}` : '?'
                    return (
                      <tr key={e.enrollmentId} className="border-b transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{name}</p>
                              {u?.studentOrEmployeeId && (
                                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.studentOrEmployeeId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{course?.courseName || '—'}</p>
                          {course && <Badge variant="purple" className="mt-0.5">{course.courseCode}</Badge>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={e.userRole === 'STUDENT' ? 'blue' : 'green'}>{e.userRole || '—'}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="rose">{e.status || 'DROPPED'}</Badge>
                        </td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(e.enrolledAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enroll user modal */}
      <Modal
        open={enrollModal}
        onClose={() => { setEnrollModal(false); setEmpId(''); setEmpIdQuery('') }}
        title="Enroll User"
      >
        <div className="space-y-4">
          <div className="bg-primary-50 rounded-xl p-3 text-xs text-primary-700 flex items-start gap-2">
            <Search size={14} className="flex-shrink-0 mt-0.5" />
            <span>Enter the student or employee ID (e.g. <strong>STU-001</strong> or <strong>EMP-001</strong>).</span>
          </div>
          <div>
            <label className="label">Student / Employee ID</label>
            <input
              value={empId}
              onChange={(e) => {
                const val = e.target.value.toUpperCase()
                setEmpId(val)
                setEmpIdQuery(val.trim())
              }}
              placeholder="STU-001 or EMP-001"
              className="input font-mono text-sm uppercase"
              autoComplete="off"
            />
            {empId.trim() && (
              lookingUp ? (
                <p className="text-sm text-slate-400 mt-1.5">Searching…</p>
              ) : resolvedUser ? (
                <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <span className="text-sm text-emerald-700 font-medium flex-1">
                    ✓ {resolvedUser.firstName} {resolvedUser.lastName} — {resolvedUser.email}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
                    resolvedUser.role === 'STUDENT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {resolvedUser.role}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-rose-500 mt-1.5">No user found with ID "{empId.trim()}"</p>
              )
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setEnrollModal(false); setEmpId('') }} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleEnroll}
              disabled={!resolvedUser || enrollMutation.isPending}
              className="btn-primary flex-1"
            >
              {enrollMutation.isPending ? 'Enrolling…' : 'Enroll'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
