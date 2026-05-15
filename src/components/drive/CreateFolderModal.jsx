import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function CreateFolderModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')

  const handleClose = () => {
    setName('')
    onClose()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(name)
    setName('')
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buat Folder"
      description="Folder baru"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-farros-navy">Nama folder</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Arsip Invoice"
            className="h-12 w-full rounded-2xl border bg-farros-ivory px-4 text-sm"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit">Simpan Folder</Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateFolderModal
