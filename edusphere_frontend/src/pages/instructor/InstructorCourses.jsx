import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { courseService } from '../../services/courseService'
import { enrollmentService } from '../../services/enrollmentService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { BookOpen, ArrowRight, Users, ClipboardList, GraduationCap, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/helpers'
import clsx from 'clsx'

export default function InstructorCourses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('my')
  const [search, setSearch] = useState('')

  const { data: enrollData, isLoading: loadEnroll } = useQuery({
    queryKey: ['instructor-enrollments', user?.userId],
    queryFn: () => enrollmentService.getInstructorEnrollments(user.userId),
    enabled: !!user?.userId,
  })

  const { data: allCoursesData, isLoading: loadAll } = useQuery({
    queryKey: ['all-courses'],
    queryFn: () => courseService.getAll(),
  })

  if (loadEnroll || loadAll) return <PageLoader />

  const enrollments = enrollData?.data?.data || []
  const allCourses = allCoursesData?.data?.data || []

  const myEnrolledIds = new Set(enrollments.map((e) => e.courseId))

  const myCourses = allCourses.filter((c) => myEnrolledIds.has(c.courseId))
  const displayCourses = tab === 'my' ? myCourses : allCourses

  const filtered = displayCourses.filter(
    (c) =>
      !search ||
      c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCourseClick = (courseId) => {
    if (myEnrolledIds.has(courseId)) navigate(`/instructor/courses/${courseId}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Browse all platform courses or view courses assigned to you
      </p>

      {/* Tab bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="tab-bar">
          <button
            className={clsx('tab-btn', tab === 'my' && 'active')}
            onClick={() => setTab('my')}
          >
            <GraduationCap size={15} />
            My Courses
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              {myCourses.length}
            </span>
          </button>
          <button
            className={clsx('tab-btn', tab === 'all' && 'active')}
            onClick={() => setTab('all')}
          >
            <BookOpen size={15} />
            All Courses
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>
              {allCourses.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-9 py-1.5 text-sm w-56"
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          {tab === 'my' ? (
            <>
              <p className="text-base font-medium">You are not assigned to any courses yet.</p>
              <p className="text-sm mt-1">Contact your coordinator to be enrolled in a course.</p>
            </>
          ) : (
            <p className="text-base font-medium">No courses found{search ? ' matching your search' : ''}.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const isMine = myEnrolledIds.has(course.courseId)
            return (
              <div
                key={course.courseId}
                onClick={() => handleCourseClick(course.courseId)}
                className={clsx(
                  'card transition-all group border border-transparent',
                  isMine
                    ? 'hover:shadow-md cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800'
                    : 'opacity-75 cursor-default'
                )}
              >
                <div className={clsx(
                  'h-1.5 -mx-6 -mt-6 mb-5 rounded-t-2xl',
                  isMine
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-r from-slate-300 to-slate-400'
                )} />
                <div className="flex items-start gap-3 mb-3">
                  <div className={clsx(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    isMine ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'
                  )}>
                    <BookOpen size={20} className={isMine ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {course.courseName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isMine ? 'green' : 'slate'}>{course.courseCode}</Badge>
                      {isMine && <Badge variant="emerald" className="text-xs">Assigned</Badge>}
                    </div>
                  </div>
                  {isMine && (
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" />
                  )}
                </div>

                {course.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{course.description}</p>
                )}

                {isMine && (
                  <div className="flex items-center gap-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Users size={12} /> View Enrollments</span>
                    <span className="flex items-center gap-1"><ClipboardList size={12} /> Manage Assignments</span>
                  </div>
                )}

                {!isMine && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not assigned to this course</p>
                  </div>
                )}

                {course.completionDeadline && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Deadline: {formatDate(course.completionDeadline)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
