# Kebutuhan Endpoint API Back End - Web Kepala UPT (PasCall)

Dokumen ini merangkum seluruh hasil *cross-check* dan kebutuhan endpoint backend (BE) untuk modul antarmuka **Kepala UPT (Branch Admin)** pada aplikasi PasCall. Dokumen ini disusun berdasarkan penelusuran seluruh halaman aktif pada `src/pages/branch/`, komponen `src/components/`, konfigurasi hak akses `src/config/menuConfig.js`, serta rute aplikasi `src/App.jsx`.

---

### 1. Ringkasan Modul & Hak Akses Kepala UPT

Kepala UPT bertindak sebagai pimpinan operasional lapas di tingkat cabang/UPT. Kepala UPT memiliki wewenang penuh untuk memantau seluruh aktivitas komunikasi warga binaan, **memutar dan menyalin transkrip rekaman panggilan audio/video**, mengelola akun staf UPT (Supervisor dan Operator Kantin), memantau mutasi keuangan transaksi saldo, dan mengevaluasi laporan kinerja cabang.

| Modul Halaman | Rute Frontend | Fungsi & Fitur Utama |
| :--- | :--- | :--- |
| **Dashboard UPT** | `/branch/dashboard` | Statistik operasional cabang (Total Panggilan, Panggilan Terjawab/Tak Terjawab, Total WBP, Tren Panggilan, Widget Rekaman & Transaksi). |
| **Data Narapidana (Read-Only)** | `/branch/inmates` | Monitoring direktori warga binaan di UPT terkait, riwayat kontak keluarga, dan status akun komunikasi (*Read-Only*). |
| **Rekaman & Transkrip Panggilan** | `/branch/recordings` | Pemutar audio rekaman (*Audio Player Streaming*), analisis transkrip percakapan AI Whisper, dan pengawasan kepatuhan. |
| **Kelola Pengguna UPT** | `/branch/users` | Manajemen akun staf internal UPT (Pendaftaran Supervisor & Petugas Kantin, edit status aktif/nonaktif, dan reset password). |
| **Transaksi Saldo Cabang** | `/branch/transactions` | Rekapitulasi mutasi saldo pemakaian panggilan dan pembelian paket kantin di UPT terkait serta detail struk transaksi. |
| **Laporan Kinerja UPT** | `/branch/reports` | Analitik performa UPT (total omzet, volume panggilan, rata-rata durasi bicara, tingkat keberhasilan, dan ekspor laporan ke PDF). |
| **Profil & Keamanan** | `/branch/profile` | Tampilan profil pimpinan UPT, ubah kontak telepon, dan fitur ganti kata sandi (*Change Password*). |

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Kepala UPT

| No | Modul / Fitur | Method | Path Usulan | Role Akses | Request (Field / Parameter) | Response (Field Penting) | Status di Back End |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | **Otentikasi Login** | `POST` | `/api/auth/login` | `BRANCH_ADMIN`, `KEPALA_UPT`, dll. | Body: `{ identifier, password }` | `token` (JWT), `user`: `{ id, name, email, role: "KEPALA_UPT", branchId, branchName }` | ✅ **Sudah Ada** |
| 2 | **Ganti Password Akun** | `POST` | `/api/auth/change-password` | `BRANCH_ADMIN`, `KEPALA_UPT` | Body: `{ oldPassword, newPassword }` | `{ success: true, message: "Password berhasil diubah" }` | ⚠️ **Perlu Ditambahkan** |
| 3 | **Update Profil Pimpinan** | `PATCH` | `/api/users/profile` | `BRANCH_ADMIN`, `KEPALA_UPT` | Body: `{ name, phone }` | `{ success: true, user: { id, name, phone, email } }` | ⚠️ **Belum Ada** |
| 4 | **Ringkasan Dashboard UPT** | `GET` | `/api/dashboard/branch-summary` | `BRANCH_ADMIN`, `KEPALA_UPT` | Header: `Authorization: Bearer <token>` *(BE otomatis filter by `user.branchId`)* | `totalCalls`, `answeredCalls`, `missedCalls`, `totalInmates`, `callsGrowth`, `answeredGrowth`, `missedGrowth`, `inmatesGrowth` | ⚠️ **Belum Ada (Fallback)** |
| 5 | **Daftar Paket Aktif UPT** | `GET` | `/api/packages` | `BRANCH_ADMIN`, `SUPERVISOR` | Query: `status: "Aktif"` *(BE otomatis filter paket nasional / UPT)* | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId }]` | ⚠️ **Belum Ada** |
| 6 | **Daftar WBP Cabang** | `GET` | `/api/inmates` | `BRANCH_ADMIN`, `SUPERVISOR` | Query: `search`, `status`, `page`, `limit` *(BE otomatis filter by `user.branchId`)* | `data`: `[{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate, families: [...] }]`, `pagination` | 🔄 **Ada (Perlu Filter status & include families)** |
| 7 | **Detail Profil & Kontak WBP** | `GET` | `/api/inmates/:id` | `BRANCH_ADMIN`, `SUPERVISOR` | Path: `id` (UUID / Nomor Register WBP) | `{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate, families: [{ id, name, relationship, phone, status }], branch: { id, name } }` | ✅ **Sudah Ada** |
| 8 | **Daftar Rekaman Panggilan** | `GET` | `/api/recordings` | `BRANCH_ADMIN`, `SUPERADMIN` | Query: `search`, `status`, `callType`, `startDate`, `endDate`, `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { inmate, family, durationSeconds, totalCost } }]`, `pagination` | ✅ **Sudah Ada** |
| 9 | **Detail Rekaman & Transkrip AI** | `GET` | `/api/recordings/:id` | `BRANCH_ADMIN`, `SUPERADMIN` | Path: `id` | `{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { id, inmate, family, durationSeconds, totalCost, connectedAt, endedAt } }` | ✅ **Sudah Ada** |
| 10 | **Stream Audio Presigned URL** | `GET` | `/api/recordings/:id/stream-url` | `BRANCH_ADMIN`, `SUPERADMIN` | Path: `id` | `{ streamUrl, directStreamUrl, expiresInSeconds }` | ✅ **Sudah Ada** |
| 11 | **Stream Audio Binary Proxy** | `GET` | `/api/recordings/:id/stream` | `BRANCH_ADMIN`, `SUPERADMIN` | Path: `id` | Stream binary `audio/mp3` dari storage MinIO | ✅ **Sudah Ada** |
| 12 | **Daftar Mutasi Transaksi UPT** | `GET` | `/api/balance/transactions` | `BRANCH_ADMIN`, `SUPERVISOR` | Query: `search`, `status`, `category` (`TOPUP_CASH`/`CALL_CHARGE`), `startDate`, `endDate`, `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, inmateId, inmateName, amount, type, description, performedBy, status, createdAt, balanceBefore, balanceAfter }]`, `totalPemakaian`, `pagination` | ⚠️ **Belum Ada** |
| 13 | **Detail Struk Mutasi Saldo** | `GET` | `/api/balance/transactions/:id` | `BRANCH_ADMIN`, `SUPERVISOR` | Path: `id` | `{ id, amount, type, balanceBefore, balanceAfter, performedBy, user: { identifier, name }, createdAt }` | ⚠️ **Belum Ada** |
| 14 | **Daftar Staf Pengguna UPT** | `GET` | `/api/users` | `BRANCH_ADMIN` | Query: `role` (`SUPERVISOR`/`CANTEEN_STAFF`), `search`, `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, name, email, phone, role, status, isActive, createdAt }]`, `pagination` | ⚠️ **Belum Ada** |
| 15 | **Tambah Akun Staf UPT** | `POST` | `/api/users` | `BRANCH_ADMIN` | Body: `{ name, email, phone, password, role: "SUPERVISOR"|"CANTEEN_STAFF" }` *(BE otomatis set `branchId = user.branchId`)* | `{ id, name, email, role, branchId, status: "Active", createdAt }` | ⚠️ **Belum Ada** |
| 16 | **Edit Data & Status Staf UPT** | `PATCH` | `/api/users/:id` | `BRANCH_ADMIN` | Path: `id`, Body: `{ name, email, phone, role, status, isActive }` | `{ id, name, email, role, isActive, updatedAt }` | ⚠️ **Belum Ada** |
| 17 | **Reset Password Akun Staf UPT** | `POST` | `/api/users/:id/reset-password` | `BRANCH_ADMIN` | Path: `id`, Body: `{ newPassword }` (opsional) | `{ success: true, message: "Password berhasil direset", newTemporaryPassword }` | ⚠️ **Belum Ada** |
| 18 | **Laporan Kinerja & Keuangan UPT** | `GET` | `/api/reports/branch-summary` | `BRANCH_ADMIN`, `SUPERVISOR` | Query: `period` (`7`/`30`/`90`) *(BE otomatis filter by `user.branchId`)* | `{ totalRevenue, totalCalls, avgCallDurationSeconds, successRate, revenueTrend: [...], callVolumeTrend: [...] }` | ⚠️ **Belum Ada** |

---

### 3. Batasan Hak Akses & Aturan Bisnis (Security & Business Logic)

1. **Hak Akses Eksklusif Rekaman Panggilan**:
   - Hanya role **Kepala UPT (`BRANCH_ADMIN`/`KEPALA_UPT`)** dan **Superadmin** yang diizinkan memutar rekaman panggilan dan membaca transkrip percakapan AI (`GET /api/recordings/*`).
   - Role **Supervisor** dan **Operator Kantin** dilarang keras mengakses endpoint rekaman ini (harus ditolak HTTP 403 oleh middleware backend).

2. **Isolasi Data Multi-Tenant (Per Cabang UPT)**:
   - Backend **wajib** memfilter seluruh query data (Narapidana, Rekaman Panggilan, Transaksi, Laporan, dan Pengguna) secara otomatis berdasarkan `user.branchId` yang diekstrak dari JWT token login Kepala UPT.
   - Kepala UPT tidak boleh dapat melihat data narapidana maupun rekaman dari cabang lapas lain.

3. **Pemisahan Wewenang (Separation of Duties)**:
   - Kepala UPT fokus pada pengawasan (*supervisory & compliance*), evaluasi laporan keuangan, serta manajemen staf internal UPT.
   - Pendaftaran dan verifikasi berkas narapidana/kontak keluarga dilakukan oleh role **Supervisor**.

---

### 4. Skema Relasi Database Prisma yang Relevan

```prisma
// Model Pengguna (Kepala UPT, Supervisor, Operator Kantin)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  phone     String?
  password  String
  role      Role     @default(SUPERVISOR) // KEPALA_UPT, SUPERVISOR, CANTEEN_STAFF
  branchId  String?
  status    String   @default("Active") // Active, Inactive, Suspended
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  branch    Branch?  @relation(fields: [branchId], references: [id])

  @@index([branchId, role])
}
```
