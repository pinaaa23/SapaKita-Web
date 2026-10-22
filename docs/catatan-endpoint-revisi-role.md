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
    "branchId": "uuid-upt-tertentu",
    "startDate": "2026-10-01",
    "endDate": "2026-10-31",
    "page": 1,
    "limit": 20
  }
  ```

---

### B. Registrasi UPT Baru dengan Kanwil Induk oleh Superadmin
- **Method**: `POST`
- **Path**: `/api/branches`
- **Dipakai di Halaman**: Halaman Buat UPT Superadmin (`/branches/create`)
- **Role**: `SUPERADMIN`

---

### C. Daftar UPT di Bawah Naungan Kanwil Tertentu
- **Method**: `GET`
- **Path**: `/api/kanwil/branches` ATAU `/api/branches?kanwilId={kanwilId}`
- **Dipakai di Halaman**: Halaman UPT Binaan Kanwil (`/kanwil/branches`)
- **Role**: `admin_kanwil` / `KANWIL`

---

### D. Isolasi Paket Komunikasi Akun Kantin (Hanya Paket UPT Sendiri, Tanpa Paket Global / Fallback)
- **Kondisi Frontend Saat Ini**:
  - Di Frontend (`src/pages/kantin/PaketPage.jsx`, `src/services/packageService.js`, dan `src/components/kantin/ModalBeli.jsx`):
    - Paket yang ditampilkan kepada Kasir Kantin **secara ketat disaring hanya yang memiliki `branchId` sama persis dengan `branchId` milik akun Kantin yang login**.
    - Paket global nasional (`branchId` bernilai `null` atau kosong) dan paket milik UPT lain **tidak ditampilkan**.
    - Jika SPV UPT belum membuat/menerapkan paket untuk cabang tersebut, daftar paket Kantin berstatus **KOSONG** (list `[]`) dengan pesan keadaan kosong: *"Belum ada paket. Paket dibuat oleh SPV UPT ini."* dan transaksi pembelian voucher dinonaktifkan.
- **Rekomendasi Penyesuaian di Backend**:
  1. Khusus Role `CANTEEN_STAFF` pada `PackageService.getPackages`: Query harus membatasi secara mutlak ke cabang UPT staf tersebut tanpa fallback ke paket global (`whereClause.branchId = currentUser.branchId`).
  2. Pada `CanteenService.create`: Wajibkan paket memiliki `branchId` yang cocok dengan UPT kantin.

---

## 2. Penyelarasan Aturan Bisnis Tagihan Pascabayar Kantin & Kontrak Superadmin

### A. Latar Belakang & Aturan Bisnis Baru
1. **Dasar Perhitungan Detik Tagihan**:
   - Total detik tagihan pascabayar kantin dihitung dari **jumlah durasi paket/voucher yang DIBELI WBP di kantin** (`CanteenTransaction`) pada bulan tersebut, **BUKAN menunggu panggilan telepon WBP** (`Call`).
   - Alasan bisnis: Voucher komunikasi yang dibeli WBP memiliki masa berlaku/kedaluwarsa (`expiresAt`, default 7 hari setelah tebus). Jika voucher hangus/tidak terpakai, uang pembelian tidak dikembalikan ke WBP. Oleh karena itu hak bagi hasil Superadmin langsung melekat sejak voucher dibeli di kantin.
   - Rumus tetap seragam di seluruh tampilan:
     $$\text{Total Tagihan} = \text{Total Detik} \times \text{Tarif per Detik} \times \left(\frac{\text{Persen SA}}{100}\right)$$

### B. Hasil Audit Kondisi Backend Saat Ini (Read-Only)
1. **Kolom Kontrak di Schema & Nilai Default**:
   - Di `prisma/schema.prisma` (baris 123-124), kolom kontrak pada model `Branch` memiliki nilai bawaan (default):
     ```prisma
     contractSharePercentage Decimal  @default(50.00) @db.Decimal(5, 2)
     contractRatePerSecond   Decimal? @default(15.00) @db.Decimal(10, 2)
     ```
   - Saat UPT baru dibuat (`branch.service.ts` baris 114-115), nilai tersebut otomatis terisi Rp 15,00/detik dan SA 50,00% jika payload kosong.
   - Di `canteen.service.ts` (baris 1350-1352, 1461-1463, 1507-1509, 1592-1593), terdapat hardcode fallback jika field kosong: `ratePerSecond = 15` dan `superadminPercent = 50`.
   - Dampak: Di sisi database, seluruh UPT seolah-olah sudah memiliki kontrak default 15/detik dan 50% meskipun Superadmin belum pernah melakukan negosiasi/penetapan kontrak dengan kantin UPT tersebut.
2. **Endpoint Rincian Faktur (`GET /api/canteen/billing/calls`)**:
   - Endpoint ini saat ini melakukan query ke tabel `prisma.call` (`where: { status: 'ENDED', durationSeconds: { gt: 0 } }`), sehingga hanya menampilkan detik bicara riil panggilan wartel.
   - Jika WBP sudah membeli voucher di kasir kantin tetapi belum melakukan panggilan, endpoint ini menghasilkan 0 detik (tidak sinkron dengan penjualan kantin dan `national-summary`).
3. **Masa Berlaku Voucher**:
   - Di `voucher.service.ts` fungsi `computeVoucherExpiry()`, masa kedaluwarsa voucher dihitung sampai akhir hari (23:59:59.999 WIB) pada tanggal tebus ditambah `VOUCHER_EXTRA_DAYS` (default 7 hari). Setelah lewat masa ini, status voucher menjadi `EXPIRED`.
4. **Zona Waktu (WIB / Asia/Jakarta)**:
   - Pada `canteen.helper.ts` fungsi `buildDateFilter`, rentang bulanan menggunakan `Date.UTC(year, month, 1, 0, 0, 0, 0)` s/d `Date.UTC(year, month + 1, 0, 23, 59, 59, 999)`. Rentang ini mengacu pada jam UTC, sehingga transaksi antara jam 00:00 - 06:59 WIB pada awal bulan atau jam 17:00 - 23:59 WIB pada akhir bulan berpotensi salah pengelompokan bulan periode.

### C. Daftar Rekomendasi Perubahan yang Diminta ke Tim Backend
1. **Kolom Kontrak Nullable Tanpa Default & Flag Konfigurasi**:
   - Ubah `contractRatePerSecond` dan `contractSharePercentage` di `prisma/schema.prisma` menjadi nullable murni tanpa `@default`:
     ```prisma
     contractSharePercentage Decimal? @db.Decimal(5, 2)
     contractRatePerSecond   Decimal? @db.Decimal(10, 2)
     ```
   - Tambahkan kolom penanda atau status konfigurasi kontrak:
     ```prisma
     isContractConfigured    Boolean  @default(false)
     ```
   - Hapus fallback hardcode `15` dan `50` pada `canteen.service.ts` dan `branch.service.ts`. Jika kontrak belum diatur oleh Superadmin, kembalikan nilai `null` dan `isContractConfigured: false` agar FE dapat menampilkan status "Belum diatur" dan memblokir tagihan secara akurat.
2. **Ubah Endpoint Rincian Tagihan Menjadi Berbasis Transaksi Penjualan Kantin**:
   - Ubah logika query `GET /api/canteen/billing/calls` (atau buat endpoint alternatif `GET /api/canteen/billing/transactions`) agar bersumber dari `prisma.canteenTransaction`:
     - Menjumlahkan `(t.package?.duration || t.packageDuration) * 60` detik.
     - Menampilkan riwayat transaksi penjualan paket kantin per WBP dengan kolom: Nomor Transaksi, Waktu, Kode Voucher, WBP (Nama & NIP), Paket/Layanan, Kasir, Durasi Detik, Tarif/dtk, Porsi SA %, dan Nominal Tagihan.
3. **Penegakan Zona Waktu Indonesia Barat (WIB, UTC+7)**:
   - Gunakan perhitungan tanggal berbasis WIB (`Asia/Jakarta`) pada filter batas awal bulan (`YYYY-MM-01 00:00:00 WIB` = `UTC-7h`) dan batas akhir bulan (`YYYY-MM-last 23:59:59.999 WIB` = `UTC-7h`) saat memfilter transaksi billing bulanan.