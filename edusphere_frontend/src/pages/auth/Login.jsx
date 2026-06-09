import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Target, Zap, Bell, BarChart2 } from 'lucide-react'

const ROLE_HOME = {
  STUDENT: '/student/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  COORDINATOR: '/coordinator/dashboard',
  ADMIN: '/admin/dashboard',
}

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(ROLE_HOME[user.role] || '/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-700 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-[-120px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-40 left-[-40px] w-32 h-32 rounded-full bg-white/10" />

        <div className="relative z-10 text-center text-white space-y-8 max-w-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center ring-4 ring-white/30">
              <GraduationCap size={40} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">Welcome to<br />EduSphere</h1>
            <p className="mt-3 text-lg text-white/70 leading-relaxed">Your all-in-one platform for learning, teaching, and growing together.</p>
          </div>

          <div className="space-y-3">
            {[
              { Icon: Target,   text: 'Role-based access for Students, Instructors, Coordinators & Admins' },
              { Icon: Zap,      text: 'Smart auto-grading with real-time progress tracking' },
              { Icon: Bell,     text: 'Instant notifications for assignments & course updates' },
              { Icon: BarChart2, text: 'Analytics dashboards to monitor learning outcomes' },
            ].map((f) => (
              <div key={f.text} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-2xl px-4 py-3">
                <f.Icon size={18} className="text-white/80 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/80 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">EduSphere</span>
          </div>

          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">!</span>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handle}
                    placeholder="you@university.edu"
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handle}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
