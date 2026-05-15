import Card from '../ui/Card'

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-farros-ink">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-farros-navy">{value}</p>
          <p className="mt-2 text-sm text-farros-ink">{note}</p>
        </div>
        <div className="rounded-3xl bg-farros-mist p-3 text-farros-sage">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  )
}

export default StatCard
