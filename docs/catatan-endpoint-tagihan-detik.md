# Catatan Kebutuhan Endpoint Backend: Tagihan Kantin Berbasis Detik Panggilan

Dokumen ini mencatat pemetaan, spesifikasi data, dan kebutuhan endpoint Backend (BE) untuk sistem penagihan kantin berbasis akumulasi **detik panggilan WBP**.

---

## 1. Logika & Rumus Perhitungan Tagihan Baru

- **Frekuensi & Faktur:** Dihitung **per bulan**, satu faktur per kantin per bulan, dibayar 1 kali.
- **Porsi Pembayaran:** Yang dibayar oleh kantin adalah porsi bagian **Superadmin (SA)**.
- **Rumus:**
  $$\text{Subtotal} = \text{Total Detik Panggilan} \times \text{Tarif per Detik}$$
  $$\text{Total Tagihan (Bagian SA)} = \text{Subtotal} \times \text{Persen Bagian SA}$$
  $$\text{Hak/Pendapatan Kantin} = \text{Subtotal} \times \text{Persen Kantin}$$
- **Contoh Perhitungan:**
  - Panggilan: $200.000\text{ detik}$
  - Tarif kontrak: $\text{Rp } 10/\text{detik}$
  - Subtotal: $200.000 \times 10 = \text{Rp } 2.000.000$
  - Pembagian: Superadmin $50\%$, Kantin $50\%$
  - Total Tagihan yang disetor Kantin ke SA: $2.000.000 \times 50\% = \text{Rp } 1.000.000$
- **Aturan Kontrak:** Tarif per detik dan persen diatur eksklusif oleh Superadmin di tab "Pengaturan Kontrak". Di sisi Kantin hanya tampil (*read-only*).
- **Alur Pembayaran:** Bayar via QRIS atau Transfer Bank Lain $\rightarrow$ Upload bukti bayar (gambar/PDF) $\rightarrow$ Verifikasi ACC oleh Superadmin $\rightarrow$ Layanan kantin otomatis terblokir jika lewat jatuh tempo belum lunas.

---

## 2. Tabel Pemetaan & Spesifikasi Endpoint Backend

| No | Endpoint Usulan | Method | Dipakai di Halaman | Role Akses | Request (Param / Body / Query) | Response Data | Status di BE Saat Ini | Catatan & Kebutuhan Fitur |
|---|---|---|---|---|---|---|---|---|
| **1** | `/api/canteen/billing/monthly` | `GET` | Kantin: Tagihan Bulanan Kantin | `CANTEEN_STAFF`, `SUPERADMIN` | Query: `?month=10&year=2026` | `{ success: true, data: { branchId, uptName, canteenName, invoiceNumber: "INV-202610-KTN", period: "10/2026", month: 10, year: 2026, totalSeconds: 120000, ratePerSecond: 10, subtotal: 1200000, superadminPercent: 50, canteenPercent: 50, totalAmount: 600000, canteenShare: 600000, isContractSet: true, dueDate: "2026-11-02T23:59:59Z", totalApproved: 0, remainingAmount: 600000, billingStatus: "BERJALAN" \| "UNPAID" \| "PENDING" \| "PAID" \| "REJECTED" \| "BLOCKED", isBlocked: false } }` | **Perlu Penyesuaian** *(Di BE lama masih omset paket & PPN 11%)* | **Faktur Bulanan Kantin:** Mengembalikan satu faktur per bulan lengkap dengan total detik riil, tarif kontrak, bagian SA, status tunggal, tanggal jatuh tempo, dan sisa tagihan jika ada transaksi baru setelah pembayaran awal. |
| **2** | `/api/canteen/billing/calls` | `GET` | Kantin: Tab "Rincian Panggilan" | `CANTEEN_STAFF`, `SUPERADMIN` | Query: `?month=10&year=2026&page=1&limit=10&search=...` | `{ success: true, data: { items: [ { id: "TRX-001", createdAt: "2026-10-15T08:30:00Z", kodeVoucher: "VC-88219", inmate: { name: "Ahmad", identifier: "NIP-001" }, package: { name: "Video Call 10m", duration: 10 }, cashier: { name: "Petugas Kasir 1" }, durationSeconds: 600, ratePerSecond: 10, superadminPercent: 50, nominal: 3000 } ], totalItems: 125, totalSeconds: 120000, totalTagihan: 600000 } }` | **Belum Ada** *(Saat ini FE menghitung per baris dari log transaksi)* | **Rincian Panggilan:** Riwayat panggilan tanpa kolom status per transaksi. Nominal per baris $= \text{detik} \times \text{tarif} \times \text{persen SA}$. Jumlah nominal seluruh baris sama dengan Total Tagihan bulan itu. Mendukung pagination dan pencarian. |
| **3** | `/api/canteen/contracts` | `GET` | Superadmin: Tab "Pengaturan Kontrak" | `SUPERADMIN` | Query: `?page=1&limit=50&search=...` | `{ success: true, data: { items: [ { branchId: "b1", branchName: "Lapas Cipinang", canteenName: "Kantin Lapas Cipinang", ratePerSecond: 10, superadminPercent: 50, canteenPercent: 50, updatedAt: "...", updatedBy: "Superadmin" } ] } }` | **Belum Ada** *(Di FE menggunakan mock fallback `canteenContractMock`)* | Mengambil konfigurasi tarif per detik dan persen pembagian seluruh kantin cabang UPT. |
| **4** | `/api/canteen/contracts/:branchId` | `GET` | Kantin: Tagihan Bulanan | `CANTEEN_STAFF`, `SUPERADMIN` | Param: `branchId` | `{ success: true, data: { branchId: "b1", ratePerSecond: 10, superadminPercent: 50, canteenPercent: 50, isConfigured: true } }` | **Belum Ada** *(Di FE membaca `getStoredContracts()`)* | Read-only di sisi Kantin. Menampilkan tarif kontrak dan persen bagian SA. |
| **5** | `/api/canteen/contracts/:branchId` | `PUT` / `PATCH` | Superadmin: Tab "Pengaturan Kontrak" | `SUPERADMIN` | Body: `{ "ratePerSecond": 10, "superadminPercent": 50, "canteenPercent": 50 }` | `{ success: true, message: "Kontrak tarif berhasil disimpan", data: { ... } }` | **Belum Ada** *(Di FE disimpan ke mock storage `pascall_canteen_contracts_v1`)* | Mengubah tarif per detik dan persen bagi hasil. Memicu event push realtime/webhook ke halaman Kantin. |
| **6** | `/api/canteen/topups` | `POST` | Kantin: Modal Pembayaran Tagihan | `CANTEEN_STAFF` | FormData: `nominal`, `minutes`, `bankTarget`, `proofFile`, `billingMonth`, `billingYear` | `{ success: true, message: "Pengajuan berhasil dikirim", data: { id: "TP-001", proofUrl: "...", status: "PENDING" } }` | **SUDAH ADA & COCOK** | Mengirimkan bukti bayar (QRIS atau Transfer Bank). Format file: JPG, PNG, WEBP, atau PDF (maks. 2 MB). Setelah terkirim status faktur menjadi `Menunggu ACC Superadmin`. |
| **7** | `/api/canteen/billing/payments` *(atau `/api/canteen/topups`)* | `GET` | Kantin: Tab "Riwayat Pembayaran" | `CANTEEN_STAFF`, `SUPERADMIN` | Query: `?limit=50` | `{ success: true, data: { items: [ { id: "TP-001", invoiceNumber: "INV-202610-KTN", billingMonth: 10, billingYear: 2026, nominal: 600000, bankTarget: "QRIS", createdAt: "2026-10-20T10:00:00Z", status: "APPROVED", proofUrl: "uploads/proof.jpg" } ] } }` | **SUDAH ADA & COCOK** | **Riwayat Pembayaran per Bulan:** Satu baris per bulan/pembayaran menampilkan periode, nomor faktur, nominal, metode, tanggal upload, status ACC, dan tautan lihat bukti. |
| **8** | `/api/canteen/topups/:id/approve` | `PATCH` | Superadmin: Tagihan Bulanan - Verifikasi Bukti | `SUPERADMIN` | Param: `id` | `{ success: true, message: "Pembayaran berhasil di-ACC", data: { id: "TP-001", status: "APPROVED" } }` | **SUDAH ADA & COCOK** | Mengubah status pembayaran menjadi Disetujui (Lunas). Mengaktifkan kembali hak operasional kantin jika sebelumnya terblokir. |
| **9** | `/api/canteen/topups/:id/reject` | `PATCH` | Superadmin: Tagihan Bulanan - Verifikasi Bukti | `SUPERADMIN` | Param: `id`, Body: `{ "reason": "Bukti transfer buram/tidak terbaca" }` | `{ success: true, message: "Pembayaran ditolak", data: { id: "TP-001", status: "REJECTED", reason: "..." } }` | **SUDAH ADA & COCOK** | Mengubah status pembayaran menjadi Ditolak dengan alasan penolakan. Kantin diperbolehkan melakukan upload ulang bukti bayar yang sah. |
| **10** | `/api/canteen/topups/:id/proof` | `GET` | Superadmin & Kantin: Preview Bukti Bayar | `SUPERADMIN`, `CANTEEN_STAFF` | Param: `id` | Stream binary gambar / PDF | **SUDAH ADA & COCOK** | Mengalirkan berkas bukti transfer gambar atau PDF untuk dipratinjau di modal. |
| **11** | `/api/canteen/billing/status-block` | `GET` | Kantin & Middleware Transaksi Penjualan | `CANTEEN_STAFF`, `SUPERVISOR` | Query: `?branchId=...` | `{ success: true, data: { isBlocked: false, reason: null, overdueInvoiceCount: 0 } }` | **Belum Ada** | **Status Blokir Layanan:** Memeriksa apakah kantin menunggak tagihan bulan lalu yang telah melewati jatuh tempo. Jika `isBlocked: true`, tombol transaksi penjualan voucher di kantin otomatis dinonaktifkan. |

---

## 3. Kebutuhan Push Realtime / Sinkronisasi Otomatis

### Mengapa Diperlukan?
Ketika Superadmin memperbarui tarif per detik atau persentase negosiasi di tab "Pengaturan Kontrak", halaman Kantin harus langsung menampilkan nilai tagihan terbaru tanpa memerlukan refresh halaman secara manual oleh petugas kantin.

### Implementasi Saat Ini di Frontend:
1. **Polling Berkala:** Dilakukan secara otomatis setiap **20 detik** (`setInterval`) memanggil ulang tagihan terbaru.
2. **Refetch on Focus & Visibility:** Dipicu segera saat pengguna berpindah tab kembali ke aplikasi PasCall (`window.addEventListener('focus')` dan `document.addEventListener('visibilitychange')`).
3. **Cross-Tab Storage Event:** Menggunakan `storage` dan CustomEvent `pascall_contract_changed` untuk sinkronisasi seketika antar-tab di browser yang sama.

### Rekomendasi Solusi Push dari Backend (Untuk Pengembangan BE Selanjutnya):
- **Opsi A: WebSocket (Disarankan)**
  - Event: `canteen:contract_updated`
  - Payload: `{ branchId, ratePerSecond, superadminPercent, canteenPercent, updatedAt }`
  - Frontend mendengarkan event dan langsung memperbarui kalkulasi tagihan secara *zero-latency*.
- **Opsi B: Server-Sent Events (SSE)**
  - Endpoint SSE: `GET /api/canteen/events`
  - BE mengirim *event stream* notifikasi pembaruan kontrak atau persetujuan pembayaran (ACC).

---

## 4. Rekomendasi Skema Database Prisma (Jika BE Mulai Dikerjakan)

```prisma
model CanteenContract {
  id                 String   @id @default(uuid())
  branchId           String   @unique
  ratePerSecond      Decimal  @db.Decimal(10, 2) // contoh: 10.00
  superadminPercent  Decimal  @default(50.00) @db.Decimal(5, 2) // porsi Superadmin (50%)
  canteenPercent     Decimal  @default(50.00) @db.Decimal(5, 2) // porsi Kantin (50%)
  negotiationPercent Decimal  @db.Decimal(5, 2)  // alias porsi SA
  updatedById        String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  branch             Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@index([branchId])
}
```

---

## 5. Ringkasan Status Frontend vs Backend

- **Tersambung ke Backend Riil (Endpoint Siap):**
  - Kirim bukti pembayaran (`POST /api/canteen/topups`)
  - Verifikasi persetujuan bukti (`PATCH /api/canteen/topups/:id/approve`)
  - Penolakan bukti bayar (`PATCH /api/canteen/topups/:id/reject`)
  - Streaming file bukti transfer (`GET /api/canteen/topups/:id/proof`)
  - Riwayat pengajuan pembayaran (`GET /api/canteen/topups`)
- **Menggunakan Fallback Mock Terpadu (`// MOCK - menunggu endpoint BE`):**
  - Penyimpanan & perubahan kontrak tarif (`src/dummy/canteenContractMock.js`)
  - Perhitungan tagihan detik panggilan (`calculateCanteenBilling`)
  - Agregasi nasional per UPT di Superadmin (`getCanteenBillingNational`)
- **Catatan Kepatuhan:** Seluruh modifikasi dilakukan **HANYA** di folder `PasCall` (Frontend). Tidak ada berkas di `PasCall-BackEnd` yang dimodifikasi.
