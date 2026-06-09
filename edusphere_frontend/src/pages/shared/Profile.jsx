import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import {
  User, Mail, ShieldCheck, IdCard, KeyRound,
  CheckCircle2, Eye, EyeOff, ArrowRight, Edit3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_COLORS = {
  STUDENT:     { badge: 'blue',   bg: 'from-blue-500 to-indigo-600',    light: 'bg-blue-50', text: 'text-blue-700' },
  INSTRUCTOR:  { badge: 'green',  bg: 'from-emerald-500 to-teal-600',   light: 'bg-emerald-50', text: 'text-emerald-700' },
  COORDINATOR: { badge: 'amber',  bg: 'from-amber-500 to-orange-500',   light: 'bg-amber-50', text: 'text-amber-700' },
  ADMIN:       { badge: 'rose',   bg: 'from-rose-500 to-pink-600',      light: 'bg-rose-50', text: 'text-rose-700' },
}

const ROLE_LABELS = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  COORDINATOR: 'Coordinator',
  ADMIN: 'Administrator',
}

function ChangePasswordModal({ open, onClose, email }) {
  const [step, setStep]         = useState(1)
  const [otp, setOtp]           = useState('')
  const [newPassword, setNewPw] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const reset = () => { setStep(1); setOtp(''); setNewPw(''); setConfirm(''); setLoading(false) }
  const handleClose = () => { reset(); onClose() }

  const sendOtp = async () => {
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      toast.success(`OTP sent to ${email}`)
      setStep(2)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 6)  { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await authService.resetPassword(email, otp, newPassword)
      setStep(3)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change Password" size="sm">
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-primary-50 rounded-xl p-4 text-sm text-slate-600">
            <p>We'll send a one-time password (OTP) to:</p>
            <p className="font-semibold text-primary-700 mt-1">{email}</p>
          </div>
          <p className="text-sm text-slate-500">Use the OTP to set a new password. Check your inbox after clicking Send OTP.</p>
          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={sendOtp} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="label">OTP Code</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP from email" className="input font-mono tracking-widest text-center text-lg" maxLength={8} />
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 characters" className="input pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" className="input" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={changePassword} disabled={!otp || !newPassword || loading} className="btn-primary flex-1">
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </div>
          <button onClick={sendOtp} disabled={loading} className="text-xs text-primary-600 hover:underline w-full text-center">
            Resend OTP
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Password changed!</p>
            <p className="text-sm text-slate-500 mt-1">Your password has been updated successfully.</p>
          </div>
          <button onClick={handleClose} className="btn-primary w-full">Done</button>
        </div>
      )}
    </Modal>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [changePwOpen, setChangePwOpen] = useState(false)

  const roleConfig = ROLE_COLORS[user?.role] || ROLE_COLORS.STUDENT
  const roleLabel  = ROLE_LABELS[user?.role]  || user?.role

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || '—'
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  const infoRows = [
    { icon: User,       label: 'Full Name',             value: fullName },
    { icon: Mail,       label: 'Email Address',         value: user?.email || '—' },
    { icon: ShieldCheck,label: 'Role',                  value: user?.role || '—', badge: true },
    { icon: IdCard,     label: 'Employee / Student ID', value: user?.studentOrEmployeeId || '—', mono: true },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile banner */}
      <div className={clsx('relative overflow-hidden rounded-2xl bg-gradient-to-br p-0 text-white', roleConfig.bg)}>
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-56 h-full opacity-10 pointer-events-none">
          <div className="absolute right-[-20px] top-[-20px] w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-16 bottom-[-10px] w-24 h-24 rounded-full bg-white" />
        </div>

        <div className="relative z-10 p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur ring-4 ring-white/40 flex items-center justify-center text-2xl font-extrabold flex-shrink-0 shadow-lg">
              {initials || <User size={28} />}
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-medium">{roleLabel}</p>
              <h2 className="text-2xl font-bold mt-0.5">{fullName}</h2>
              <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
              {user?.studentOrEmployeeId && (
                <p className="text-white/60 text-xs mt-1 font-mono">{user.studentOrEmployeeId}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title">Account Information</h3>
          <div className={clsx('flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold', roleConfig.light, roleConfig.text)}>
            <ShieldCheck size={12} />
            {roleLabel}
          </div>
        </div>
        <div className="space-y-0.5">
          {infoRows.map(({ icon: Icon, label, value, badge, mono }) => (
            <div key={label} className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', roleConfig.light)}>
                <Icon size={17} className={roleConfig.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                {badge ? (
                  <Badge variant={roleConfig.badge} className="mt-1">{value}</Badge>
                ) : (
                  <p className={clsx('text-sm font-semibold text-slate-800 mt-0.5', mono && 'font-mono text-xs tracking-wider break-all select-all bg-slate-50 px-2 py-0.5 rounded-lg w-fit')}>
                    {value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security card — hidden for ADMIN */}
      {user?.role !== 'ADMIN' && (
        <div className="card">
          <h3 className="section-title mb-4">Security</h3>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <KeyRound size={17} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Password</p>
                <p className="text-xs text-slate-400 mt-0.5">Change your account password via email OTP</p>
              </div>
            </div>
            <button
              onClick={() => setChangePwOpen(true)}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Edit3 size={14} /> Change
            </button>
          </div>

          {user?.passwordChangeRequired && (
            <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">!</span>
              <p className="text-sm text-amber-700">
                Your administrator has requested a password change. Please update your password.
              </p>
            </div>
          )}
        </div>
      )}

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        email={user?.email || ''}
      />
    </div>
  )
}
