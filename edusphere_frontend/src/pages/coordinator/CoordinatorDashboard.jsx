import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { analyticsService } from '../../services/analyticsService'
import { adminService } from '../../services/adminService'
import StatCard from '../../components/dashboard/StatCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { BookOpen, Users, FolderKanban, ArrowRight, Clock, ClipboardList, Sun, Moon, Cloud, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import { getGreeting, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: kpiData } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => analyticsService.getKpis(),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['pending-enrollments'],
    queryFn: () => enrollmentService.getPendingRequests(),
  })

  const { data: coursesAllData } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsersSilent(),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => enrollmentService.approveEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment approved')
      qc.invalidateQueries({ queryKey: ['pending-enrollments'] })
    },
    onError: () => toast.error('Approve failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => enrollmentService.rejectEnrollment(id),
    onSuccess: () => {
      toast.success('Enrollment rejected')
      qc.invalidateQueries({ queryKey: ['pending-enrollments'] })
    },
    onError: () => toast.error('Reject failed'),
  })

  if (isLoading) return <PageLoader />

  const courses = coursesData?.data?.data || []
  const kpis    = kpiData?.data?.data    || {}
  const pendingRequests = pendingData?.data?.data || []
  const allCourses = coursesAllData?.data?.data || []
  const courseMap = Object.fromEntries(allCourses.map((c) => [c.courseId, c]))
  const allUsers = usersData?.data?.data || []
  const totalStudents = allUsers.length > 0
    ? allUsers.filter(u => u.role === 'STUDENT').length
    : (kpis.totalStudents ?? '—')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-glow">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute right-[-30px] top-[-30px] w-48 h-48 rounded-full bg-white" />
          <div className="absolute right-24 bottom-[-20px] w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium flex items-center gap-1.5">
              {(() => { const h = new Date().getHours(); return h < 12 ? <Sun size={14}/> : h < 17 ? <Cloud size={14}/> : <Moon size={14}/> })()} {getGreeting()}
            </p>
            <h2 className="text-3xl font-bold mt-0.5">{user?.firstName} {user?.lastName}</h2>
            <p className="text-white/70 text-sm mt-2">Manage course assignments, departments, and enrollments.</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <FolderKanban size={26} className="text-white" />
          </div>
        </div>
      </div>


      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Courses"      value={courses.length}             icon={BookOpen}      colorIndex={3} />
        <StatCard label="Total Students"     value={totalStudents}              icon={Users}         colorIndex={0} />
        <StatCard label="Pending Requests"   value={pendingRequests.length}     icon={Clock}         colorIndex={2} />
        <StatCard label="Total Assignments"  value={kpis.totalAssignments ?? '—'} icon={ClipboardList} colorIndex={1} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Managed courses list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Managed Courses</h3>
            <button
              onClick={() => navigate('/coordinator/courses')}
              className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1"
            >
              Manage <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {courses.slice(0, 6).map((c) => (
              <div key={c.courseId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.courseName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.courseCode}</p>
                </div>
                <Badge variant="purple">{c.courseCode}</Badge>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No courses found.</p>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Pending Requests</h3>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => navigate('/coordinator/enrollments')}
                className="text-sm text-amber-600 hover:underline font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {pendingRequests.slice(0, 4).map((req) => {
              const course = courseMap[req.courseId]
              return (
                <div key={req.enrollmentId} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {course?.courseName ?? `Course ${req.courseId?.slice(0, 8)}…`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Student ID: {req.studentId?.slice(0, 8)}… · {formatDate(req.requestedAt || req.enrolledAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => approveMutation.mutate(req.enrollmentId)}
                      disabled={approveMutation.isPending}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(req.enrollmentId)}
                      disabled={rejectMutation.isPending}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Reject"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
            {pendingRequests.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="mx-auto text-emerald-300 mb-2" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending requests</p>
              </div>
            )}
          </div>
          {pendingRequests.length > 4 && (
            <button
              onClick={() => navigate('/coordinator/enrollments')}
              className="w-full mt-3 pt-3 border-t text-sm text-center text-amber-600 hover:underline font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              +{pendingRequests.length - 4} more requests
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
