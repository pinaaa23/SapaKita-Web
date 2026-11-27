# Color Palette — SapaKita Web

Dokumen ini memuat standar token warna, kode HEX, padanan Tailwind CSS, dan petunjuk penggunaannya di seluruh antarmuka web SapaKita.

---

## 1. Warna Brand Utama (Primary — Hijau Toska SapaKita)
Warna identitas platform yang melambangkan nuansa pesantren yang sejuk, islami, terpercaya, dan modern.

| Token Warna | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Base** | `#0D7A73` / `#0E7A74` | `bg-[#0D7A73]` / `text-[#0D7A73]` | Tombol aksi utama (CTA), menu navigasi aktif, header tab aktif, icon highlight, nominal tagihan/saldo utama. |
| **Primary Light** | `#14968C` | `bg-[#14968C]` / `teal-600` | State *hover* pada tombol utama, teks interaktif sekunder. |
| **Primary Dark** | `#0A5A55` | `bg-[#0A5A55]` / `teal-800` | State *active / pressed* pada tombol, border fokus tebal. |
| **Primary Soft** | `#E6F4F1` / `#CCFBF1` | `bg-teal-50` / `bg-teal-100` | Latar badge status toska, background icon container, highlight hover tabel. |
| **Primary Border**| `#99F6E4` | `border-teal-200` | Garis tepi badge toska, border tombol outline toska. |

---

## 2. Gradasi Sidebar Melayang (Floating Sidebar)
Gradasi vertikal khas SapaKita dari sudut kiri atas ke kanan bawah pada kontainer sidebar.

| Posisi Gradasi | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Gradasi Atas** | `#1F5F8B` | `from-[#1F5F8B]` | Bagian kepala sidebar (area logo dan identitas Superadmin). |
| **Gradasi Tengah**| `#16707C` | `via-[#16707C]` | Transisi warna di bagian tengah menu navigasi. |
| **Gradasi Bawah** | `#0D7A73` | `to-[#0D7A73]` | Bagian kaki sidebar (tombol Logout dan info versi). |
| **Teks Menu Nonaktif** | `#CCFBF1` | `text-teal-100` | Label menu yang sedang tidak dipilih. |
| **Ikon Nonaktif** | `#99F6E4` | `text-teal-200` | Ikon menu yang sedang tidak dipilih. |
| **Pill Menu Aktif** | `#FFFFFF` | `bg-white text-[#0E7A74]` | Tombol pill menu yang sedang aktif (latar putih dengan teks toska tua). |

---

## 3. Latar Belakang & Permukaan (Background & Surfaces)
Warna alas dan kontainer yang dirancang bersih, lembut di mata, dan memberikan kontras yang ideal.

| Tipe Permukaan | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **App Background** | `#E6F4F1` $\rightarrow$ `#F1F8FA` | `bg-gradient-to-br from-[#E6F4F1] via-[#EDF6F7] to-[#F1F8FA]` | Background menyeluruh halaman aplikasi / dashboard (`min-h-screen`). |
| **Surface Pure** | `#FFFFFF` | `bg-white` | Kartu ringkasan (*Cards*), kontainer tabel data, modal dialog, dropdown. |
| **Surface Muted** | `#F8FAFC` | `bg-slate-50` | Input teks form sebelum fokus, baris selang-seling tabel, header tabel. |
| **Surface Subtle**| `#F1F5F9` | `bg-slate-100` | Tombol batal/tutup, wrapper tombol tab filter, pembatas non-kontras. |

---

## 4. Tipografi & Teks Netral (Typography Neutrals)
Tingkat kontras teks yang konsisten untuk keterbacaan (*readability*) optimal.

| Tingkat Kontras | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Teks Utama** | `#0F172A` | `text-slate-900` | Judul halaman (H1, H2), nama santri tebal, angka nominal besar. |
| **Teks Body** | `#334155` | `text-slate-700` | Teks isi data tabel, paragraf keterangan, nilai isian form. |
| **Teks Muted** | `#64748B` | `text-slate-500` | Subjudul halaman, label input formulir, teks bantuan (*hint*). |
| **Teks Lemah** | `#94A3B8` | `text-slate-400` | Placeholder input, keterangan NIS kecil, stempel tanggal/waktu. |

---

## 5. Status & Indikator Finansial / Operasional (Semantic Colors)
Pewarnaan fungsional untuk memudahkan identifikasi status transaksi dan peran:

| Kategori Status | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Sukses / Lunas** | Teks: `#047857`<br>Latar: `#ECFDF5` | `text-emerald-700 bg-emerald-50 border-emerald-200` | Status **Lunas**, santri **Aktif**, panggilan sukses, akumulasi menit. |
| **Peringatan / Menunggu** | Teks: `#B45309`<br>Latar: `#FFFBEB` | `text-amber-700 bg-amber-50 border-amber-200` | Status **Menunggu ACC**, kontrak **Belum Diatur**, notifikasi transfer masuk. |
| **Bahaya / Telat** | Teks: `#BE123C`<br>Latar: `#FFF1F2` | `text-rose-700 bg-rose-50 border-rose-200` | Status **Telat Bayar**, akun **Nonaktif**, penolakan transfer, error validasi. |
| **Porsi Pimpinan** | Teks: `#6B21A8`<br>Latar: `#FAF5FF` | `text-purple-700 bg-purple-50 border-purple-200` | Badge alokasi bagi hasil **Pimpinan Pondok (5%)**. |
| **Kategori Video** | Teks: `#4338CA`<br>Latar: `#EEF2FF` | `text-indigo-700 bg-indigo-50 border-indigo-200` | Badge paket komunikasi **Video Call**. |
| **Internal Kopontren**| Teks: `#0369A1`<br>Latar: `#F0F9FF` | `text-sky-700 bg-sky-50 border-sky-200` | Badge porsi hak internal **Kopontren (40%)**. |

---

## 6. Border & Interaksi Fokus (Borders & Outlines)

| Jenis Border | Nilai HEX | Tailwind Class | Keterangan & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Border Standar** | `#E2E8F0` | `border-slate-200` | Garis tepi kartu, pemisah baris tabel, border input form. |
| **Focus Ring** | `#0D7A73` (20% Opacity) | `focus:ring-[#0D7A73]/20 focus:border-[#0D7A73]` | *Glow ring* saat input atau tombol sedang aktif / difokuskan. |
| **Subtle Divider**| `#F1F5F9` | `border-slate-100` | Garis tipis pemisah section dalam modal atau header kartu. |
