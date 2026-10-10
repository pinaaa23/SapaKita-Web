# Kebutuhan Endpoint API Back End - Web Operator Kantin (PasCall)

Dokumen ini merangkum seluruh hasil *cross-check* dan kebutuhan endpoint backend (BE) untuk modul antarmuka **Operator / Kasir Kantin** pada aplikasi PasCall. Dokumen ini disusun berdasarkan penelusuran seluruh halaman aktif pada `src/pages/kantin/`, komponen `src/components/kantin/`, layanan `src/services/kantin/`, context `AuthContext`, serta layout `KantinLayout.jsx`.

---

### 1. Ringkasan Modul & Fitur Web Kantin

Operator Kantin bertugas melayani pembelian paket komunikasi oleh Warga Binaan Pemasyarakatan (WBP) secara tunai di kantin lapas, mencetak voucher panggilan, memantau ketersediaan bilik wartel, serta mengajukan pengisian ulang kuota saldo menit kantin.

| Modul Halaman | Rute Frontend | Fungsi & Fitur Utama |
| :--- | :--- | :--- |
| **Katalog Paket** | `/kantin` | Menampilkan katalog paket telepon/video aktif, pencarian profil WBP (NIP / Nama), validasi kuota menit kantin, transaksi pembelian tunai, dan penerbitan voucher. |
| **Voucher Transaksi** | `/kantin/voucher/:id` | Menampilkan kode voucher panggilan (5 digit / barcode), PIN, NIP & nama WBP, durasi menit, serta tombol cetak voucher thermal. |
| **Struk Bukti Transaksi** | `/kantin/struk/:id` | Detail struk resmi kasir dengan rincian DPP, PPN 11%, nama petugas kasir, dan opsi cetak struk kasir. |
| **Status Wartel Lapas** | `/kantin/status-wartel` | Monitoring ketersediaan bilik wartel secara realtime (bilik tersedia vs bilik sedang digunakan + timer hitung mundur panggilan). |
| **Rekap & Riwayat Transaksi** | `/kantin/riwayat` | Laporan omzet tunai harian/bulanan/tahunan, grafik tren transaksi per jam, tabel riwayat transaksi, filter pencarian, dan ekspor laporan ke PDF. |
| **Top Up Saldo Menit Kantin** | `/kantin/top-up-saldo` | Informasi sisa kuota saldo menit kasir, pengajuan top up menit (1.000, 2.200, 4.500 menit) dengan unggah bukti transfer, serta riwayat status pengajuan (*Pending / Disetujui / Ditolak*). |
| **Notifikasi Realtime** | Di Header Topbar | Notifikasi dan badge angka realtime saat permintaan top up saldo disetujui / ditolak oleh Admin Cabang / SPV. |

---

### 2. Tabel Daftar Kebutuhan Endpoint Web Operator Kantin

| No | Method | Path Usulan | Dipakai di Halaman / Fitur | Role Akses | Request (Field / Parameter) | Response (Field Penting) | Prioritas |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | `POST` | `/api/auth/login` | Login Kasir (`/login`) | `CANTEEN_STAFF`, `SUPERVISOR`, `BRANCH_ADMIN`, dll. | Body: `{ identifier, password }` | `token` (JWT), `user`: `{ id, name, role: "CANTEEN_STAFF", branchId, branchName }` | **Tinggi** |
| 2 | `GET` | `/api/packages` atau `/api/canteen/packages` | Katalog Paket (`/kantin`) | `CANTEEN_STAFF`, `SUPERVISOR`, `BRANCH_ADMIN` | Query: `kategori` (`telepon`/`video`), `status` (`Aktif`), `branchId` *(BE filter otomatis by branch kasir)* | `data`: `[{ id, nama, kategori, durasi, harga, status, branchId }]` | **Tinggi** |
| 3 | `GET` | `/api/inmates` | Pencarian WBP di Modal Beli (`/kantin`) | `CANTEEN_STAFF`, `SUPERVISOR`, `BRANCH_ADMIN` | Query: `search` (NIP/Nama), `branchId`, `limit: 20` | `items`: `[{ id, identifier, name, blockRoom, phone, status, commStatus, isActive, branchId }]` | **Tinggi** |
| 4 | `GET` | `/api/canteen/balance` | Kuota Menit di Sidebar & Header Topup (`KantinLayout`, `/kantin/top-up-saldo`) | `CANTEEN_STAFF` | Header: `Authorization: Bearer <token>` | `{ balanceMinutes: 2499940, lastUpdated: "2026-10-10T..." }` | **Tinggi** |
| 5 | `POST` | `/api/canteen/transactions` | Konfirmasi Pembelian Paket Tunai (`/kantin` Modal Beli) | `CANTEEN_STAFF` | Body: `{ inmateIdentifier: "NAPI-8192", packageId: "pkg-1", paymentMethod: "TUNAI", notes: "" }` | `id`: "TRX-...", `kodeVoucher`: "88219", `status`: "Berhasil", `inmate`: `{...}`, `package`: `{...}`, `payment`: `{ totalAmount, dpp, ppn }`, `cashier`: `{...}` | **Tinggi** |
| 6 | `GET` | `/api/canteen/transactions/:id` | Struk Transaksi (`/kantin/struk/:id`) & Voucher (`/kantin/voucher/:id`) | `CANTEEN_STAFF`, `BRANCH_ADMIN` | Path: `id` (ID Transaksi atau Kode Voucher) | `{ id, kodeVoucher, status, paymentMethod, createdAt, inmate: {...}, package: {...}, payment: { totalAmount, dpp, ppn }, cashier: {...}, isVoucherUsed, voucherUsedAt }` | **Tinggi** |
| 7 | `GET` | `/api/canteen/transactions` | Tabel Riwayat Transaksi (`/kantin/riwayat`) | `CANTEEN_STAFF`, `BRANCH_ADMIN` | Query: `periode` (`harian`/`bulanan`/`tahunan`), `tanggal` (`YYYY-MM-DD`), `bulan` (`YYYY-MM`), `tahun` (`YYYY`), `search`, `metode`, `page`, `limit` | `data`: `[{ id, kodeVoucher, status, paymentMethod, createdAt, inmate: {...}, package: {...}, totalAmount, cashier: {...} }]`, `pagination`: `{ total, page, totalPages }` | **Tinggi** |
| 8 | `GET` | `/api/canteen/reports/summary` | Kartu Ringkasan & Grafik Tren Omzet (`/kantin/riwayat`) | `CANTEEN_STAFF`, `BRANCH_ADMIN` | Query: `periode` (`harian`/`bulanan`/`tahunan`), `tanggal`, `bulan`, `tahun` | `summary`: `{ totalRevenue: 150000, totalTransactions: 15 }`, `salesChart`: `[{ label: "08:00", revenue: 25000, transactions: 2 }, ...]`, `topPackages`: `[...]` | **Sedang** |
| 9 | `GET` | `/api/wartel/status` | Monitoring Bilik Wartel (`/kantin/status-wartel` & Widget Sidebar) | `CANTEEN_STAFF`, `SUPERVISOR`, `BRANCH_ADMIN` | Header: `Authorization: Bearer <token>` | `waktuServer`: timestamp, `cabang`: `{ totalBilik: 8, bilikTersedia: 6, bilikDigunakan: 2 }`, `daftar`: `[{ id: "wartel-01", nama: "Wartel 01", status: "digunakan"|"tersedia", estimasiSelesai: timestamp, detail: { inmateName, packageDuration } }]` | **Tinggi** |
| 10 | `GET` | `/api/canteen/topups` | Riwayat Pengajuan Top Up Saldo Menit (`/kantin/top-up-saldo`) | `CANTEEN_STAFF`, `BRANCH_ADMIN`, `SUPERADMIN` | Query: `page`, `limit`, `status` (`PENDING`/`APPROVED`/`REJECTED`) | `data`: `[{ id, nominal, minutes: 1000, proofUrl, status, bankTarget, createdAt, approvedAt, approvedBy, rejectReason }]` | **Tinggi** |
| 11 | `POST` | `/api/canteen/topups` | Ajukan Permintaan Top Up Saldo Menit (`/kantin/top-up-saldo`) | `CANTEEN_STAFF` | Form-Data / Body: `{ nominal: 500000, minutes: 1000, bankTarget: "BCA 8830192831", proofFile: File (JPG/PNG/PDF) }` | `id`, `nominal`, `minutes`, `status`: "PENDING", `proofUrl`, `createdAt` | **Tinggi** |
| 12 | `GET` | `/api/notifications` | Notifikasi Masuk di Topbar & Badge Menu Top Up (`KantinLayout`) | `CANTEEN_STAFF` | Query: `type`, `unreadOnly: boolean` | `data`: `[{ id, type: "canteen_topup_approved"|"canteen_topup_rejected", title, desc, time, read: boolean, link: "/kantin/top-up-saldo" }]` | **Sedang** |
| 13 | `PATCH` | `/api/notifications/:id/read` | Tandai Notifikasi Dibaca | `CANTEEN_STAFF` | Path: `id` | `{ success: true, id, read: true }` | **Rendah** |
| 14 | `POST` | `/api/notifications/mark-all-read` | Tandai Semua Notifikasi Dibaca | `CANTEEN_STAFF` | Body: `{ ids: [...] }` | `{ success: true, count: 5 }` | **Rendah** |

---

### 3. Alur Bisnis & Validasi Kunci (Business Logic Rules)

1. **Konsep Saldo Menit Kantin (Bukan Saldo Rupiah)**:
   - Kantin membeli kuota saldo menit dari Lapas/Admin (misal Rp 500.000 dapet 1.000 Menit, Rp 1.000.000 dapet 2.200 Menit, Rp 2.000.000 dapet 4.500 Menit).
   - Ketika kasir menjual paket 5 menit seharga Rp 5.000 tunai ke WBP, backend memotong kuota menit kasir sebanyak **5 menit** dan mencatat transaksi penerbitan voucher.
   - Jika kuota menit kasir kurang dari durasi paket yang dibeli, backend harus menolak transaksi dengan pesan error: `Kuota menit kasir tidak mencukupi, silakan lakukan top up saldo menit terlebih dahulu`.

2. **Pencarian WBP Multi-Tenant (Per Cabang)**:
   - Kasir kantin hanya boleh mencari dan melayani narapidana yang terdaftar di **cabang/UPT yang sama** dengan kasir tersebut.
   - WBP dengan status komunikasi nonaktif (`commStatus === "Nonaktif"` atau `isActive === false`) tidak dapat dibelikan paket komunikasi.

3. **Integrasi Voucher dengan Perangkat Bilik Wartel**:
   - Setelah transaksi berhasil dibuat di `POST /api/canteen/transactions`, backend mengenerate kode voucher unik (5 digit angka atau format `PAS-XXXXX`).
   - Ketika WBP menggunakan voucher di aplikasi Mobile/Tablet Bilik Wartel (`POST /api/wartel/use-voucher` atau `POST /api/calls/start`), status bilik di `GET /api/wartel/status` otomatis berubah menjadi `digunakan` dengan `estimasiSelesai = waktuMulai + durasiMenit * 60 * 1000`.

---

### 4. Skema Data Baru yang Direkomendasikan di Database (Prisma)

```prisma
// 1. Model Transaksi Kantin
model CanteenTransaction {
  id              String   @id @default(uuid())
  kodeVoucher     String   @unique
  branchId        String
  cashierId       String
  inmateId        String
  packageId       String
  paymentMethod   String   @default("TUNAI") // TUNAI
  durationMinutes Int
  totalAmount     Decimal  @db.Decimal(12, 2)
  dpp             Decimal  @db.Decimal(12, 2)
  ppn             Decimal  @db.Decimal(12, 2)
  status          String   @default("Berhasil") // Berhasil / Dibatalkan
  isVoucherUsed   Boolean  @default(false)
  voucherUsedAt   DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([branchId, createdAt])
  @@index([inmateId])
}

// 2. Model Permintaan Top Up Saldo Menit Kantin
model CanteenTopupRequest {
  id           String    @id @default(uuid())
  branchId     String
  cashierId    String
  nominal      Decimal   @db.Decimal(12, 2) // Contoh: 500000
  minutes      Int       // Contoh: 1000
  bankTarget   String
  proofUrl     String    // Foto bukti transfer
  status       String    @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedBy   String?
  approvedAt   DateTime?
  rejectReason String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([branchId, status])
}

// 3. Model Saldo Menit Kasir Kantin
model CanteenBalance {
  id             String   @id @default(uuid())
  branchId       String   @unique
  balanceMinutes Int      @default(0) // Kuota menit aktif kantin
  updatedAt      DateTime @updatedAt
}
```
