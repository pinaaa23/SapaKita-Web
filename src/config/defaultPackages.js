/**
 * Konfigurasi Paket Komunikasi Default untuk Cabang (UPT) Baru
 * Digunakan saat pendaftaran UPT baru oleh Superadmin,
 * atau saat melakukan "Isi Paket Default" pada cabang yang belum memiliki paket.
 */
export const DEFAULT_PACKAGES = [
  {
    nama: 'Paket Suara 5 Menit',
    kategori: 'telepon',
    durasi: 5,
    harga: 5000,
    status: 'Aktif',
  },
  {
    nama: 'Paket Suara 15 Menit',
    kategori: 'telepon',
    durasi: 15,
    harga: 12000,
    status: 'Aktif',
  },
  {
    nama: 'Paket Video Call 10 Menit',
    kategori: 'video',
    durasi: 10,
    harga: 20000,
    status: 'Aktif',
  },
];

export default DEFAULT_PACKAGES;
