import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { assignmentService } from '../../services/assignmentService'
import { userService } from '../../services/userService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '../../utils/constants'
import { ArrowLeft, Plus, Trash2, Video, FileText, Users, ClipboardList, ExternalLink, ScrollText } from 'lucide-react'
import { formatDate, formatDateTime, isDeadlinePassed } from '../../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = ['Content', 'Assignments', 'Syllabus', 'Enrollments']

export default function ManageCourse() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('Content')
  const [addModal, setAddModal] = useState(false)
  const [addPdfModal, setAddPdfModal] = useState(false)
  const [form, setForm] = useState({ contentType: 'VIDEO_LINK', title: '', filePathOrUrl: '', body: '', sequenceNumber: 0 })
  const [pdfForm, setPdfForm] = useState({ title: '', file: null, sequenceNumber: 0 })

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getById(courseId),
  })

  const { data: contentData, isLoading: loadContent } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: () => courseService.getContent(courseId),
  })

  const { data: assignmentsData, isLoading: loadAssignments } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: () => assignmentService.getForCourse(courseId),
    enabled: tab === 'Assignments',
  })

  const { data: enrollData, isLoading: loadEnroll } = useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: () => enrollmentService.getEnrollmentsByCourse(courseId),
    enabled: tab === 'Enrollments',
  })

  const { data: syllabusData } = useQuery({
    queryKey: ['syllabus', courseId],
    queryFn: () => courseService.getSyllabus(courseId),
    enabled: tab === 'Syllabus',
    retry: false,
  })

  const addContent = useMutation({
    mutationFn: (data) => courseService.addContent(courseId, data),
    onSuccess: () => {
      toast.success('Content added!')
      qc.invalidateQueries({ queryKey: ['course-content', courseId] })
      setAddModal(false)
      setForm({ contentType: 'VIDEO_LINK', title: '', filePathOrUrl: '', body: '', sequenceNumber: 0 })
    },
  })

  const uploadPdf = useMutation({
    mutationFn: ({ title, file, sequenceNumber }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title)
      fd.append('sequenceNumber', sequenceNumber)
      return courseService.uploadPdfContent(courseId, fd)
    },
    onSuccess: () => {
      toast.success('PDF uploaded!')
      qc.invalidateQueries({ queryKey: ['course-content', courseId] })
      setAddPdfModal(false)
      setPdfForm({ title: '', file: null, sequenceNumber: 0 })
    },
  })

  const deleteContent = useMutation({
    mutationFn: (contentId) => courseService.deleteContent(courseId, contentId),
    onSuccess: () => {
      toast.success('Content deleted')
      qc.invalidateQueries({ queryKey: ['course-content', courseId] })
    },
  })

  const deleteAssignment = useMutation({
    mutationFn: (assignmentId) => assignmentService.delete(assignmentId),
    onSuccess: () => {
      toast.success('Assignment deleted')
      qc.invalidateQueries({ queryKey: ['course-assignments', courseId] })
    },
  })

  const enrollments = enrollData?.data?.data || []

  // Fetch user profiles for all enrolled users to get name + studentOrEmployeeId
  const uniqueUserIds = [...new Set(enrollments.map((e) => String(e.userId)))]
  const userProfileQueries = useQueries({
    queries: uniqueUserIds.map((uid) => ({
      queryKey: ['user-profile', uid],
      queryFn: () => userService.getProfile(uid),
      staleTime: 5 * 60 * 1000,
      enabled: tab === 'Enrollments',
    })),
  })
  const userMap = userProfileQueries.reduce((acc, q) => {
    const u = q.data?.data?.data
    if (u?.userId) acc[String(u.userId)] = u
    return acc
  }, {})

  if (isLoading) return <PageLoader />

  const course = courseData?.data?.data
  const contents = contentData?.data?.data || []
  const assignments = assignmentsData?.data?.data || []

  const handleAddContent = () => {
    const payload = {
      contentType: form.contentType,
      title: form.title,
      sequenceNumber: form.sequenceNumber,
      ...(form.contentType === 'VIDEO_LINK' ? { filePathOrUrl: form.filePathOrUrl } : { body: form.body }),
    }
    addContent.mutate(payload)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2 flex items-center gap-1">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Course header */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{course?.courseName}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="purple">{course?.courseCode}</Badge>
              {course?.enrollmentDeadline && (
                <span className="text-xs text-slate-400">Enroll by {formatDate(course.enrollmentDeadline)}</span>
              )}
            </div>
            {course?.description && (
              <p className="text-sm text-slate-500 mt-2">{course.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx('tab-btn', tab === t && 'active')}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === 'Content' && (
            <>
              <button onClick={() => setAddPdfModal(true)} className="btn-secondary flex items-center gap-1 text-sm">
                <Plus size={15} /> Upload PDF
              </button>
              <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-1 text-sm">
                <Plus size={15} /> Add Content
              </button>
            </>
          )}
          {tab === 'Assignments' && (
            <button
              onClick={() => navigate(`/instructor/courses/${courseId}/assignments/new`)}
              className="btn-primary flex items-center gap-1 text-sm"
            >
              <Plus size={15} /> New Assignment
            </button>
          )}
        </div>
      </div>

      {/* Content tab */}
      {tab === 'Content' && (
        <div className="space-y-3">
          {loadContent ? <PageLoader /> : contents.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <FileText size={40} className="mx-auto mb-3 text-slate-200" />
              <p>No content yet. Add your first lesson!</p>
            </div>
          ) : (
            contents.map((item) => (
              <div key={item.contentId} className="card flex items-center gap-4 hover:shadow-soft transition-shadow">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm', CONTENT_TYPE_COLORS[item.contentType])}>
                  {item.contentType === 'VIDEO_LINK' ? <Video size={18} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="slate">{CONTENT_TYPE_LABELS[item.contentType]}</Badge>
                    {item.sequenceNumber > 0 && (
                      <span className="text-xs text-slate-400">#{item.sequenceNumber}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {item.contentType === 'VIDEO_LINK' && item.filePathOrUrl && (
                    <a
                      href={item.filePathOrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-primary-50 text-primary-400 hover:text-primary-600 transition-colors"
                      title="Open video link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {item.contentType === 'PDF' && (
                    <button
                      onClick={() => courseService.openPdfContent(item.courseId, item.contentId)}
                      className="p-2 rounded-lg hover:bg-primary-50 text-primary-400 hover:text-primary-600 transition-colors"
                      title="Open PDF"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteContent.mutate(item.contentId)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assignments tab */}
      {tab === 'Assignments' && (
        <div className="space-y-3">
          {loadAssignments ? <PageLoader /> : assignments.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 text-slate-200" />
              <p>No assignments yet. Create one for your students.</p>
            </div>
          ) : (
            assignments.map((a) => (
              <div key={a.assignmentId} className="card flex items-center gap-4 hover:shadow-soft transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">
                      Due: {formatDateTime(a.submissionDeadline)}
                    </span>
                    <span className="text-xs text-slate-400">
                      · {a.timeLimitMinutes} min limit
                    </span>
                    {isDeadlinePassed(a.submissionDeadline) && (
                      <Badge variant="rose">Deadline Passed</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/instructor/assignments/${a.assignmentId}/submissions`)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    View Submissions
                  </button>
                  <button
                    onClick={() => deleteAssignment.mutate(a.assignmentId)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
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

      {/* Enrollments tab */}
      {tab === 'Enrollments' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary-500" />
            <h3 className="section-title">Enrolled Users ({enrollments.length})</h3>
          </div>
          {loadEnroll ? <PageLoader /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Student / Employee</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>ID</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Enrolled</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const u = userMap[String(e.userId)]
                    const name = u ? `${u.firstName} ${u.lastName}` : '…'
                    const empId = u?.studentOrEmployeeId
                    const initials = u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}` : '?'
                    return (
                      <tr key={e.enrollmentId} className="border-b transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${e.userRole === 'STUDENT' ? 'bg-blue-400' : 'bg-emerald-400'}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{name}</p>
                              {u?.email && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {empId ? (
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                              {empId}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={e.userRole === 'STUDENT' ? 'blue' : 'green'}>{e.userRole}</Badge>
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{formatDate(e.enrolledAt)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={e.status === 'ACTIVE' ? 'green' : 'slate'}>{e.status}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center" style={{ color: 'var(--text-muted)' }}>No enrollments yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Content modal (VIDEO_LINK or NOTE) */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Course Content">
        <div className="space-y-4">
          <div>
            <label className="label">Content Type</label>
            <select
              value={form.contentType}
              onChange={(e) => setForm({ ...form, contentType: e.target.value })}
              className="input"
            >
              <option value="VIDEO_LINK">Video Link</option>
              <option value="NOTE">Note / Text</option>
            </select>
          </div>
          <div>
            <label className="label">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Lesson title…"
              className="input"
            />
          </div>
          {form.contentType === 'VIDEO_LINK' ? (
            <div>
              <label className="label">Video URL *</label>
              <input
                value={form.filePathOrUrl}
                onChange={(e) => setForm({ ...form, filePathOrUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=…"
                className="input"
              />
            </div>
          ) : (
            <div>
              <label className="label">Content *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                placeholder="Write your note here…"
                className="input resize-none"
              />
            </div>
          )}
          <div>
            <label className="label">Sequence Number</label>
            <input
              type="number"
              value={form.sequenceNumber}
              onChange={(e) => setForm({ ...form, sequenceNumber: parseInt(e.target.value) || 0 })}
              className="input"
              min={0}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleAddContent}
              disabled={!form.title || addContent.isPending}
              className="btn-primary flex-1"
            >
              {addContent.isPending ? 'Adding…' : 'Add Content'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload PDF modal */}
      <Modal open={addPdfModal} onClose={() => setAddPdfModal(false)} title="Upload PDF Content">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              value={pdfForm.title}
              onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })}
              placeholder="Document title…"
              className="input"
            />
          </div>
          <div>
            <label className="label">PDF File *</label>
            <div className="border-2 border-dashed border-primary-200 rounded-xl p-5 text-center">
              <FileText size={24} className="mx-auto text-primary-300 mb-2" />
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfForm({ ...pdfForm, file: e.target.files[0] })}
                className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium cursor-pointer"
              />
            </div>
            {pdfForm.file && (
              <p className="text-sm text-emerald-600 mt-1.5 font-medium">✓ {pdfForm.file.name}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddPdfModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => uploadPdf.mutate(pdfForm)}
              disabled={!pdfForm.title || !pdfForm.file || uploadPdf.isPending}
              className="btn-primary flex-1"
            >
              {uploadPdf.isPending ? 'Uploading…' : 'Upload PDF'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
