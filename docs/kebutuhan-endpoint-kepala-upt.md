# Kebutuhan Endpoint API Back End - Web Kepala UPT (PasCall)

Dokumen ini merangkum seluruh endpoint backend (BE) yang dibutuhkan oleh antarmuka frontend (FE) pada modul **Kepala UPT (Branch Admin)**. Dokumen ini disusun berdasarkan penelusuran kode FE aktif di `src/pages/branch` dan `src/services`, lalu dicocokkan dengan kode aktif di `PasCall-BackEnd`.

---

### 1. Ringkasan Status Kebutuhan Endpoint

Dari total **15 endpoint** yang dibutuhkan untuk modul Kepala UPT:
- **ADA**: **7 endpoint** (Auth Login, Pendaftaran WBP, Detail & Update WBP, List Rekaman, Detail Rekaman, Presigned Stream URL, Binary Audio Stream)
- **ADA (Perlu Tambahan)**: **1 endpoint** (`GET /api/inmates` perlu dukungan filter status)
- **BELUM ADA**: **7 endpoint** (Summary Dashboard UPT, Widget Paket Cabang, List Transaksi, Detail Transaksi, Kelola Akun Pengguna UPT, Reset Password User, Laporan UPT)

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Kepala UPT

| Method | Path Usulan | Dipakai di Halaman | Role Akses | Request (Field Penting) | Response (Field Penting) | Status di Back End |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login (`/login`) | Semua Role (`BRANCH_ADMIN`, `SUPERVISOR`, dll.) | `identifier`, `password` | `token` (JWT), `user` (`id`, `name`, `role`, `branchId`, `branchName`) | **ADA** |
| `GET` | `/api/dashboard/branch-summary` | Dashboard Kepala UPT (`/branch/dashboard`) | `BRANCH_ADMIN` | Header: `Authorization: Bearer <token>` *(BE otomatis filter by `user.branchId`)* | `totalCalls`, `answeredCalls`, `missedCalls`, `totalInmates`, `callsGrowth`, `answeredGrowth`, `missedGrowth`, `inmatesGrowth` | **BELUM ADA** *(Saat ini FE fallback `-`)* |
| `GET` | `/api/packages` | Dashboard Widget & Menu Paket (`/branch/packages`) | `BRANCH_ADMIN`, `SUPERVISOR` | Query: `branchId` *(atau otomatis dari token JWT)* | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId }]` | **BELUM ADA** |
| `GET` | `/api/inmates` | Data Narapidana (`/branch/inmates`) | `BRANCH_ADMIN` | Query: `search`, `page`, `limit`, `status` *(BE otomatis filter by `user.branchId`)* | `data`: `[{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate }]`, `pagination`: `{ total, page, totalPages }` | **ADA (perlu tambahan)** *(BE belum mendukung query filter `status`)* |
| `POST` | `/api/inmates` | Tambah Narapidana (`/branch/inmates/create`) | `BRANCH_ADMIN` | Body: `identifier`, `name`, `initialPin` *(BE otomatis set `branchId` dari user login)* | `id`, `identifier`, `name`, `branchId`, `createdAt` | **ADA** |
| `GET` | `/api/inmates/:id` | Detail Narapidana (`/branch/inmates/:id`) | `BRANCH_ADMIN` | Path: `id` | `id`, `identifier`, `name`, `initialPin`, `callBalance`, `blockRoom`, `status`, `commStatus`, `branch`: `{ id, name }` | **ADA** |
| `PATCH` | `/api/inmates/:id` | Edit Data Narapidana (`/branch/inmates/:id/edit`) | `BRANCH_ADMIN` | Path: `id`, Body: `identifier`, `name`, `initialPin` | `id`, `identifier`, `name`, `initialPin`, `updatedAt` | **ADA** |
| `PATCH` | `/api/inmates/:id/status` | Ubah Status Komunikasi WBP (`/branch/inmates`) | `BRANCH_ADMIN` | Path: `id`, Body: `isActive` (`boolean`) | `id`, `identifier`, `isActive`, `status`, `updatedAt` | **ADA** |
| `GET` | `/api/recordings` | Rekaman Panggilan (`/branch/recordings` & Dashboard) | `BRANCH_ADMIN` | Query: `search`, `page`, `limit`, `status`, `startDate`, `endDate` *(BE otomatis filter by `user.branchId`)* | `data`: `[{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { inmate, family, durationSeconds, totalCost } }]`, `pagination` | **ADA** |
| `GET` | `/api/recordings/:id` | Detail & Transkrip Modal (`/branch/recordings`) | `BRANCH_ADMIN` | Path: `id` | `id`, `callId`, `storageUrl`, `transcriptText`, `transcriptStatus`, `call`: `{ id, inmate, family, durationSeconds, totalCost, connectedAt, endedAt }` | **ADA** |
| `GET` | `/api/recordings/:id/stream-url` | Pemutar Audio Presigned URL (`AudioPlayerPanel`) | `BRANCH_ADMIN` | Path: `id` | `streamUrl`, `directStreamUrl`, `expiresInSeconds` | **ADA** |
| `GET` | `/api/recordings/:id/stream` | Proxy Stream Binary Audio (`/branch/recordings`) | `BRANCH_ADMIN` | Path: `id` | Binary Audio Stream *(audio/mp3 dari MinIO)* | **ADA** |
| `GET` | `/api/balance/transactions` | Riwayat Transaksi (`/branch/transactions`) | `BRANCH_ADMIN` | Query: `search`, `status`, `category` (`TOPUP_CASH`/`CALL_CHARGE`), `startDate`, `endDate`, `page`, `limit` *(BE filter `branchId`)* | `data`: `[{ id, inmateId, inmateName, amount, type, description, performedBy, status, createdAt, balanceBefore, balanceAfter }]`, `totalPemakaian`, `pagination` | **BELUM ADA** *(Tabel `Transaction` ada di Prisma, route/controller belum dibuat)* |
| `GET` | `/api/balance/transactions/:id` | Detail/Struk Transaksi (`/branch/transactions` Modal) | `BRANCH_ADMIN` | Path: `id` | `id`, `amount`, `type`, `balanceBefore`, `balanceAfter`, `performedBy`, `user`: `{ identifier, name }`, `createdAt` | **BELUM ADA** |
| `GET` | `/api/users` | Kelola Pengguna UPT (`/branch/users`) | `BRANCH_ADMIN` | Query: `role` (`SUPERVISOR`/`CANTEEN_STAFF`), `search`, `page`, `limit` *(BE filter `branchId`)* | `data`: `[{ id, name, email, phone, role, status, isActive, createdAt }]`, `pagination` | **BELUM ADA** *(Role `SUPERVISOR` juga belum ada di enum Prisma)* |
| `POST` | `/api/users` | Tambah Supervisor / Petugas Kantin (`/branch/users`) | `BRANCH_ADMIN` | Body: `name`, `email`, `phone`, `password`, `role` (`SUPERVISOR`/`CANTEEN_STAFF`), `branchId` | `id`, `name`, `email`, `role`, `branchId`, `createdAt` | **BELUM ADA** |
| `PATCH` | `/api/users/:id` | Ubah / Nonaktifkan User (`/branch/users`) | `BRANCH_ADMIN` | Path: `id`, Body: `name`, `email`, `phone`, `role`, `status` / `isActive` | `id`, `name`, `email`, `role`, `isActive`, `updatedAt` | **BELUM ADA** |
| `POST` | `/api/users/:id/reset-password` | Reset Password Akun Petugas (`/branch/users`) | `BRANCH_ADMIN` | Path: `id`, Body: `newPassword` (opsional) | `message`: "Password berhasil direset", `newTemporaryPassword` | **BELUM ADA** |
| `GET` | `/api/reports/branch-summary` | Laporan Kinerja UPT (`/branch/reports`) | `BRANCH_ADMIN` | Query: `period` (`7`, `30`, `90` hari) *(BE otomatis filter by `user.branchId`)* | `totalRevenue`, `totalCalls`, `avgCallDurationSeconds`, `successRate`, `revenueTrend`: `[...]`, `callVolumeTrend`: `[...]` | **BELUM ADA** |

---

### 3. Catatan & Pertanyaan untuk Tim BE

1. **Status Rekaman vs Status Panggilan**:
   - Nilai status di tabel `Recording` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) adalah status proses transkripsi AI Whisper, bukan status panggilan terjawab/tidak terjawab.
   - Mohon dipastikan bagaimana logika penentuan panggilan terjawab vs tidak terjawab (apakah menggunakan `call.status === 'CONNECTED'`, `call.connectedAt !== null`, atau `call.durationSeconds > 0`).

2. **Tipe Transaksi Saldo (`TransactionType`)**:
   - Di Prisma schema saat ini hanya tersedia enum `TOPUP_CASH` dan `CALL_CHARGE`.
   - Apakah `CALL_CHARGE` otomatis dicatat saat panggilan berakhir dengan pemotongan saldo?
   - Apakah transaksi pembelian voucher paket kantin membutuhkan tipe transaksi baru (misal: `CANTEEN_PURCHASE`), atau tetap menggunakan `TOPUP_CASH`?

3. **Definisi Kartu "Estimasi Hari Ini" di Transaksi**:
   - Di antarmuka sebelumnya nilai ini dihitung hardcode $25\% \times \text{Total Pemakaian}$.
   - Perlu keputusan tim produk/BE apakah kartu ini akan diisi proyeksi pemakaian harian berbasis rata-rata atau realisasi pemakaian per tanggal hari ini ($H+0$).

4. **Penambahan Role `SUPERVISOR` di Backend**:
   - Enum `Role` di `schema.prisma` backend saat ini baru memiliki `SUPERADMIN`, `BRANCH_ADMIN`, `CANTEEN_STAFF`, `INMATE`, `FAMILY`.
   - Modul manajemen pengguna Kepala UPT membutuhkan role `SUPERVISOR` untuk ditambahkan ke enum Prisma.
