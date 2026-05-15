import clsx from 'clsx'

const variants = {
  primary: 'bg-farros-navy text-farros-ivory hover:bg-farros-navy/92',
  secondary: 'bg-farros-sage text-farros-navy hover:bg-farros-sage/85',
  ghost: 'bg-transparent text-farros-navy hover:bg-farros-mist/80',
  subtle: 'bg-farros-mist/80 text-farros-navy hover:bg-farros-mist',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

const sizes = {
  sm: 'h-10 px-3.5 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:ring-2 focus-visible:ring-farros-sage/60 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
