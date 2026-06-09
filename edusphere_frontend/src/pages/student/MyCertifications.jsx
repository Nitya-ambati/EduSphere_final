import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { enrollmentService } from '../../services/enrollmentService'
import { courseService } from '../../services/courseService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Award, BookOpen, Calendar, CheckCircle, Download } from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function MyCertifications() {
  const { user } = useAuth()

  const { data: enrollData, isLoading } = useQuery({
    queryKey: ['student-enrollments', user?.userId],
    queryFn: () => enrollmentService.getStudentEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: allCoursesData } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  const enrollments = enrollData?.data?.data || []

  // Fetch progress for every enrolled course
  const { data: progressRes, isLoading: loadingProgress } = useQuery({
    queryKey: ['student-course-progress-all-certs', user?.userId],
    queryFn: async () => {
      if (enrollments.length === 0) return []
      const results = await Promise.allSettled(
        enrollments.map((e) => courseService.getCourseProgress(e.courseId))
      )
      return results.map((r, i) => ({
        courseId: enrollments[i]?.courseId,
        progress: r.status === 'fulfilled'
          ? (r.value?.data?.data?.progressPercentage ?? 0)
          : 0,
      }))
    },
    enabled: enrollments.length > 0,
  })

  if (isLoading || loadingProgress) return <PageLoader />

  const allCourses = allCoursesData?.data?.data || []
  const courseMap = Object.fromEntries(allCourses.map((c) => [c.courseId, c]))

  // Build a progress lookup map
  const progressMap = Object.fromEntries(
    (progressRes || []).map((p) => [p.courseId, Math.round(p.progress)])
  )

  // A course is "completed" if:
  //  - enrollment status is explicitly COMPLETED (after backend restart), OR
  //  - course progress is 100%
  const completed = enrollments.filter(
    (e) => e.status === 'COMPLETED' || (progressMap[e.courseId] ?? 0) >= 100
  )

  const generateCertificate = (enrollment) => {
    const course = courseMap[enrollment.courseId]
    const courseName = course?.courseName || `Course ${enrollment.courseId?.slice(0, 8)}`
    const studentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    const completedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Certificate — ${courseName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:ital,wght@0,400;0,700;1,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f0e8; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Lato', sans-serif; }
    .cert { width: 860px; background: #fff; border: 14px solid #c9a84c; padding: 55px 70px; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.18); position: relative; }
    .cert::before { content: ''; position: absolute; inset: 8px; border: 2px solid #c9a84c; pointer-events: none; }
    .logo { font-size: 20px; font-weight: 700; color: #6c3fc1; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
    .org-sub { font-size: 12px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    .seal { font-size: 52px; margin-bottom: 12px; }
    .cert-title { font-family: 'Cinzel', serif; font-size: 38px; color: #2a2a2a; margin-bottom: 6px; }
    .cert-sub { font-size: 14px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 28px; }
    .student-name { font-family: 'Cinzel', serif; font-size: 36px; color: #c9a84c; margin: 4px 0 28px; padding-bottom: 10px; border-bottom: 2px solid #e8d5a0; display: inline-block; }
    .completed-text { font-size: 15px; color: #666; margin-bottom: 14px; }
    .course-name { font-size: 26px; font-weight: 700; color: #2a2a2a; margin-bottom: 6px; }
    .course-code { font-size: 13px; color: #999; letter-spacing: 1px; margin-bottom: 30px; }
    .divider { width: 80px; height: 2px; background: #c9a84c; margin: 0 auto 28px; }
    .description { font-size: 14px; color: #777; line-height: 1.8; max-width: 520px; margin: 0 auto 32px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 28px; border-top: 1px solid #e8d5a0; }
    .footer-item { text-align: center; }
    .footer-label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .footer-value { font-size: 13px; color: #555; font-weight: 700; }
    @media print { body { background: #fff; } .cert { box-shadow: none; } }
  </style>
</head>
<body>
<div class="cert">
  <div class="logo">🎓 EduSphere</div>
  <div class="org-sub">Learning Platform</div>
  <div class="seal">🏆</div>
  <div class="cert-title">Certificate of Completion</div>
  <div class="cert-sub">This is proudly presented to</div>
  <div class="student-name">${studentName}</div>
  <div class="completed-text">for successfully completing the course</div>
  <div class="course-name">${courseName}</div>
  ${course?.courseCode ? `<div class="course-code">Course Code: ${course.courseCode}${course?.duration ? ' &nbsp;·&nbsp; Duration: ' + course.duration : ''}</div>` : ''}
  <div class="divider"></div>
  <div class="description">
    This certificate acknowledges the dedication and commitment demonstrated<br/>
    in completing all course requirements on the EduSphere Learning Platform.
  </div>
  <div class="footer">
    <div class="footer-item">
      <div class="footer-value">${completedDate}</div>
      <div class="footer-label">Date of Completion</div>
    </div>
    <div class="footer-item">
      <div style="font-size:36px;">✦</div>
    </div>
    <div class="footer-item">
      <div class="footer-value">EduSphere</div>
      <div class="footer-label">Authorized By</div>
    </div>
  </div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (!w) toast.error('Allow pop-ups to view your certificate')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-6 text-white shadow-glow">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute right-[-30px] top-[-30px] w-48 h-48 rounded-full bg-white" />
          <div className="absolute right-24 bottom-[-20px] w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Your achievements</p>
            <h2 className="text-3xl font-bold mt-0.5">My Certifications</h2>
            <p className="text-white/70 text-sm mt-2">
              {completed.length} certificate{completed.length !== 1 ? 's' : ''} earned
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Award size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
            <Award size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{completed.length}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Certificates Earned</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{enrollments.length}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Total Enrollments</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {Math.max(0, enrollments.length - completed.length)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>In Progress</p>
        </div>
      </div>

      {/* Certificates grid */}
      {completed.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <Award size={56} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No certificates yet</p>
          <p className="text-sm mt-2">Complete all content items in an enrolled course to earn your certificate!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((enrollment) => {
            const course = courseMap[enrollment.courseId]
            const progress = progressMap[enrollment.courseId] ?? 100
            return (
              <div
                key={enrollment.enrollmentId}
                className="card group hover:shadow-md transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
              >
                {/* Gold accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 -mx-6 -mt-6 mb-5 rounded-t-2xl" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Award size={24} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={11} />
                    {progress}% Complete
                  </span>
                </div>

                {/* Course info */}
                <h3 className="font-bold text-base mb-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {course?.courseName || `Course ${enrollment.courseId?.slice(0, 8)}`}
                </h3>
                {course?.courseCode && (
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                    {course.courseCode}
                    {course?.duration && <span className="ml-2">· ⏱ {course.duration}</span>}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Enrolled {enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '—'}
                  </span>
                </div>

                {/* View Certificate */}
                <button
                  type="button"
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                  onClick={() => generateCertificate(enrollment)}
                >
                  <Download size={14} />
                  View / Print Certificate
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
