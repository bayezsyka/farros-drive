import { Link2 } from 'lucide-react'
import SharedItemRow from '../components/drive/SharedItemRow'
import EmptyState from '../components/ui/EmptyState'
import { useDriveStore } from '../hooks/useDriveStore'

function Shared() {
  const { revokeShare, shares } = useDriveStore()

  const handleCopy = async (url) => {
    await navigator.clipboard.writeText(url)
  }

  if (!shares.length) {
    return <EmptyState icon={Link2} title="Belum ada link" description="Buat link dari berkas atau folder." />
  }

  return (
    <div className="space-y-3">
      {shares.map((item) => (
        <SharedItemRow key={item.token} item={item} onCopy={handleCopy} onRevoke={revokeShare} />
      ))}
    </div>
  )
}

export default Shared
