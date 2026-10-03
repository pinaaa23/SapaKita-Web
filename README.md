# PasCall — Sistem Layanan Komunikasi Lembaga Pemasyarakatan

Aplikasi web terpadu untuk manajemen layanan komunikasi narapidana.

## Cara Menjalankan

```bash
npm install
npm run dev
```

## Role & Akses

Satu halaman login dipakai bersama semua role. Setelah login, pengguna diarahkan ke dashboard sesuai role:

| Role | Nilai (BE) | Dashboard |
|------|------------|-----------|
| Super Administrator | `SUPERADMIN` | `/dashboard` |
| Kepala UPT | `BRANCH_ADMIN` | `/branch/dashboard` |
| Supervisor | (belum ada di BE — mock: `supervisor`) | `/branch/dashboard` |
| Operator Kantin | `CANTEEN_STAFF` | `/kantin` |

## Halaman Kantin (Operator Kantin)

Halaman kantin terintegrasi di dalam proyek PasCall dan hanya dapat diakses oleh role **Operator Kantin**.

### Route

| URL | Deskripsi |
|-----|-----------|
| `/kantin` | Katalog Paket Komunikasi (Halaman utama) |
| `/kantin/status-wartel` | Status ketersediaan wartel lapas |
| `/kantin/riwayat` | Rekap & riwayat transaksi kasir |
| `/kantin/voucher/:id` | Voucher transaksi (setelah beli paket) |
| `/kantin/struk/:id` | Struk bukti transaksi |

### Struktur File Kantin

```
src/
  pages/kantin/          # Halaman kantin
  components/kantin/     # Komponen kantin
  services/kantin/       # Service kantin (kantinService, wartelService)
  data/kantin/           # Data dummy (paket, napi)
  utils/formatKantin.js  # Utility format angka & tanggal
  layouts/KantinLayout.jsx    # Layout sidebar khusus kantin
  components/KantinProtectedRoute.jsx  # Guard route kantin
```

### localStorage Keys Kantin

- `pascall_kantin_transaksi` — data transaksi dummy
- `pascall_wartel_status_v2` — status wartel dummy

Kunci ini **tidak bertabrakan** dengan localStorage PasCall yang menggunakan `token`, `pascall_token`, `user`, `pascall_user`.

### Data Kantin

Saat ini semua data Kantin masih **dummy** (localStorage). Menunggu endpoint BE:
- `GET /api/kantin/paket` — daftar paket
- `GET /api/kantin/wartel/status` — status wartel
- `GET /api/kantin/transaksi` — riwayat transaksi
- `POST /api/kantin/transaksi` — buat transaksi baru

### Akun Demo (Mode Offline)

Login dengan email yang mengandung kata:
- `kantin.*` atau `*canteen*` → masuk sebagai Operator Kantin
- `supervisor.*` atau `*spv*` → masuk sebagai Supervisor
- `kepala.*` → masuk sebagai Kepala UPT
- `superadmin.*` atau `pusat@pascall.id` → masuk sebagai Super Admin

## Manajemen Pengguna (Kepala UPT)

Kepala UPT dapat membuat dan mengelola akun:
- **Supervisor** — akses dashboard UPT
- **Operator Kantin** — akses halaman `/kantin`

Format email yang disarankan: `peran.wilayah@pascall.id`
Contoh: `kantin.cipinang@pascall.id`, `supervisor.cipinang@pascall.id`