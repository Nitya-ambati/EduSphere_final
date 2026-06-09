import { useQuery, useQueries } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { analyticsService } from '../../services/analyticsService'
import { assignmentService } from '../../services/assignmentService'
import { enrollmentService } from '../../services/enrollmentService'
import { courseService } from '../../services/courseService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import StatCard from '../../components/dashboard/StatCard'
import ProgressBar from '../../components/common/ProgressBar'
import { scoreBg, formatDateTime } from '../../utils/helpers'
import { Trophy, Target, BookOpen, ClipboardCheck } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import clsx from 'clsx'

export default function MyProgress() {
  const { user } = useAuth()

  const { data: analyticsData, isLoading: loadAnalytics } = useQuery({
    queryKey: ['analytics-student', user?.userId],
    queryFn: () => analyticsService.getStudentProgress(user.userId),
    enabled: !!user?.userId,
  })

  const { data: subData, isLoading: loadSub } = useQuery({
    queryKey: ['student-assignment-progress', user?.userId],
    queryFn: () => assignmentService.getStudentProgress(user.userId),
    enabled: !!user?.userId,
  })

  const { data: enrollData } = useQuery({
    queryKey: ['student-enrollments', user?.userId],
    queryFn: () => enrollmentService.getStudentEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: coursesData } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const enrollments = enrollData?.data?.data || []
  const allCourses = coursesData?.data?.data || []

  // Fetch real course progress for each enrollment
  const progressQueries = useQueries({
    queries: enrollments.map((e) => ({
      queryKey: ['course-progress', e.courseId],
      queryFn: () => courseService.getCourseProgress(e.courseId),
      enabled: !!e.courseId,
      staleTime: 2 * 60 * 1000,
    })),
  })

  if (loadAnalytics || loadSub) return <PageLoader />

  const analyticsItems = analyticsData?.data?.data || []
  const subStats = subData?.data?.data || {}
  const courseMap = Object.fromEntries(allCourses.map((c) => [c.courseId, c]))

  const avgScore = subStats.averageScore ?? 0
  const submittedAssignments = subStats.submittedAssignments ?? 0
  const bestScore = subStats.bestScore ?? 0
  const recentSubmissions = subStats.submissions || []

  // Activity chart: last 8 analytics events that have scores
  const chartData = analyticsItems
    .filter((p) => p.score != null)
    .slice(-8)
    .map((p, i) => ({
      name: `Sub ${i + 1}`,
      score: Math.round(p.score ?? 0),
    }))

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-slate-500 text-sm">Track your learning journey and performance</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Avg. Score"       value={`${Math.round(avgScore)}%`}  icon={Target}        colorIndex={0} />
        <StatCard label="Enrolled Courses" value={enrollments.length}           icon={BookOpen}      colorIndex={1} />
        <StatCard label="Submissions"      value={submittedAssignments}         icon={ClipboardCheck} colorIndex={2} />
        <StatCard label="Best Score"       value={`${Math.round(bestScore)}%`} icon={Trophy}        colorIndex={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Activity progress chart */}
        <div className="card">
          <h3 className="section-title mb-5">Activity Progress</h3>
          {chartData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No submission data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="score" name="Score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent submissions */}
        <div className="card">
          <h3 className="section-title mb-4">Recent Submissions</h3>
          {recentSubmissions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.slice(0, 6).map((s, i) => (
                <div key={s.submissionId ?? i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Assignment submission
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(s.submittedAt)}</p>
                  </div>
                  <span className={clsx('badge text-sm px-3 py-1', scoreBg(s.score ?? 0))}>
                    {Math.round(s.score ?? 0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course completion overview with real progress */}
      {enrollments.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-4">Course Completion Overview</h3>
          <div className="space-y-4">
            {enrollments.map((e, i) => {
              const course = courseMap[e.courseId]
              const progressPct = Math.min(100, progressQueries[i]?.data?.data?.data?.progressPercentage ?? 0)
              return (
                <div key={e.enrollmentId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {course?.courseName || `Course ${i + 1}`}
                    </span>
                    <span className="text-xs font-semibold text-primary-600">
                      {Math.round(progressPct)}%
                    </span>
                  </div>
                  <ProgressBar value={Math.round(progressPct)} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
