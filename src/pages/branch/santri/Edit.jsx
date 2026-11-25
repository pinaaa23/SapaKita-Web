import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building2, 
  Camera, 
  Wallet, 
  AlertCircle
} from 'lucide-react';
import { getInmates, updateInmate } from '../../../services/santriService';
import { logout, getAuthUser } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const SantriEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { uptName, isSupervisor } = useAuth();
  const authUser = getAuthUser();
  const isSuperadmin = authUser?.role === 'SUPERADMIN';
  const currentBranchName = (uptName && uptName !== 'Cabang Terdaftar' && uptName !== 'UPT Anda') ? uptName : (authUser?.branch?.name || authUser?.branchName || (typeof authUser?.branch === 'string' ? authUser.branch : '') || 'Kampus Utama');

  const [formData, setFormData] = useState({
    name: '',
    wbpRegNumber: '',
    initialPin: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    photoUrl: '',
    branchName: currentBranchName,
    blockRoom: '',
    entryDate: '',
    status: 'Aktif',
    callBalance: 0,
    commStatus: 'Aktif',
    families: []
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getInmates({ search: id }).then(res => {
      const found = res?.items?.find(i => i.id === id || i.wbpRegNumber === id || i.identifier === id);
      if (found) {
        let formattedBirthDate = '';
        const rawBirthDate = found.dateOfBirth || found.birthDate || '';
        if (rawBirthDate) {
          try {
            formattedBirthDate = new Date(rawBirthDate).toISOString().split('T')[0];
          } catch {
            formattedBirthDate = rawBirthDate;
          }
        }

        setFormData({
          name: found.name || '',
          wbpRegNumber: found.wbpRegNumber || found.identifier || '',
          initialPin: '',
          nik: '',
          birthPlace: '',
          birthDate: formattedBirthDate,
          gender: 'Laki-laki',
          photoUrl: '',
          branchName: (isSupervisor || !isSuperadmin || !found.branchName || found.branchName === 'Pusat' || found.branchName === '-') ? currentBranchName : found.branchName,
          blockRoom: (!found.blockRoom || found.blockRoom === '-') ? 'Asrama A / Kamar 01' : found.blockRoom,
          entryDate: found.entryDate ? new Date(found.entryDate).toISOString().split('T')[0] : '',
          status: found.status || 'Aktif',
          callBalance: found.callBalance || 0,
          commStatus: found.commStatus || 'Aktif',
          families: Array.isArray(found.families) ? found.families : []
        });
      }
    }).catch((err) => {
      console.log('[SantriEdit] Error loading santri:', err);
    });
  }, [id, currentBranchName]);

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
      setErrorMsg('Nama Lengkap dan NIS Santri wajib diisi.');
      return;
    }

    if (!formData.birthDate || !formData.birthDate.trim()) {
      setErrorMsg('Tanggal lahir wajib diisi.');
      return;
    }

    const birthDateObj = new Date(formData.birthDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(birthDateObj.getTime()) || birthDateObj > today) {
      setErrorMsg('Tanggal lahir tidak valid atau tidak boleh di masa depan.');
      return;
    }

    if (!formData.blockRoom?.trim()) {
      setErrorMsg('Penempatan Asrama / Kamar wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateInmate(id, {
        name: formData.name,
        identifier: formData.wbpRegNumber,
        birthDate: formData.birthDate,
        dateOfBirth: formData.birthDate,
        initialPin: formData.initialPin,
        blockRoom: formData.blockRoom,
        branchName: formData.branchName,
        families: []
      });
      navigate('/branch/santri', { state: { toast: 'Data Santri berhasil diperbarui.' } });
    } catch (err) {
      if (err?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err?.status === 403) {
        setErrorMsg('Anda tidak memiliki akses untuk mengubah data Santri.');
      } else if (err?.status === 404) {
        setErrorMsg('Data Santri tidak ditemukan di server.');
      } else if (err?.status === 400 || err?.data?.errors || err?.data?.message) {
        const msg = (Array.isArray(err?.data?.errors) && err.data.errors.length > 0)
          ? err.data.errors.map(e => e.message || e).join(', ')
          : (err?.message || err?.data?.message || 'Data yang dimasukkan tidak valid.');
        setErrorMsg(msg);
      } else {
        setErrorMsg(err?.message || 'Gagal menyimpan perubahan data Santri.');
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
          to="/branch/santri"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Data Santri
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
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
              <p className="text-[11px] text-slate-500">Informasi pribadi & dokumen santri</p>
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
                <p className="text-xs font-bold text-slate-800">Foto Profil Santri</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Format JPG/PNG maks 2MB (Opsional)</p>
                <label className="inline-block mt-2 text-xs font-bold text-primary hover:underline cursor-pointer">
                  Ubah Foto...
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIS (Nomor Induk Santri) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.wbpRegNumber}
                  onChange={(e) => setFormData({...formData, wbpRegNumber: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tempat Lahir</label>
                <input 
                  type="text" 
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  required
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
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 2 — Penempatan</h2>
              <p className="text-[11px] text-slate-500">Lokasi asrama, kamar, dan status penempatan santri</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kampus Pesantren</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                {formData.branchName}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Kampus mengikuti lokasi Admin saat ini.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Asrama / Kamar</label>
              <input 
                type="text" 
                value={formData.blockRoom}
                onChange={(e) => setFormData({...formData, blockRoom: e.target.value})}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Masuk Pesantren</label>
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
                <option value="Sudah Bebas">Lulus / Alumni</option>
                <option value="Dipindahkan">Pindah Kampus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3 - Sistem Komunikasi SapaKita */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Section 3 — Layanan SapaKita</h2>
              <p className="text-[11px] text-slate-500">Saldo panggilan & status akun komunikasi SapaKita</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Saldo Panggilan (Rp)</label>
              <input 
                type="number" 
                value={formData.callBalance}
                onChange={(e) => setFormData({...formData, callBalance: Number(e.target.value)})}
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
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <Link 
            to="/branch/santri"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SantriEdit;