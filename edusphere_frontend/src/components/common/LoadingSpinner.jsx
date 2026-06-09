import clsx from 'clsx'

export default function LoadingSpinner({ size = 'md', className }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx(sz, 'rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin')} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  )
}
