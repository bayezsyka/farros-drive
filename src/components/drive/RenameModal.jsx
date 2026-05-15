import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function RenameModal({ item, open, onClose, onSubmit }) {
  const [name, setName] = useState(item?.name || '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ubah Nama"
      description={item?.name || ''}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(name)
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-farros-navy">Nama baru</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-2xl border bg-farros-ivory px-4 text-sm"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </Modal>
  )
}

export default RenameModal
