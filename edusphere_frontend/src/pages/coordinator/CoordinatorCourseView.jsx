import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { assignmentService } from '../../services/assignmentService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import {
  ArrowLeft, BookOpen, FileText, ClipboardList, Video, FileBadge,
  ExternalLink, ChevronDown, ChevronUp, HelpCircle, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CONTENT_ICON  = { VIDEO_LINK: Video, PDF: FileBadge, NOTE: FileText }
const CONTENT_COLOR = { VIDEO_LINK: 'text-rose-500', PDF: 'text-primary-500', NOTE: 'text-amber-500' }

export default function CoordinatorCourseView() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [expandedAssignment, setExpandedAssignment] = useState(null)

  /* ── course meta ── */
  const { data: courseRes, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getById(courseId),
  })

  /* ── syllabus (silent – may not exist yet) ── */
  const { data: syllabusRes } = useQuery({
    queryKey: ['syllabus', courseId],
    queryFn: () => courseService.getSyllabus(courseId),
    retry: false,
  })

  /* ── content (silent – coordinator bypass is already in the backend) ── */
  const { data: contentRes, isLoading: loadingContent } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: () =>
      courseService.getContent(courseId).catch(() => ({ data: { data: [] } })),
  })

  /* ── assignments: try dedicated coordinator endpoint first,
        then fall back to the standard route which has X-User-Role bypass ── */
  const {
    data: assignmentsRes,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useQuery({
    queryKey: ['coordinator-assignments', courseId],
    queryFn: async () => {
      try {
        // Dedicated coordinator endpoint — no enrollment check at all
        const res = await assignmentService.getForCourseCoordinator(courseId)
        return res
      } catch {
        // Fallback: standard endpoint — controller has X-User-Role COORDINATOR bypass
        // Uses an inline silent call so the interceptor never toasts on failure
        return await assignmentService.getForCourseSilent(courseId)
      }
    },
    retry: false,
  })

  if (loadingCourse) return <PageLoader />

  const course      = courseRes?.data?.data
  const syllabus    = syllabusRes?.data?.data
  const contents    = contentRes?.data?.data   || []
  const assignments = assignmentsRes?.data?.data || []

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/coordinator/courses')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {course?.courseName ?? 'Course Details'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {course?.courseCode} · View-only supervisor access
          </p>
        </div>
      </div>

      {/* ── Syllabus ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title flex items-center gap-2">
            <FileText size={16} className="text-primary-500" /> Syllabus
          </h3>
          {syllabus && (
            <button
              onClick={() =>
                courseService
                  .openSyllabus(courseId)
                  .catch(() => toast.error('Failed to open syllabus'))
              }
              className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline"
            >
              <ExternalLink size={14} /> Open PDF
            </button>
          )}
        </div>
        {syllabus ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <FileBadge size={20} className="text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {syllabus.fileName || 'Syllabus PDF'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Uploaded{' '}
                {syllabus.uploadedAt
                  ? new Date(syllabus.uploadedAt).toLocaleDateString()
                  : ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            No syllabus uploaded for this course yet.
          </p>
        )}
      </div>

      {/* ── Course Resources ── */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-amber-500" /> Course Resources
        </h3>
        {loadingContent ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </p>
        ) : contents.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No resources uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {contents.map((item) => {
              const Icon      = CONTENT_ICON[item.contentType]  || FileText
              const iconClass = CONTENT_COLOR[item.contentType] || 'text-slate-400'
              return (
                <div
                  key={item.contentId}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className={iconClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={
                        item.contentType === 'VIDEO_LINK'
                          ? 'rose'
                          : item.contentType === 'PDF'
                          ? 'blue'
                          : 'amber'
                      }
                    >
                      {item.contentType}
                    </Badge>
                    {item.contentType === 'VIDEO_LINK' && item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-primary-500 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {item.contentType === 'PDF' && (
                      <button
                        onClick={() =>
                          courseService
                            .openPdfContent(courseId, item.contentId)
                            .catch(() => toast.error('Failed to open file'))
                        }
                        className="text-slate-400 hover:text-primary-500 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Assignments ── */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <ClipboardList size={16} className="text-emerald-500" /> Assignments
        </h3>

        {loadingAssignments ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </p>
        ) : assignmentsError ? (
          /* Both endpoints failed — backend service likely needs a restart */
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Assignments temporarily unavailable
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                The assignment service needs to be restarted to apply the coordinator access update.
                Please restart the <strong>assignment-service</strong> and refresh this page.
              </p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No assignments for this course yet.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.assignmentId}
                className="border rounded-xl overflow-hidden"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  onClick={() =>
                    setExpandedAssignment(
                      expandedAssignment === a.assignmentId ? null : a.assignmentId
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={14} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {a.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {a.questionCount ?? 0} questions · {a.timeLimitMinutes} min
                      </p>
                    </div>
                  </div>
                  {expandedAssignment === a.assignmentId ? (
                    <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>

                {expandedAssignment === a.assignmentId && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    {a.instructions && (
                      <p className="text-sm mt-3 mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {a.instructions}
                      </p>
                    )}
                    <div
                      className="flex flex-wrap gap-3 mt-3 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span>
                        Deadline:{' '}
                        {a.submissionDeadline
                          ? new Date(a.submissionDeadline).toLocaleString()
                          : '—'}
                      </span>
                      <span>Time limit: {a.timeLimitMinutes} min</span>
                      <span>Questions: {a.questionCount ?? 0}</span>
                    </div>
                    <div
                      className="mt-3 pt-3 border-t flex items-center gap-2"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <HelpCircle size={13} className="text-slate-400" />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        View-only — coordinators cannot attempt assignments.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
