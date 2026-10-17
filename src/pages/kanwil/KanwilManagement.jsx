import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  MapPin, 
  Key, 
  Mail, 
  X, 
  Check, 
  RefreshCw,
  AlertTriangle,
  Power,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
  UserCheck,
  Phone
} from 'lucide-react';
import { 
  getAllKanwilsForSuperadmin, 
  saveKanwilFromSuperadmin, 
  deleteKanwilFromSuperadmin,
  toggleKanwilStatus,
  getOfficialProvinces,
  getKanwilAuditReport,
  getUnassignedBranches,
  assignBranchKanwil
} from '../../services/kanwilService';

export default function KanwilManagement() {
  const [kanwils, setKanwils] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [auditReport, setAuditReport] = useState([]);
  const [unassignedBranches, setUnassignedBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State Detail Kanwil & UPT Binaan
  const [detailKanwil, setDetailKanwil] = useState(null);

  // Modal State Tambah / Edit Kanwil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKanwil, setEditingKanwil] = useState(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    kanwilName: '',
    wilayah: '',
    provinces: [],
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    adminPhone: '',
  });

  // Helper untuk membuat email login rekomendasi otomatis berdasarkan nama / wilayah
  const generateRecommendedEmail = (name, wilayah, code) => {
    const text = `${wilayah || ''} ${name || ''} ${code || ''}`.toLowerCase();
    let slug = '';
    if (text.includes('jawa barat') || text.includes('jabar') || text.includes('bandung')) slug = 'jabar';
    else if (text.includes('dki') || text.includes('jakarta')) slug = 'dki';
    else if (text.includes('jawa tengah') || text.includes('jateng') || text.includes('semarang')) slug = 'jateng';
    else if (text.includes('yogyakarta') || text.includes('diy') || text.includes('jogja')) slug = 'diy';
    else if (text.includes('jawa timur') || text.includes('jatim') || text.includes('surabaya')) slug = 'jatim';
    else if (text.includes('banten') || text.includes('serang')) slug = 'banten';
    else if (text.includes('bali') || text.includes('denpasar')) slug = 'bali';
    else if (text.includes('sumatera utara') || text.includes('sumut') || text.includes('medan')) slug = 'sumut';
    else if (text.includes('sumatera barat') || text.includes('sumbar') || text.includes('padang')) slug = 'sumbar';
    else if (text.includes('riau') || text.includes('pekanbaru')) slug = 'riau';
    else if (text.includes('sumatera selatan') || text.includes('sumsel') || text.includes('palembang')) slug = 'sumsel';
    else if (text.includes('lampung')) slug = 'lampung';
    else if (text.includes('kalimantan timur') || text.includes('kaltim') || text.includes('samarinda')) slug = 'kaltim';
    else if (text.includes('sulawesi selatan') || text.includes('sulsel') || text.includes('makassar')) slug = 'sulsel';
    else if (text.includes('papua')) slug = 'papua';
    else {
      const cleaned = (name || wilayah || '')
        .replace(/kantor|wilayah|kanwil|kemenkumham|pemasyarakatan/gi, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      slug = cleaned || (code ? code.toLowerCase().replace(/[^a-z0-9]/g, '') : 'wilayah');
    }
    return `admin.${slug}@pascall.id`;
  };

  // Modal State Tetapkan Provinsi & Kanwil
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetBranch, setAssignTargetBranch] = useState(null);
  const [assignForm, setAssignForm] = useState({
    branchId: '',
    province: '',
    kanwilId: '',
    reason: 'Penetapan resmi oleh Superadmin',
  });
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Accordion UPT State
  const [expandedKanwilId, setExpandedKanwilId] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [kanwilList, provList, auditList, unassignedList] = await Promise.all([
        getAllKanwilsForSuperadmin(),
        getOfficialProvinces(),
        getKanwilAuditReport(),
        getUnassignedBranches(),
      ]);
      setKanwils(kanwilList);
      setProvinces(provList);
      setAuditReport(auditList);
      setUnassignedBranches(unassignedList);
    } catch (err) {
      console.error('Error fetching kanwil management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingKanwil(null);
    setShowAdminPassword(false);
    const nextCode = `KW-${(kanwils.length + 1).toString().padStart(2, '0')}`;
    setFormData({
      id: '',
      code: nextCode,
      kanwilName: '',
      wilayah: '',
      provinces: [],
      adminEmail: '',
      adminName: '',
      adminPassword: 'password123',
      adminPhone: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (k) => {
    setEditingKanwil(k);
    setShowAdminPassword(false);
    setFormData({
      id: k.id,
      code: k.code || '',
      kanwilName: k.kanwilName || k.name || '',
      wilayah: k.wilayah || k.region || '',
      provinces: k.provinces || [],
      adminEmail: k.adminEmail || k.adminUser?.email || '',
      adminName: k.adminName || k.adminUser?.name || '',
      adminPassword: '',
      adminPhone: k.adminPhone || k.adminUser?.phone || '',
    });
    setIsModalOpen(true);
  };

  const openAssignModal = (branch) => {
    setAssignTargetBranch(branch);
    setAssignForm({
      branchId: branch.id,
      province: branch.province || '',
      kanwilId: branch.kanwilId || '',
      reason: 'Penetapan resmi oleh Superadmin',
    });
    setIsAssignModalOpen(true);
  };

  const toggleProvinceSelection = (prov) => {
    setFormData((prev) => {
      const exists = prev.provinces.includes(prov);
      return {
        ...prev,
        provinces: exists
          ? prev.provinces.filter((p) => p !== prov)
          : [...prev.provinces, prov],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kanwilName.trim()) {
      alert('Nama Kantor Wilayah wajib diisi!');
      return;
    }

    try {
      await saveKanwilFromSuperadmin(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data Kanwil.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if (!window.confirm(`Ubah status Kantor Wilayah ini menjadi "${nextStatus}"?`)) {
      return;
    }
    try {
      await toggleKanwilStatus(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status Kanwil.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus ${name}? Hanya diperbolehkan jika Kanwil tidak memiliki UPT.`)) {
      return;
    }
    try {
      await deleteKanwilFromSuperadmin(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus Kanwil.');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.branchId || !assignForm.province || !assignForm.kanwilId) {
      alert('Pilih UPT, Provinsi resmi, dan Kantor Wilayah tujuan!');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await assignBranchKanwil(assignForm.branchId, {
        province: assignForm.province,
        kanwilId: assignForm.kanwilId,
        reason: assignForm.reason,
      });
      alert('UPT berhasil ditetapkan ke Kantor Wilayah yang sesuai!');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menetapkan UPT ke Kanwil.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Hitung jumlah UPT yang bermasalah (unassigned / mismatch)
  const problematicUpts = auditReport.filter(
    (item) => item.status === 'TIDAK DIKETAHUI' || item.status === 'TIDAK COCOK'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manajemen Kantor Wilayah (Kanwil)</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola Kantor Wilayah sebagai koordinator UPT dan pastikan pembagian wilayah UPT sesuai standar
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kanwil Baru</span>
        </button>
      </div>

      {/* PANEL PERINGATAN UPT: Belum Ditetapkan / Tidak Cocok */}
      {problematicUpts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950">
                  Perhatian: Ditemukan {problematicUpts.length} UPT Belum Ditetapkan / Tidak Cocok Wilayah
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900">
                  Perlu Penetapan Superadmin
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                UPT berikut belum memiliki asosiasi Kantor Wilayah atau memiliki ketidakcocokan provinsi cakupan.
                Klik <strong>Tetapkan Provinsi & Kanwil</strong> untuk memverifikasi dan menetapkan secara resmi.
              </p>

              {/* Daftar UPT yang bermasalah */}
              <div className="mt-3.5 divide-y divide-amber-200/60 border border-amber-200 rounded-xl bg-white/80 overflow-hidden">
                {problematicUpts.map((item) => (
                  <div key={item.branchId} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.branchName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'TIDAK COCOK' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Kota: <span className="font-medium text-slate-700">{item.branchCity || '-'}</span> | 
                        Provinsi: <span className="font-medium text-slate-700">{item.branchProvince || 'Belum diisi'}</span> | 
                        Kanwil Saat Ini: <span className="font-medium text-slate-700">{item.kanwilName || 'Belum Ditetapkan'}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => openAssignModal({
                        id: item.branchId,
                        name: item.branchName,
                        city: item.branchCity,
                        province: item.branchProvince,
                        kanwilId: item.kanwilId,
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-xs"
                    >
                      <span>Tetapkan Provinsi & Kanwil</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanwils List Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">
          Memuat data Kantor Wilayah...
        </div>
      ) : kanwils.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">
          Belum ada Kantor Wilayah yang terdaftar. Silakan tambahkan Kanwil pertama Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kanwils.map((k) => {
            const isExpanded = expandedKanwilId === k.id;
            const isAktif = k.status === 'Aktif';

            return (
              <div 
                key={k.id} 
                className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  isAktif ? 'border-slate-200/80 shadow-xs hover:border-blue-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAktif ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{k.code}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span className={`text-[11px] font-semibold ${isAktif ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {k.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailKanwil(k)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                        title="Lihat Detail Kanwil & UPT Binaan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(k.id, k.status)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isAktif ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={isAktif ? 'Nonaktifkan Kanwil' : 'Aktifkan Kanwil'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(k)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                        title="Edit Kanwil"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(k.id, k.kanwilName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                        title="Hapus Kanwil (Hanya jika kosong)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{k.kanwilName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Wilayah: {k.wilayah || 'Indonesia'}</p>

                  {/* Provinsi Cakupan Baku */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Provinsi Cakupan:</span>
                    <div className="flex flex-wrap gap-1">
                      {(k.provinces || []).map((prov) => (
                        <span key={prov} className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md">
                          {prov}
                        </span>
                      ))}
                      {(!k.provinces || k.provinces.length === 0) && (
                        <span className="text-[11px] text-slate-400 italic">Belum ada provinsi yang dicakup</span>
                      )}
                    </div>
                  </div>

                  {/* Akun Administrator Kanwil (1 Kanwil 1 Admin) */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">Akun Login Admin:</span>
                        <span className="text-xs font-bold text-slate-800 truncate block font-mono">
                          {k.adminEmail || k.adminUser?.email || 'Belum diatur'}
                        </span>
                      </div>
                    </div>
                    {(k.adminEmail || k.adminUser) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                        Siap Login
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold shrink-0">
                        Belum Ada
                      </span>
                    )}
                  </div>
                </div>

                {/* Bagian UPT Binaan & Tombol Aksi Detail */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">UPT Binaan:</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {k.uptCount || 0} Lapas / Rutan
                    </span>
                  </div>

                  {k.assignedUpts && k.assignedUpts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {k.assignedUpts.slice(0, 2).map((u) => (
                        <span key={u.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[130px]" title={u.name}>
                          {u.name}
                        </span>
                      ))}
                      {k.assignedUpts.length > 2 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                          +{k.assignedUpts.length - 2} lainnya
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tombol Aksi Lihat Detail & UPT yang Dinaungi */}
                  <button
                    onClick={() => setDetailKanwil(k)}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50/80 hover:bg-blue-600 rounded-xl transition-all cursor-pointer border border-blue-200/60 hover:border-blue-600 shadow-xs group"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-colors" />
                    <span>Lihat Detail & UPT ({k.assignedUpts?.length || k.uptCount || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KANWIL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-base font-bold text-slate-800">
                {editingKanwil ? 'Edit Kantor Wilayah' : 'Tambah Kantor Wilayah Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Kanwil *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingKanwil)}
                    placeholder="Contoh: KW-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kantor Wilayah *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kanwil Jawa Barat"
                    value={formData.kanwilName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const nextForm = { ...formData, kanwilName: newName };
                      if (!editingKanwil && (!formData.adminEmail || formData.adminEmail.includes('@pascall.id'))) {
                        nextForm.adminEmail = generateRecommendedEmail(newName, formData.wilayah, formData.code);
                        nextForm.adminName = newName ? `Admin ${newName}` : '';
                      }
                      setFormData(nextForm);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilayah / Region Tampilan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jawa Bagian Barat"
                  value={formData.wilayah}
                  onChange={(e) => {
                    const newWil = e.target.value;
                    const nextForm = { ...formData, wilayah: newWil };
                    if (!editingKanwil && (!formData.adminEmail || formData.adminEmail.includes('@pascall.id'))) {
                      nextForm.adminEmail = generateRecommendedEmail(formData.kanwilName, newWil, formData.code);
                    }
                    setFormData(nextForm);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* SECTION AKUN LOGIN ADMIN KANWIL (1 Kanwil 1 Admin) */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Akun Login Administrator Kanwil (1 Kanwil 1 Admin)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Kredensial ini digunakan untuk masuk ke portal pemantauan wilayah yang bersangkutan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Email Login Admin *
                      </label>
                      {(() => {
                        const rec = generateRecommendedEmail(formData.kanwilName, formData.wilayah, formData.code);
                        if (rec && formData.adminEmail !== rec) {
                          return (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, adminEmail: rec })}
                              className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                              title="Gunakan email rekomendasi ini"
                            >
                              Pakai Rekomendasi
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required={!editingKanwil}
                        placeholder="admin.wilayah@pascall.id"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono"
                      />
                    </div>
                    {formData.adminEmail && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Email resmi: <span className="font-mono text-blue-600">{formData.adminEmail}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Administrator
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Admin Kanwil Jawa Barat"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {editingKanwil ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Login *'}
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required={!editingKanwil}
                        placeholder={editingKanwil ? 'Kosongkan jika sandi tetap' : 'Minimal 6 karakter'}
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full pl-8 pr-12 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-semibold cursor-pointer"
                      >
                        {showAdminPassword ? 'Tutup' : 'Lihat'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Pemilihan Provinsi Baku Indonesia */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Provinsi Baku Cakupan Kanwil (Multi-select)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  UPT yang didaftarkan ke Kanwil ini wajib berada di salah satu provinsi yang dipilih.
                </p>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50/50">
                  {provinces.map((prov) => {
                    const isChecked = formData.provinces.includes(prov);
                    return (
                      <label 
                        key={prov}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-100 text-blue-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProvinceSelection(prov)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{prov}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs"
                >
                  Simpan Kanwil & Akun Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TETAPKAN PROVINSI & KANWIL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold">Tetapkan Provinsi & Kantor Wilayah UPT</h2>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPT / Lapas yang Ditetapkan
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="font-bold text-slate-800">{assignTargetBranch?.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Kota: {assignTargetBranch?.city || '-'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi Resmi Indonesia *
                </label>
                <select
                  required
                  value={assignForm.province}
                  onChange={(e) => setAssignForm({ ...assignForm, province: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Salah Satu dari 38 Provinsi Resmi --</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kantor Wilayah Tujuan *
                </label>
                <select
                  required
                  value={assignForm.kanwilId}
                  onChange={(e) => setAssignForm({ ...assignForm, kanwilId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Kantor Wilayah --</option>
                  {kanwils
                    .filter((k) => k.status === 'Aktif')
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.provinces && k.provinces.length > 0 ? k.provinces.join(', ') : 'Semua'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penetapan / Catatan Audit
                </label>
                <input
                  type="text"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingAssign}
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAssign ? 'Menyimpan...' : 'Terapkan Penetapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KANWIL & DAFTAR UPT BINAAN BESERTA KEPALA UPT */}
      {detailKanwil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{detailKanwil.kanwilName}</h2>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                      {detailKanwil.code}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      detailKanwil.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {detailKanwil.status || 'Aktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Wilayah: {detailKanwil.wilayah || 'Indonesia'}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailKanwil(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Konten Modal */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Ringkasan Profil Kanwil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provinsi Cakupan */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Provinsi Cakupan Baku</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(detailKanwil.provinces || []).map((prov) => (
                      <span key={prov} className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-lg border border-blue-100/60">
                        {prov}
                      </span>
                    ))}
                    {(!detailKanwil.provinces || detailKanwil.provinces.length === 0) && (
                      <span className="text-xs text-slate-400 italic">Belum ada provinsi yang dicakup</span>
                    )}
                  </div>
                </div>

                {/* Akun Administrator Kanwil */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Administrator Kantor Wilayah</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nama Admin:</span>
                      <span className="font-semibold text-slate-800">{detailKanwil.adminName || detailKanwil.adminUser?.name || 'Admin Kanwil'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email Login:</span>
                      <span className="font-mono font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded text-[11px]">
                        {detailKanwil.adminEmail || detailKanwil.adminUser?.email || 'Belum diatur'}
                      </span>
                    </div>
                    {detailKanwil.adminPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Telepon:</span>
                        <span className="text-slate-700">{detailKanwil.adminPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Daftar UPT Binaan & Kepala UPT */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Daftar UPT & Kepala UPT yang Dinaungi
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {detailKanwil.assignedUpts?.length || 0} Lapas / Rutan
                  </span>
                </div>

                {detailKanwil.assignedUpts && detailKanwil.assignedUpts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {detailKanwil.assignedUpts.map((upt, idx) => (
                      <div key={upt.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 leading-snug truncate" title={upt.name}>
                              {upt.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{upt.city && upt.city !== '-' ? `${upt.city}, ` : ''}{upt.province}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            upt.status === 'Aktif' || !upt.status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {upt.status || 'Aktif'}
                          </span>
                        </div>

                        {/* Profil Kepala UPT */}
                        <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-blue-600" />
                              Kepala UPT
                            </span>
                            {upt.headEmail && upt.headEmail !== '-' ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                Akun Siap
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                Belum Ada Akun
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs space-y-0.5">
                            <span className="font-semibold text-slate-800 block truncate" title={upt.headName}>
                              {upt.headName || 'Belum Ditugaskan'}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate" title={upt.headEmail}>{upt.headEmail || '-'}</span>
                            </div>
                            {upt.headPhone && upt.headPhone !== '-' && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{upt.headPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Data Statistik Singkat */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>WBP: <strong className="text-slate-700">{upt.inmateCount || 0}</strong> orang</span>
                          {upt.capacity > 0 && (
                            <span>Kapasitas: <strong className="text-slate-700">{upt.capacity}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Belum Ada UPT yang Dinaungi</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Kanwil ini belum menaungi UPT manapun. Anda dapat menetapkan UPT binaan melalui tabel penetapan UPT di bawah.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setDetailKanwil(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer shadow-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
