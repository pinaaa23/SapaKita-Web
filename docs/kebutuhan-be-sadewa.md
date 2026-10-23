# DOKUMEN KEBUTUHAN BACKEND (BE) - SISTEM SADEWA
**Status Dokumen:** Hasil Audit Komprehensif Arsitektur Frontend & Backend  
**Tanggal Audit:** 23 Oktober 2026  
**Target Pengembang:** Tim Backend PasCall / Sadewa (PasCall-BackEnd)  
**Tujuan Dokumen:** Spesifikasi teknis kesenjangan endpoint, agregasi data, perbaikan isolasi data tenant/branch, penyesuaian payload response, dan panduan migrasi domain email akun.

---

## DAFTAR ISI
1. [Ringkasan Eksekutif Audit](#1-ringkasan-eksekutif-audit)
2. [Bagian A: Kebutuhan Endpoint & Response Backend](#2-bagian-a-kebutuhan-endpoint--response-backend)
   - [A.1. Analisis Riwayat Panggilan: 3 Card Ringkasan Jalur (Web vs GSM)](#a1-analisis-riwayat-panggilan-3-card-ringkasan-jalur-web-vs-gsm)
   - [A.2. Analisis Rekaman Panggilan: Hilangnya Field `targetPhone` di Root Object](#a2-analisis-rekaman-panggilan-hilangnya-field-targetphone-di-root-object)
   - [A.3. Analisis Paket Komunikasi SPV & Kantin: Kebocoran Paket Global (`branchId: null`)](#a3-analisis-paket-komunikasi-spv--kantin-kebocoran-paket-global-branchid-null)
   - [A.4. Analisis Kontrak Tarif Kantin & Tagihan Bulanan: Izin Role Kanwil & SPV](#a4-analisis-kontrak-tarif-kantin--tagihan-bulanan-izin-role-kanwil--spv)
   - [A.5. Analisis Ringkasan Dashboard SPV & UPT](#a5-analisis-ringkasan-dashboard-spv--upt)
   - [A.6. Tabel Spesifikasi Kebutuhan Endpoint & Field Response](#a6-tabel-spesifikasi-kebutuhan-endpoint--field-response)
3. [Bagian B: Audit Migrasi Domain Email Akun (`@pascall.id` -> `[DOMAIN_BARU]`)](#3-bagian-b-audit-migrasi-domain-email-akun-pascallid---domain_baru)
   - [B.1. Inventaris Seluruh Kemunculan `pascall.id` di FE dan BE](#b1-inventaris-seluruh-kemunculan-pascallid-di-fe-dan-be)
   - [B.2. Analisis Dampak Database & Skrip Migrasi Akun Eksisting](#b2-analisis-dampak-database--skrip-migrasi-akun-eksisting)
   - [B.3. Audit Validasi Format Email di Backend](#b3-audit-validasi-format-email-di-backend)
   - [B.4. Mekanisme Pembuatan Email Otomatis di Frontend](#b4-mekanisme-pembuatan-email-otomatis-di-frontend)
4. [Langkah Tindak Lanjut Rekomendasi (Action Plan)](#4-langkah-tindak-lanjut-rekomendasi-action-plan)

---

## 1. RINGKASAN EKSEKUTIF AUDIT

Audit menyeluruh (read-only) telah dilakukan pada repositori Frontend (`PasCall/`) dan Backend (`PasCall-BackEnd/`). Audit ini berfokus pada:
1. Kesesuaian konsumsi API pada role **Superadmin**, **Kanwil**, **Kepala UPT**, **Supervisor (SPV)**, dan **Kantin**.
2. Kesiapan endpoint untuk fitur analitik terkini (agregasi jalur Web/GSM, pemutaran rekaman, billing kantin).
3. Evaluasi kebocoran data multi-tenant (paket global bawaan yang mencemari cabang baru).
4. Pemetaan lengkap dan mitigasi pergantian domain email lama `@pascall.id` menuju `[DOMAIN_BARU]`.

### Rekapitulasi Temuan Kunci:
- **Kebutuhan Endpoint Agregat Baru / Kurang:** Terdapat **4 endpoint baru / revisi filter query** yang mendesak untuk menghilangkan kalkulasi parsial di FE dan mock data.
- **Kesenjangan Response / Payload:** Terdapat **2 controller/service** di BE yang tidak mengekspos field penting (seperti `targetPhone` pada rekaman panggilan dan kebocoran `branchId: null` pada query paket & dashboard).
- **Otorisasi Role (RBAC):** Role `KANWIL_ADMIN` mengalami **403 Forbidden** pada endpoint kontrak tarif kantin dan rincian panggilan billing kantin, padahal Kanwil memiliki fungsi pengawasan di tingkat wilayah.
- **Total Kemunculan Domain `@pascall.id`:** Ditemukan **70 kemunculan** di seluruh kode dan dokumen (37 di Frontend dan 33 di Backend).

---

## 2. BAGIAN A: KEBUTUHAN ENDPOINT & RESPONSE BACKEND

### A.1. Analisis Riwayat Panggilan: 3 Card Ringkasan Jalur (Web vs GSM)
**Lokasi Halaman FE:**
- Superadmin: `src/pages/calls/CallsHistory.jsx`
- Kanwil: `src/pages/kanwil/calls/History.jsx`
- Kepala UPT: `src/pages/branch/calls/History.jsx`

**Kondisi Saat Ini di Backend:**
- BE telah memiliki endpoint `GET /api/calls` yang mendukung query filtering (`branchId`, `status`, `type`, `channel`, `search`, `startDate`, `endDate`).
- Setiap item panggilan dalam response array `data` sudah memuat:
  - `channel`: `'gsm' | 'web'`
  - `durationSeconds`: integer (contoh: 120)
- **MASALAH BESAR:** Endpoint `GET /api/calls` mengembalikan data dengan pagination (`limit: 20` secara default).
- Akibatnya, 3 card ringkasan di FE (Total Detik Web, Total Detik GSM, dan Donut Persentase) **hanya bisa menghitung dari 20 baris panggilan yang sedang tampil di halaman aktif**. Jika ada 5.000 panggilan pada filter bulan ini, angka ringkasan di card tersebut menjadi keliru dan menyesatkan pengguna karena tidak mewakili total populasi data hasil filter.

**Rekomendasi Solusi untuk Tim BE:**
Sediakan endpoint agregasi terpisah yang menerima seluruh parameter filter yang sama dengan `GET /api/calls`, namun langsung mengembalikan ringkasan statistik dari database tanpa membebani transfer data ribuan baris:
- **Metode & Path Usulan:** `GET /api/calls/channel-summary`
- **Alternatif:** Menambahkan objek `channelSummary` di dalam root/meta response `GET /api/calls`. Namun endpoint terpisah (`GET /api/calls/channel-summary`) jauh lebih direkomendasikan agar performa paginasi tabel tetap ringan saat user berpindah halaman (page 1, 2, 3...).

---

### A.2. Analisis Rekaman Panggilan: Hilangnya Field `targetPhone` di Root Object
**Lokasi Halaman FE:**
- Kepala UPT: `src/pages/branch/recordings/List.jsx`
- Superadmin: `src/pages/calls/Recordings.jsx`

**Kondisi Saat Ini di Backend:**
- Di controller `src/modules/call/recording.controller.ts`:
  ```typescript
  const [items, total] = await Promise.all([
    prisma.recording.findMany({
      include: {
        call: {
          select: {
            id: true,
            inmateId: true,
            targetPhone: true, // Prisma mengambil targetPhone dari tabel Call
            channel: true,
            // ...
          }
        }
      }
    })
  ]);
  ```
- Namun pada fungsi `mappedRecordings`, field `targetPhone` tidak diekspos di level utama objek:
  ```typescript
  // Response saat ini:
  {
    id: "rec_123",
    callId: "call_456",
    durationSeconds: 150,
    audioUrl: "/api/recordings/stream/...",
    call: {
      targetPhone: "08123456789" // bersarang di dalam relasi call
    }
  }
  ```
- FE membaca `record.targetPhone` atau `record.destinationPhone` langsung pada objek rekaman utama. Akibatnya kolom nomor tujuan di tabel rekaman sering kosong atau jatuh ke fallback `'-'`.

**Rekomendasi Solusi untuk Tim BE:**
Update mapping di `recording.controller.ts` agar menyertakan `targetPhone` di root object:
```typescript
return {
  ...rec,
  targetPhone: rec.call?.targetPhone || null,
  inmateName: rec.call?.inmate?.fullName || null,
};
```

---

### A.3. Analisis Paket Komunikasi SPV & Kantin: Kebocoran Paket Global (`branchId: null`)
**Lokasi Halaman FE:**
- SPV: `src/pages/branch/packages/List.jsx`
- Kantin: `src/pages/canteen/packages/List.jsx`

**Kondisi Saat Ini di Backend:**
- Di `src/modules/package/package.service.ts` baris 38–41:
  ```typescript
  if (branchId) {
    whereClause.OR = [
      { branchId },
      { branchId: null } // INI PENYEBAB MASALAH
    ];
  }
  ```
- Hal ini menyebabkan ketika sebuah Cabang/UPT baru dibuat dan belum membuat paket apapun, query `GET /api/packages?branchId=xxx` mengembalikan 3 paket bawaan sistem (paket global dengan `branchId: null`).
- Akibatnya:
  1. Halaman SPV langsung menampilkan 3 paket aktif padahal cabang belum pernah mengkonfigurasi paket.
  2. Bagian "Paket Rekomendasi" di FE menjadi bingung dan tidak tampil saat kondisi kosong.
  3. Terjadi inkonsistensi antara paket resmi cabang dengan paket template.

**Rekomendasi Solusi untuk Tim BE:**
1. Hapus `{ branchId: null }` dari query utama cabang di `package.service.ts`:
   ```typescript
   if (branchId) {
     whereClause.branchId = targetBranchId; // HANYA paket milik cabang bersangkutan
   }
   ```
2. Buat endpoint baru khusus template: `GET /api/packages/templates` yang mengembalikan paket-paket rekomendasi bawaan sistem (`where: { branchId: null, isTemplate: true }`). Dengan demikian, SPV bisa mengambil template secara eksplisit tanpa mengotori tabel paket aktif cabang.

---

### A.4. Analisis Kontrak Tarif Kantin & Tagihan Bulanan: Izin Role Kanwil & SPV
**Lokasi Halaman FE:**
- Kanwil: `src/pages/kanwil/canteen/TariffContracts.jsx`
- Superadmin: `src/pages/canteen/billing/List.jsx`
- Kantin: `src/pages/canteen/billing/Monthly.jsx`

**Kondisi Saat Ini di Backend:**
- Di `src/modules/canteen/canteen.routes.ts`:
  - `GET /api/canteen/contracts` hanya memiliki middleware `requireRole(Role.SUPERADMIN)`.
  - `GET /api/canteen/contracts/:branchId` hanya mengizinkan `Role.CANTEEN_STAFF, Role.SUPERADMIN`.
  - `GET /api/canteen/billing/calls` hanya mengizinkan `Role.CANTEEN_STAFF, Role.SUPERADMIN`.
- **MASALAH:** Role `KANWIL_ADMIN` yang membuka halaman pengawasan tagihan kantin di wilayahnya menerima error `403 Forbidden` dari BE, sehingga FE terpaksa mengandalkan data mock/fallback.

**Rekomendasi Solusi untuk Tim BE:**
1. Tambahkan `Role.KANWIL_ADMIN` pada route:
   - `GET /api/canteen/contracts`: izinkan Kanwil dengan membatasi data branch yang berada di bawah `kanwilId` dari user Kanwil yang login.
   - `GET /api/canteen/billing/calls`: izinkan Kanwil dan Supervisor (`Role.SUPERVISOR`) untuk kebutuhan audit pemakaian pulsa/menit kantin.

---

### A.5. Analisis Ringkasan Dashboard SPV & UPT
**Lokasi Halaman FE:**
- SPV Dashboard: `src/pages/branch/dashboard/Supervisor.jsx`
- Kepala UPT Dashboard: `src/pages/branch/dashboard/Head.jsx`

**Kondisi Saat Ini di Backend:**
- Di `src/modules/dashboard/dashboard.service.ts` baris 417 (`getSupervisorSummary`):
  Perhitungan `totalPackages` dan `activePackages` masih menggunakan query `OR: [{ branchId }, { branchId: null }]`. Hal ini menyebabkan kartu metrik SPV di cabang baru menghitung paket global sebagai paket cabang.
- **Rekomendasi:** Perbaiki query count di `dashboard.service.ts` agar hanya menghitung `where: { branchId }`.

---

### A.6. Tabel Spesifikasi Kebutuhan Endpoint & Field Response

Berikut adalah rincian lengkap endpoint yang dibutuhkan atau perlu disesuaikan oleh tim BE:

| No | Method | Path Usulan / Eksisting | Dipakai di Halaman FE | Role Akses | Request (Query / Body) | Response Yang Diharapkan | Status di BE |
|---|---|---|---|---|---|---|---|
| **1** | `GET` | `/api/calls/channel-summary` | - Superadmin: `CallsHistory.jsx`<br>- Kanwil: `calls/History.jsx`<br>- UPT: `branch/calls/History.jsx` | `SUPERADMIN`, `KANWIL_ADMIN`, `BRANCH_HEAD`, `SUPERVISOR` | **Query:**<br>`branchId` (opsional)<br>`kanwilId` (opsional)<br>`startDate` (ISO string)<br>`endDate` (ISO string)<br>`status` (SUCCESS/FAILED/dll)<br>`type` (VOICE/VIDEO)<br>`search` (kata kunci WBP/nomor) | `200 OK`<br>`{`<br>&nbsp;&nbsp;`"success": true,`<br>&nbsp;&nbsp;`"data": {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"totalWebSeconds": 14520,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"totalGsmSeconds": 6240,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"totalWebCalls": 120,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"totalGsmCalls": 45,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"percentageWeb": 69.95,`<br>&nbsp;&nbsp;&nbsp;&nbsp;`"percentageGsm": 30.05`<br>&nbsp;&nbsp;`}`<br>`}` | **BELUM ADA** (Saat ini FE terpaksa menghitung manual dari 20 item per page) |
| **2** | `GET` | `/api/recordings` | - UPT: `branch/recordings/List.jsx`<br>- Superadmin: `calls/Recordings.jsx` | `SUPERADMIN`, `KANWIL_ADMIN`, `BRANCH_HEAD`, `SUPERVISOR` | **Query:** `page`, `limit`, `branchId`, `search`, `startDate`, `endDate` | Tambahkan field di level root item:<br>`{`<br>&nbsp;&nbsp;`"id": "rec_uuid",`<br>&nbsp;&nbsp;`"targetPhone": "08123456789",` *(ekspos dari call.targetPhone)*<br>&nbsp;&nbsp;`"inmateName": "Budi Santoso",`<br>&nbsp;&nbsp;`"durationSeconds": 180,`<br>&nbsp;&nbsp;`"audioUrl": "/api/recordings/stream/..."`<br>`}` | **KURANG FIELD** (`targetPhone` hanya ada di dalam objek `call.targetPhone`, tidak di root) |
| **3** | `GET` | `/api/packages` *(Penyesuaian)* | - SPV: `branch/packages/List.jsx`<br>- Kantin: `canteen/packages/List.jsx` | `SUPERADMIN`, `SUPERVISOR`, `CANTEEN_STAFF` | **Query:** `branchId=xxx` | HANYA paket milik cabang tersebut (`where: { branchId }`). Jangan sertakan `branchId: null`. Cabang baru harus mengembalikan array kosong `[]`. | **PERLU PERBAIKAN LOGIKA** (Saat ini masih bocor paket global `branchId: null`) |
| **4** | `GET` | `/api/packages/templates` | - SPV: `branch/packages/List.jsx` *(Bagian Paket Rekomendasi)* | `SUPERADMIN`, `SUPERVISOR` | **Query:** Tidak ada | `200 OK`<br>`{`<br>&nbsp;&nbsp;`"success": true,`<br>&nbsp;&nbsp;`"data": [`<br>&nbsp;&nbsp;&nbsp;&nbsp;`{`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"id": "tpl_1",`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"name": "Paket Hemat 10 Menit",`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"price": 15000,`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"durationMinutes": 10,`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"isTemplate": true`<br>&nbsp;&nbsp;&nbsp;&nbsp;`}`<br>&nbsp;&nbsp;`]`<br>`}` | **BELUM ADA** (SPV membutuhkan template resmi dari sistem tanpa mencemari paket aktif cabang) |
| **5** | `GET` | `/api/canteen/contracts` *(Penyesuaian RBAC)* | - Kanwil: `kanwil/canteen/TariffContracts.jsx` | `SUPERADMIN`, `KANWIL_ADMIN` | **Query:** `kanwilId=xxx` atau `branchId=xxx` | Daftar kontrak tarif seluruh cabang di wilayah Kanwil tersebut. | **KURANG ROLE AKSES** (`KANWIL_ADMIN` saat ini di-reject `403 Forbidden`) |
| **6** | `GET` | `/api/canteen/billing/calls` *(Penyesuaian RBAC)* | - Kanwil: `kanwil/canteen/Billing.jsx`<br>- SPV: `branch/billing/CanteenCalls.jsx` | `SUPERADMIN`, `KANWIL_ADMIN`, `SUPERVISOR`, `CANTEEN_STAFF` | **Query:** `branchId`, `month`, `year`, `page`, `limit` | Rincian log panggilan per voucher kantin untuk audit transparansi. | **KURANG ROLE AKSES** (Hanya `SUPERADMIN` & `CANTEEN_STAFF` yang diizinkan) |
| **7** | `GET` | `/api/dashboard/supervisor-summary` *(Penyesuaian)* | - SPV: `branch/dashboard/Supervisor.jsx` | `SUPERVISOR` | **Query:** None (ambil dari token user) | Metrik `totalPackages` dan `activePackages` harus murni menghitung paket milik `branchId` supervisor tersebut. | **PERLU PERBAIKAN LOGIKA** (Menghitung paket global `branchId: null`) |

---

## 3. BAGIAN B: AUDIT MIGRASI DOMAIN EMAIL AKUN (`@pascall.id` -> `[DOMAIN_BARU]`)

Domain email akun lama `@pascall.id` akan diperbarui secara serentak ke domain baru: `[DOMAIN_BARU]`.
Berikut adalah hasil penelusuran menyeluruh (grep) pada seluruh file FE dan BE.

### B.1. Inventaris Seluruh Kemunculan `pascall.id` di FE dan BE

#### 1. Sisi Frontend (`PasCall/`) - Total: 37 Kemunculan
| No | File | Baris | Jenis | Deskripsi Singkat | Saran Perubahan |
|---|---|---|---|---|---|
| 1 | `src/pages/Branches/Create.jsx` | 29 | **Kode (Konstanta)** | `export const ADMIN_EMAIL_DOMAIN = 'pascall.id';` | Ganti `'pascall.id'` dengan `[DOMAIN_BARU]` (atau ambil dari `import.meta.env.VITE_EMAIL_DOMAIN`) |
| 2 | `src/pages/kanwil/branches/Create.jsx` | 28 | **Kode (Konstanta)** | `export const ADMIN_EMAIL_DOMAIN = 'pascall.id';` | Ganti `'pascall.id'` dengan `[DOMAIN_BARU]` (atau ambil dari env) |
| 3 | `src/pages/branch/users/Create.jsx` | 83 | **Kode (Generator)** | Komentar `// Format: peran.nama.cabang@pascall.id` | Perbarui komentar ke `@ [DOMAIN_BARU]` |
| 4 | `src/pages/branch/users/Create.jsx` | 105 | **Kode (Generator)** | Template string `${rolePrefix}.${cleanName}.${cleanBranch}@pascall.id` | Ganti `@pascall.id` dengan `@[DOMAIN_BARU]` |
| 5 | `src/pages/branch/users/Create.jsx` | 126 | **Kode (Generator)** | Template string `${rolePrefix}.${cleanBranch}@pascall.id` | Ganti `@pascall.id` dengan `@[DOMAIN_BARU]` |
| 6 | `src/pages/branch/users/Create.jsx` | 519 | **Contoh Teks (Placeholder)** | `placeholder="spv.budi.lapas-a@pascall.id"` | Ganti ke `spv.budi.lapas-a@[DOMAIN_BARU]` |
| 7 | `src/pages/branch/users/Create.jsx` | 528 | **Teks Tampilan (Keterangan)** | `Format otomatis: peran.nama.cabang@pascall.id` | Ganti ke `...@[DOMAIN_BARU]` |
| 8 | `src/pages/kanwil/Create.jsx` | 33 | **Kode (Konstanta)** | Komentar `// Format: admin.[slug-kanwil]@pascall.id` | Perbarui komentar ke `@ [DOMAIN_BARU]` |
| 9 | `src/pages/kanwil/Create.jsx` | 80 | **Kode (Generator)** | Template string `admin.${slug}@pascall.id` | Ganti `@pascall.id` dengan `@[DOMAIN_BARU]` |
| 10 | `src/pages/kanwil/Create.jsx` | 95 | **Kode (Generator)** | Template string `admin.${slug}@pascall.id` | Ganti `@pascall.id` dengan `@[DOMAIN_BARU]` |
| 11 | `src/pages/kanwil/Create.jsx` | 163 | **Kode (Generator)** | Template string `admin.${slug}@pascall.id` | Ganti `@pascall.id` dengan `@[DOMAIN_BARU]` |
| 12 | `src/pages/kanwil/Create.jsx` | 367 | **Contoh Teks (Keterangan)** | Teks panduan `admin.jabar@pascall.id` | Ganti ke `admin.jabar@[DOMAIN_BARU]` |
| 13 | `src/pages/kanwil/Create.jsx` | 406 | **Contoh Teks (Placeholder)** | `placeholder="admin.jabar@pascall.id"` | Ganti ke `admin.jabar@[DOMAIN_BARU]` |
| 14 | `src/pages/kanwil/Create.jsx` | 549 | **Teks Tampilan (Review)** | Keterangan `admin.<slug>@pascall.id` | Ganti ke `admin.<slug>@[DOMAIN_BARU]` |
| 15 | `src/pages/kanwil/Create.jsx` | 559 | **Teks Tampilan (Review)** | Keterangan format email `@pascall.id` | Ganti ke `@[DOMAIN_BARU]` |
| 16 | `src/pages/Login.jsx` | 82 | **Mock / Default** | `superadmin@pascall.id` (Quick Login Superadmin) | Ganti ke `superadmin@[DOMAIN_BARU]` |
| 17 | `src/pages/Login.jsx` | 95 | **Mock / Default** | `kanwil.jabar@pascall.id` (Quick Login Kanwil) | Ganti ke `kanwil.jabar@[DOMAIN_BARU]` |
| 18 | `src/pages/Login.jsx` | 105 | **Mock / Default** | `kalapas.cipinang@pascall.id` (Quick Login Kalapas) | Ganti ke `kalapas.cipinang@[DOMAIN_BARU]` |
| 19 | `src/pages/Login.jsx` | 118 | **Mock / Default** | `spv.cipinang@pascall.id` (Quick Login SPV) | Ganti ke `spv.cipinang@[DOMAIN_BARU]` |
| 20 | `src/pages/Login.jsx` | 131 | **Mock / Default** | `kantin.cipinang@pascall.id` (Quick Login Kantin) | Ganti ke `kantin.cipinang@[DOMAIN_BARU]` |
| 21 | `src/pages/Login.jsx` | 370 | **Contoh Teks (Placeholder)** | `placeholder="nama@pascall.id"` | Ganti ke `nama@[DOMAIN_BARU]` |
| 22 | `src/pages/Login.jsx` | 596 | **Teks Tampilan (Bantuan)** | Keterangan bantuan login `admin@pascall.id` | Ganti ke `admin@[DOMAIN_BARU]` |
| 23 | `src/pages/Landing.jsx` | 1577 | **Teks Tampilan** | `mailto:cs@pascall.id` | Ganti ke `mailto:cs@[DOMAIN_BARU]` |
| 24 | `src/pages/Landing.jsx` | 1579 | **Teks Tampilan** | Teks `cs@pascall.id` | Ganti ke `cs@[DOMAIN_BARU]` |
| 25 | `src/pages/LandingAdmin.jsx` | 677 | **Teks Tampilan** | `mailto:cs@pascall.id` | Ganti ke `mailto:cs@[DOMAIN_BARU]` |
| 26 | `src/pages/LandingAdmin.jsx` | 678 | **Teks Tampilan** | Teks `cs@pascall.id` | Ganti ke `cs@[DOMAIN_BARU]` |
| 27 | `src/pages/LandingAdmin.jsx` | 728 | **Teks Tampilan** | `mailto:cs@pascall.id` | Ganti ke `mailto:cs@[DOMAIN_BARU]` |
| 28 | `src/pages/LandingAdmin.jsx` | 730 | **Teks Tampilan** | Teks `cs@pascall.id` | Ganti ke `cs@[DOMAIN_BARU]` |
| 29 | `src/dummy/kanwil/kanwilData.js` | 13, 23, 33, 43 | **Mock Data** | Email kanwil: `kanwil.dki@pascall.id`, `kanwil.jabar@pascall.id`, dll. (4 baris) | Ganti ke `@[DOMAIN_BARU]` |
| 30 | `src/services/mockData.js` | 130–150 | **Mock Data** | Beragam email mock petugas & admin cabang (21 kemunculan) | Ganti ke `@[DOMAIN_BARU]` |
| 31 | `README.md` | 79, 87, 88 | **Dokumentasi** | Panduan kredensial default sistem | Perbarui dokumentasi ke `[DOMAIN_BARU]` |

---

#### 2. Sisi Backend (`PasCall-BackEnd/`) - Total: 33 Kemunculan
| No | File | Baris | Jenis | Deskripsi Singkat | Saran Perubahan |
|---|---|---|---|---|---|
| 1 | `prisma/seed.ts` | 31 | **Seed Data** | Email default superadmin: `email: 'superadmin@pascall.id'` | Ganti ke `'superadmin@[DOMAIN_BARU]'` |
| 2 | `prisma/seed.ts` | 39 | **Seed Log** | Log console: `Superadmin ready: superadmin@pascall.id` | Ganti ke `superadmin@[DOMAIN_BARU]` |
| 3 | `src/modules/branch/branch.dto.ts` | 41 | **Kode (Fallback Default)** | `const defaultEmail = \`kepala.${cleanSlug \|\| 'upt'}@pascall.id\`;` | **KRUSIAL**: Ganti `@pascall.id` dengan domain baru atau `process.env.DEFAULT_EMAIL_DOMAIN` |
| 4 | `src/docs/openapi.yaml` | 691, 1249, 1298, 1304, 1405 | **Dokumentasi API** | Contoh email pengguna: `user@pascall.id`, `supervisor@pascall.id`, dll. | Ganti seluruh contoh email menjadi `@[DOMAIN_BARU]` |
| 5 | `src/docs/openapi.yaml` | 1656, 1670, 2016 | **Dokumentasi API** | Contoh URL MinIO & webhook: `https://storage.pascall.id/...` | Ganti domain storage ke `[DOMAIN_BARU]` |
| 6 | `src/scripts/setup-local-test-data.ts` | 25, 41, 57, 72, 87, 102 | **Script Pengujian** | Akun test lokal: `superadmin@pascall.id`, `kanwil.dki@pascall.id`, dll. | Sesuaikan dengan domain baru |
| 7 | `src/scripts/test-new-endpoints.ts` | 38, 48, 58 | **Script Pengujian** | Kredensial uji endpoint baru | Sesuaikan dengan domain baru |
| 8 | `src/scripts/test-revisi-be.ts` | 40, 50, 60, 70, 80 | **Script Pengujian** | Kredensial uji role revisi | Sesuaikan dengan domain baru |
| 9 | `src/scripts/test-stream-proof.ts` | 35 | **Script Pengujian** | Kredensial uji streaming audio rekaman | Sesuaikan dengan domain baru |
| 10 | `tests/role-access.test.ts` | 40, 48, 56, 64, 72 | **Test Otomatis** | User payload integration test role-access | Sesuaikan dengan domain baru |
| 11 | `DEPLOY_VPS.md` | 120–123, 127, 134 | **Dokumentasi VPS** | Konfigurasi domain Caddy & sub-domain API/MinIO | Sesuaikan dengan nama domain produksi baru |
| 12 | `deploy/CHECKLIST_DEPLOYMENT.md` | 70–72, 77, 81, 85 | **Dokumentasi Deploy** | Panduan routing DNS produksi | Sesuaikan dengan domain baru |
| 13 | `deploy/Caddyfile` | 2 | **Konfigurasi Reverse Proxy** | Domain utama reverse proxy web server | Sesuaikan dengan domain baru |

---

### B.2. Analisis Dampak Database & Skrip Migrasi Akun Eksisting

#### Dampak Terhadap Database & Akun Eksisting:
1. **Kegagalan Login (Authentication Failure):**
   - Di BE (`src/modules/auth/auth.service.ts`), login dilakukan dengan pencarian tepat:
     `prisma.user.findUnique({ where: { email } })`.
   - Jika pengguna memasukkan email baru (misal `admin.jabar@[DOMAIN_BARU]`), sedangkan di database record masih tersimpan sebagai `admin.jabar@pascall.id`, maka database akan mengembalikan `null` dan login akan ditolak (`401 Invalid credentials`).
2. **Kebutuhan Migrasi Data:**
   - **WAJIB DILAKUKAN MIGRASI DATA**. Data email di database PostgreSQL harus diperbarui sebelum atau bersamaan dengan peluncuran perubahan domain di sisi FE/BE.

#### Skrip Migrasi SQL (Rekomendasi untuk Tim DBA/BE):
Jalankan query migrasi berikut pada database PostgreSQL:
```sql
-- 1. Backup atau cek akun yang terdampak
SELECT id, email, role, "fullName" 
FROM "User" 
WHERE email LIKE '%@pascall.id';

-- 2. Lakukan update penggantian domain secara atomik
BEGIN;

UPDATE "User"
SET email = REPLACE(email, '@pascall.id', '@[DOMAIN_BARU]')
WHERE email LIKE '%@pascall.id';

-- Cek jika ada tabel relasi lain yang mencatat email (misal log audit atau contact person)
UPDATE "Branch"
SET "contactEmail" = REPLACE("contactEmail", '@pascall.id', '@[DOMAIN_BARU]')
WHERE "contactEmail" LIKE '%@pascall.id';

COMMIT;

-- 3. Verifikasi hasil pembaruan
SELECT COUNT(*) FROM "User" WHERE email LIKE '%@pascall.id'; -- Harus 0
```

---

### B.3. Audit Validasi Format Email di Backend

Tim telah mengaudit seluruh skema validasi DTO di Backend:
- `src/modules/auth/auth.dto.ts`
- `src/modules/user/user.dto.ts`
- `src/modules/kanwil/kanwil.dto.ts`
- `src/modules/branch/branch.dto.ts`

**Temuan Audit Validasi BE:**
1. **TIDAK ADA REGEX HARDCODED:** Semua validasi email di Backend menggunakan validator standar Zod:
   ```typescript
   email: z.string().email('Format email tidak valid')
   ```
   Backend **tidak pernah mengunci** domain harus `@pascall.id`. Email dengan domain apapun (seperti `@sadewa.id` atau `@[DOMAIN_BARU]`) akan lolos validasi sintaks Zod.
2. **Pengecualian Hardcoded di BE:**
   Satu-satunya kode BE yang mengunci nama domain ada di file [src/modules/branch/branch.dto.ts:41](file:///d:/PROJECT%20TIM/PasCall-BackEnd/src/modules/branch/branch.dto.ts#L41):
   ```typescript
   const defaultEmail = `kepala.${cleanSlug || 'upt'}@pascall.id`;
   ```
   Jika pembuat UPT baru tidak mengisi email kepala UPT secara manual, BE akan men-generate default email menggunakan domain lama. Ini **harus diganti** oleh tim BE.

---

### B.4. Mekanisme Pembuatan Email Otomatis di Frontend

Frontend memiliki beberapa generator email otomatis yang berjalan secara reaktif saat admin mengetik nama cabang, posisi, atau wilayah:
1. **Generator Akun Cabang (`src/pages/Branches/Create.jsx` & `src/pages/kanwil/branches/Create.jsx`):**
   - Memakai konstanta: `export const ADMIN_EMAIL_DOMAIN = 'pascall.id';`
   - Formula: `kepala.<slug-cabang>@${ADMIN_EMAIL_DOMAIN}`
2. **Generator Pengguna Petugas Cabang (`src/pages/branch/users/Create.jsx`):**
   - Formula: `${rolePrefix}.${cleanName}.${cleanBranch}@pascall.id`
   - Contoh: `spv.budi.lapas-cipinang@pascall.id` atau `kantin.lapas-cipinang@pascall.id`
3. **Generator Admin Kanwil (`src/pages/kanwil/Create.jsx`):**
   - Formula: `admin.${slugKanwil}@pascall.id`
   - Contoh: `admin.jabar@pascall.id`

**Rekomendasi Implementasi FE (Setelah Dokumen Ini Disetujui):**
- Pindahkan konfigurasi domain ke file `.env`:
  `VITE_EMAIL_DOMAIN=[DOMAIN_BARU]`
- Seluruh modul pembuat email di FE cukup mengimpor konfigurasi tersebut sehingga di masa depan tidak perlu mencari dan mengubah puluhan string manual.

---

## 4. LANGKAH TINDAK LANJUT REKOMENDASI (ACTION PLAN)

Untuk tim Backend (PasCall-BackEnd):
1. **Prioritas 1 (Analitik & Reporting):** Buat endpoint `GET /api/calls/channel-summary` agar 3 card ringkasan (Web vs GSM) di Superadmin, Kanwil, dan Kepala UPT dapat menampilkan data riil dari seluruh database hasil filter, bukan hanya 20 data per halaman.
2. **Prioritas 2 (Fix Payload & Multi-tenant):**
   - Di `recording.controller.ts`: sertakan `targetPhone: rec.call?.targetPhone` langsung di root object response.
   - Di `package.service.ts`: buang klausa `{ branchId: null }` pada query paket cabang, dan sediakan endpoint `GET /api/packages/templates`.
3. **Prioritas 3 (RBAC Kanwil):** Buka akses `GET /api/canteen/contracts` dan `GET /api/canteen/billing/calls` untuk role `KANWIL_ADMIN` dengan pembatasan cabang sewilayahnya.
4. **Prioritas 4 (Migrasi Domain Email):**
   - Ubah default email generator di `src/modules/branch/branch.dto.ts:41` dan `prisma/seed.ts`.
   - Eksekusi skrip migrasi data SQL `UPDATE "User"` pada database staging dan production.
