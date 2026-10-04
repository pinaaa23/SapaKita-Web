# Kebutuhan Endpoint API Back End - Web Supervisor (PasCall)

Dokumen ini merangkum seluruh kebutuhan endpoint backend (BE) untuk modul antarmuka **Supervisor (SPV)** pada aplikasi PasCall. Dokumen ini disusun berdasarkan penelusuran kode frontend (FE) aktif pada `src/pages/branch`, `src/config/menuConfig.js`, `src/App.jsx`, dan `src/services`, serta telah dicocokkan dengan kode aktif di `PasCall-BackEnd`.

---

### 1. Ringkasan Status Kebutuhan Endpoint

Dari total **18 endpoint** yang dibutuhkan untuk modul Supervisor:
- **ADA**: **0 endpoint**
- **ADA (Perlu Tambahan)**: **7 endpoint** (Otentikasi login, pendaftaran & detail WBP, reset PIN WBP, dan modul kontak keluarga — endpoint sudah ada di BE namun `authorizeRoles` dan enum `Role` di Prisma belum mengizinkan role `SUPERVISOR`).
- **BELUM ADA**: **11 endpoint** (Ringkasan statistik dashboard UPT, CRUD & status paket komunikasi, update data/status narapidana, persetujuan status kontak keluarga, riwayat & detail mutasi transaksi saldo, serta laporan kinerja UPT).

> **Catatan Hak Akses Khusus:**
> Role **Supervisor TIDAK memiliki izin** untuk memutar maupun menyalin transkrip rekaman panggilan suara/video (`GET /api/recordings/:id/stream` dan `GET /api/recordings/:id/stream-url`). Hak akses tersebut khusus dibatasi untuk **Kepala UPT** dan **Superadmin**.

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Supervisor (SPV)

| Method | Path Usulan | Dipakai di Halaman | Role Akses | Request (Field Penting) | Response (Field Penting) | Status di Back End |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login (`/login`) | Semua Role (`SUPERVISOR`, `BRANCH_ADMIN`, `SUPERADMIN`, dll.) | Body: `identifier` / `email`, `password` | `token` (JWT), `user`: `{ id, name, role, branchId, branchName }` | **ADA (perlu tambahan)** *(Enum `Role` di `schema.prisma` belum memuat `SUPERVISOR`)* |
| `GET` | `/api/dashboard/branch-summary` | Dashboard Supervisor (`/branch/dashboard`) | `SUPERVISOR`, `BRANCH_ADMIN` | Header: `Authorization: Bearer <token>` *(BE otomatis filter by `user.branchId`)* | `totalCalls`, `answeredCalls`, `missedCalls`, `totalInmates`, `callsGrowth`, `answeredGrowth`, `missedGrowth`, `inmatesGrowth` | **BELUM ADA** *(Saat ini FE menampilkan `-` / fallback)* |
| `GET` | `/api/packages` | Kelola Paket (`/branch/packages`), Widget Dashboard SPV, & Web Kantin (`/kantin`) | `SUPERVISOR`, `BRANCH_ADMIN`, `CANTEEN_STAFF` | Query: `branchId`, `kategori` (`telepon`/`video`), `status` (`Aktif`/`Nonaktif`), `search` *(BE otomatis filter by `user.branchId`)* | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId, createdAt }]` | **BELUM ADA** *(Tabel/model paket belum ada di Prisma)* |
| `POST` | `/api/packages` | Tambah Paket Komunikasi (`/branch/packages`) | `SUPERVISOR`, `BRANCH_ADMIN` | Body: `nama`, `kategori` (`telepon`/`video`), `durasi` (menit), `harga` (IDR), `status` (`Aktif`/`Nonaktif`) *(BE set `branchId` dari user login)* | `id`, `nama`, `kategori`, `durasi`, `harga`, `status`, `branchId`, `createdAt` | **BELUM ADA** |
| `PATCH` | `/api/packages/:id` | Edit Data & Tarif Paket (`/branch/packages`) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id`, Body: `nama`, `kategori`, `durasi`, `harga`, `status` | `id`, `nama`, `kategori`, `durasi`, `harga`, `status`, `updatedAt` | **BELUM ADA** |
| `PATCH` | `/api/packages/:id/status` | Aktifkan / Nonaktifkan Paket (`/branch/packages`) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id`, Body: `status` (`Aktif`/`Nonaktif`) atau `isActive` (`boolean`) | `id`, `nama`, `status`, `updatedAt` | **BELUM ADA** |
| `GET` | `/api/inmates` | Data Narapidana (`/branch/inmates`, `/inmates`) | `SUPERVISOR`, `BRANCH_ADMIN`, `SUPERADMIN` *(Hanya Lihat)* | Query: `search`, `page`, `limit`, `status` *(BE filter `branchId`)* | `data`: `[{ id, identifier, name, initialPin, callBalance, blockRoom, status, commStatus, entryDate, families: [{ id, name, relationship, phone }] }]`, `pagination` | **ADA (perlu tambahan)** *(authorizeRoles di `inmate.routes.ts` belum mengizinkan `SUPERVISOR`, query filter `status` belum didukung, serta perlu include array `families`)* |
| `POST` | `/api/inmates` | Tambah Narapidana (`/branch/inmates/create`) | `SUPERVISOR`, `BRANCH_ADMIN` *(Khusus Ubah/Tambah)* | Body: `identifier`, `name`, `initialPin`, `blockRoom`, `families`: `[{ name, relationship, phone }]` *(BE otomatis set `branchId`)* | `id`, `identifier`, `name`, `branchId`, `families`: `[...]`, `createdAt` | **ADA (perlu tambahan)** *(authorizeRoles di `inmate.routes.ts` belum mengizinkan `SUPERVISOR` & belum menyimpan array `families`)* |
| `GET` | `/api/inmates/:id` | Detail Narapidana (`/branch/inmates/:id`, `/inmates/:id`) | `SUPERVISOR`, `BRANCH_ADMIN`, `SUPERADMIN` *(Hanya Lihat)* | Path: `id` (UUID atau Nomor Register WBP) | `id`, `identifier`, `name`, `callBalance`, `blockRoom`, `status`, `commStatus`, `entryDate`, `families`: `[{ id, name, relationship, phone }]`, `branch`: `{ id, name }` | **ADA (perlu tambahan)** *(authorizeRoles di `inmate.routes.ts` belum mengizinkan `SUPERVISOR` & perlu relasi `families`)* |
| `PATCH` | `/api/inmates/:id` | Edit Data Narapidana & Keluarga (`/branch/inmates/:id/edit`, modal) | `SUPERVISOR`, `BRANCH_ADMIN` *(Khusus SPV)* | Path: `id`, Body: `identifier`, `name`, `initialPin`, `blockRoom`, `families`: `[{ id?, name, relationship, phone }]` | `id`, `identifier`, `name`, `families`: `[...]`, `updatedAt` | **BELUM ADA** *(Endpoint update WBP dan sinkronisasi keluarga belum dibuat di `inmate.routes.ts`)* |
| `PATCH` | `/api/inmates/:id/status` | Ubah Status Komunikasi WBP (`/branch/inmates`) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id`, Body: `isActive` (`boolean`) atau `commStatus` (`Aktif`/`Nonaktif`) | `id`, `identifier`, `isActive`, `commStatus`, `updatedAt` | **BELUM ADA** |
| `POST` | `/api/inmates/:id/reset-pin` | Reset PIN Akun Narapidana (`/branch/inmates`) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id`, Body: `initialPin` / `newPin` | `message`: "PIN berhasil direset", `id`, `identifier` | **ADA (perlu tambahan)** *(Rute sudah ada di `inmate.routes.ts`, namun authorizeRoles belum mengizinkan `SUPERVISOR`)* |
| `GET` | `/api/inmates/:id/families` | Daftar Kontak Keluarga WBP (Detail & Modal) | `SUPERVISOR`, `BRANCH_ADMIN`, `SUPERADMIN` *(Hanya Lihat)* | Path: `id` | `data`: `[{ id, inmateId, name, relationship, phone, createdAt }]` | **BELUM ADA** *(Alternatif jika data keluarga diakses tersendiri)* |
| `POST` | `/api/inmates/:id/families` | Tambah Kontak Keluarga WBP | `SUPERVISOR`, `BRANCH_ADMIN` *(Khusus SPV)* | Path: `id`, Body: `name`, `relationship`, `phone` | `id`, `inmateId`, `name`, `relationship`, `phone`, `createdAt` | **BELUM ADA** |
| `PUT` | `/api/inmates/:id/families` | Perbarui Seluruh Kontak Keluarga WBP (Batch Replace) | `SUPERVISOR`, `BRANCH_ADMIN` *(Khusus SPV)* | Path: `id`, Body: `families`: `[{ id?, name, relationship, phone }]` | `data`: `[{ id, name, relationship, phone }]` | **BELUM ADA** |
| `DELETE` | `/api/inmates/:id/families/:familyId` | Hapus Kontak Keluarga WBP | `SUPERVISOR`, `BRANCH_ADMIN` *(Khusus SPV)* | Path: `id`, `familyId` | `message`: "Keluarga berhasil dihapus", `id` | **BELUM ADA** |
| `GET` | `/api/contacts` | Daftar Pengajuan Kontak (`/branch/contacts`) | `SUPERVISOR`, `BRANCH_ADMIN`, `SUPERADMIN` | Query: `search`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `page`, `limit` *(BE otomatis filter by `user.branchId`)* | `data`: `[{ id, inmateId, inmateName, wbpRegNumber, contactName, phone, relationship, ktpUrl, status, createdAt }]`, `pagination` | **ADA (perlu tambahan)** *(Rute ada di `contact.routes.ts`, perlu filter UPT & field relasi nama WBP)* |
| `POST` | `/api/contacts` | Ajukan Kontak Baru oleh Petugas (`/branch/contacts`) | `SUPERVISOR`, `BRANCH_ADMIN`, `INMATE` | Body: `inmateIdentifier`, `relationship`, `ktpUrl`, `phone`, `name` | `id`, `inmateId`, `name`, `phone`, `relationship`, `status`: `PENDING`, `createdAt` | **ADA (perlu tambahan)** *(authorizeRoles di `contact.routes.ts` belum mengizinkan `SUPERVISOR`)* |
| `PATCH` | `/api/contacts/:id/status` | Persetujuan Kontak Keluarga (`/branch/contacts`) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id`, Body: `status` (`APPROVED` / `REJECTED`) | `id`, `status`, `approvedBy`, `updatedAt` | **BELUM ADA** *(Di `contact.routes.ts` saat ini hanya ada `POST`, `DELETE`, dan `GET`)* |
| `GET` | `/api/balance/transactions` | Riwayat Transaksi & Widget Dashboard SPV (`/branch/transactions`) | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `search`, `status` (`Berhasil`/`Gagal`), `category` (`Panggilan`/`Kantin`), `startDate`, `endDate`, `page`, `limit` *(BE filter `branchId`)* | `data`: `[{ id, inmateId, inmateName, amount, type, description, performedBy, status, date, balanceBefore, balanceAfter }]`, `totalPemakaian`, `pagination` | **BELUM ADA** *(Model `Transaction` ada di schema Prisma, route/controller belum dibuat)* |
| `GET` | `/api/balance/transactions/:id` | Detail / Struk Mutasi Saldo (`/branch/transactions` Modal) | `SUPERVISOR`, `BRANCH_ADMIN` | Path: `id` | `id`, `amount`, `type`, `balanceBefore`, `balanceAfter`, `performedBy`, `user`: `{ identifier, name }`, `createdAt` | **BELUM ADA** |
| `GET` | `/api/reports/branch-summary` | Laporan Analitik UPT (`/branch/reports`) | `SUPERVISOR`, `BRANCH_ADMIN` | Query: `period` (`7`, `30`, `90` hari) *(BE otomatis filter by `user.branchId`)* | `totalRevenue`, `totalCalls`, `avgCallDurationSeconds`, `successRate`, `revenueTrend`: `[...]`, `callVolumeTrend`: `[...]` | **BELUM ADA** |

---

### 3. Keterkaitan Antar Modul (Web Supervisor & Web Kantin)

1. **Sinkronisasi Tarif & Paket Komunikasi**:
   - Paket komunikasi yang dibuat dan diaktifkan oleh Supervisor melalui `POST /api/packages` dan `PATCH /api/packages/:id/status` pada web PasCall akan langsung dikonsumsi oleh **Operator Kantin** pada halaman Paket Web Kantin (`GET /api/packages?status=Aktif`).
   - Detail alur transaksi pembelian paket dan cetak voucher oleh kasir kantin dapat dirujuk pada dokumen `ENDPOINT-KANTIN.md`.

2. **Isolasi Data Multi-Tenant (Per Cabang UPT)**:
   - Seluruh data yang diakses oleh Supervisor (Data Narapidana, Paket Komunikasi, Kontak Keluarga, Transaksi Saldo, dan Laporan) **wajib difilter otomatis oleh backend** berdasarkan `branchId` dari akun Supervisor yang sedang login (diekstrak dari payload JWT token).

---

### 4. Catatan & Pertanyaan untuk Tim BE

1. **Penambahan Role `SUPERVISOR` di Schema Prisma & Middleware**:
   - Enum `Role` di `PasCall-BackEnd/prisma/schema.prisma` saat ini baru memiliki `SUPERADMIN`, `BRANCH_ADMIN`, `CANTEEN_STAFF`, `INMATE`, `FAMILY`.
   - Mohon tambahkan nilai `SUPERVISOR` ke enum `Role` serta perbarui fungsi middleware `authorizeRoles` di `auth.middleware.ts` agar akun Supervisor tidak mengalami penolakan HTTP 403 saat mengakses endpoint `inmates` dan `contacts`.

2. **Perancangan Model Tabel `Package` di Database**:
   - Saat ini tabel/model untuk paket komunikasi belum ada di database Prisma.
   - Usulan skema tabel:
     ```prisma
     model Package {
       id        String   @id @default(uuid())
       branchId  String?  // null jika paket berlaku nasional, atau ID UPT jika per cabang
       nama      String   // contoh: "Paket Telepon 12 Menit"
       kategori  String   // "telepon" atau "video"
       durasi    Int      // jumlah durasi dalam menit
       harga     Decimal  @db.Decimal(12, 2)
       status    String   @default("Aktif") // "Aktif" atau "Nonaktif"
       createdAt DateTime @default(now())
       updatedAt DateTime @updatedAt

       @@index([branchId])
     }
     ```
   - Mohon konfirmasi apakah tarif paket berlaku per UPT (dikelola oleh SPV UPT masing-masing) atau terdapat paket master nasional.

3. **Status Persetujuan Kontak Keluarga**:
   - Enum `ContactStatus` di Prisma sudah memiliki `PENDING`, `APPROVED`, dan `REJECTED`.
   - Mohon disediakan endpoint `PATCH /api/contacts/:id/status` dengan otorisasi `SUPERVISOR` dan `BRANCH_ADMIN` untuk melakukan aksi persetujuan (*approval*) dan penolakan kontak keluarga beserta perekaman ID petugas di field `approvedBy`.
