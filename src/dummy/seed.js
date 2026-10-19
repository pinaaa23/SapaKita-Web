/**
 * Data Dasar / Seed untuk Mode Demo PasCall
 * Menggunakan tanggal relatif terhadap waktu sekarang (Date.now())
 * Dataset dikosongkan untuk testing dari nol.
 */

// Helper untuk membuat tanggal relatif (contoh: 2 jam lalu, 1 hari lalu, dsb)
export const getRelativeDate = (daysAgo = 0, hoursAgo = 0, minutesAgo = 0) => {
  const date = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
  return date.toISOString();
};

export const getInitialDummyData = () => {
  return {
    branches: [],
    inmates: [],
    packages: [],
    calls: [],
    transactions: [],
    users: [],
    wartelUnits: [],
  };
};
