import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { assignmentService } from '../../services/assignmentService'
import { userService } from '../../services/userService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import { ArrowLeft, UserCheck, UserX } from 'lucide-react'
import { formatDateTime, scoreBg } from '../../utils/helpers'
import clsx from 'clsx'

export default function Submissions() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => assignmentService.getSubmissions(assignmentId),
  })

  const { data: statusData } = useQuery({
    queryKey: ['attempt-status', assignmentId],
    queryFn: () => assignmentService.getAttemptStatus(assignmentId),
  })

  const submissions = submissionsData?.data?.data || []
  const status = statusData?.data?.data || {}
  // API returns: attempted (list), notAttempted (list of UUIDs), totalAttempted, totalNotAttempted
  const submitted = status.attempted || []
  const notSubmitted = status.notAttempted || []

  // Collect all unique user IDs from both submitted and not-submitted lists
  const allUserIds = [...new Set([
    ...submissions.map((s) => String(s.studentId)),
    ...notSubmitted.map((id) => String(id)),
  ])].filter(Boolean)

  // Fetch user profiles in parallel
  const userProfileQueries = useQueries({
    queries: allUserIds.map((uid) => ({
      queryKey: ['user-profile', uid],
      queryFn: () => userService.getProfile(uid),
      staleTime: 5 * 60 * 1000,
      enabled: allUserIds.length > 0,
    })),
  })

  // Build a map: userId → profile object
  const userMap = userProfileQueries.reduce((acc, q) => {
    const u = q.data?.data?.data
    if (u?.userId) acc[String(u.userId)] = u
    return acc
  }, {})

  const getDisplayName = (uid) => {
    const u = userMap[String(uid)]
    if (!u) return String(uid).slice(0, 12) + '…'
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || String(uid).slice(0, 12)
  }

  const getStudentId = (uid) => {
    const u = userMap[String(uid)]
    return u?.studentOrEmployeeId ?? null
  }

  if (isLoading) return <PageLoader />

  const avgScore = submissions.reduce((acc, s) => acc + (s.score || 0), 0) / (submissions.length || 1)

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} received
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card py-3 px-5 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(avgScore)}%</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Class Average</p>
          </div>
          <div className="card py-3 px-5 text-center">
            <p className="text-2xl font-bold text-emerald-500">{submitted.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Submitted</p>
          </div>
          <div className="card py-3 px-5 text-center">
            <p className="text-2xl font-bold text-rose-500">{notSubmitted.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Not Submitted</p>
          </div>
        </div>
      </div>

      {/* Submissions table */}
      <div className="card overflow-hidden">
        <h3 className="section-title mb-4">Submission Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Student</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Score</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Correct</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Submitted</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const u = userMap[String(s.studentId)]
                const name = getDisplayName(s.studentId)
                const sid = getStudentId(s.studentId)
                return (
                  <tr
                    key={s.submissionId}
                    className="border-b transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                          {u
                            ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`
                            : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {name}
                          </p>
                          {sid && (
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                              {sid}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx('badge', scoreBg(s.score))}>{Math.round(s.score ?? 0)}%</span>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                      {s.correctAnswers}/{s.totalQuestions}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(s.submittedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'SUBMITTED' ? 'green' : s.status === 'AUTO_TIMED_OUT' ? 'rose' : 'amber'}>
                        {s.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Not submitted */}
      {notSubmitted.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-3 flex items-center gap-2">
            <UserX size={18} className="text-rose-400" />
            Not Submitted ({notSubmitted.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {notSubmitted.map((uid) => {
              const u = userMap[String(uid)]
              const name = getDisplayName(uid)
              const sid = getStudentId(uid)
              return (
                <div
                  key={uid}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: 'rgba(244,63,94,0.07)',
                    borderColor: 'rgba(244,63,94,0.2)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', fontSize: '9px' }}
                  >
                    {u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}` : '?'}
                  </div>
                  <span className="font-medium text-rose-500">{name}</span>
                  {sid && (
                    <span className="font-mono text-rose-400 opacity-75">{sid}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
