# Farros Drive

Farros Drive adalah drive pribadi ringan berbasis Go + React. Storage asli tetap berada di luar aplikasi, default local dev di `dev-drive/` dan production di `/srv/drive`.

## Stack

- Backend: Go
- Frontend: React + Vite + Tailwind
- Metadata share: JSON file di `/srv/drive/.farros-drive/shares.json`
- Auth: single password via cookie session tanpa database

## Struktur

```text
src/                  frontend React
server/               backend Go API
dev-drive/            storage local development
```

## Password

Backend memakai environment variable:

```bash
FARROS_DRIVE_PASSWORD=isi_password_anda
```

Catatan:

- Jika kosong, backend tetap bisa jalan.
- Saat kosong, UI akan memberi peringatan bahwa password belum disetel.
- Untuk production, password harus disetel.
- Jangan commit password ke repo.

## Menjalankan Frontend

Install dependency:

```bash
npm install
```

Development:

```bash
npm run dev
```

Frontend akan memakai backend jika `VITE_API_BASE_URL` disetel. Contoh local dev:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8085/api
```

Production:

```bash
VITE_API_BASE_URL=/api
```

Validasi frontend:

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

Build binary:

```bash
go build -o farros-drive ./cmd/farros-drive
```

Default environment backend:

- `DRIVE_ROOT=../dev-drive`
- `DRIVE_TRASH_DIR=.trash`
- `DRIVE_META_DIR=.farros-drive`
- `DRIVE_PORT=8085`
- `DRIVE_MAX_UPLOAD_MB=100`
- `FARROS_DRIVE_PASSWORD=...`

## Deploy Production

Contoh target production:

- Source repo / build workspace: `/srv/websites/farros-drive`
- App frontend hasil build: `/opt/farros-drive/public`
- Backend binary / app: `/opt/farros-drive`
- Storage asli: `/srv/drive`
- Backend bind: `127.0.0.1:8085`

Langkah umum:

1. Build frontend dengan `npm run build`.
2. Build backend dengan `go build -o farros-drive ./cmd/farros-drive`.
3. Salin aset frontend ke `/opt/farros-drive/public`.
4. Jalankan binary backend sebagai service.
5. Pastikan Nginx mengarahkan `/api` ke backend Go dan SPA route memakai `try_files $uri $uri/ /index.html;`.
6. Set `FARROS_DRIVE_PASSWORD` di systemd service.

Contoh systemd env:

```ini
Environment=FARROS_DRIVE_PASSWORD=ubah_password_ini
Environment=DRIVE_ROOT=/srv/drive
```

## Fitur

- Login single password dengan cookie session 7 hari
- List item, upload, folder, rename, trash, restore, delete forever
- Preview gambar, PDF, video, audio, dan teks
- Share publik read-only untuk file atau folder
- Summary storage `/srv/drive` dan disk CT

## Public Share

Public share bersifat read-only:

- Bisa lihat
- Bisa preview
- Bisa download jika diizinkan

Public share tidak bisa:

- Upload
- Rename
- Delete
- Restore
- Buat folder

## Catatan

- File asli tidak disimpan di `src/`, `public/`, atau `server/`.
- Folder `.trash` dan `.farros-drive` disembunyikan dari list drive biasa.
- Share publik disimpan di file JSON, belum memakai database.
