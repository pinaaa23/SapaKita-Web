import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building2, 
  Camera, 
  Wallet,
  AlertCircle,
  ChevronDown,
  Users
} from 'lucide-react';
import { createInmate } from '../../../services/inmateService';
import { getBranches } from '../../../services/branchService';
import { logout, getAuthUser } from '../../../services/api';
import FamilyMembersEditor, { validateFamilies } from '../../../components/FamilyMembersEditor';
import { useAuth } from '../../../context/AuthContext';

const InmatesCreate = () => {
  const navigate = useNavigate();
  const { uptName } = useAuth();
  const authUser = getAuthUser();
  const isSuperadmin = authUser?.role === 'SUPERADMIN';
  const currentBranchName = uptName || authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : null) || 'Lapas Kelas II Yogyakarta';

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [manualBranchName, setManualBranchName] = useState('');
  const [familyErrors, setFamilyErrors] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    wbpRegNumber: `NIP-${Math.floor(1000 + Math.random() * 9000)}`,
    initialPin: '1234',
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    photoUrl: '',
    branchName: currentBranchName,
    blockRoom: 'Blok A / Kamar 1A',
    entryDate: new Date().toISOString().split('T')[0],
    status: 'Aktif',
    callBalance: 0,
    commStatus: 'Aktif',
    families: []
  });

  useEffect(() => {
    const fetchBranchesList = async () => {
      try {
        const data = await getBranches({ limit: 100 });
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setBranches(list);
        if (list.length > 0 && !selectedBranchId) {
          setSelectedBranchId(list[0].id);
        }
      } catch (err) {
        console.log('[InmatesCreate] Error fetching branches:', err);
      }
    };
    fetchBranchesList();
  }, []);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.wbpRegNumber.trim()) {
      setErrorMsg('Nama Lengkap dan NIP Narapidana wajib diisi.');
      return;
    }

    if (!formData.initialPin || formData.initialPin.trim().length < 4) {
      setErrorMsg('PIN awal narapidana untuk kiosk minimal 4 digit/karakter.');
      return;
    }

    // Validasi keluarga
    const { isValid, errors } = validateFamilies(formData.families);
    if (!isValid) {
      setFamilyErrors(errors);
      setErrorMsg('Terdapat kesalahan pada data keluarga terdaftar. Mohon periksa kembali.');
      return;
    }
    setFamilyErrors([]);

    const branchIdToSend = isSuperadmin 
      ? (selectedBranchId || manualBranchName.trim() || undefined)
      : undefined;

    if (isSuperadmin && !branchIdToSend) {
      setErrorMsg('Cabang tujuan wajib dipilih atau diisi untuk Superadmin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Nilai NIP dikirim ke backend sebagai field "identifier"
      await createInmate({
        identifier: formData.wbpRegNumber,
        name: formData.name,
        initialPin: formData.initialPin,
        families: formData.families,
        blockRoom: formData.blockRoom || 'Blok A / Kamar 1A',
        branchId: branchIdToSend || authUser?.branchId || authUser?.branch?.id || 'mock-upt-yogyakarta',
        branchName: currentBranchName,
      });
      
      navigate('/branch/inmates', { 
        state: { toast: `Narapidana ${formData.name} (NIP: ${formData.wbpRegNumber}) berhasil didaftarkan!` } 
      });
    } catch (err) {
      console.log('[InmatesCreate] Error submit inmate:', err);
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setErrorMsg('Anda tidak memiliki akses untuk menambah narapidana.');
      } else if (err?.isNetworkError || err?.status === 0) {
        setErrorMsg('Server tidak dapat dihubungi. Silakan coba lagi nanti.');
      } else if (err?.status === 400 || err?.data?.message) {
        const msg = err?.data?.errors?.map(e => e.message).join(', ') || err?.data?.message || err?.message || 'Validasi gagal.';
        setErrorMsg(msg);
      } else {
        setErrorMsg(err?.message || 'Gagal mendaftarkan narapidana.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/branch/inmates"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1 - Identitas Dasar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 1 — Identitas Dasar</h2>
              <p className="text-[11px] text-slate-500">Informasi pribadi & dokumen warga binaan</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Avatar / Photo Upload */}
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Foto Profil WBP</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Format JPG/PNG maks 2MB (Opsional)</p>
                <label className="inline-block mt-2 text-xs font-bold text-primary hover:underline cursor-pointer">
                  Pilih Foto...
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Ahmad Supriyadi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP (Nomor Induk Narapidana) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.wbpRegNumber}
                  onChange={(e) => setFormData({...formData, wbpRegNumber: e.target.value})}
                  placeholder="NIP-1001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Digunakan keluarga untuk mendaftarkan kontak di aplikasi mobile.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  PIN Awal Akses Kiosk / Panggilan <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.initialPin}
                  onChange={(e) => setFormData({...formData, initialPin: e.target.value})}
                  placeholder="Minimal 4 digit (misal: 1234)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">PIN awal untuk narapidana login di terminal kiosk / telepon wartel.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tempat Lahir</label>
                <input 
                  type="text" 
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                  placeholder="Contoh: Jakarta"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Lahir</label>
                <input 
                  type="date" 
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 - Penempatan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 2 — Penempatan</h2>
              <p className="text-[11px] text-slate-500">Lokasi blok, kamar, dan status penempatan lapas</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cabang Operasional {isSuperadmin && <span className="text-rose-500">*</span>}
              </label>
              {isSuperadmin ? (
                branches.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <select 
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        required
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.location ? `(${b.location})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-slate-400">Pilih cabang Lapas/Rutan tempat narapidana ini didaftarkan.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        value={manualBranchName}
                        onChange={(e) => setManualBranchName(e.target.value)}
                        placeholder="Contoh: Lapas Kelas I Cipinang (atau ID Cabang)"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Daftar cabang belum tersedia dari server. Masukkan nama/ID cabang secara manual.</p>
                  </div>
                )
              ) : (
                <>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    {formData.branchName}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Cabang otomatis mengikuti lokasi Admin saat ini.</p>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Blok / Kamar</label>
              <input 
                type="text" 
                value={formData.blockRoom}
                onChange={(e) => setFormData({...formData, blockRoom: e.target.value})}
                placeholder="Contoh: Blok A / Kamar 3A"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Masuk Lapas</label>
              <input 
                type="date" 
                value={formData.entryDate}
                onChange={(e) => setFormData({...formData, entryDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Penempatan</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold cursor-pointer"
              >
                <option value="Aktif">Aktif</option>
                <option value="Sudah Bebas">Sudah Bebas</option>
                <option value="Dipindahkan">Dipindahkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 - Sistem PasCall */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 3 — Sistem PasCall</h2>
              <p className="text-[11px] text-slate-500">Saldo panggilan & status akun komunikasi PasCall</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Saldo Panggilan Awal (Rp)</label>
              <input 
                type="number" 
                value={formData.callBalance}
                onChange={(e) => setFormData({...formData, callBalance: Number(e.target.value)})}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Akun Komunikasi</label>
              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, commStatus: prev.commStatus === 'Aktif' ? 'Nonaktif' : 'Aktif' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    formData.commStatus === 'Aktif' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-700 border border-rose-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.commStatus === 'Aktif' ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                  Status: {formData.commStatus}
                </button>
                <span className="text-[11px] text-slate-400">Klik untuk mengubah status aktif akun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 - Keluarga Terdaftar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 4 — Keluarga Terdaftar</h2>
              <p className="text-[11px] text-slate-500">Daftar kontak keluarga yang berhak menerima panggilan narapidana</p>
            </div>
          </div>

          <div className="p-6">
            <FamilyMembersEditor 
              families={formData.families} 
              onChange={(newFamilies) => {
                setFormData(prev => ({ ...prev, families: newFamilies }));
                if (familyErrors.length > 0) setFamilyErrors([]);
              }}
              errors={familyErrors}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link 
            to="/branch/inmates"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Narapidana'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default InmatesCreate;
