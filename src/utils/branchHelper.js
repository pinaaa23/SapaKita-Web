/**
 * Helper utilitas normalisasi dan komparasi nama cabang/UPT.
 * Mengatasi inkonsistensi penamaan seperti:
 * - "Lapas II Yogyakarta" vs "Lapas Kelas II Yogyakarta" vs "mock-upt-yogyakarta"
 * - ID UUID backend vs nama cabang
 */

export function normalizeBranchName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\b(lapas|rutan|bapas|rupbasan|kelas|kls|upt|indonesia|wilayah|provinsi|kota|kabupaten|i|ii|iii|iv|iia|iib)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSameBranch(branchA, branchB) {
  if (!branchA || !branchB) return true; // jika salah satu null/undefined, izinkan (jangan filter agresif)
  
  const strA = String(branchA).toLowerCase().trim();
  const strB = String(branchB).toLowerCase().trim();

  // 1. Kesamaan identik
  if (strA === strB) return true;

  // 2. Jika salah satu adalah wildcard umum
  if (strA === 'all' || strB === 'all' || strA === 'upt anda' || strB === 'upt anda' || strA === 'cabang terdaftar' || strB === 'cabang terdaftar' || strA === 'cabang ini' || strB === 'cabang ini') {
    return true;
  }

  // 3. Normalisasi teks tanpa gelar lapas/kelas
  const normA = normalizeBranchName(strA);
  const normB = normalizeBranchName(strB);

  if (normA && normB) {
    if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  // 4. Periksa kata kunci wilayah/daerah (misal 'yogyakarta', 'cipinang', 'salemba', 'surakarta', 'medan', 'tangerang')
  const keywords = ['yogyakarta', 'jogja', 'cipinang', 'salemba', 'surakarta', 'solo', 'medan', 'tangerang', 'bandung', 'surabaya', 'semarang'];
  for (const kw of keywords) {
    const hasA = strA.includes(kw);
    const hasB = strB.includes(kw);
    if (hasA && hasB) {
      return true;
    }
  }

  // 5. Cek kata yang signifikan (panjang >= 4 karakter)
  const wordsA = (normA || strA).split(/\s+/).filter(w => w.length >= 4);
  const wordsB = (normB || strB).split(/\s+/).filter(w => w.length >= 4);
  if (wordsA.some(w => wordsB.includes(w))) {
    return true;
  }

  return false;
}
