import clsx from 'clsx'

const variants = {
  purple:  'bg-primary-100 text-primary-700',
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  rose:    'bg-rose-100 text-rose-700',
  slate:   'bg-slate-100 text-slate-600',
  pink:    'bg-pink-100 text-pink-700',
  teal:    'bg-teal-100 text-teal-700',
  sky:     'bg-sky-100 text-sky-700',
  orange:  'bg-orange-100 text-orange-700',
}

export default function Badge({ children, variant = 'purple', className }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
