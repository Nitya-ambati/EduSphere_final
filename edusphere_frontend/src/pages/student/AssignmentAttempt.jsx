import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { assignmentService } from '../../services/assignmentService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Clock, ArrowLeft, ArrowRight, Send, Trophy } from 'lucide-react'
import { formatSeconds, scoreBg } from '../../utils/helpers'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// Backend returns optionA, optionB, optionC, optionD — build array + letter map
const getOptions = (q) => [
  { label: 'A', text: q.optionA },
  { label: 'B', text: q.optionB },
  { label: 'C', text: q.optionC },
  { label: 'D', text: q.optionD },
].filter((o) => o.text)

export default function AssignmentAttempt() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})   // { questionId: "A"|"B"|"C"|"D" }
  const [timeLeft, setTimeLeft] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  // Guard against double-submit from timer auto-submit racing with manual submit
  const submittingRef = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getById(assignmentId),
  })

  const submitMutation = useMutation({
    mutationFn: (payload) => assignmentService.submit(assignmentId, payload),
    onSuccess: (res) => {
      clearInterval(timerRef.current)
      submittingRef.current = false
      const resultData = res.data?.data
      setResult(resultData)
      setSubmitted(true)
      toast.success('Quiz submitted! Good job!')
      // Invalidate course progress so it refreshes
      const courseId = assignment?.courseId
      if (courseId) {
        qc.invalidateQueries({ queryKey: ['course-progress', courseId] })
        qc.invalidateQueries({ queryKey: ['student-course-progress-all'] })
      }
      qc.invalidateQueries({ queryKey: ['student-assignment-progress'] })
    },
    onError: (err) => {
      submittingRef.current = false
      if (err?.response?.status === 409) {
        toast.error('You have already submitted this assignment')
      } else {
        toast.error('Failed to submit')
      }
    },
  })

  const assignment = data?.data?.data
  const questions = assignment?.questions || []

  const isAttemptActive = !submitted && questions.length > 0

  // Block in-app navigation while assignment is active
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isAttemptActive && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Warning: Leaving this page will stop your assignment attempt without submitting. Are you sure you want to leave?')) {
        clearInterval(timerRef.current)
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  // Block browser tab close / page refresh while active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAttemptActive) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAttemptActive])

  useEffect(() => {
    if (assignment?.timeLimitMinutes && !submitted) {
      const secs = assignment.timeLimitMinutes * 60
      setTimeLeft(secs)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current)
            handleSubmit(true)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [assignment])

  const handleSubmit = (auto = false) => {
    // Prevent double-submit: timer auto-submit can race with manual click
    if (submittingRef.current) return
    if (!auto && Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions before submitting')
      return
    }
    submittingRef.current = true
    // selectedOption must be "A", "B", "C", or "D" — stored that way already
    const answerList = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }))
    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
    submitMutation.mutate({ answers: answerList, timeTakenSeconds })
  }

  if (isLoading) return <PageLoader />
  if (!assignment) return <div className="card text-center py-12 text-slate-400">Assignment not found</div>

  // Show result screen only after submitting in this session
  const resultToShow = (submitted && result) ? result : null
  if (resultToShow) {
    const score = Math.round(resultToShow.score ?? 0)
    const performance = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        <div className="card text-center space-y-5">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quiz Completed!</h2>
            <p className="text-slate-500 mt-1">Your quiz has been auto-graded</p>
          </div>
          <div className={clsx('inline-block px-8 py-4 rounded-2xl text-center w-full', scoreBg(score))}>
            <p className="text-5xl font-bold">{score}%</p>
            <p className="text-sm mt-1">{resultToShow.correctAnswers} / {resultToShow.totalQuestions} correct</p>
            <p className="text-sm font-semibold mt-1">{performance}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400">Time Taken</p>
              <p className="font-semibold text-slate-800">{formatSeconds(resultToShow.timeTakenSeconds)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400">Status</p>
              <p className="font-semibold text-slate-800 capitalize">{resultToShow.status?.toLowerCase().replace('_', ' ') || 'Submitted'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="btn-primary flex-1">
              Back to Course
            </button>
            <button onClick={() => navigate('/student/progress')} className="btn-secondary flex-1">
              View Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const totalQ = questions.length
  const answered = Object.keys(answers).length
  const options = q ? getOptions(q) : []

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{assignment.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{assignment.instructions}</p>
          </div>
          {timeLeft !== null && (
            <div className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg',
              timeLeft < 60 ? 'bg-rose-100 text-rose-600 animate-pulse-soft' : 'bg-primary-100 text-primary-700'
            )}>
              <Clock size={18} />
              {formatSeconds(timeLeft)}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(answered / Math.max(totalQ, 1)) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{answered}/{totalQ} answered</span>
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={clsx(
              'w-9 h-9 rounded-lg text-sm font-semibold transition-all',
              i === current ? 'bg-primary-600 text-white' :
              answers[questions[i]?.questionId] ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-100 text-slate-600 hover:bg-primary-50'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      {q && (
        <div className="card space-y-5">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {current + 1}
            </span>
            <p className="text-slate-900 font-medium leading-relaxed">{q.questionText}</p>
          </div>
          <div className="space-y-2 pl-10">
            {options.map(({ label, text }) => {
              const selected = answers[q.questionId] === label
              return (
                <button
                  key={label}
                  onClick={() => setAnswers({ ...answers, [q.questionId]: label })}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 text-slate-700'
                  )}
                >
                  <span className={clsx('inline-flex w-6 h-6 rounded-full mr-2 text-xs items-center justify-center font-bold',
                    selected ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                  )}>
                    {label}
                  </span>
                  {text}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn-secondary"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        {current < totalQ - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => handleSubmit()}
            disabled={submitMutation.isPending}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700"
          >
            <Send size={16} />
            {submitMutation.isPending ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  )
}
