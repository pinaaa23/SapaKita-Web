import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Building2, 
  Phone, 
  Camera, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { addInmate } from '../../../services/mockData';

const InmatesCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    wbpRegNumber: `REG-CPN-2026-${Math.floor(100 + Math.random() * 900)}`,
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    photoUrl: '',
    branchName: 'Lapas Kelas I Cipinang',
    blockRoom: 'Blok A / Kamar 1A',
    entryDate: new Date().toISOString().split('T')[0],
    status: 'Aktif',
    callBalance: 0,
    commStatus: 'Aktif'
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.wbpRegNumber.trim()) {
      setErrorMsg('Nama Lengkap dan No. Registrasi WBP wajib diisi.');
      return;
    }

    addInmate(formData);
    navigate('/branch/inmates', { state: { toast: `Narapidana ${formData.name} berhasil ditambahkan!` } });
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
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
                  No. Registrasi WBP <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.wbpRegNumber}
                  onChange={(e) => setFormData({...formData, wbpRegNumber: e.target.value})}
                  placeholder="REG-CPN-2026-XXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">NIK KTP (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.nik}
                  onChange={(e) => setFormData({...formData, nik: e.target.value})}
                  placeholder="317508xxxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-medium"
                />
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cabang Operasional</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                {formData.branchName}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Cabang mengikuti lokasi Admin saat ini.</p>
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Narapidana
          </button>
        </div>

      </form>
    </div>
  );
};

export default InmatesCreate;
