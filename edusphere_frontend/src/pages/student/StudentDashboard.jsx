import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { enrollmentService } from '../../services/enrollmentService'
import { assignmentService } from '../../services/assignmentService'
import { analyticsService } from '../../services/analyticsService'
import StatCard from '../../components/dashboard/StatCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { BookOpen, ClipboardList, Trophy, TrendingUp, Flame, ArrowRight, Sun, Moon, Cloud, Award } from 'lucide-react'
import { scoreBg, getGreeting } from '../../utils/helpers'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

function ScoreRing({ score }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e'
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{score}%</span>
        <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Overall</span>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: enrollData, isLoading: loadEnroll } = useQuery({
    queryKey: ['student-enrollments', user?.userId],
    queryFn: () => enrollmentService.getStudentEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['student-analytics-progress', user?.userId],
    queryFn: () => analyticsService.getStudentProgress(user.userId),
    enabled: !!user?.userId,
  })

  const { data: submissionsData } = useQuery({
    queryKey: ['student-assignment-progress', user?.userId],
    queryFn: () => assignmentService.getStudentProgress(user.userId),
    enabled: !!user?.userId,
  })

  if (loadEnroll) return <PageLoader />

  const enrollments = enrollData?.data?.data || []
  const analytics = analyticsData?.data?.data || []
  const subStats = submissionsData?.data?.data || {}

  const avgScore = subStats.averageScore ?? 0
  const totalAssignments = subStats.totalAssignments ?? 0
  const submittedAssignments = subStats.submittedAssignments ?? 0
  const pending = Math.max(0, totalAssignments - submittedAssignments)
  const streak = user?.streakDays ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personalized welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 p-6 text-white shadow-glow">
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
            <p className="text-white/70 text-sm mt-2">Keep up the great work on your learning journey!</p>
          </div>
          {streak > 0 && (
            <div className="flex-shrink-0 flex flex-col items-center bg-white/20 backdrop-blur rounded-2xl px-4 py-3 gap-1">
              <Flame size={22} className="text-amber-300" />
              <span className="text-2xl font-bold text-white leading-none">{streak}</span>
              <span className="text-white/70 text-xs">day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Enrolled Courses"    value={enrollments.length}          icon={BookOpen}     colorIndex={0} />
        <StatCard label="Assignments Done"    value={submittedAssignments}         icon={Trophy}       colorIndex={1} />
        <StatCard label="Pending"             value={pending}                      icon={ClipboardList} colorIndex={2} />
        <StatCard label="Avg. Score"          value={`${Math.round(avgScore)}%`}   icon={TrendingUp}   colorIndex={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Enrolled courses */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Enrolled Courses</h2>
            <Link to="/student/courses" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>No courses enrolled yet.</p>
              <Link to="/student/courses" className="btn-primary mt-3 inline-flex text-sm">Browse Courses</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enrollments.slice(0, 4).map((e, i) => (
                <Link
                  key={e.enrollmentId}
                  to={`/student/courses/${e.courseId}`}
                  className="card hover:shadow-md transition-shadow flex items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {e.courseName || `Course ${i + 1}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Enrollment</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Score chart — SVG circular progress */}
        <div className="card flex flex-col items-center gap-4">
          <h3 className="section-title self-start">Average Score</h3>
          <ScoreRing score={Math.round(avgScore)} />
          <div className={clsx('badge text-sm px-4 py-1.5', scoreBg(avgScore))}>
            {avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/student/enrollments" className="card flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary-600 transition-colors" style={{ color: 'var(--text-primary)' }}>Enrollments</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active & pending requests</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-primary-500 transition-colors" />
        </Link>

        <Link to="/student/progress" className="card flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-emerald-600 transition-colors" style={{ color: 'var(--text-primary)' }}>My Progress</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Detailed score history</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>

        <Link to="/student/certifications" className="card flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Award size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-amber-600 transition-colors" style={{ color: 'var(--text-primary)' }}>My Certificates</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed course certificates</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-amber-500 transition-colors" />
        </Link>
      </div>

    </div>
  )
}
