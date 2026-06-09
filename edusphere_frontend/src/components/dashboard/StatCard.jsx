import clsx from 'clsx'

const PALETTE = [
  { bg: 'bg-primary-100', icon: 'bg-primary-500', text: 'text-primary-700', ring: 'ring-primary-200' },
  { bg: 'bg-emerald-100', icon: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  { bg: 'bg-pink-100',    icon: 'bg-pink-500',    text: 'text-pink-700',    ring: 'ring-pink-200' },
  { bg: 'bg-amber-100',   icon: 'bg-amber-500',   text: 'text-amber-700',  ring: 'ring-amber-200' },
  { bg: 'bg-sky-100',     icon: 'bg-sky-500',     text: 'text-sky-700',    ring: 'ring-sky-200' },
  { bg: 'bg-teal-100',    icon: 'bg-teal-500',    text: 'text-teal-700',   ring: 'ring-teal-200' },
]

export default function StatCard({ label, value, icon: Icon, colorIndex = 0, sub, trend }) {
  const p = PALETTE[colorIndex % PALETTE.length]

  return (
    <div className={clsx('card flex items-center gap-4 animate-slide-up')}>
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center ring-4 flex-shrink-0', p.icon, p.ring)}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={clsx('ml-auto text-sm font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
