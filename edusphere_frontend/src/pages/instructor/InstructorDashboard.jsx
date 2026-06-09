import { useQuery, useQueries } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { analyticsService } from '../../services/analyticsService'
import { assignmentService } from '../../services/assignmentService'
import { adminService } from '../../services/adminService'
import StatCard from '../../components/dashboard/StatCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { BookOpen, Users, ClipboardList, TrendingUp, ArrowRight, GraduationCap, BarChart2, Sun, Moon, Cloud } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getGreeting } from '../../utils/helpers'
import { scoreBg } from '../../utils/helpers'
import clsx from 'clsx'

export default function InstructorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ── All hooks MUST be declared before any early return ──

  const { data: instructorEnrollData, isLoading } = useQuery({
    queryKey: ['instructor-enrollments', user?.userId],
    queryFn: () => enrollmentService.getInstructorEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: allCoursesData } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: kpiData } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => analyticsService.getKpis(),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsersSilent(),
  })

  // Derive data safely (no early return yet)
  const instructorEnrollments = instructorEnrollData?.data?.data || []
  const allCourses = allCoursesData?.data?.data || []
  const courseMap = Object.fromEntries(allCourses.map((c) => [c.courseId, c]))
  const myCourses = instructorEnrollments.map((e) => courseMap[e.courseId]).filter(Boolean)
  const kpis = kpiData?.data?.data || {}
  const allUsers = usersData?.data?.data || []
  const totalStudents = allUsers.length > 0
    ? allUsers.filter(u => u.role === 'STUDENT').length
    : (kpis.totalStudents ?? '—')

  // Fetch assignments for each of instructor's courses (stable hook call, dynamic array OK in useQueries)
  const assignmentQueries = useQueries({
    queries: myCourses.map((c) => ({
      queryKey: ['assignments', c.courseId],
      queryFn: () => assignmentService.getForCourse(c.courseId),
      enabled: !!c.courseId,
    })),
  })

  // Build a flat list of recent assignments (with course name attached)
  const recentAssignments = assignmentQueries
    .flatMap((q, i) => {
      const course = myCourses[i]
      return (q.data?.data?.data || []).map((a) => ({
        ...a,
        courseName: course?.courseName || '',
        courseCode: course?.courseCode || '',
      }))
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)

  // Fetch submissions for each recent assignment to compute class average
  const submissionQueries = useQueries({
    queries: recentAssignments.map((a) => ({
      queryKey: ['submissions', a.assignmentId],
      queryFn: () => assignmentService.getSubmissions(a.assignmentId),
      enabled: !!a.assignmentId,
    })),
  })

  // ── Now safe to do early return ──
  if (isLoading) return <PageLoader />

  // Build enriched recent assessment list
  const recentAssessmentsWithAvg = recentAssignments.map((a, i) => {
    const subs = submissionQueries[i]?.data?.data?.data || []
    const avg = subs.length
      ? Math.round(subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length)
      : null
    return { ...a, submissionCount: subs.length, classAvg: avg }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-glow">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute right-[-30px] top-[-30px] w-48 h-48 rounded-full bg-white" />
          <div className="absolute right-24 bottom-[-20px] w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium flex items-center gap-1.5">
              {(() => { const h = new Date().getHours(); return h < 12 ? <Sun size={14}/> : h < 17 ? <Cloud size={14}/> : <Moon size={14}/> })()} {getGreeting()}
            </p>
            <h2 className="text-3xl font-bold mt-0.5">Prof. {user?.firstName} {user?.lastName}</h2>
            <p className="text-white/70 text-sm mt-2">
              You are teaching <strong className="text-white">{myCourses.length}</strong> course{myCourses.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <GraduationCap size={28} className="text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="My Courses"        value={myCourses.length}             icon={BookOpen}      colorIndex={1} />
        <StatCard label="Total Students"    value={totalStudents}                icon={Users}         colorIndex={0} />
        <StatCard label="Assignments"       value={kpis.totalAssignments ?? '—'} icon={ClipboardList} colorIndex={2} />
        <StatCard label="Platform Courses"  value={kpis.totalCourses ?? '—'}     icon={TrendingUp}    colorIndex={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* My courses list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">My Assigned Courses</h3>
            <button
              onClick={() => navigate('/instructor/courses')}
              className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {myCourses.slice(0, 6).map((c) => (
              <div
                key={c.courseId}
                onClick={() => navigate(`/instructor/courses/${c.courseId}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.courseName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.courseCode}</p>
                </div>
                <ArrowRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
              </div>
            ))}
            {myCourses.length === 0 && (
              <div className="text-center py-10">
                <BookOpen size={36} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses assigned yet.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Contact your coordinator to be enrolled in a course.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent assessments with class averages */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-emerald-500" />
            <h3 className="section-title">Recent Assessments</h3>
          </div>
          {recentAssessmentsWithAvg.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={36} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No assessments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssessmentsWithAvg.map((a) => (
                <div
                  key={a.assignmentId}
                  onClick={() => navigate(`/instructor/assignments/${a.assignmentId}/submissions`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {a.title || 'Untitled Assessment'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {a.courseName} · {a.submissionCount} submission{a.submissionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {a.classAvg !== null ? (
                      <span className={clsx('badge text-xs px-2 py-0.5', scoreBg(a.classAvg))}>
                        {a.classAvg}%
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No submissions</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
