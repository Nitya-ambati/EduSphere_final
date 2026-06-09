import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { assignmentService } from '../../services/assignmentService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import ProgressBar from '../../components/common/ProgressBar'
import Badge from '../../components/common/Badge'
import { formatDateTime, isDeadlinePassed, scoreBg } from '../../utils/helpers'
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '../../utils/constants'
import {
  BookOpen, Video, FileText, CheckCircle2,
  ClipboardList, Calendar, Clock, ArrowLeft, ExternalLink, Trophy, ScrollText,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const TABS = ['Content', 'Assignments', 'Submissions', 'Syllabus', 'Info']

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('Content')

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getById(courseId),
  })

  const { data: contentData, isLoading: loadingContent } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: () => courseService.getContent(courseId),
  })

  const { data: progressData } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => courseService.getCourseProgress(courseId),
    silentError: true,
  })

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentService.getForCourse(courseId),
    enabled: tab === 'Assignments' || tab === 'Submissions',
  })

  const { data: myProgressData } = useQuery({
    queryKey: ['student-assignment-progress', user?.userId],
    queryFn: () => assignmentService.getStudentProgress(user.userId),
    enabled: !!user?.userId && tab === 'Submissions',
  })

  const { data: syllabusData } = useQuery({
    queryKey: ['syllabus', courseId],
    queryFn: () => courseService.getSyllabus(courseId),
    enabled: tab === 'Syllabus',
    retry: false,
  })

  const completeMutation = useMutation({
    mutationFn: (contentId) => courseService.markContentComplete(courseId, contentId),
    onSuccess: () => {
      toast.success('Marked as complete!')
      qc.invalidateQueries({ queryKey: ['course-progress', courseId] })
      qc.invalidateQueries({ queryKey: ['course-content', courseId] })
    },
  })

  if (isLoading) return <PageLoader />

  const course = courseData?.data?.data
  const contents = contentData?.data?.data || []
  const progress = Math.min(100, progressData?.data?.data?.progressPercentage ?? 0)
  const completedIds = new Set((progressData?.data?.data?.completedContentIds) || [])
  const assignments = assignmentsData?.data?.data || []
  const allSubmissions = myProgressData?.data?.data?.submissions || []
  // Filter submissions to assignments belonging to this course
  const courseAssignmentIds = new Set(assignments.map((a) => a.assignmentId))
  const mySubmissions = allSubmissions.filter((s) => courseAssignmentIds.has(s.assignmentId))

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(-1)} className="btn-ghost gap-1.5 -ml-2 flex items-center">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary-500 to-purple-500 -mx-6 -mt-6 mb-5" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{course?.courseName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="purple">{course?.courseCode}</Badge>
            </div>
          </div>
        </div>
        {course?.description && (
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{course.description}</p>
        )}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-medium">Course Progress</span>
            <span className="text-xs font-bold text-primary-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={Math.round(progress)} size="md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content tab */}
      {tab === 'Content' && (
        <div className="space-y-3">
          {loadingContent ? <PageLoader /> : contents.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">No content added yet.</div>
          ) : (
            contents.map((item) => {
              const colorClass = CONTENT_TYPE_COLORS[item.contentType] || 'bg-slate-100 text-slate-700'
              const isCompleted = completedIds.has(item.contentId)
              return (
                <div key={item.contentId} className="card flex items-center gap-4 hover:shadow-soft transition-shadow">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm', colorClass)}>
                    {item.contentType === 'VIDEO_LINK' ? <Video size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{CONTENT_TYPE_LABELS[item.contentType]}</p>
                    {item.contentType === 'NOTE' && item.body && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                    )}
                    {item.contentType === 'VIDEO_LINK' && item.filePathOrUrl && (
                      <a
                        href={item.filePathOrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
                      >
                        Open <ExternalLink size={11} />
                      </a>
                    )}
                    {item.contentType === 'PDF' && (
                      <button
                        onClick={() => courseService.openPdfContent(item.courseId, item.contentId)}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
                      >
                        Open PDF <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => completeMutation.mutate(item.contentId)}
                    className={clsx(
                      'p-1.5 rounded-lg transition-colors flex-shrink-0',
                      isCompleted
                        ? 'text-emerald-500 bg-emerald-50'
                        : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-50'
                    )}
                    title={isCompleted ? 'Completed' : 'Mark as complete'}
                  >
                    <CheckCircle2 size={22} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Assignments tab */}
      {tab === 'Assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">No assignments yet.</div>
          ) : (
            assignments.map((a) => {
              const past = isDeadlinePassed(a.submissionDeadline)
              return (
                <div key={a.assignmentId} className="card flex items-center gap-4 hover:shadow-soft transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> Due {formatDateTime(a.submissionDeadline)}
                      </span>
                      {a.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {a.timeLimitMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {past ? <Badge variant="rose">Closed</Badge> : <Badge variant="amber">Open</Badge>}
                    {!past && (
                      <button
                        onClick={() => navigate(`/student/assignments/${a.assignmentId}`)}
                        className="btn-primary text-xs"
                      >
                        Attempt
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Submissions tab */}
      {tab === 'Submissions' && (
        <div className="space-y-3">
          {mySubmissions.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <Trophy size={36} className="mx-auto mb-3 text-slate-200" />
              <p>No submissions yet for this course. Attempt an assignment to see your results here.</p>
            </div>
          ) : (
            mySubmissions.map((s) => {
              const assignment = assignments.find((a) => a.assignmentId === s.assignmentId)
              return (
                <div key={s.submissionId} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Trophy size={18} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">
                      {assignment?.title || 'Assignment'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {formatDateTime(s.submittedAt)}
                      {s.timeTakenSeconds && ` · ${Math.round(s.timeTakenSeconds / 60)} min`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.correctAnswers ?? 0} / {s.totalQuestions ?? 0} correct
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={clsx('badge text-base px-4 py-1.5 font-bold', scoreBg(s.score ?? 0))}>
                      {Math.round(s.score ?? 0)}%
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Syllabus tab */}
      {tab === 'Syllabus' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <ScrollText size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Course Syllabus</p>
              <p className="text-xs text-slate-400">Uploaded by coordinator</p>
            </div>
          </div>
          {syllabusData?.data?.data ? (
            <button
              onClick={() => courseService.openSyllabus(courseId)}
              className="btn-primary flex items-center gap-2"
            >
              <ExternalLink size={15} /> View Syllabus PDF
            </button>
          ) : (
            <p className="text-sm text-slate-400">No syllabus has been uploaded for this course yet.</p>
          )}
        </div>
      )}

      {/* Info tab */}
      {tab === 'Info' && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Course Name', value: course?.courseName },
              { label: 'Course Code', value: course?.courseCode },
              { label: 'Enrollment Deadline', value: course?.enrollmentDeadline || '—' },
              { label: 'Completion Deadline', value: course?.completionDeadline || '—' },
              { label: 'Description', value: course?.description || '—', full: true },
            ].map((r) => (
              <div key={r.label} className={clsx('bg-slate-50 rounded-xl p-4', r.full && 'sm:col-span-2')}>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{r.label}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
