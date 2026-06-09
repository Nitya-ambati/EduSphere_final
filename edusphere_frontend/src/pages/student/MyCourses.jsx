import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { useAuth } from '../../context/AuthContext'
import CourseCard from '../../components/dashboard/CourseCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Search, BookOpen, Send, CheckCircle2, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function MyCourses() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('enrolled')

  const { data: allCoursesRes, isLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: enrollRes } = useQuery({
    queryKey: ['student-enrollments', user?.userId],
    queryFn: () => enrollmentService.getStudentEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: pendingRes } = useQuery({
    queryKey: ['student-pending-requests', user?.userId],
    queryFn: () => enrollmentService.getStudentPendingRequests(user.userId),
    enabled: !!user?.userId,
  })

  // Fetch progress for each enrolled course to determine completed ones
  const { data: progressRes } = useQuery({
    queryKey: ['student-course-progress-all', user?.userId],
    queryFn: async () => {
      const enrollments = enrollRes?.data?.data || []
      if (enrollments.length === 0) return []
      const results = await Promise.allSettled(
        enrollments.map((e) => courseService.getCourseProgress(e.courseId))
      )
      return results.map((r, i) => ({
        courseId: enrollments[i]?.courseId,
        progress: r.status === 'fulfilled' ? (r.value?.data?.data?.progressPercentage ?? 0) : 0,
      }))
    },
    enabled: !!enrollRes,
  })

  const requestMutation = useMutation({
    mutationFn: (courseId) => enrollmentService.requestEnrollment(courseId),
    onSuccess: () => {
      toast.success('Enrollment request sent! Awaiting coordinator approval.')
      qc.invalidateQueries({ queryKey: ['student-enrollments', user?.userId] })
      qc.invalidateQueries({ queryKey: ['student-pending-requests', user?.userId] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Request failed')
    },
  })

  if (isLoading) return <PageLoader />

  const allCourses = allCoursesRes?.data?.data || []
  const myEnrollments = enrollRes?.data?.data || []
  const pendingEnrollments = pendingRes?.data?.data || []
  // Separate active enrollments from rejected ones
  const activeEnrollments = myEnrollments.filter((e) => e.status !== 'REJECTED')
  const rejectedCourseIds = new Set(
    myEnrollments.filter((e) => e.status === 'REJECTED').map((e) => e.courseId)
  )
  const enrolledCourseIds = new Set(activeEnrollments.map((e) => e.courseId))
  const requestedCourseIds = new Set(pendingEnrollments.map((e) => e.courseId))

  const progressMap = Object.fromEntries(
    (progressRes || []).map((p) => [p.courseId, Math.min(100, Math.round(p.progress))])
  )

  const completedCourseIds = new Set(
    Object.entries(progressMap)
      .filter(([, pct]) => pct >= 100)
      .map(([id]) => id)
  )

  const searchFilter = (c) =>
    c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode?.toLowerCase().includes(search.toLowerCase())

  const enrolledCourses = allCourses.filter((c) => enrolledCourseIds.has(c.courseId) && searchFilter(c))
  const completedCourses = enrolledCourses.filter((c) => completedCourseIds.has(c.courseId))
  const browseCourses = allCourses.filter(searchFilter)

  const displayCourses =
    tab === 'enrolled'   ? enrolledCourses :
    tab === 'completed'  ? completedCourses :
    browseCourses

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{allCourses.length} courses on the platform</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Enrollment request info */}
      {tab === 'enrolled' && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 border"
          style={{
            background: 'linear-gradient(to right, rgba(139,92,246,0.1), rgba(168,85,247,0.08))',
            borderColor: 'rgba(139,92,246,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}
            >
              <Send size={18} className="text-primary-500" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Want to join a new course?</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Browse the catalog and send an enrollment request to your coordinator.</p>
            </div>
          </div>
          <button onClick={() => setTab('browse')} className="btn-primary flex-shrink-0 text-sm">
            Browse &amp; Request
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar flex-wrap">
        {[
          { key: 'enrolled',  label: `Enrolled (${enrolledCourseIds.size})`,   icon: BookOpen },
          { key: 'completed', label: `Completed (${completedCourseIds.size})`, icon: CheckCircle2 },
          { key: 'browse',    label: 'Browse All',                              icon: Send },
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

      {tab === 'browse' && (
        <div
          className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 border"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderColor: 'rgba(59,130,246,0.25)',
          }}
        >
          <Clock size={16} className="text-blue-400 flex-shrink-0" />
          <span>Click <strong style={{ color: 'var(--text-primary)' }}>Request Enrollment</strong> to send a request. Your coordinator will review and approve it.</span>
        </div>
      )}

      {tab === 'completed' && completedCourseIds.size === 0 && (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-base font-medium">No completed courses yet.</p>
          <p className="text-sm mt-1">Complete all content items in an enrolled course to mark it as complete.</p>
        </div>
      )}

      {displayCourses.length === 0 && tab !== 'completed' ? (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-base font-medium">
            {tab === 'enrolled' ? 'You are not enrolled in any courses yet.' : 'No courses found.'}
          </p>
          {tab === 'enrolled' && (
            <button onClick={() => setTab('browse')} className="btn-primary mt-4 mx-auto">
              Browse &amp; Request Enrollment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCourses.map((c, i) => (
            <div key={c.courseId} className="relative">
              <CourseCard course={c} index={i} navigateTo={`/student/courses/${c.courseId}`} />

              {tab === 'completed' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg shadow font-medium">
                  <CheckCircle2 size={12} /> 100%
                </div>
              )}

              {tab === 'browse' && enrolledCourseIds.has(c.courseId) && (
                <span className="absolute top-4 right-4 bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg shadow flex items-center gap-1">
                  <CheckCircle2 size={11} /> Enrolled
                </span>
              )}
              {tab === 'browse' && !enrolledCourseIds.has(c.courseId) && requestedCourseIds.has(c.courseId) && (
                <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2 py-1 rounded-lg shadow flex items-center gap-1">
                  <Clock size={11} /> Requested
                </span>
              )}
              {tab === 'browse' && !enrolledCourseIds.has(c.courseId) && !requestedCourseIds.has(c.courseId) && rejectedCourseIds.has(c.courseId) && (
                <span className="absolute top-4 right-4 bg-rose-100 text-rose-700 border border-rose-200 text-xs px-2 py-1 rounded-lg shadow flex items-center gap-1">
                  <XCircle size={11} /> Rejected
                </span>
              )}
              {tab === 'browse' && !enrolledCourseIds.has(c.courseId) && !requestedCourseIds.has(c.courseId) && !rejectedCourseIds.has(c.courseId) && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    requestMutation.mutate(c.courseId)
                  }}
                  disabled={requestMutation.isPending}
                  className="absolute top-4 right-4 btn-primary text-xs py-1.5 px-3 shadow-md flex items-center gap-1"
                >
                  <Send size={11} />
                  {requestMutation.isPending ? '…' : 'Request'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
