import clsx from 'clsx'

function Card({ children, className, muted = false }) {
  return (
    <div className={clsx(muted ? 'panel-muted' : 'panel-surface', className)}>{children}</div>
  )
}

export default Card
