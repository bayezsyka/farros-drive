import StorageSummaryCard from '../components/drive/StorageSummaryCard'
import { useDriveStore } from '../hooks/useDriveStore'

function Settings() {
  const { auth, backend, currentMode, getStorageSummary } = useDriveStore()
  const summary = getStorageSummary()

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <StorageSummaryCard summary={summary} />

      <div className="space-y-4">
        <section className="panel-surface rounded-[30px] px-5 py-5">
          <h2 className="text-lg font-semibold text-farros-navy">Akses</h2>
          <div className="mt-4 space-y-3 text-sm text-farros-ink">
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
              <p className="font-semibold text-farros-navy">Mode</p>
              <p className="mt-1">{currentMode}</p>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
              <p className="font-semibold text-farros-navy">Cookie session</p>
              <p className="mt-1">7 hari, HttpOnly, SameSite=Lax</p>
            </div>
            {!auth.passwordConfigured ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                FARROS_DRIVE_PASSWORD belum disetel.
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel-surface rounded-[30px] px-5 py-5">
          <h2 className="text-lg font-semibold text-farros-navy">Backend</h2>
          <div className="mt-4 space-y-3 text-sm text-farros-ink">
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
              <p className="font-semibold text-farros-navy">API</p>
              <p className="mt-1">{backend.apiBaseUrl || '-'}</p>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
              <p className="font-semibold text-farros-navy">/srv/drive</p>
              <p className="mt-1">{summary.drive?.root || backend.storageRoot}</p>
            </div>
            <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
              <p className="font-semibold text-farros-navy">Status</p>
              <p className="mt-1">{backend.statusLabel}</p>
              {backend.error ? <p className="mt-2 text-red-600">{backend.error}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
