import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import ProgressBar from '../common/ProgressBar'
import clsx from 'clsx'

const CARD_COLORS = [
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-cyan-500',
]

export default function CourseCard({ course, progress, navigateTo, index = 0 }) {
  const navigate = useNavigate()
  const gradient = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <div
      className="card hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col gap-4"
      onClick={() => navigate(navigateTo)}
    >
      {/* Color strip + icon */}
      <div className={clsx('h-2 -mx-6 -mt-6 rounded-t-2xl bg-gradient-to-r', gradient)} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0', gradient)}>
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{course.courseName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{course.courseCode}</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
      </div>

      {progress !== undefined && (
        <ProgressBar value={progress} showLabel size="sm" />
      )}

      {course.description && (
        <p className="text-xs text-slate-400 line-clamp-2 -mt-1">{course.description}</p>
      )}
    </div>
  )
}
