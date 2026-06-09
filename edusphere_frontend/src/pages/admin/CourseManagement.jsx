import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import { Search, Plus, Trash2, Edit2, BookOpen, RotateCcw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const emptyCourse = { courseName: '', courseCode: '', description: '', duration: '' }

const COURSE_CODE_REGEX = /^[A-Z]{2,6}-\d{3,4}$/

function validateCourse(form) {
  const errors = {}
  if (!form.courseName.trim()) {
    errors.courseName = 'Course name is required'
  } else if (form.courseName.trim().length < 3) {
    errors.courseName = 'Course name must be at least 3 characters'
  } else if (form.courseName.trim().length > 100) {
    errors.courseName = 'Course name must be under 100 characters'
  }
  if (!form.courseCode.trim()) {
    errors.courseCode = 'Course code is required'
  } else if (!COURSE_CODE_REGEX.test(form.courseCode.trim().toUpperCase())) {
    errors.courseCode = 'Format: XX-123 (e.g. CS-301, JAVA-101)'
  }
  if (form.description && form.description.length > 500) {
    errors.description = 'Description must be under 500 characters'
  }
  return errors
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
      <AlertCircle size={11} /> {msg}
    </p>
  )
}

function CourseForm({ value, onChange, errors = {} }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Course Name *</label>
        <input
          value={value.courseName}
          onChange={(e) => onChange({ ...value, courseName: e.target.value })}
          placeholder="Advanced Java Programming"
          className={clsx('input', errors.courseName && 'border-rose-300 focus:ring-rose-300')}
        />
        <FieldError msg={errors.courseName} />
      </div>
      <div>
        <label className="label">Course Code *</label>
        <input
          value={value.courseCode}
          onChange={(e) => onChange({ ...value, courseCode: e.target.value.toUpperCase() })}
          placeholder="CS-301"
          className={clsx('input font-mono', errors.courseCode && 'border-rose-300 focus:ring-rose-300')}
        />
        <FieldError msg={errors.courseCode} />
        <p className="text-xs text-slate-400 mt-1">Format: 2-6 letters, dash, 3-4 digits (e.g. CS-301)</p>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
          placeholder="Brief course description…"
          className={clsx('input resize-none', errors.description && 'border-rose-300 focus:ring-rose-300')}
        />
        <div className="flex justify-between mt-1">
          <FieldError msg={errors.description} />
          <p className="text-xs text-slate-400 ml-auto">{value.description?.length ?? 0}/500</p>
        </div>
      </div>
      <div>
        <label className="label">Duration <span style={{ color: 'var(--text-muted)' }} className="font-normal">(optional)</span></label>
        <input
          value={value.duration}
          onChange={(e) => onChange({ ...value, duration: e.target.value })}
          placeholder="e.g. 20 hours, 6 weeks, 3 months"
          className="input"
        />
        <p className="text-xs text-slate-400 mt-1">Free-text — describe how long the course takes</p>
      </div>
    </div>
  )
}

export default function AdminCourseManagement() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('active')
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [restoreConfirm, setRestoreConfirm] = useState(null)
  const [form, setForm] = useState(emptyCourse)
  const [formErrors, setFormErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  })

  const { data: deletedData, isLoading: loadingDeleted } = useQuery({
    queryKey: ['deleted-courses'],
    queryFn: () => courseService.getDeleted(),
    enabled: tab === 'deleted',
  })

  const createMutation = useMutation({
    mutationFn: (data) => courseService.create(data),
    onSuccess: () => {
      toast.success('Course created!')
      setCreateModal(false)
      setForm(emptyCourse)
      setFormErrors({})
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create course'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => courseService.update(id, data),
    onSuccess: () => {
      toast.success('Course updated!')
      setEditModal(null)
      setFormErrors({})
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update course'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => courseService.delete(id),
    onSuccess: () => {
      toast.success('Course deleted')
      setDeleteConfirm(null)
      qc.invalidateQueries({ queryKey: ['courses'] })
      qc.invalidateQueries({ queryKey: ['deleted-courses'] })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => courseService.restore(id),
    onSuccess: () => {
      toast.success('Course restored!')
      setRestoreConfirm(null)
      qc.invalidateQueries({ queryKey: ['courses'] })
      qc.invalidateQueries({ queryKey: ['deleted-courses'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to restore course'),
  })

  if (isLoading) return <PageLoader />

  const activeCourses = (data?.data?.data || []).filter((c) =>
    c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode?.toLowerCase().includes(search.toLowerCase())
  )

  const deletedCourses = (deletedData?.data?.data || []).filter((c) =>
    c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode?.toLowerCase().includes(search.toLowerCase())
  )

  const displayCourses = tab === 'active' ? activeCourses : deletedCourses

  const handleCreate = () => {
    const errors = validateCourse(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    createMutation.mutate({ ...form, courseCode: form.courseCode.trim().toUpperCase() })
  }

  const handleUpdate = () => {
    const errors = validateCourse(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    updateMutation.mutate({ id: editModal?.courseId, data: { ...form, courseCode: form.courseCode.trim().toUpperCase() } })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-slate-500 text-sm">
            {tab === 'active' ? `${activeCourses.length} active courses` : `${deletedCourses.length} deleted courses`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="input pl-9"
            />
          </div>
          {tab === 'active' && (
            <button onClick={() => { setForm(emptyCourse); setFormErrors({}); setCreateModal(true) }} className="btn-primary">
              <Plus size={16} /> New Course
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'active',  label: `Active (${activeCourses.length})` },
          { key: 'deleted', label: `Deleted` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'deleted' && loadingDeleted ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCourses.map((c) => (
            <div key={c.courseId} className={clsx('card hover:shadow-soft transition-shadow group', tab === 'deleted' && 'opacity-75')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', tab === 'deleted' ? 'bg-slate-100' : 'bg-primary-100')}>
                    <BookOpen size={18} className={tab === 'deleted' ? 'text-slate-400' : 'text-primary-600'} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{c.courseName}</p>
                    <Badge variant={tab === 'deleted' ? 'slate' : 'purple'} className="mt-0.5">{c.courseCode}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tab === 'active' ? (
                    <>
                      <button
                        onClick={() => {
                          setEditModal(c)
                          setFormErrors({})
                          setForm({ courseName: c.courseName, courseCode: c.courseCode, description: c.description || '', duration: c.duration || '' })
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setRestoreConfirm(c)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'No description provided.'}</p>
              {c.duration && (
                <p className="text-xs font-medium mt-1.5 text-primary-600 dark:text-primary-400">⏱ Duration: {c.duration}</p>
              )}
              {tab === 'deleted' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setRestoreConfirm(c)}
                    className="btn-secondary text-xs w-full flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={13} /> Restore Course
                  </button>
                </div>
              )}
            </div>
          ))}
          {displayCourses.length === 0 && (
            <div className="col-span-full card text-center py-16 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
              <p>{tab === 'deleted' ? 'No deleted courses' : 'No courses found'}</p>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setFormErrors({}) }} title="Create New Course" size="lg">
        <div className="space-y-4">
          <CourseForm value={form} onChange={setForm} errors={formErrors} />
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setCreateModal(false); setFormErrors({}) }} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setFormErrors({}) }} title="Edit Course" size="lg">
        <div className="space-y-4">
          <CourseForm value={form} onChange={setForm} errors={formErrors} />
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setEditModal(null); setFormErrors({}) }} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="btn-primary flex-1"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Course" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl p-4">
            <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-600 text-sm">
              Delete <strong>{deleteConfirm?.courseName}</strong>? The course will be moved to the deleted tab and can be restored later.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm?.courseId)}
              disabled={deleteMutation.isPending}
              className="btn-danger flex-1"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore confirm */}
      <Modal open={!!restoreConfirm} onClose={() => setRestoreConfirm(null)} title="Restore Course" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Restore <strong>{restoreConfirm?.courseName}</strong>? It will become available again for enrollments.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setRestoreConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => restoreMutation.mutate(restoreConfirm?.courseId)}
              disabled={restoreMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} /> {restoreMutation.isPending ? 'Restoring…' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
