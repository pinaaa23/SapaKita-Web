# Catatan Endpoint & Rekomendasi Backend — Revisi Per Role (PasCall)

Dokumen ini mencatat integrasi frontend ke backend, usulan endpoint baru/penyesuaian, status di BE saat ini, serta rekomendasi penegakan aturan bisnis di sisi Backend (API).

---

## 1. Usulan Endpoint & Integrasi

### A. Endpoint Panggilan Kanwil (Daftar Panggilan Seluruh UPT Binaan Kanwil)
- **Method**: `GET`
- **Path Usulan**: `/api/kanwil/calls` ATAU `GET /api/recordings?kanwilId={kanwilId}`
- **Dipakai di Halaman**: Halaman Panggilan Kanwil (`/kanwil/calls`)
- **Role**: `admin_kanwil` / `KANWIL`
- **Tujuan**: Mengambil seluruh riwayat panggilan suara & video dari semua UPT Lapas/Rutan yang berada di bawah wewenang Kantor Wilayah terkait, lengkap dengan nama/identitas UPT asal.
- **Request Parameters / Query**:
  ```json
  {
    "search": "budi",
    "status": "Answered",
    "callType": "voice",
    "branchId": "uuid-upt-tertentu", // opsional jika ingin memfilter 1 UPT spesifik
    "startDate": "2026-10-01",
    "endDate": "2026-10-31",
    "page": 1,
    "limit": 20
  }
  ```
- **Response Usulan**:
  ```json
  {
    "status": "success",
    "data": {
      "items": [
        {
          "id": "rec-uuid-1",
          "callId": "call-101",
          "branchId": "branch-uuid-1",
          "branchName": "Lapas Kelas I Cipinang",
          "inmateName": "Ahmad Supriyadi",
          "inmateId": "NIP-1001",
          "familyName": "Siti Aminah",
          "familyPhone": "08123456789",
          "duration": "05:12",
          "durationSeconds": 312,
          "status": "Answered",
          "channel": "Web",
          "cost": 15000,
          "audioUrl": "https://...",
          "transcript": "...",
          "createdAt": "2026-10-21T10:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```
- **Status di BE Saat Ini**:
  - Saat ini FE menggunakan endpoint `GET /api/recordings` (sumber yang sama dengan Kepala UPT).
  - FE membatasi data secara client-side berdasarkan daftar ID UPT binaan Kanwil yang didapatkan dari `GET /api/kanwil/branches` / `GET /api/branches`.
  - **Rekomendasi BE**: Backend sebaiknya menerapkan filter otomatis `where: { branch: { kanwilId } }` saat token akun `ADMIN_KANWIL` melakukan request, untuk efisiensi transfer data dan keamanan data isolasi per wilayah.

---

### B. Registrasi UPT Baru dengan Kanwil Induk oleh Superadmin
- **Method**: `POST`
- **Path**: `/api/branches`
- **Dipakai di Halaman**: Halaman Buat UPT Superadmin (`/branches/create`)
- **Role**: `SUPERADMIN`
- **Request Body**:
  ```json
  {
    "name": "Lapas Kelas IIA Yogyakarta",
    "kanwilId": "kanwil-uuid-yogyakarta",
    "location": "Yogyakarta",
    "address": "Jl. Tamansiswa No. 1",
    "phone": "0274-123456",
    "capacity": 500,
    "status": "Aktif",
    "headName": "Kepala Lapas Yogyakarta",
    "headEmail": "kepala.lapas-yogyakarta@pascall.id",
    "headPassword": "Password123",
    "headPhone": "0274-123456",
    "admin": {
      "name": "Kepala Lapas Yogyakarta",
      "email": "kepala.lapas-yogyakarta@pascall.id",
      "password": "Password123"
    }
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "branch-uuid",
      "name": "Lapas Kelas IIA Yogyakarta",
      "kanwilId": "kanwil-uuid-yogyakarta",
      "location": "Yogyakarta",
      "status": "Aktif",
      "createdAt": "2026-10-21T23:30:00Z"
    }
  }
  ```
- **Status di BE Saat Ini**:
  - BE (`src/modules/branch/branch.schema.ts` / Prisma) sudah mendukung relasi `kanwilId` pada entitas `Branch`!
  - Payload frontend telah disesuaikan di `buildCreateBranchPayload` untuk menyertakan `kanwilId` dari form Superadmin.

---

## 2. Catatan Penegakan Aturan Bisnis di Sisi Backend

### A. Penguncian Read-Only Role Kanwil di Backend (Security & Authorization)
- **Kondisi Frontend**:
  - Di Frontend, seluruh tombol create, edit, update, delete, switch status, toggle power, dan modal aksi pada seluruh halaman Kanwil (`/kanwil/*`) telah dinonaktifkan/dihilangkan.
  - Route `/kanwil/branches/create` telah diproteksi dan diarahkan kembali (`Navigate replace`) ke `/kanwil/branches`.
- **Rekomendasi Backend**:
  - Backend perlu menegakkan pembatasan otorisasi di middleware:
    - Akun dengan role `ADMIN_KANWIL` / `KANWIL` dilarang melakukan method mutasi: `POST`, `PUT`, `PATCH`, `DELETE` pada modul UPT (`/api/branches/*`), data WBP (`/api/inmates/*`), paket (`/api/packages/*`), dan pengguna (`/api/users/*`).
    - Jika dicoba melalui Postman/API client, BE mengembalikan HTTP `403 Forbidden` dengan pesan `"Akses hanya lihat. Kanwil tidak memiliki izin memodifikasi data."`.

### B. Validasi Wajib Tanggal Lahir (`dateOfBirth` / `birthDate`) untuk WBP
- **Kondisi Frontend**:
  - Di Form input WBP (`/branch/inmates/create`), form edit WBP (`/branch/inmates/:id/edit`), dan modal quick-edit WBP (`/branch/inmates`), field **Tanggal Lahir** telah diberi tanda bintang `*`, validasi wajib isi dengan pesan error `"Tanggal lahir wajib diisi"`, dan tombol simpan memblokir pengiriman jika kosong atau tidak valid (tidak boleh di masa depan).
- **Rekomendasi Backend**:
  - Pada schema validasi registrasi & update narapidana (`inmate.schema.ts` atau validator Zod/Joi BE):
    - Tambahkan aturan wajib (mandatory) pada field `dateOfBirth`:
      ```typescript
      dateOfBirth: z.string({ required_error: "Tanggal lahir wajib diisi" })
        .refine(val => !isNaN(Date.parse(val)), "Format tanggal lahir tidak valid")
        .refine(val => new Date(val) <= new Date(), "Tanggal lahir tidak boleh di masa depan")
      ```
    - Ini memastikan konsistensi integritas data antara FE dan BE.
