# Kebutuhan Endpoint API Back End - Web Supervisor (PasCall)

Dokumen ini merangkum seluruh hasil *cross-check* dan kebutuhan endpoint backend (BE) untuk modul antarmuka **Supervisor (SPV)** pada aplikasi PasCall. Dokumen ini disusun berdasarkan penelusuran seluruh halaman aktif pada `src/pages/branch/`, komponen `src/components/`, konfigurasi hak akses `src/config/menuConfig.js`, serta rute aplikasi `src/App.jsx`.

---

### 1. Ringkasan Modul & Hak Akses Supervisor (SPV)

Supervisor bertindak sebagai petugas operasional utama di lapas/UPT yang bertanggung jawab atas **pendaftaran warga binaan (WBP)**, verifikasi data dan kontak keluarga, persetujuan (*approval*) kontak keluarga yang diajukan, pemantauan transaksi pemakaian saldo panggilan, serta evaluasi laporan kinerja UPT.

| Modul Halaman | Rute Frontend | Fungsi & Fitur Utama |
| :--- | :--- | :--- |
| **Dashboard SPV** | `/branch/dashboard` | Statistik operasional cabang (Total Panggilan, Terjawab, Tidak Terjawab, Total WBP, Tren Panggilan, Widget Transaksi). |
| **Kelola Data Narapidana** | `/branch/inmates` | CRUD lengkap data narapidana (Pendaftaran WBP baru, edit biodata/kamar blok, status komunikasi aktif/nonaktif, reset PIN, dan daftar kontak keluarga). |
| **Persetujuan Kontak Keluarga** | `/branch/contacts` | Verifikasi berkas KTP/KK, pengajuan kontak baru, dan persetujuan (*Approval / Rejection*) nomor keluarga yang boleh dihubungi WBP. |
| **Transaksi Saldo Cabang** | `/branch/transactions` | Rekapitulasi mutasi saldo pemakaian panggilan dan pembelian paket kantin di UPT terkait serta detail struk mutasi. |
| **Laporan Kinerja UPT** | `/branch/reports` | Analitik performa cabang (omzet, volume panggilan, rata-rata durasi, persentase keberhasilan panggilan, dan ekspor laporan ke PDF). |
| **Profil & Keamanan** | `/branch/profile` | Profil akun Supervisor, ubah kontak telepon, dan fitur ganti kata sandi (*Change Password*). |

> **⚠️ Batasan Hak Akses Khusus:**
> - Role **Supervisor TIDAK MEMILIKI IZIN** untuk memutar rekaman audio/video panggilan maupun membaca transkrip percakapan AI (`/branch/recordings`). Hak akses tersebut dibatasi khusus untuk **Kepala UPT** dan **Superadmin**.
> - Role **Supervisor TIDAK MEMILIKI IZIN** untuk mengelola akun pengguna staf lapas (`/branch/users`).

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Supervisor (SPV)

| No | Modul / Fitur | Method | Path Usulan | Role Akses | Request (Field / Parameter) | Response (Field Penting) | Status di Back End |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | **Otentikasi Login** | `POST` | `/api/auth/login` | `SUPERVISOR`, `BRANCH_ADMIN`, dll. | Body: `{ identifier, password }` | `token` (JWT), `user`: `{ id, name, email, role: "SUPERVISOR", branchId, branchName }` | 🔄 **Ada (Enum Prisma perlu role `SUPERVISOR`)** |
| 2 | **Ganti Password Akun** | `POST` | `/api/auth/change-password` | `SUPERVISOR`, `BRANCH_ADMIN` | Body: `{ oldPassword, newPassword }` | `{ success: true, message: "Password berhasil diubah" }` | ⚠️ **Perlu Ditambahkan** |
| 3 | **Update Profil Petugas** | `PATCH` | `/api/users/profile` | `SUPERVISOR`, `BRANCH_ADMIN` | Body: `{ name, phone }` | `{ success: true, user: { id, name, phone, email } }` | ⚠️ **Belum Ada** |
| 4 | **Ringkasan Dashboard UPT** | `GET` | `/api/dashboard/branch-summary` | `SUPERVISOR`, `BRANCH_ADMIN` | Header: `Authorization: Bearer <token>` *(BE otomatis filter by `user.branchId`)* | `totalCalls`, `answeredCalls`, `missedCalls`, `totalInmates`, `callsGrowth`, `answeredGrowth`, `missedGrowth`, `inmatesGrowth` | ⚠️ **Belum Ada (Fallback)** |
| 5 | **Daftar Paket Komunikasi Aktif** | `GET` | `/api/packages` | `SUPERVISOR`, `BRANCH_ADMIN`, `CANTEEN_STAFF` | Query: `status: "Aktif"` | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId }]` | ⚠️ **Belum Ada** |
| 6 | **Daftar Narapidana Cabang** | `GET` | `/api/inmates` | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `search`, `status`, `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate, families: [...] }]`, `pagination` | 🔄 **Ada (Perlu otorisasi `SUPERVISOR` & filter status)** |
| 7 | **Tambah Data Narapidana Baru** | `POST` | `/api/inmates` | `SUPERVISOR` | Body: `{ identifier, name, initialPin, blockRoom, families: [{ name, relationship, phone }] }` *(BE otomatis set `branchId = user.branchId`)* | `id`, `identifier`, `name`, `branchId`, `families: [...]`, `createdAt` | 🔄 **Ada (Perlu otorisasi `SUPERVISOR` & simpan families)** |
| 8 | **Detail Profil & Kontak WBP** | `GET` | `/api/inmates/:id` | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id` (UUID / Nomor Register WBP) | `{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate, families: [{ id, name, relationship, phone, status }], branch: { id, name } }` | 🔄 **Ada (Perlu otorisasi `SUPERVISOR` & include families)** |
| 9 | **Edit Data Narapidana & Keluarga** | `PATCH` | `/api/inmates/:id` | `SUPERVISOR` | Path: `id`, Body: `{ identifier, name, initialPin, blockRoom, families: [{ id?, name, relationship, phone }] }` | `id`, `identifier`, `name`, `families: [...]`, `updatedAt` | ⚠️ **Belum Ada** |
| 10 | **Ubah Status Komunikasi WBP** | `PATCH` | `/api/inmates/:id/status` | `SUPERVISOR` | Path: `id`, Body: `{ isActive: boolean }` atau `{ commStatus: "Aktif"|"Nonaktif" }` | `id`, `identifier`, `isActive`, `commStatus`, `updatedAt` | ⚠️ **Belum Ada** |
| 11 | **Reset PIN Akun Narapidana** | `POST` | `/api/inmates/:id/reset-pin` | `SUPERVISOR` | Path: `id`, Body: `{ newPin }` | `{ success: true, message: "PIN berhasil direset", id, identifier }` | 🔄 **Ada (Perlu otorisasi `SUPERVISOR`)** |
| 12 | **Daftar Pengajuan Kontak Keluarga** | `GET` | `/api/contacts` | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `search`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, inmateId, inmateName, wbpRegNumber, contactName, phone, relationship, ktpUrl, status, createdAt }]`, `pagination` | 🔄 **Ada (Perlu relasi inmateName & filter branch)** |
| 13 | **Persetujuan Kontak Keluarga (Approval)** | `PATCH` | `/api/contacts/:id/status` | `SUPERVISOR` | Path: `id`, Body: `{ status: "APPROVED"|"REJECTED", notes: "" }` *(BE catat `approvedBy`)* | `{ id, status, approvedBy, updatedAt }` | ⚠️ **Belum Ada** |
| 14 | **Tambah Kontak Keluarga oleh Petugas** | `POST` | `/api/contacts` | `SUPERVISOR`, `BRANCH_ADMIN` | Body: `{ inmateIdentifier, relationship, ktpUrl, phone, name }` | `{ id, inmateId, name, phone, relationship, status: "PENDING", createdAt }` | 🔄 **Ada (Perlu otorisasi `SUPERVISOR`)** |
| 15 | **Daftar Mutasi Transaksi UPT** | `GET` | `/api/balance/transactions` | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `search`, `status`, `category` (`TOPUP_CASH`/`CALL_CHARGE`), `startDate`, `endDate`, `page`, `limit` *(BE filter `user.branchId`)* | `data`: `[{ id, inmateId, inmateName, amount, type, description, performedBy, status, createdAt, balanceBefore, balanceAfter }]`, `totalPemakaian`, `pagination` | ⚠️ **Belum Ada** |
| 16 | **Detail Struk Mutasi Saldo** | `GET` | `/api/balance/transactions/:id` | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id` | `{ id, amount, type, balanceBefore, balanceAfter, performedBy, user: { identifier, name }, createdAt }` | ⚠️ **Belum Ada** |
| 17 | **Laporan Kinerja & Keuangan UPT** | `GET` | `/api/reports/branch-summary` | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `period` (`7`/`30`/`90`) *(BE otomatis filter by `user.branchId`)* | `{ totalRevenue, totalCalls, avgCallDurationSeconds, successRate, revenueTrend: [...], callVolumeTrend: [...] }` | ⚠️ **Belum Ada** |

---

### 3. Poin Penting & Aturan Akses Supervisor (SPV)

1. **Penambahan Role `SUPERVISOR` di Schema Prisma & Middleware Backend**:
   - Enum `Role` pada database `schema.prisma` backend wajib memiliki nilai `SUPERVISOR`.
   - Middleware `authorizeRoles` di backend pada endpoint `/api/inmates/*` dan `/api/contacts/*` wajib mengizinkan role `SUPERVISOR`.

2. **Isolasi Data Multi-Tenant (Per Cabang UPT)**:
   - Backend **wajib** memfilter seluruh query data (Narapidana, Kontak Keluarga, Transaksi, dan Laporan) secara otomatis berdasarkan `user.branchId` dari token JWT akun Supervisor yang login.

3. **Inmate-Family Sync (Perekaman Kontak Keluarga Terverifikasi)**:
   - Saat Supervisor mendaftarkan WBP baru di `POST /api/inmates`, payload menyertakan array data keluarga (`families`).
   - Backend wajib menyimpan relasi kontak keluarga tersebut ke database agar nomor telepon keluarga langsung dapat digunakan oleh narapidana saat melakukan panggilan telepon di bilik wartel.
