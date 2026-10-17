import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Eye, 
  Download, 
  Building2, 
  MapPin, 
  X, 
  AlertCircle,
  Phone,
  Users,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Check,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getKanwilBranches, createKanwilBranch } from '../../services/kanwilService';
import { exportToExcel } from '../../utils/exportUtils';

export default function KanwilBranches() {
  const { user } = useAuth();
  const kanwilId = user?.kanwilId || user?.kanwil?.id;
  const kanwilName = user?.kanwilName || user?.kanwil?.name || 'Kantor Wilayah';

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Detail Modal State
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Add UPT Modal State (Khusus Admin Kanwil mendaftarkan UPT baru)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [showHeadPassword, setShowHeadPassword] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    capacity: 1000,
    status: 'Aktif',
    headName: '',
    headEmail: '',
    headPassword: 'password123',
    headPhone: '',
  });

  const generateRecommendedHeadEmail = (branchName, city) => {
    const text = `${branchName || ''} ${city || ''}`
      .toLowerCase()
      .replace(/lembaga|pemasyarakatan|lapas|rumah|tahanan|rutan|kelas|iia|iib|ia|ib|iii|khusus|anak|perempuan/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    const slug = text || (branchName ? branchName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) : 'upt');
    return `kepala.${slug}@pascall.id`;
  };

  const [branchesData, setBranchesData] = useState({
    items: [],
    total: 0,
    totalPages: 1,
  });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 5000);
  };

  // Debounce search 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getKanwilBranches(kanwilId, {
        search: debouncedSearch,
        limit: 50,
      });
      setBranchesData(res);
    } catch (err) {
      console.error('Error fetching kanwil branches:', err);
      showToast('Gagal memuat data UPT.', 'error');
      setBranchesData({ items: [], total: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [kanwilId, debouncedSearch]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Filtering by status
  const filteredBranches = branchesData.items.filter((branch) => {
    const isAktif = branch.status === 'Active' || branch.status === 'Aktif';
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return isAktif;
    if (statusFilter === 'Inactive') return !isAktif;
    return true;
  });

  const handleExport = () => {
    if (filteredBranches.length === 0) {
      showToast('Tidak ada data UPT untuk diekspor.', 'error');
      return;
    }

    const exportData = filteredBranches.map((b, idx) => ({
      No: idx + 1,
      'ID UPT': b.id,
      'Nama UPT': b.name,
      'Kota / Lokasi': b.city || b.location,
      'Alamat Lengkap': b.address || '-',
      'Nomor Telepon': b.phone || '-',
      'Kapasitas Maksimal': b.capacity || 0,
      'Jumlah WBP': b.inmateCount || 0,
      'Status Operasional': (b.status === 'Active' || b.status === 'Aktif') ? 'Aktif' : 'Nonaktif',
    }));

    const activeCount = filteredBranches.filter(b => b.status === 'Active' || b.status === 'Aktif').length;
    const totalWbp = filteredBranches.reduce((sum, b) => sum + (b.inmateCount || 0), 0);

    const filename = `Daftar_UPT_${kanwilName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const success = exportToExcel(exportData, filename, 'Daftar UPT', {
      title: `DAFTAR UNIT PELAKSANA TEKNIS (UPT) - ${kanwilName.toUpperCase()}`,
      subtitle: `Laporan Data UPT di Bawah Naungan ${kanwilName}`,
      metadata: {
        'Tingkat': 'Kantor Wilayah',
        'Wilayah': kanwilName,
        'Status Filter': statusFilter === 'All' ? 'Semua Status' : statusFilter === 'Active' ? 'Aktif' : 'Nonaktif',
        'Tanggal Ekspor': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      summaryMetrics: [
        { label: 'Total UPT', value: `${filteredBranches.length} UPT` },
        { label: 'UPT Aktif', value: `${activeCount} UPT` },
        { label: 'Total WBP', value: `${totalWbp} Orang` },
      ],
    });

    if (success !== false) {
      showToast('Berhasil mengekspor daftar UPT ke format Excel!', 'success');
    }
  };

  const openDetailModal = (branch) => {
    setSelectedBranch(branch);
    setIsDetailModalOpen(true);
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      showToast('Nama UPT wajib diisi!', 'error');
      return;
    }
    setIsSubmittingAdd(true);
    try {
      await createKanwilBranch(kanwilId, newBranchForm);
      showToast(`Berhasil mendaftarkan ${newBranchForm.name.trim()} di bawah naungan ${kanwilName}!`, 'success');
      setIsAddModalOpen(false);
      setNewBranchForm({
        name: '',
        city: '',
        address: '',
        phone: '',
        capacity: 1000,
        status: 'Aktif',
        headName: '',
        headEmail: '',
        headPassword: 'password123',
        headPhone: '',
      });
      loadBranches();
    } catch (err) {
      console.error('Error creating UPT:', err);
      showToast(err.message || 'Gagal mendaftarkan UPT baru.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Control Bar: Search, Filters, Export & Tambah UPT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama UPT atau lokasi..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {['All', 'Active', 'Inactive'].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'All' ? 'Semua' : status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </button>
              ))}
            </div>

            <button 
              type="button"
              onClick={handleExport}
              disabled={filteredBranches.length === 0}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowHeadPassword(false);
                setNewBranchForm({
                  name: '',
                  city: '',
                  address: '',
                  phone: '',
                  capacity: 1000,
                  status: 'Aktif',
                  headName: '',
                  headEmail: '',
                  headPassword: 'password123',
                  headPhone: '',
                });
                setIsAddModalOpen(true);
              }}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah UPT
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-left w-[32%]">Nama Cabang</th>
                <th className="py-3.5 px-4 text-left w-[24%]">Lokasi</th>
                <th className="py-3.5 px-4 text-left w-[26%]">Kapasitas & WBP</th>
                <th className="py-3.5 px-4 text-center w-[10%]">Status</th>
                <th className="py-3.5 px-4 text-center w-[8%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-44 mb-1" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24 mb-1.5" /><div className="h-1.5 bg-slate-100 rounded w-36" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredBranches.length > 0 ? (
                filteredBranches.map((branch) => {
                  const isAktif = branch.status === 'Active' || branch.status === 'Aktif';
                  const occupancyPct = branch.capacity ? (branch.inmateCount / branch.capacity) * 100 : 0;

                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold shrink-0 border border-blue-100/80">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{branch.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{branch.phone || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{branch.city || branch.location || 'Indonesia'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {new Intl.NumberFormat('id-ID').format(branch.inmateCount)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">/ {branch.capacity} Kapasitas</span>
                        </div>
                        <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full ${
                              occupancyPct > 100 
                                ? 'bg-rose-500' 
                                : occupancyPct > 80 
                                  ? 'bg-amber-500' 
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, occupancyPct)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAktif 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          type="button"
                          onClick={() => openDetailModal(branch)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Lihat Detail UPT"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data UPT yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail UPT */}
      {isDetailModalOpen && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Unit Pelaksana Teknis</h3>
                  <p className="text-[11px] text-slate-400">Informasi operasional UPT di wilayah {kanwilName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium">Nama UPT</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedBranch.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Operasional</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                    (selectedBranch.status === 'Active' || selectedBranch.status === 'Aktif')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {(selectedBranch.status === 'Active' || selectedBranch.status === 'Aktif') ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Kota / Lokasi</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedBranch.city || selectedBranch.location || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Nomor Telepon</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedBranch.phone || '-'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Alamat Lengkap</p>
                <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{selectedBranch.address || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl">
                <div>
                  <p className="text-slate-400 font-medium">Jumlah WBP Terdaftar</p>
                  <p className="text-base font-extrabold text-primary mt-0.5">
                    {new Intl.NumberFormat('id-ID').format(selectedBranch.inmateCount || 0)} Orang
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Kapasitas Maksimal</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    {new Intl.NumberFormat('id-ID').format(selectedBranch.capacity || 0)} Orang
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah UPT Baru (Kewenangan Khusus Admin Kanwil) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tambah UPT Baru</h3>
                  <p className="text-[11px] text-slate-500">Pendaftaran UPT di bawah naungan {kanwilName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateBranch}>
              <div className="p-6 space-y-4 text-xs">
                {/* Info Wilayah */}
                <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl flex items-center gap-2.5 text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    UPT yang didaftarkan akan otomatis dinaungi oleh <strong>{kanwilName}</strong> dan tersinkronisasi ke seluruh sistem PasCall.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Nama UPT / Lapas / Rutan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lapas Kelas IIA Sleman"
                    value={newBranchForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const nextForm = { ...newBranchForm, name: newName };
                      if (!nextForm.headEmail || nextForm.headEmail.includes('@pascall.id')) {
                        nextForm.headEmail = generateRecommendedHeadEmail(newName, nextForm.city);
                        nextForm.headName = newName ? `Kepala ${newName}` : '';
                      }
                      setNewBranchForm(nextForm);
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      placeholder="Contoh: Sleman"
                      value={newBranchForm.city}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        const nextForm = { ...newBranchForm, city: newCity };
                        if (!nextForm.headEmail || nextForm.headEmail.includes('@pascall.id')) {
                          nextForm.headEmail = generateRecommendedHeadEmail(nextForm.name, newCity);
                        }
                        setNewBranchForm(nextForm);
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nomor Telepon UPT</label>
                    <input
                      type="text"
                      placeholder="Contoh: 0274-8921234"
                      value={newBranchForm.phone}
                      onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Alamat jalan, kelurahan, kecamatan..."
                    value={newBranchForm.address}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kapasitas Maksimal WBP</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={newBranchForm.capacity}
                      onChange={(e) => setNewBranchForm({ ...newBranchForm, capacity: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Status Operasional</label>
                    <select
                      value={newBranchForm.status}
                      onChange={(e) => setNewBranchForm({ ...newBranchForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {/* SECTION AKUN LOGIN KEPALA UPT */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>Akun Login Kepala UPT (Branch Admin)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Akun ini digunakan oleh Kepala UPT untuk mengelola data narapidana dan operasional UPT.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-600 font-semibold">
                          Email Login Kepala UPT <span className="text-rose-500">*</span>
                        </label>
                        {(() => {
                          const rec = generateRecommendedHeadEmail(newBranchForm.name, newBranchForm.city);
                          if (rec && newBranchForm.headEmail !== rec) {
                            return (
                              <button
                                type="button"
                                onClick={() => setNewBranchForm({ ...newBranchForm, headEmail: rec })}
                                className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                              >
                                Pakai Rekomendasi
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="kepala.upt@pascall.id"
                        value={newBranchForm.headEmail}
                        onChange={(e) => setNewBranchForm({ ...newBranchForm, headEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                      />
                      {newBranchForm.headEmail && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Email login: <span className="font-mono text-primary font-semibold">{newBranchForm.headEmail}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Nama Lengkap Kepala UPT
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kepala Lapas Kelas IIA Sleman"
                        value={newBranchForm.headName}
                        onChange={(e) => setNewBranchForm({ ...newBranchForm, headName: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Kata Sandi Login <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showHeadPassword ? 'text' : 'password'}
                          required
                          placeholder="Minimal 6 karakter"
                          value={newBranchForm.headPassword}
                          onChange={(e) => setNewBranchForm({ ...newBranchForm, headPassword: e.target.value })}
                          className="w-full pl-3.5 pr-12 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowHeadPassword(!showHeadPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-[10px] font-semibold cursor-pointer"
                        >
                          {showHeadPassword ? 'Tutup' : 'Lihat'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        No. Telepon Kepala UPT
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={newBranchForm.headPhone}
                        onChange={(e) => setNewBranchForm({ ...newBranchForm, headPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSubmittingAdd ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Simpan UPT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
