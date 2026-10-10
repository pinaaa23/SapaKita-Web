# Kebutuhan Endpoint API Back End - Web Superadmin (PasCall)

Dokumen ini merangkum seluruh hasil *cross-check* dan kebutuhan endpoint backend (BE) untuk modul antarmuka **Super Administrator (Superadmin)** pada aplikasi PasCall. Dokumen ini disusun berdasarkan penelusuran seluruh halaman aktif pada `src/pages/`, komponen `src/components/`, layanan `src/services/`, konfigurasi hak akses `src/config/menuConfig.js`, serta rute aplikasi `src/App.jsx`.

---

### 1. Ringkasan Modul & Hak Akses Superadmin

Superadmin memiliki hak akses tertinggi di tingkat nasional untuk mengelola seluruh UPT/Lapas di Indonesia, memantau seluruh warga binaan, memutar dan menganalisis rekaman panggilan suara/video nasional, menetapkan tarif paket komunikasi, menyetujui pengisian saldo menit kantin, serta melihat laporan keuangan dan performa agregat nasional.

| Modul Halaman | Rute Frontend | Fungsi & Fitur Utama |
| :--- | :--- | :--- |
| **Dashboard Nasional** | `/dashboard` | Ringkasan statistik nasional (Total Panggilan, Total Omzet, UPT Aktif, Persentase Keberhasilan Panggilan, Tren Omzet & Volume). |
| **Kelola UPT / Cabang** | `/branches` | CRUD data UPT Lapas/Rutan se-Indonesia, penambahan akun Kepala UPT, kapasitas hunian, dan status operasional. |
| **Data Narapidana Nasional** | `/inmates` | Monitoring direktori data narapidana dari seluruh UPT (pencarian, filter UPT, filter status, dan detail profil WBP). |
| **Panggilan & Rekaman** | `/calls` | Monitoring seluruh panggilan nasional, pemutar audio rekaman (*streaming*), dan pembacaan transkrip percakapan WBP. |
| **Transaksi Saldo** | `/transactions` | Monitoring rekapitulasi mutasi saldo pemakaian panggilan dan top up kantin dari seluruh cabang UPT. |
| **Kelola Paket Komunikasi** | `/packages` | Master data paket telepon & video call (nama paket, durasi menit, tarif harga IDR, dan toggle status aktif/nonaktif). |
| **Top Up Saldo Kantin** | `/canteen-topup` | Approval & rejection permintaan pengisian kuota menit kantin lapas, verifikasi bukti transfer, dan ringkasan PPN. |
| **Laporan Agregat Nasional** | `/reports` | Analitik kinerja nasional, kepatuhan rekaman panggilan, tren pendapatan, dan ekspor laporan ke PDF/Excel. |
| **Profil & Keamanan** | `/profile` | Informasi profil akun Superadmin dan fitur ubah kata sandi (*Change Password*). |

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Superadmin

| No | Modul / Fitur | Method | Path Usulan | Role Akses | Request (Field / Parameter) | Response (Field Penting) | Status di Back End |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | **Otentikasi Login** | `POST` | `/api/auth/login` | `SUPERADMIN` | Body: `{ identifier, password }` | `token` (JWT), `user`: `{ id, name, email, role: "SUPERADMIN" }` | ✅ **Sudah Ada** |
| 2 | **Ganti Password** | `POST` | `/api/auth/change-password` | `SUPERADMIN` | Body: `{ oldPassword, newPassword }` | `{ success: true, message: "Password berhasil diubah" }` | ⚠️ **Perlu Ditambahkan** |
| 3 | **Dashboard Summary** | `GET` | `/api/dashboard/summary` | `SUPERADMIN` | Header: `Authorization: Bearer <token>` | `totalCalls`, `totalRevenue`, `activeBranches`, `successRate`, `revenueTrend: [...]`, `callVolumeTrend: [...]`, `callsGrowth`, `revenueGrowth` | ⚠️ **Belum Ada** |
| 4 | **Daftar UPT / Cabang** | `GET` | `/api/branches` | `SUPERADMIN` | Query: `search`, `page`, `limit` | `data`: `[{ id, name, location, address, phone, capacity, inmateCount, adminCount, status, isActive, createdAt }]`, `pagination` | ⚠️ **Belum Ada (Mock)** |
| 5 | **Tambah UPT & Kepala UPT** | `POST` | `/api/branches` | `SUPERADMIN` | Body: `{ name, location, address, phone, capacity, status, admin: { name, email, password } }` | `{ id, name, location, address, phone, capacity, status, createdAt, admin: { id, email } }` | ⚠️ **Belum Ada (Mock)** |
| 6 | **Detail UPT** | `GET` | `/api/branches/:id` | `SUPERADMIN` | Path: `id` | `{ id, name, location, address, phone, capacity, inmateCount, admins: [...] }` | ⚠️ **Belum Ada (Mock)** |
| 7 | **Edit Data UPT** | `PATCH` | `/api/branches/:id` | `SUPERADMIN` | Path: `id`, Body: `{ name, location, address, phone, capacity, status }` | `{ id, name, location, address, phone, capacity, status, updatedAt }` | ⚠️ **Belum Ada (Mock)** |
| 8 | **Hapus UPT** | `DELETE` | `/api/branches/:id` | `SUPERADMIN` | Path: `id` | `{ success: true, message: "UPT berhasil dihapus" }` | ⚠️ **Belum Ada (Mock)** |
| 9 | **Daftar WBP Nasional** | `GET` | `/api/inmates` | `SUPERADMIN` | Query: `search`, `branchId`, `status`, `page`, `limit` | `data`: `[{ id, identifier, name, branchId, branchName, callBalance, status, commStatus, entryDate }]`, `pagination` | 🔄 **Ada (Perlu Filter branchId & status)** |
| 10 | **Detail WBP** | `GET` | `/api/inmates/:id` | `SUPERADMIN` | Path: `id` (UUID / NIP) | `{ id, identifier, name, callBalance, blockRoom, status, commStatus, entryDate, branch: { id, name }, families: [...] }` | ✅ **Sudah Ada** |
| 11 | **Daftar Panggilan & Rekaman** | `GET` | `/api/recordings` | `SUPERADMIN` | Query: `search`, `branchId`, `status`, `callType`, `startDate`, `endDate`, `page`, `limit` | `data`: `[{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { inmate, family, durationSeconds, branchName } }]`, `pagination` | ✅ **Sudah Ada** |
| 12 | **Detail Rekaman & Transkrip** | `GET` | `/api/recordings/:id` | `SUPERADMIN` | Path: `id` | `{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { ... } }` | ✅ **Sudah Ada** |
| 13 | **Stream URL Audio Rekaman** | `GET` | `/api/recordings/:id/stream-url` | `SUPERADMIN` | Path: `id` | `{ streamUrl, directStreamUrl, expiresInSeconds }` | ✅ **Sudah Ada** |
| 14 | **Daftar Mutasi Transaksi Saldo** | `GET` | `/api/balance/transactions` | `SUPERADMIN` | Query: `search`, `branchId`, `category`, `status`, `startDate`, `endDate`, `page`, `limit` | `data`: `[{ id, inmateId, inmateName, amount, category, description, officerName, method, status, date, balanceBefore, balanceAfter }]`, `totalPemakaian`, `pagination` | ⚠️ **Belum Ada** |
| 15 | **Detail Mutasi Saldo** | `GET` | `/api/balance/transactions/:id` | `SUPERADMIN` | Path: `id` | `{ id, inmateId, inmateName, amount, type, balanceBefore, balanceAfter, date, description, officerName }` | ⚠️ **Belum Ada** |
| 16 | **Daftar Paket Komunikasi** | `GET` | `/api/packages` | `SUPERADMIN`, `CANTEEN_STAFF` | Query: `kategori` (`telepon`/`video`), `status` (`Aktif`/`Nonaktif`), `search` | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId, createdAt }]` | ⚠️ **Belum Ada** |
| 17 | **Tambah Paket Komunikasi** | `POST` | `/api/packages` | `SUPERADMIN` | Body: `{ nama, kategori, durasi, harga, status }` | `{ id, nama, kategori, durasi, harga, status, createdAt }` | ⚠️ **Belum Ada** |
| 18 | **Edit Paket Komunikasi** | `PATCH` | `/api/packages/:id` | `SUPERADMIN` | Path: `id`, Body: `{ nama, kategori, durasi, harga, status }` | `{ id, nama, kategori, durasi, harga, status, updatedAt }` | ⚠️ **Belum Ada** |
| 19 | **Ubah Status Paket** | `PATCH` | `/api/packages/:id/status` | `SUPERADMIN` | Path: `id`, Body: `{ status: "Aktif"|"Nonaktif" }` atau `{ isActive: boolean }` | `{ id, nama, status, isActive, updatedAt }` | ⚠️ **Belum Ada** |
| 20 | **Hapus Paket Komunikasi** | `DELETE` | `/api/packages/:id` | `SUPERADMIN` | Path: `id` | `{ success: true, message: "Paket berhasil dihapus" }` | ⚠️ **Belum Ada** |
| 21 | **Ringkasan Top Up Kantin** | `GET` | `/api/canteen/topup/summary` | `SUPERADMIN` | Header: `Authorization: Bearer <token>` | `{ totalSaldoTerjual: 125000000, totalPpn: 13750000, totalTopupCount: 142, totalPending: 3 }` | ⚠️ **Belum Ada** |
| 22 | **Riwayat Pengajuan Top Up Kantin** | `GET` | `/api/canteen/topups` | `SUPERADMIN` | Query: `search`, `branchId`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `page`, `limit` | `data`: `[{ id, branchId, branchName, cashierName, nominal, minutes, bankTarget, proofUrl, status, createdAt, approvedAt, approvedBy, rejectReason }]`, `pagination` | ⚠️ **Belum Ada** |
| 23 | **Setujui Top Up Kantin (Approval)** | `PATCH` | `/api/canteen/topups/:id/approve` | `SUPERADMIN` | Path: `id`, Body: `{ notes: "" }` *(BE otomatis menambahkan saldo menit ke kantin UPT terkait)* | `{ success: true, message: "Top up kantin berhasil disetujui", id, status: "APPROVED", approvedAt }` | ⚠️ **Belum Ada** |
| 24 | **Tolak Top Up Kantin (Reject)** | `PATCH` | `/api/canteen/topups/:id/reject` | `SUPERADMIN` | Path: `id`, Body: `{ reason: "Bukti transfer tidak valid/kabur" }` | `{ success: true, message: "Top up kantin ditolak", id, status: "REJECTED", rejectReason }` | ⚠️ **Belum Ada** |
| 25 | **Laporan Kinerja & Keuangan Agregat** | `GET` | `/api/reports/summary` | `SUPERADMIN` | Query: `period` (`7`/`30`/`90`), `branchId` (opsional jika ingin filter UPT) | `{ totalRevenue, totalCalls, avgCallDurationSeconds, successRate, revenueTrend: [...], callVolumeTrend: [...], compliance: { recordedRate, avgSearchTime } }` | ⚠️ **Belum Ada** |
| 26 | **Daftar Seluruh Pengguna Sistem** | `GET` | `/api/users` | `SUPERADMIN` | Query: `search`, `branchId`, `role` (`KEPALA_UPT`/`SUPERVISOR`/`CANTEEN_STAFF`), `page`, `limit` | `data`: `[{ id, name, email, role, branchId, branchName, status, createdAt }]`, `pagination` | ⚠️ **Belum Ada** |
| 27 | **Reset Password Pengguna** | `POST` | `/api/users/:id/reset-password` | `SUPERADMIN` | Path: `id`, Body: `{ temporaryPassword: "" }` | `{ success: true, message: "Password pengguna berhasil direset", newTemporaryPassword }` | ⚠️ **Belum Ada** |

---

### 3. Poin Penting & Aturan Akses Superadmin

1. **Akses Global (Nasional Tanpa Filter Branch Otomatis)**:
   - Berbeda dengan role Kepala UPT atau Supervisor yang otomatis dikunci ke `branchId` mereka, **Superadmin berhak melihat seluruh data dari seluruh UPT Lapas/Rutan**.
   - Parameter `branchId` pada query bersifat opsional dan hanya dipakai jika Superadmin secara manual memilih filter cabang tertentu di antarmuka.

2. **Pengelolaan Tarif Paket & Sinkronisasi ke Kantin**:
   - Master tarif paket komunikasi telepon dan video call dikelola secara terpusat oleh Superadmin pada menu `/packages`.
   - Seluruh paket dengan status `Aktif` akan langsung muncul di katalog kasir kantin (`/kantin`) seluruh lapas di Indonesia.

3. **Verifikasi & Approval Pengisian Saldo Kantin**:
   - Ketika kasir kantin mengajukan top up saldo menit di `/kantin/top-up-saldo`, transaksi berstatus `PENDING` masuk ke menu `/canteen-topup` Superadmin.
   - Saat Superadmin menekan tombol **Setujui (Approve)** melalui `PATCH /api/canteen/topups/:id/approve`:
     - Status transaksi berubah menjadi `APPROVED`.
     - Backend otomatis menambahkan kuota saldo menit (`balanceMinutes`) pada model `CanteenBalance` cabang UPT terkait.
     - Backend mengirimkan notifikasi ke Operator Kantin cabang terkait.
   - Saat Superadmin menekan tombol **Tolak (Reject)** melalui `PATCH /api/canteen/topups/:id/reject`:
     - Status transaksi berubah menjadi `REJECTED` beserta alasan penolakan (`rejectReason`).
     - Tidak ada penambahan saldo menit.

---

### 4. Skema Tabel Tambahan yang Diperlukan di Prisma

```prisma
// 1. Model UPT / Cabang
model Branch {
  id        String   @id @default(uuid())
  name      String   // Contoh: "Lapas Kelas I Cipinang"
  location  String   // Kota / Wilayah
  address   String?
  phone     String?
  capacity  Int      @default(500)
  status    String   @default("Active") // Active / Inactive
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  inmates   Inmate[]
  packages  Package[]
}

// 2. Model Paket Komunikasi
model Package {
  id        String   @id @default(uuid())
  branchId  String?  // null jika berlaku nasional
  nama      String   // Contoh: "Paket Telepon 12 Menit"
  kategori  String   // "telepon" atau "video"
  durasi    Int      // Durasi dalam menit
  harga     Decimal  @db.Decimal(12, 2)
  status    String   @default("Aktif") // "Aktif" atau "Nonaktif"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  branch    Branch?  @relation(fields: [branchId], references: [id])

  @@index([branchId, status])
}

// 3. Model Pengajuan Top Up Saldo Kantin
model CanteenTopupRequest {
  id           String    @id @default(uuid())
  branchId     String
  cashierId    String
  nominal      Decimal   @db.Decimal(12, 2) // Contoh: 500000
  minutes      Int       // Contoh: 1000
  bankTarget   String    // Rekening tujuan
  proofUrl     String    // Foto bukti transfer
  status       String    @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedBy   String?
  approvedAt   DateTime?
  rejectReason String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([branchId, status])
}
```
