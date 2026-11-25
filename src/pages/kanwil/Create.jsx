import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Power, 
  Info, 
  X, 
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getAllYayasansForSuperadmin, 
  getOfficialProvinces, 
  saveYayasanFromSuperadmin, 
  deleteYayasanFromSuperadmin 
} from '../../services/YayasanService';
import { generateRandomPassword } from '../../services/userService';

/**
 * Generator rekomendasi email administrator Yayasan
 * Format: admin.[slug_wilayah]@sapakita.id
 */
export const generateRecommendedEmail = (name, wilayah, code) => {
  const text = `${wilayah || ''} ${name || ''} ${code || ''}`.toLowerCase();
  let slug = '';
  if (text.includes('jawa barat') || text.includes('jabar') || text.includes('bandung')) slug = 'jabar';
  else if (text.includes('dki') || text.includes('jakarta')) slug = 'dki';
  else if (text.includes('jawa tengah') || text.includes('jateng') || text.includes('semarang')) slug = 'jateng';
  else if (text.includes('yogyakarta') || text.includes('diy') || text.includes('jogja')) slug = 'diy';
  else if (text.includes('jawa timur') || text.includes('jatim') || text.includes('surabaya')) slug = 'jatim';
  else if (text.includes('banten') || text.includes('serang')) slug = 'banten';
  else if (text.includes('bali') || text.includes('denpasar')) slug = 'bali';
  else if (text.includes('aceh') || text.includes('banda aceh')) slug = 'aceh';
  else if (text.includes('sumatera utara') || text.includes('sumut') || text.includes('medan')) slug = 'sumut';
  else if (text.includes('sumatera barat') || text.includes('sumbar') || text.includes('padang')) slug = 'sumbar';
  else if (text.includes('riau') || text.includes('pekanbaru')) slug = 'riau';
  else if (text.includes('kepulauan riau') || text.includes('kepri') || text.includes('batam')) slug = 'kepri';
  else if (text.includes('jambi')) slug = 'jambi';
  else if (text.includes('sumatera selatan') || text.includes('sumsel') || text.includes('palembang')) slug = 'sumsel';
  else if (text.includes('bangka') || text.includes('belitung') || text.includes('babel')) slug = 'babel';
  else if (text.includes('bengkulu')) slug = 'bengkulu';
  else if (text.includes('lampung')) slug = 'lampung';
  else if (text.includes('kalimantan barat') || text.includes('kalbar') || text.includes('pontianak')) slug = 'kalbar';
  else if (text.includes('kalimantan tengah') || text.includes('kalteng') || text.includes('palangkaraya')) slug = 'kalteng';
  else if (text.includes('kalimantan selatan') || text.includes('kalsel') || text.includes('banjarmasin')) slug = 'kalsel';
  else if (text.includes('kalimantan timur') || text.includes('kaltim') || text.includes('samarinda')) slug = 'kaltim';
  else if (text.includes('kalimantan utara') || text.includes('kaltara')) slug = 'kaltara';
  else if (text.includes('sulawesi utara') || text.includes('sulut') || text.includes('manado')) slug = 'sulut';
  else if (text.includes('sulawesi tengah') || text.includes('sulteng') || text.includes('palu')) slug = 'sulteng';
  else if (text.includes('sulawesi selatan') || text.includes('sulsel') || text.includes('makassar')) slug = 'sulsel';
  else if (text.includes('sulawesi tenggara') || text.includes('sultra') || text.includes('kendari')) slug = 'sultra';
  else if (text.includes('sulawesi barat') || text.includes('sulbar') || text.includes('mamuju')) slug = 'sulbar';
  else if (text.includes('gorontalo')) slug = 'gorontalo';
  else if (text.includes('maluku utara') || text.includes('malut')) slug = 'malut';
  else if (text.includes('maluku') || text.includes('ambon')) slug = 'maluku';
  else if (text.includes('nusa tenggara barat') || text.includes('ntb') || text.includes('mataram')) slug = 'ntb';
  else if (text.includes('nusa tenggara timur') || text.includes('ntt') || text.includes('kupang')) slug = 'ntt';
  else if (text.includes('papua')) slug = 'papua';
  else {
    const stopwords = ['kantor', 'wilayah', 'Yayasan', 'kemenkumham', 'pemasyarakatan', 'dinas', 'provinsi', 'admin', 'Pesantren', 'Kampus'];
    const rawWords = (name || wilayah || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !stopwords.includes(w));
    slug = rawWords.slice(0, 2).join('') || (code ? code.toLowerCase().replace(/[^a-z0-9]/g, '') : 'wilayah');
  }
  return slug ? `admin.${slug}@sapakita.id` : '';
};

export default function YayasanCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const passedYayasan = location.state?.Yayasan;
  const isEditing = Boolean(id || passedYayasan);

  const initialYayasanName = passedYayasan?.YayasanName || passedYayasan?.name || '';
  const initialWilayah = passedYayasan?.wilayah || passedYayasan?.region || passedYayasan?.provinces?.[0] || '';
  const hasExistingCustomEmail = Boolean(
    passedYayasan?.adminEmail &&
    passedYayasan.adminEmail !== 'superadmin@sapakita.id' &&
    passedYayasan.adminEmail.trim() !== ''
  );
  const initialEmail = hasExistingCustomEmail
    ? passedYayasan.adminEmail
    : generateRecommendedEmail(initialYayasanName, initialWilayah, passedYayasan?.code);

  const [provinces, setProvinces] = useState([]);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(hasExistingCustomEmail);
  const [formData, setFormData] = useState({
    id: passedYayasan?.id || '',
    code: passedYayasan?.code || '',
    YayasanName: initialYayasanName,
    wilayah: initialWilayah,
    provinces: passedYayasan?.provinces || [],
    status: passedYayasan?.status || 'Aktif',
    adminEmail: initialEmail,
    adminName: passedYayasan?.adminName || passedYayasan?.adminUser?.name || (initialYayasanName ? `Admin ${initialYayasanName}` : ''),
    adminPassword: generateRandomPassword(),
    adminPhone: passedYayasan?.adminPhone || passedYayasan?.adminUser?.phone || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Delete Yayasan Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getOfficialProvinces()
      .then((res) => setProvinces(res || []))
      .catch((err) => console.error('Gagal mengambil daftar provinsi:', err));

    if (!isEditing) {
      // Inisialisasi kode Yayasan dan password acak
      getAllYayasansForSuperadmin()
        .then((list) => {
          const nextCode = `KW-${(list.length + 1).toString().padStart(2, '0')}`;
          const initialPass = generateRandomPassword();
          setFormData((prev) => ({
            ...prev,
            code: prev.code || nextCode,
            adminPassword: initialPass,
          }));
        })
        .catch(() => {
          setFormData((prev) => ({
            ...prev,
            code: prev.code || 'KW-01',
            adminPassword: generateRandomPassword(),
          }));
        });
    } else if (!passedYayasan && id) {
      // Jika reload saat mode edit tanpa passed state, cari datanya
      getAllYayasansForSuperadmin()
        .then((list) => {
          const found = list.find((k) => k.id === id || String(k.id) === String(id));
          if (found) {
            const fName = found.YayasanName || found.name || '';
            const fWilayah = found.wilayah || found.region || found.provinces?.[0] || '';
            const fExistingEmail = found.adminEmail || found.adminUser?.email || '';
            const fHasCustomEmail = Boolean(fExistingEmail && fExistingEmail !== 'superadmin@sapakita.id');
            const fEmail = fHasCustomEmail
              ? fExistingEmail
              : generateRecommendedEmail(fName, fWilayah, found.code);

            setIsEmailManuallyEdited(fHasCustomEmail);
            setFormData({
              id: found.id,
              code: found.code || '',
              YayasanName: fName,
              wilayah: fWilayah,
              provinces: found.provinces || [],
              status: found.status || 'Aktif',
              adminEmail: fEmail,
              adminName: found.adminName || found.adminUser?.name || (fName ? `Admin ${fName}` : ''),
              adminPassword: generateRandomPassword(),
              adminPhone: found.adminPhone || found.adminUser?.phone || '',
            });
          }
        })
        .catch((err) => console.error('Gagal mengambil data Yayasan edit:', err));
    }
  }, [id, isEditing, passedYayasan]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.YayasanName.trim()) {
      setErrorMsg('Nama Yayasan Pesantren wajib diisi.');
      return;
    }
    if (formData.provinces.length === 0) {
      setErrorMsg('Pilih minimal satu provinsi cakupan wilayah kerja.');
      return;
    }
    if (!formData.adminEmail.trim()) {
      setErrorMsg('Email login administrator wajib diisi.');
      return;
    }
    if (!isEditing && !formData.adminPassword) {
      setErrorMsg('Password sementara administrator wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetWilayah = formData.wilayah || formData.provinces[0] || formData.YayasanName || 'Indonesia';
      const effectivePassword = formData.adminPassword?.trim() || generateRandomPassword();
      const payload = {
        ...formData,
        wilayah: targetWilayah,
        adminPassword: effectivePassword,
      };
      await saveYayasanFromSuperadmin(payload);

      setCreatedCredentials({
        name: formData.YayasanName,
        code: formData.code,
        wilayah: targetWilayah,
        provinces: formData.provinces,
        adminName: formData.adminName || `Admin ${formData.YayasanName}`,
        email: formData.adminEmail,
        password: effectivePassword,
        isEdit: isEditing,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data Yayasan Pesantren.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!formData.id) {
      setDeleteError('ID Yayasan Pesantren tidak valid atau belum tersimpan.');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteYayasanFromSuperadmin(formData.id);
      setIsDeleteModalOpen(false);
      navigate('/Yayasan-management', {
        state: { successMessage: `Yayasan Pesantren "${formData.YayasanName}" berhasil dihapus dari sistem.` }
      });
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus Yayasan Pesantren.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    const isEdit = createdCredentials?.isEdit;
    const name = createdCredentials?.name || formData.YayasanName;
    setCreatedCredentials(null);
    navigate('/Yayasan-management', {
      state: {
        successMessage: isEdit
          ? `Perubahan data & kredensial "${name}" berhasil disimpan.`
          : `Yayasan Pesantren "${name}" berhasil didaftarkan.`
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/Yayasan-management"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Batal & Kembali ke Kelola Yayasan
        </Link>
      </div>

      {/* Hero Overview Banner Card */}
      <div className="bg-gradient-to-r from-[#0B3D91] via-[#1E5FCC] to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-1 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">
              {isEditing ? 'Edit Data Yayasan Pesantren' : 'Pendaftaran Yayasan Pesantren Baru'}
            </h2>
            <p className="text-blue-100 text-xs">
              {isEditing 
                ? 'Perbarui data wilayah kerja koordinasi dan akun administrator Yayasan Pesantren'
                : 'Daftarkan Yayasan Pesantren baru sebagai koordinator Kampus dan buat kredensial akun administrator Yayasan'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        
        {/* Section 1: Informasi & Wilayah Yayasan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Informasi & Wilayah Yayasan</h3>
              <p className="text-[11px] text-slate-500">Nama Yayasan Pesantren, kode wilayah resmi, dan cakupan provinsi kerja</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Kode Yayasan & Nama Yayasan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kode Yayasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  placeholder="Contoh: KW-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary disabled:opacity-60 transition-all shadow-2xs"
                />
                <span className="text-[11px] text-slate-400">Kode identitas resmi</span>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Yayasan Pesantren <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Yayasan Jawa Barat"
                  value={formData.YayasanName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const next = { ...formData, YayasanName: val };
                    const currentWilayah = formData.wilayah || formData.provinces[0] || val || '';
                    if (!isEmailManuallyEdited || !formData.adminEmail || formData.adminEmail === 'superadmin@sapakita.id' || formData.adminEmail.includes('@sapakita.id')) {
                      next.adminEmail = generateRecommendedEmail(val, currentWilayah, formData.code);
                      next.adminName = val ? `Admin ${val}` : '';
                    }
                    setFormData(next);
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
                <span className="text-[11px] text-slate-400">Sesuai nomenklatur Kemenkumham / Ditjenpas</span>
              </div>
            </div>

            {/* Provinsi Cakupan (Dropdown Sederhana + Chip Badges) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Provinsi Cakupan Wilayah Kerja <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {formData.provinces.length} provinsi dipilih
                </span>
              </div>

              <select
                value=""
                onChange={(e) => {
                  const prov = e.target.value;
                  if (prov && !formData.provinces.includes(prov)) {
                    const nextProvinces = [...formData.provinces, prov];
                    const nextWilayah = formData.wilayah || prov;
                    const next = {
                      ...formData,
                      provinces: nextProvinces,
                      wilayah: nextWilayah,
                    };
                    if (!formData.YayasanName) {
                      next.YayasanName = `Yayasan ${prov}`;
                      next.adminName = `Admin Yayasan ${prov}`;
                    }
                    if (!isEmailManuallyEdited || !formData.adminEmail || formData.adminEmail === 'superadmin@sapakita.id' || formData.adminEmail.includes('@sapakita.id')) {
                      next.adminEmail = generateRecommendedEmail(next.YayasanName || prov, prov, formData.code);
                    }
                    setFormData(next);
                  }
                }}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs cursor-pointer"
              >
                <option value="">-- Pilih Provinsi Cakupan (Klik untuk menambahkan) --</option>
                {provinces.map((p) => (
                  <option key={p} value={p} disabled={formData.provinces.includes(p)}>
                    {p} {formData.provinces.includes(p) ? '✓ (Sudah Ditambahkan)' : ''}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-400">
                Pilih provinsi cakupan. Sistem akan otomatis menyelaraskan wilayah dan rekomendasi email administrator Yayasan.
              </p>

              {/* Chip Badges */}
              {formData.provinces.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {formData.provinces.map((prov) => (
                    <span 
                      key={prov}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                    >
                      <span>{prov}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => {
                            const remaining = prev.provinces.filter((p) => p !== prov);
                            return {
                              ...prev,
                              provinces: remaining,
                              wilayah: remaining[0] || '',
                            };
                          })
                        }
                        className="p-0.5 hover:bg-blue-200/60 rounded text-blue-600 hover:text-blue-900 cursor-pointer"
                        title={`Hapus ${prov}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Belum ada provinsi yang dipilih. Pilih satu atau beberapa provinsi melalui dropdown di atas.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Kredensial Akun & Keamanan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Kredensial Akun & Keamanan</h3>
                <p className="text-[11px] text-slate-500">Kredensial akun login administrator untuk mengelola dan memantau wilayah ini</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              1 Yayasan = 1 Akun Administrator
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Administrator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap Administrator Yayasan
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Contoh: Admin Yayasan Jawa Barat"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400">Nama staf atau pejabat administrator wilayah</span>
              </div>

              {/* Telepon */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400">Kontak koordinasi darurat dan komunikasi</span>
              </div>
            </div>

            {/* Email Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Login Administrator <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentWilayah = formData.provinces[0] || formData.wilayah || formData.YayasanName || '';
                    const rec = generateRecommendedEmail(formData.YayasanName, currentWilayah, formData.code);
                    if (rec) {
                      setFormData({ ...formData, adminEmail: rec });
                      setIsEmailManuallyEdited(false);
                    }
                  }}
                  className="text-[11px] text-primary hover:text-primary-dark font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Rekomendasi Email Otomatis
                </button>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  name="YayasanAdminEmail"
                  autoComplete="off"
                  required={!isEditing}
                  placeholder="Contoh: admin.jateng@sapakita.id"
                  value={formData.adminEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, adminEmail: e.target.value });
                    setIsEmailManuallyEdited(true);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Format resmi: <span className="text-slate-600">admin.[wilayah]@sapakita.id</span>
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEditing ? 'Kata Sandi Baru (Opsional)' : 'Password Sementara Administrator'} {!isEditing && <span className="text-rose-500">*</span>}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const pwd = generateRandomPassword();
                    setFormData({ ...formData, adminPassword: pwd });
                  }}
                  className="text-[11px] text-primary hover:text-primary-dark font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Buat Ulang Password Acak
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="YayasanAdminPassword"
                  autoComplete="new-password"
                  required={!isEditing}
                  placeholder={isEditing ? 'Kosongkan jika sandi tetap' : 'Minimal 8 karakter'}
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xs"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {formData.adminPassword && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.adminPassword, 'password')}
                      className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                      title="Salin password"
                    >
                      {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Operasional Yayasan */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status Operasional Yayasan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Aktif' })}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    formData.status === 'Aktif'
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.status === 'Aktif' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.status === 'Aktif' ? 'text-emerald-800' : 'text-slate-700'}`}>
                      Langsung Aktif
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Admin dapat login dan menaungi Kampus binaan</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Nonaktif' })}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    formData.status === 'Nonaktif'
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    formData.status === 'Nonaktif' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${formData.status === 'Nonaktif' ? 'text-rose-800' : 'text-slate-700'}`}>
                      Nonaktif / Penangguhan
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Akses masuk dan sinkronisasi wilayah ditangguhkan</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-900">Pemberitahuan Keamanan & Kredensial</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Setelah disimpan, sistem akan menampilkan dialog kredensial yang dapat Anda salin langsung untuk diberikan kepada administrator Yayasan Pesantren.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Zona Berbahaya: Hapus Yayasan (Khusus Mode Edit) */}
        {isEditing && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Zona Berbahaya: Hapus Yayasan Pesantren</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghapus Yayasan Pesantren bersifat permanen. Sesuai regulasi sistem, Yayasan Pesantren hanya dapat dihapus apabila sudah tidak memiliki Kampus binaan dan tidak ada akun Admin Yayasan terdaftar.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Pastikan cabang Kampus binaan telah dipindahkan atau dikosongkan sebelum menghapus.</span>
              </div>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 cursor-pointer self-end sm:self-auto"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Yayasan Pesantren</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4" /> Hapus Yayasan
            </button>
          ) : <div />}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/Yayasan-management"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan Yayasan' : 'Simpan Yayasan Pesantren Baru'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ================================================================
          SUCCESS MODAL: KREDENSIAL Yayasan BERHASIL DIBUAT
          ================================================================ */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {createdCredentials.isEdit 
                  ? 'Kredensial Akun Administrator Yayasan Berhasil Diperbarui!' 
                  : 'Yayasan Pesantren & Akun Admin Berhasil Didaftarkan!'}
              </h3>
              <p className="text-xs text-slate-500">
                {createdCredentials.isEdit
                  ? 'Kredensial login administrator Yayasan Pesantren telah diperbarui. Salin dan berikan kredensial login berikut kepada Admin Yayasan.'
                  : 'Salin dan berikan kredensial login berikut kepada administrator Yayasan Pesantren yang bersangkutan.'}
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Yayasan Pesantren</span>
                <span className="font-bold text-slate-800">{createdCredentials.name} ({createdCredentials.code})</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Provinsi Cakupan</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200/60">
                  {(createdCredentials.provinces || []).join(', ')}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Nama Administrator</span>
                <span className="font-bold text-slate-800">{createdCredentials.adminName}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Email Login</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-800">{createdCredentials.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.email, 'modal-email')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Salin Email"
                  >
                    {copiedField === 'modal-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  {createdCredentials.isEdit ? 'Password Login Baru' : 'Password Sementara'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80">
                    {createdCredentials.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdCredentials.password, 'modal-pass')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Salin Password"
                  >
                    {copiedField === 'modal-pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Copy All Button & Close Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const fullText = `*Kredensial Akun Administrator Yayasan SapaKita*\nYayasan Pesantren: ${createdCredentials.name} (${createdCredentials.code})\nWilayah: ${createdCredentials.wilayah}\nProvinsi: ${(createdCredentials.provinces || []).join(', ')}\nNama Admin: ${createdCredentials.adminName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nSilakan login di portal SapaKita.`;
                  handleCopy(fullText, 'modal-all');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedField === 'modal-all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Semua Kredensial Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Semua Kredensial (Format Teks)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                Selesai & Lihat Daftar Yayasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: KONFIRMASI HAPUS Yayasan Pesantren
          ================================================================ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Yayasan Pesantren</h3>
                <p className="text-[11px] text-slate-400">Tindakan ini permanen dan tidak dapat dibatalkan</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-100/90 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Penghapusan Ditolak</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-800 space-y-2">
              <p className="font-bold">
                Apakah Anda yakin ingin menghapus <span className="underline">{formData.YayasanName || 'Yayasan Pesantren ini'}</span> {formData.code ? `(${formData.code})` : ''}?
              </p>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                Peringatan: Yayasan Pesantren hanya diperbolehkan dihapus jika sudah tidak memiliki Kampus binaan dan akun admin terdaftar.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Yayasan Pesantren</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

