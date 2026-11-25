# SapaKita-Web

**SapaKita — Sistem Komunikasi Wartel Pesantren Terpadu**  
*"Satu Sapaan, Sejuta Kedekatan"*

Aplikasi web terpadu untuk manajemen layanan komunikasi santri di pondok pesantren modern, menghubungkan santri dengan keluarga/wali secara terjadwal, terpantau, dan transparan.

---

## 🚀 Cara Menjalankan

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Bangun untuk produksi
npm run build
```

---

## 👥 Role & Hak Akses

Halaman login terpadu (`/login`) melayani seluruh role pengguna:

| Role | Nilai Role | Halaman Utama | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Petugas Pondok / Supervisor** | `supervisor` / `kepala_upt` | `/branch/dashboard` | Manajemen santri, approval, jadwal panggilan, monitoring video/voice call. |
| **Kasir Kopontren** | `operator_kantin` | `/kopontren` | Billing panggilan, top-up saldo santri, penjualan voucher/paket. |
| **Yayasan Pusat** | `admin_kanwil` | `/kanwil/dashboard` | Monitoring multi-kampus pesantren, rekapitulasi data santri & panggilan. |
| **Manajemen Keuangan** | `finance` | `/finance/dashboard` | Rekonsiliasi transaksi, laporan keuangan platform, dan penagihan. |
| **Super Administrator** | `superadmin` | `/dashboard` | Konfigurasi sistem global, master data, dan audit log. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 8, Tailwind CSS, Lucide Icons, HLS.js
- **State & Routing**: React Router DOM v6, React Context
- **Charts & Export**: Chart.js, Recharts, XLSX, JSPDF
