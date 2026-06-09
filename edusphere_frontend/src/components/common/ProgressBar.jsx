import clsx from 'clsx'

export default function ProgressBar({ value = 0, max = 100, className, showLabel = true, size = 'md' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary-500' : 'bg-amber-500'
  const h = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }[size]

  return (
    <div className={clsx('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden', h)}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
