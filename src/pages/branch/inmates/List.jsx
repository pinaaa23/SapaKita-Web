import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Power, 
  Filter, 
  Download, 
  SearchX, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Wallet,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import Modal from '../../../components/Modal';
import { getInmates, toggleInmateCommStatus } from '../../../services/mockData';
import { exportToCSV } from '../../../utils/exportUtils';

const InmatesList = () => {
  const navigate = useNavigate();
  
  const [inmatesList, setInmatesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal & Toast State
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Load inmates on mount / refresh
  const loadData = () => {
    setInmatesList([...getInmates()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const filteredInmates = inmatesList.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.wbpRegNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.blockRoom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePromptToggleCommStatus = (inmate) => {
    setSelectedInmate(inmate);
    setToggleModalOpen(true);
  };

  const confirmToggleCommStatus = () => {
    if (!selectedInmate) return;
    const updated = toggleInmateCommStatus(selectedInmate.id);
    loadData();
    const actionText = updated?.commStatus === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan';
    setToastMessage(`Akun komunikasi ${selectedInmate.name} berhasil ${actionText}!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleExport = () => {
    const exportData = filteredInmates.map(i => ({
      No_Registrasi_WBP: i.wbpRegNumber,
      Nama_Lengkap: i.name,
      NIK: i.nik || '-',
      Blok_Kamar: i.blockRoom,
      Tanggal_Masuk: i.entryDate,
      Saldo_Panggilan: i.callBalance,
      Status_Penempatan: i.status,
      Status_Akun_Komunikasi: i.commStatus
    }));

    const success = exportToCSV(exportData, `Data_Narapidana_PasCall_${statusFilter}.csv`);
    if (success !== false) {
      setToastMessage(`Berhasil mengunduh ${filteredInmates.length} data narapidana (.csv)!`);
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2.5 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/60">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama WBP atau No. Registrasi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
          </div>

          {/* Action Filters & Create Button */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Status */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="All">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Sudah Bebas">Sudah Bebas</option>
                <option value="Dipindahkan">Dipindahkan</option>
              </select>
            </div>

            {/* Export Button */}
            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>

            {/* Add Inmate Button */}
            <Link 
              to="/branch/inmates/create"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-xs cursor-pointer ml-auto md:ml-1"
            >
              <Plus className="w-4 h-4" /> Tambah Narapidana
            </Link>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 whitespace-nowrap">No. Registrasi WBP</th>
                <th className="py-3.5 px-5">Nama Lengkap</th>
                <th className="py-3.5 px-5">Blok / Kamar</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Tgl Masuk</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Saldo Panggilan</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Status Penempatan</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Status Akun</th>
                <th className="py-3.5 px-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInmates.length > 0 ? (
                filteredInmates.map((inmate) => (
                  <tr key={inmate.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {inmate.wbpRegNumber}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">{inmate.name}</div>
                      {inmate.nik && <div className="text-[10px] text-slate-400 font-mono">NIK: {inmate.nik}</div>}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-700">
                      {inmate.blockRoom}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-600 whitespace-nowrap">
                      {new Date(inmate.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-800 whitespace-nowrap">
                      {formatCurrency(inmate.callBalance)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        inmate.status === 'Aktif' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : inmate.status === 'Dipindahkan' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {inmate.status === 'Aktif' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {inmate.status === 'Dipindahkan' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {inmate.status === 'Sudah Bebas' && <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        {inmate.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        inmate.commStatus === 'Aktif' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inmate.commStatus === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {inmate.commStatus === 'Aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Detail */}
                        <Link
                          to={`/branch/inmates/${inmate.id}`}
                          className="p-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Narapidana"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/branch/inmates/${inmate.id}/edit`}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Narapidana"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        {/* Toggle Comm Status */}
                        <button
                          type="button"
                          onClick={() => handlePromptToggleCommStatus(inmate)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            inmate.commStatus === 'Aktif' 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={inmate.commStatus === 'Aktif' ? 'Nonaktifkan Akun Komunikasi' : 'Aktifkan Akun Komunikasi'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Tidak ada narapidana ditemukan</p>
                      <p className="text-xs mt-1 text-slate-400">Coba ubah kata kunci pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredInmates.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">Menampilkan 1-{filteredInmates.length} dari {filteredInmates.length} narapidana</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Sebelumnya</button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-sm">1</button>
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal Toggle Comm Status */}
      <Modal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={confirmToggleCommStatus}
        title={selectedInmate?.commStatus === 'Aktif' ? 'Konfirmasi Nonaktifkan Akun' : 'Konfirmasi Aktifkan Akun'}
        message={`Apakah Anda yakin ingin ${selectedInmate?.commStatus === 'Aktif' ? 'MENONAKTIFKAN' : 'MENGAKTIFKAN'} akun komunikasi PasCall milik narapidana ${selectedInmate?.name} (${selectedInmate?.wbpRegNumber})?`}
        confirmText={selectedInmate?.commStatus === 'Aktif' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        isDanger={selectedInmate?.commStatus === 'Aktif'}
      />
    </div>
  );
};

export default InmatesList;
