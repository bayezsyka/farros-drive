import clsx from 'clsx'

const variants = {
  primary: 'bg-farros-navy/8 text-farros-navy',
  success: 'bg-farros-sage/20 text-farros-navy',
  neutral: 'bg-farros-mist text-farros-ink',
  danger: 'bg-red-100 text-red-700',
}

function Badge({ children, className, variant = 'neutral' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge
