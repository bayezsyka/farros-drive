# Farros Drive

Farros Drive adalah mini drive pribadi untuk pertukaran berkas antara laptop, HP, dan server Farros. Frontend dibangun dengan React + Vite + Tailwind, sedangkan backend fase 2 memakai Go dan langsung membaca storage terpisah di luar folder aplikasi.

## Stack

- React
- Vite
- Tailwind CSS
- lucide-react
- SweetAlert2
- Go standard library

## Struktur Aplikasi

```text
src/                  frontend React
server/               backend Go API
dev-drive/            storage local development
```

Struktur backend utama:

```text
server/
  cmd/farros-drive/
  internal/config/
  internal/drive/
  internal/httpapi/
  internal/security/
```

## Menjalankan Frontend

```bash
npm install
npm run dev
```

Frontend akan memakai backend Go jika `VITE_API_BASE_URL` tersedia. Contoh konfigurasi ada di `.env.example`.

Command verifikasi frontend:

```bash
npm run lint
npm run build
```

## Menjalankan Backend

```bash
cd server
go mod tidy
go run ./cmd/farros-drive
```

Backend listen default di `http://127.0.0.1:8085`.

Environment variable yang dipakai:

- `DRIVE_ROOT` default `../dev-drive`
- `DRIVE_TRASH_DIR` default `.trash`
- `DRIVE_PORT` default `8085`
- `DRIVE_MAX_UPLOAD_MB` default `100`

## Lokasi Storage Local Dev

Storage local development ada di:

```text
dev-drive/
```

Folder `.trash/` di dalam `dev-drive/` dipakai untuk item yang dipindahkan dari UI sebelum dihapus permanen.

## Catatan Production

- Source app / web panel: `/opt/farros-drive`
- Storage file asli: `/srv/drive`
- Domain target: `drive.farros.space`

File asli tidak disimpan di `src/`, `public/`, atau folder backend. Storage tetap terpisah agar tetap nyaman dikelola dari CLI.

## Catatan Keamanan

- Fase ini belum memiliki login / auth.
- Jangan buka aplikasi ini ke publik tanpa proteksi akses tambahan.
- Backend menolak path traversal dan akses langsung ke hidden path selain endpoint trash.
