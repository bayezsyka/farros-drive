import Card from './Card'

function EmptyState({ action, description, icon: Icon, title }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="rounded-full bg-farros-mist p-4 text-farros-sage">
        <Icon size={28} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-farros-navy">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-farros-ink">{description}</p>
      </div>
      {action}
    </Card>
  )
}

export default EmptyState
