import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDriveStore } from '../../hooks/useDriveStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

function UploadDropzone({ onFiles, inputRef: externalInputRef }) {
  const { backend, isServerMode } = useDriveStore()
  const localInputRef = useRef(null)
  const inputRef = externalInputRef || localInputRef
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    onFiles(event.dataTransfer.files)
  }

  return (
    <Card
      className={`border-2 border-dashed p-6 transition ${
        isDragging ? 'border-farros-sage bg-farros-mist/80' : 'border-farros-line'
      }`}
    >
      <div
        className="flex flex-col items-center justify-center gap-4 text-center"
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="rounded-full bg-farros-mist p-4 text-farros-sage">
          <UploadCloud size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-farros-navy">
            {isServerMode ? 'Upload langsung ke storage server' : 'Upload simulasi ke Farros Drive'}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-farros-ink">
            {isServerMode
              ? 'Drag & drop file dari laptop atau HP, lalu file akan disimpan ke storage aktif sesuai backend Go.'
              : 'Drag & drop file dari laptop atau HP, lalu metadata file akan disimpan ke state lokal.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Pilih Berkas
          </Button>
          <Badge variant={backend.connected ? 'success' : 'neutral'}>
            {backend.connected ? `Tersambung ke ${backend.storageRoot}` : 'Simulasi lokal, belum tersimpan ke /srv/drive'}
          </Badge>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
    </Card>
  )
}

export default UploadDropzone
