import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { GraduationCap, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authService.resetPassword(form.email, form.otp, form.newPassword)
      setDone(true)
      toast.success('Password reset successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-indigo-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">New Password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter the OTP from your email</p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Password Updated!</p>
                <p className="text-sm text-slate-500 mt-1">Your password has been changed successfully.</p>
              </div>
              <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" required value={form.email} onChange={handle} placeholder="you@university.edu" className="input" />
              </div>
              <div>
                <label className="label">OTP Code</label>
                <input name="otp" required value={form.otp} onChange={handle} placeholder="6-digit OTP" maxLength={6} className="input tracking-widest text-center text-lg font-bold" />
              </div>
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input name="newPassword" type={showPw ? 'text' : 'password'} required value={form.newPassword} onChange={handle} placeholder="Min 8 characters" className="input pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input name="confirm" type="password" required value={form.confirm} onChange={handle} placeholder="Repeat password" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500 hover:text-primary-600 transition-colors">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  )
}
