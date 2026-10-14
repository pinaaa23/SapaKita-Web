import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Image as ImageIcon, 
  SearchX, 
  Download, 
  Eye, 
  AlertCircle, 
  FileSpreadsheet,
  Plus,
  User,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Modal from '../../components/Modal';
import { exportToCSV } from '../../utils/exportUtils';
import { getContacts, updateContactStatus } from '../../services/contactService';
import { getInmatesApi, requestContactApi, logout } from '../../services/api';

/**
 * ARSIP: Halaman Persetujuan Kontak Keluarga
 * Dinonaktifkan: WBP sekarang mengetik sendiri nomor tujuan di kiosk/wartel.
 * Akses dialihkan otomatis ke Dashboard Cabang. Kode asli di bawah disimpan sebagai arsip.
 */
const Contacts = () => {
  return <Navigate to="/branch/dashboard" replace />;
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [inmatesList, setInmatesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: '', text: '' });
  const [imageError, setImageError] = useState(false);
  
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Form New Contact state (Ajukan Kontak)
  const [newContactForm, setNewContactForm] = useState({
    inmateIdentifier: '',
    relationship: 'Istri',
    ktpUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop&q=80'
  });
  const [newContactError, setNewContactError] = useState('');

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4500);
  };

  const handleApiError = (err, fallbackText = 'Terjadi kesalahan') => {
    if (err?.status === 401) {
      logout();
      navigate('/login', { replace: true });
      return;
    }
    if (err?.status === 403) {
      showToast('Anda tidak memiliki akses untuk tindakan ini.', 'error');
      return;
    }
    if (err?.isNetworkError || err?.status === 0) {
      showToast('Server tidak dapat dihubungi.', 'error');
      return;
    }
    showToast(fallbackText, 'error');
  };

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = filterStatus === 'All' ? undefined : filterStatus.toUpperCase();
      const data = await getContacts({ status: statusParam });
      setContacts(data);
    } catch (err) {
      handleApiError(err, 'Gagal memuat daftar kontak verifikasi');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    // Muat daftar narapidana untuk opsi formulir pengajuan jika diperlukan
    let isMounted = true;
    getInmatesApi()
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setInmatesList(list);
        if (list.length > 0 && !newContactForm.inmateIdentifier) {
          setNewContactForm(prev => ({ ...prev, inmateIdentifier: list[0].identifier || list[0].id }));
        }
      })
      .catch((err) => {
        console.log('[Contacts] Error mengambil daftar narapidana:', err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = () => {
    if (filteredContacts.length === 0) {
      showToast('Tidak ada data kontak untuk diekspor.', 'error');
      return;
    }
    const success = exportToCSV(filteredContacts, `Daftar_Kontak_PasCall_${filterStatus}.csv`);
    if (success !== false) {
      showToast(`Berhasil mengunduh ${filteredContacts.length} data kontak keluarga (.csv)!`);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesStatus = filterStatus === 'All' ? true : c.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      (c.contactName && c.contactName.toLowerCase().includes(q)) || 
      (c.phone && c.phone.includes(searchTerm)) || 
      (c.napiName && c.napiName.toLowerCase().includes(q)) ||
      (c.wbpRegNumber && c.wbpRegNumber.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (contact) => {
    setSelectedContact(contact);
    setIsApproveModalOpen(true);
  };

  const handleReject = (contact) => {
    setSelectedContact(contact);
    setRejectReason(contact.rejectReason || '');
    setRejectError('');
    setIsRejectModalOpen(true);
  };

  const handleViewDoc = (contact) => {
    setSelectedContact(contact);
    setImageError(false);
    setIsImageModalOpen(true);
  };

  const handleViewDetail = (contact) => {
    setSelectedContact(contact);
    setImageError(false);
    setIsDetailModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedContact?.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateContactStatus(selectedContact.id, 'APPROVED');
      setIsApproveModalOpen(false);
      showToast(`Kontak ${selectedContact.contactName} berhasil disetujui (Approved)!`);
      await loadContacts();
    } catch (err) {
      handleApiError(err, 'Gagal menyetujui kontak');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedContact?.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Backend hanya menerima status "REJECTED". Alasan penolakan tidak didukung di API.
      await updateContactStatus(selectedContact.id, 'REJECTED');
      setIsRejectModalOpen(false);
      showToast(`Kontak ${selectedContact.contactName} berhasil ditolak (Rejected).`);
      await loadContacts();
    } catch (err) {
      handleApiError(err, 'Gagal menolak kontak');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContactForm.inmateIdentifier || !newContactForm.relationship) {
      setNewContactError('Nomor identitas narapidana dan hubungan wajib diisi.');
      return false;
    }
    setIsSubmitting(true);
    setNewContactError('');
    try {
      await requestContactApi({
        inmateIdentifier: newContactForm.inmateIdentifier,
        relationship: newContactForm.relationship,
        ktpUrl: newContactForm.ktpUrl
      });
      setIsAddContactModalOpen(false);
      showToast('Permohonan kontak baru berhasil diajukan!');
      await loadContacts();
    } catch (err) {
      handleApiError(err, 'Gagal mengajukan kontak baru');
      setNewContactError(err?.message || 'Gagal mengajukan kontak');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari nama, WBP, atau nomor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {[
                { key: 'All', label: 'Semua' },
                { key: 'Pending', label: 'Menunggu' },
                { key: 'Approved', label: 'Disetujui' },
                { key: 'Rejected', label: 'Ditolak' }
              ].map(tab => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === tab.key 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <button 
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 rounded-xl font-bold flex items-center gap-2 shadow-2xs transition-all text-xs cursor-pointer ml-auto md:ml-2"
            >
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>

            <button
              type="button"
              onClick={() => setIsAddContactModalOpen(true)}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ajukan Kontak Baru
            </button>
          </div>
        </div>

        {/* Alert / Toast Notification */}
        {toastMessage.text && (
          <div className={`mx-5 my-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
            toastMessage.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {toastMessage.text}
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-2 text-left whitespace-nowrap w-28">Tgl Diajukan</th>
                <th className="py-3 px-3 text-left">Nama Narapidana</th>
                <th className="py-3 px-3 text-left">Kontak &amp; Hubungan</th>
                <th className="py-3 px-3 text-center whitespace-nowrap w-28">Status</th>
                <th className="py-3 pl-2 pr-4 text-center whitespace-nowrap w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 pl-4 pr-2"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-32 mb-1" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-28 mb-1" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                    <td className="py-3.5 px-3 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-3.5 pl-2 pr-4 text-center"><div className="h-7 bg-slate-200 rounded-lg w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-4 pr-2 font-medium text-slate-600 whitespace-nowrap">
                      {contact.date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{contact.napiName.split(' (')[0]}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        No ID: {contact.wbpRegNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{contact.contactName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {contact.relation} • <span className="font-mono text-slate-600">{contact.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {contact.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Ditolak</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          contact.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                          'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {contact.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {contact.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{contact.status === 'Approved' ? 'Disetujui' : 'Menunggu'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-2 pr-4 text-center whitespace-nowrap">
                      {contact.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            type="button"
                            onClick={() => handleApprove(contact)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-emerald-200 cursor-pointer shadow-2xs"
                          >
                            Setujui
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleReject(contact)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                          >
                            Tolak
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleViewDoc(contact)}
                            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Lihat Dokumen KTP"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            type="button"
                            onClick={() => handleViewDoc(contact)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200/80 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Lihat Dokumen KTP"
                          >
                            <ImageIcon className="w-3 h-3 text-slate-400" /> KTP
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleViewDetail(contact)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200/80 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            title="Lihat Rincian Kontak"
                          >
                            <Eye className="w-3 h-3 text-slate-400" /> Detail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <SearchX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">Belum ada pengajuan kontak</p>
                      <p className="text-xs mt-1 text-slate-400">
                        {searchTerm ? 'Tidak ada data kontak yang sesuai dengan pencarian.' : 'Belum ada data pengajuan kontak keluarga pada tab ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        {!isLoading && filteredContacts.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">Menampilkan {filteredContacts.length} kontak</div>
          </div>
        )}
      </div>

      {/* Add New Contact Modal */}
      <Modal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onConfirm={handleCreateContactSubmit}
        title="Ajukan Kontak Keluarga Baru"
        confirmText={isSubmitting ? "Menyimpan..." : "Simpan Permohonan"}
      >
        <form onSubmit={handleCreateContactSubmit} className="space-y-4 text-xs">
          {newContactError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {newContactError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nomor Registrasi Narapidana <span className="text-rose-500">*</span>
            </label>
            {inmatesList.length > 0 ? (
              <select
                value={newContactForm.inmateIdentifier}
                onChange={(e) => setNewContactForm({ ...newContactForm, inmateIdentifier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                required
              >
                {inmatesList.map(inmate => (
                  <option key={inmate.id} value={inmate.identifier || inmate.id}>
                    {inmate.name} ({inmate.identifier || inmate.id})
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="text"
                placeholder="Contoh: REG-12345"
                value={newContactForm.inmateIdentifier}
                onChange={(e) => setNewContactForm({ ...newContactForm, inmateIdentifier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Hubungan</label>
            <select
              value={newContactForm.relationship}
              onChange={(e) => setNewContactForm({ ...newContactForm, relationship: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="Istri">Istri</option>
              <option value="Suami">Suami</option>
              <option value="Ibu Kandung">Ibu Kandung</option>
              <option value="Ayah Kandung">Ayah Kandung</option>
              <option value="Anak Kandung">Anak Kandung</option>
              <option value="Adik Kandung">Adik Kandung</option>
              <option value="Kakak Kandung">Kakak Kandung</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">URL Dokumen KTP</label>
            <input 
              type="url"
              placeholder="https://..."
              value={newContactForm.ktpUrl}
              onChange={(e) => setNewContactForm({ ...newContactForm, ktpUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal 
        isOpen={isApproveModalOpen}
        onClose={() => !isSubmitting && setIsApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Konfirmasi Persetujuan Kontak"
        message={`Apakah Anda yakin ingin menyetujui permohonan kontak ${selectedContact?.contactName} untuk narapidana ${selectedContact?.napiName}?`}
        confirmText={isSubmitting ? "Memproses..." : "Ya, Setujui Kontak"}
      />

      {/* Reject Modal */}
      <Modal 
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        onConfirm={confirmReject}
        title="Konfirmasi Penolakan Kontak"
        confirmText={isSubmitting ? "Memproses..." : "Tolak Kontak"}
        isDanger={true}
      >
        <div className="mb-4 space-y-3">
          <p className="text-slate-600 text-xs font-medium">
            Apakah Anda yakin ingin menolak permohonan kontak untuk <strong>{selectedContact?.contactName}</strong>?
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Catatan Internal (Opsional - tidak disimpan di server):
            </label>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px] transition-all font-medium"
              placeholder="Catatan verifikasi..."
            ></textarea>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detail Kontak - ${selectedContact?.id || ''}`}
        cancelText="Tutup"
        confirmText="Selesai"
        onConfirm={() => setIsDetailModalOpen(false)}
      >
        {selectedContact && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status Pengajuan:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  selectedContact.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                  selectedContact.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {selectedContact.status === 'Approved' ? 'Disetujui' : selectedContact.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-medium block">Nama Pemohon:</span>
                <span className="font-bold text-slate-800">{selectedContact.contactName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Hubungan:</span>
                <span className="font-bold text-slate-800">{selectedContact.relation}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Nomor Kontak:</span>
                <span className="font-bold font-mono text-slate-800">{selectedContact.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Narapidana Terkait:</span>
                <span className="font-bold text-slate-800">{selectedContact.napiName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleViewDoc(selectedContact);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" /> Lihat Dokumen KTP
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Image / KTP Preview Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`Dokumen Identitas KTP - ${selectedContact?.contactName || ''}`}
        cancelText="Tutup"
        confirmText="Selesai"
        onConfirm={() => setIsImageModalOpen(false)}
      >
        <div className="p-2 space-y-3">
          {selectedContact?.ktpUrl ? (
            <div className="flex flex-col items-center">
              {!imageError ? (
                <div className="w-full flex flex-col items-center">
                  <img 
                    src={selectedContact.ktpUrl} 
                    alt={`KTP ${selectedContact.contactName}`}
                    onError={() => setImageError(true)}
                    className="max-h-72 w-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                  />
                  <a 
                    href={selectedContact.ktpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buka gambar di tab baru <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="font-bold text-slate-700 text-xs">KTP tidak dapat dimuat</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-3">Tautan gambar tidak dapat diakses secara langsung.</p>
                  <a 
                    href={selectedContact.ktpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buka tautan KTP di tab baru <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <ImageIcon className="w-8 h-8 mb-2 text-slate-300" />
              <span>Tidak ada dokumen KTP yang diunggah untuk kontak ini.</span>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default Contacts;
