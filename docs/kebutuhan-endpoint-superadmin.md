# Kebutuhan Endpoint API Back End untuk Superadmin (PasCall)

Dokumen ini mencantumkan daftar endpoint Back End yang dibutuhkan oleh modul Superadmin pada Front End PasCall.

---

### Tabel Ringkasan Endpoint

| No | Fitur | Method + URL | Data yang Dikirim (Request) | Data yang Diharapkan Kembali (Response) | Status Saat Ini |
|---|---|---|---|---|---|
| 1 | **Daftar UPT / Cabang** | `GET /api/branches` | Query: `search`, `page`, `limit` | `{ success: true, data: [{ id, name, location, address, phone, capacity, inmateCount, adminCount, status, isActive, createdAt }], pagination: { total, page, totalPages } }` | ⚠️ Masih Pakai Data Sementara FE (`localStorage`) |
| 2 | **Tambah UPT & Akun Kepala UPT** | `POST /api/branches` | Body: `{ name, location, address, phone, capacity, status, admin: { email, password } }` | `{ success: true, message: "UPT berhasil dibuat", data: { id, name, ... } }` | ⚠️ Masih Pakai Data Sementara FE (`localStorage`) |
| 3 | **Detail UPT** | `GET /api/branches/:id` | Params: `id` | `{ success: true, data: { id, name, location, address, phone, capacity, inmateCount, admins: [...] } }` | ⚠️ Masih Pakai Data Sementara FE (`localStorage`) |
| 4 | **Ubah Data UPT** | `PATCH /api/branches/:id` | Params: `id`, Body: `{ name, location, address, phone, capacity, status }` | `{ success: true, message: "UPT berhasil diperbarui", data: { ... } }` | ⚠️ Masih Pakai Data Sementara FE (`localStorage`) |
| 5 | **Hapus UPT** | `DELETE /api/branches/:id` | Params: `id` | `{ success: true, message: "UPT berhasil dihapus" }` | ⚠️ Masih Pakai Data Sementara FE (`localStorage`) |
| 6 | **Daftar Narapidana (Nasional)** | `GET /api/inmates` | Query: `search`, `page`, `limit`, `branchId`, `status` | `{ success: true, data: [{ id, identifier, name, branchId, branchName, callBalance, status, commStatus, entryDate }], pagination: { total, page, totalPages } }` | 🔄 Sudah Ada di BE (tapi BE belum mendukung filter `branchId` & `status`) |
| 7 | **Tambah Data Narapidana** | `POST /api/inmates` | Body: `{ identifier, name, initialPin, branchId }` | `{ success: true, message: "WBP berhasil didaftarkan", data: { id, identifier, name, ... } }` | 🔄 Sudah Ada di BE |
| 8 | **Daftar Rekaman & Transkrip** | `GET /api/recordings` | Query: `search`, `page`, `limit`, `status`, `startDate`, `endDate`, `branchId` | `{ success: true, data: [{ id, callId, storageUrl, transcriptText, transcriptStatus, call: { inmate, family, durationSeconds } }], pagination: { total, page, totalPages } }` | ✅ Sudah Ada di BE |
| 9 | **Detail Rekaman & Transkrip** | `GET /api/recordings/:id` | Params: `id` | `{ success: true, data: { id, transcriptText, transcriptStatus, call: { ... } } }` | ✅ Sudah Ada di BE |
| 10 | **Stream Audio Rekaman** | `GET /api/recordings/:id/stream-url` | Params: `id` | `{ success: true, data: { streamUrl, directStreamUrl, expiresInSeconds } }` | ✅ Sudah Ada di BE |
| 11 | **Ringkasan Dashboard Superadmin** | `GET /api/dashboard/summary` | Header: `Authorization: Bearer <token>` | `{ success: true, data: { totalCalls, totalRevenue, activeBranches, successRate, revenueTrend: [...], callVolume: [...], callsGrowth, revenueGrowth } }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |
| 12 | **Daftar Mutasi / Transaksi Saldo** | `GET /api/balance/transactions` | Query: `search`, `branchId`, `category`, `status`, `startDate`, `endDate`, `page`, `limit` | `{ success: true, data: [{ id, inmateId, inmateName, amount, category, description, officerName, method, status, date, balanceBefore, balanceAfter }], totalPemakaian, pagination }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |
| 13 | **Detail Transaksi Saldo** | `GET /api/balance/transactions/:id` | Params: `id` | `{ success: true, data: { id, amount, description, ... } }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |
| 14 | **Laporan Agregat Nasional** | `GET /api/reports/summary` | Query: `period` (7, 30, 90) | `{ success: true, data: { totalRevenue, totalCalls, avgCallDurationSeconds, successRate, revenueTrend: [...], callVolumeTrend: [...], compliance: { recordedRate, avgSearchTime } } }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |
| 15 | **Daftar Pengguna / Admin UPT** | `GET /api/users` | Query: `branchId`, `role`, `search`, `page`, `limit` | `{ success: true, data: [{ id, name, email, role, branchId, status }], pagination }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |
| 16 | **Reset Password Admin UPT** | `POST /api/users/:id/reset-password` | Params: `id` | `{ success: true, message: "Password berhasil direset", data: { newTemporaryPassword } }` | ⚠️ Belum Ada di BE (Fallback Mock FE) |

---

### Catatan Tambahan untuk Integrasi BE
1. **Pemisahan Akses Role**:
   - Superadmin berhak melihat semua data dari seluruh cabang (tidak dibatasi oleh `branchId`).
   - Branch Admin (Kepala UPT) otomatis difilter hanya melihat data UPT miliknya (`where: { branchId: user.branchId }`).
2. **Format Response Standar**:
   - Response sukses: `{ success: true, message?: string, data: any, pagination?: { page, limit, total, totalPages } }`.
   - Response gagal: `{ success: false, message: string, errors?: any }`.
