# Dokumentasi Endpoint Backend (BE) - Modul Finance & Kebutuhan Akun Finance

Dokumen ini disusun untuk memberikan gambaran lengkap mengenai:
1. **Daftar endpoint yang SUDAH ADA** di modul finance (`/api/finance/*`).
2. **Ketiadaan endpoint manajemen akun** di modul finance saat ini.
3. **Hasil pengecekan endpoint `/api/users`** terhadap role `FINANCE`.
4. **Spesifikasi endpoint baru yang diusulkan** untuk diserahkan ke Tim Backend (BE).

---che

## 1. Daftar Endpoint yang SUDAH ADA di Modul Finance (`/api/finance/*`)

Berdasarkan pemeriksaan langsung pada router backend (`PasCall-BackEnd/src/modules/finance/finance.routes.ts`), saat ini terdapat **17 endpoint operasional bisnis** di bawah path `/api/finance/`:

| No | Method | Endpoint Path | Role yang Diizinkan | Deskripsi / Fungsi |
|---|---|---|---|---|
| **A** | **Dashboard & Laporan Keuangan** | | | |
| 1 | `GET` | `/api/finance/summary` | `FINANCE`, `SUPERADMIN` | Ringkasan statistik keuangan (total setoran, omzet, piutang, dll). |
| 2 | `GET` | `/api/finance/reports` | `FINANCE`, `SUPERADMIN` | Laporan transaksi dan rekapitulasi finansial bulanan/tahunan. |
| **B** | **Rekap Tagihan UPT (Billings) & Verifikasi Setoran** | | | |
| 3 | `GET` | `/api/finance/billings/pending-count` | `FINANCE`, `SUPERADMIN` | Menghitung jumlah tagihan UPT yang menunggu verifikasi. |
| 4 | `GET` | `/api/finance/billings` | `FINANCE`, `SUPERADMIN`, `KANWIL_ADMIN` | Menampilkan seluruh daftar tagihan dan setoran UPT. |
| 5 | `GET` | `/api/finance/billings/:id` | `FINANCE`, `SUPERADMIN`, Staf UPT | Melihat detail tagihan UPT tertentu. |
| 6 | `PATCH`| `/api/finance/billings/:id/approve` | `SUPERADMIN` | Menyetujui bukti transfer / pembayaran setoran UPT. |
| 7 | `PATCH`| `/api/finance/billings/:id/reject` | `SUPERADMIN` | Menolak bukti pembayaran setoran UPT. |
| 8 | `POST` | `/api/finance/billings/:id/pay` | `CANTEEN_STAFF`, `SUPERVISOR`, `BRANCH_ADMIN`, `FINANCE`, `SUPERADMIN` | Mengunggah bukti bayar / transfer setoran UPT. |
| 9 | `GET` | `/api/finance/billings/:id/proof` | `FINANCE`, `SUPERADMIN`, Staf UPT | Mengunduh / streaming file bukti transfer setoran. |
| **C** | **Kontrak Kerjasama & Bagi Hasil 4 Pihak (Contracts)** | | | |
| 10 | `GET` | `/api/finance/contracts` | `FINANCE`, `SUPERADMIN`, `KANWIL_ADMIN` | Menampilkan daftar persentase bagi hasil seluruh UPT. |
| 11 | `GET` | `/api/finance/contracts/:branchId` | `FINANCE`, `SUPERADMIN`, Staf UPT | Melihat detail kontrak bagi hasil UPT tertentu. |
| 12 | `PUT` | `/api/finance/contracts/:branchId` | `SUPERADMIN` | Memperbarui persentase bagi hasil (Pusat, Kanwil, UPT, Koperasi). |
| **D** | **Pengaturan Rekening Bank & QRIS Pusat** | | | |
| 13 | `GET` | `/api/finance/payment-settings/qris-image` | *Publik (Tanpa Token)* | Streaming gambar QRIS statis untuk tampilan struk kantin. |
| 14 | `GET` | `/api/finance/payment-settings` | `FINANCE`, `SUPERADMIN`, Seluruh Staf | Mengambil nomor rekening tujuan dan data QRIS aktif. |
| 15 | `PUT` | `/api/finance/payment-settings` | `SUPERADMIN` | Memperbarui info rekening pusat dan upload QRIS baru. |
| **E** | **Pengaturan Tarif Global (Nasional)** | | | |
| 16 | `GET` | `/api/finance/global-settings` | `FINANCE`, `SUPERADMIN`, `KANWIL_ADMIN` | Melihat tarif standar pulsa/menit telepon nasional. |
| 17 | `PUT` | `/api/finance/global-settings` | `SUPERADMIN` | Mengubah tarif standar pulsa/menit telepon nasional. |

> ⚠️ **KESIMPULAN PENTING**:
> Seluruh 17 endpoint di atas berfokus pada **operasional keuangan (billing, laporan, bagi hasil, dan rekening)**.
> **BELUM ADA endpoint untuk Manajemen Akun Admin Finance** (seperti membuat akun baru, mengubah status aktif/nonaktif, atau mengelola login tim finance pusat).

---

## 2. Perbandingan dengan Modul Lain (Pola Modul Kanwil)

Sebagai referensi, modul **Kanwil** (`/api/kanwil/*`) sudah memiliki sub-route dedikasi untuk mengelola akun admin wilayahnya sendiri:
* `GET /api/kanwil/admins`
* `POST /api/kanwil/admins`
* `POST /api/kanwil/admins/:id/reset-password`

Pola ini sangat rapi, modular, dan memisahkan antara staf cabang/UPT dengan admin entitas pusat/wilayah.

---

## 3. Status Pengecekan Modul User Umum (`/api/users/*`) terhadap Role `FINANCE`

Kami juga telah menguji modul pengguna umum (`/api/users`) untuk melihat apakah dapat dipakai sementara waktu:

| Endpoint | Status untuk Role `FINANCE` | Catatan Kendala Teknis di BE |
|---|---|---|
| `GET /api/users?role=FINANCE` | ✅ **Bisa Digunakan** | Mengembalikan daftar akun dengan role `FINANCE`. Sudah dihubungkan ke FE. |
| `POST /api/users` | ❌ **Gagal (Error 400)** | Skema validasi Zod (`createUptUserSchema`) menolak request karena hanya menerima role: `'BRANCH_ADMIN'`, `'SUPERVISOR'`, `'CANTEEN_STAFF'`. |
| `PATCH /api/users/:id/status` | ❌ **Gagal (Error 400)** | Logika di `user.service.ts` baris 434 secara eksplisit membatasi toggle status hanya untuk staf UPT: *"Hanya akun staf yang dapat diubah statusnya"*. |
| `POST /api/users/:id/reset-password` | ⚠️ **Bisa (Khusus Superadmin)** | Superadmin dapat mereset password akun finance karena memiliki flag `canAccessBranch = true`. |

---

## 4. Usulan Solusi untuk Tim Backend (BE)

Tim BE disarankan mengadopsi salah satu dari dua opsi berikut:

### OPSI A: Tambah Grup Endpoint Dedikasi di Modul Finance (SANGAT DIREKOMENDASIKAN)
Tambahkan rute berikut ke dalam `PasCall-BackEnd/src/modules/finance/finance.routes.ts`:

#### 1. `GET /api/finance/admins`
* **Deskripsi**: Mengambil daftar seluruh akun tim Finance pusat.
* **Otorisasi**: `Role.SUPERADMIN`
* **Query Params**:
  * `search` (opsional): cari berdasarkan nama atau email
  * `status` (opsional): filter `'Aktif'` atau `'Nonaktif'`
* **Contoh Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar Akun Finance berhasil diambil",
  "data": [
    {
      "id": "88ba2074-df28-4ed2-a032-4a2c87c36f88",
      "name": "Dewi Lestari (Finance)",
      "email": "finance@sadewa.id",
      "phone": "081298765432",
      "role": "FINANCE",
      "branchId": null,
      "isActive": true,
      "status": "Aktif",
      "createdAt": "2026-10-27T11:36:42.512Z",
      "updatedAt": "2026-11-02T10:02:39.166Z"
    }
  ]
}
```

#### 2. `POST /api/finance/admins`
* **Deskripsi**: Mendaftarkan akun tim Finance baru. Akun ini tidak terikat ke branch manapun (`branchId: null`).
* **Otorisasi**: `Role.SUPERADMIN`
* **Request Body**:
```json
{
  "name": "Siti Rahmawati",
  "email": "finance.siti@sadewa.id",
  "phone": "081234567890",
  "password": "passwordAman123",
  "status": "Aktif"
}
```
* **Contoh Response (201 Created)**:
```json
{
  "success": true,
  "message": "Akun Finance berhasil dibuat",
  "data": {
    "id": "c1f7a28e-39df-4a61-9c12-38d1726a8219",
    "name": "Siti Rahmawati",
    "email": "finance.siti@sadewa.id",
    "phone": "081234567890",
    "role": "FINANCE",
    "branchId": null,
    "isActive": true,
    "status": "Aktif",
    "createdAt": "2026-11-02T10:15:00.000Z"
  }
}
```

#### 3. `PATCH /api/finance/admins/:id/status`
* **Deskripsi**: Mengubah status aktif / nonaktif akun Finance.
* **Otorisasi**: `Role.SUPERADMIN`
* **Request Body**:
```json
{
  "status": "Nonaktif",
  "isActive": false
}
```
* **Contoh Response (200 OK)**:
```json
{
  "success": true,
  "message": "Status akun Finance berhasil diubah menjadi 'Nonaktif'",
  "data": {
    "id": "c1f7a28e-39df-4a61-9c12-38d1726a8219",
    "isActive": false,
    "status": "Nonaktif"
  }
}
```

#### 4. `POST /api/finance/admins/:id/reset-password`
* **Deskripsi**: Mereset kata sandi akun Finance.
* **Otorisasi**: `Role.SUPERADMIN`
* **Request Body**:
```json
{
  "newPassword": "passwordBaru123"
}
```
* **Contoh Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password akun Finance berhasil diperbarui",
  "data": {
    "id": "c1f7a28e-39df-4a61-9c12-38d1726a8219",
    "email": "finance.siti@sadewa.id",
    "name": "Siti Rahmawati"
  }
}
```

---

### OPSI B: Memperbarui Logika di Modul `/api/users` (Solusi Cepat)
Jika tim BE memilih untuk menyatukan seluruh pengelolaan akun di bawah `/api/users`, lakukan 3 penyesuaian:
1. **`src/modules/user/user.dto.ts`**:
   Tambahkan `'FINANCE'` pada enum skema validasi pembuatan akun (`createUptUserSchema`):
   ```ts
   role: z.enum(['BRANCH_ADMIN', 'SUPERVISOR', 'CANTEEN_STAFF', 'FINANCE'])
   ```
2. **`src/modules/user/user.service.ts` (`createUser`)**:
   Jika role adalah `Role.FINANCE`, izinkan `branchId: null` tanpa memunculkan error UPT wajib diisi.
3. **`src/modules/user/user.service.ts` (`toggleUserStatus`)**:
   Sertakan `Role.FINANCE` pada baris pengecekan role staf (baris ~434) agar tidak melempar error *"Hanya akun staf yang dapat diubah statusnya"*.

---

## 5. Status Integrasi di Frontend (FE) - TERHUBUNG ✅

Sisi Frontend Sadewa sudah **100% terhubung secara langsung** ke endpoint backend:
* **Halaman**: `PasCall/src/pages/finance/FinanceAccounts.jsx` (Akses URL: `/finance-accounts` khusus Superadmin).
* **Service**: `PasCall/src/services/financeAccountService.js`.
* **Status Koneksi Endpoint**:
  1. `GET /api/finance/admins`: ✅ **Terhubung langsung** (mendukung query filter `search` & `status`).
  2. `POST /api/finance/admins`: ✅ **Terhubung langsung** (payload `{ name, email, phone, password, status, isActive }`).
  3. `PATCH /api/finance/admins/:id/status`: ✅ **Terhubung langsung** (payload `{ status, isActive }`).
  4. `POST /api/finance/admins/:id/reset-password`: ✅ **Terhubung langsung** (payload `{ newPassword }`).
  5. `PATCH /api/finance/admins/:id`: ✅ **Tersedia** untuk update data admin.
  6. `DELETE /api/finance/admins/:id`: ✅ **Tersedia** untuk hapus akun admin.
* **Mekanisme Ketahanan (Resilience)**:
  * Dilengkapi validasi penangkapan error server langsung dari backend (seperti error email duplikat atau password kurang dari 6 karakter).
  * Dilengkapi fallback data lokal/offline bila server backend sedang dalam maintenance.
