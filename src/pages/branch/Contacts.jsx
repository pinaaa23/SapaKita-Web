import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Image as ImageIcon, 
  SearchX, 
  Download, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  FileSpreadsheet,
  Plus,
  User,
  Phone,
  Camera
} from 'lucide-react';
import Modal from '../../components/Modal';
import { exportToCSV } from '../../utils/exportUtils';
import { getInmates } from '../../services/mockData';

const initialContacts = Array.from({ length: 20 }).map((_, i) => {
  let status = 'Pending';
  let rejectReason = '';
  if (i % 3 === 1) status = 'Approved';
  if (i % 3 === 2) {
    status = 'Rejected';
    const reasons = [
      'Foto Kartu Keluarga tidak jelas / buram',
      'Nama pemohon tidak terdaftar di Kartu Keluarga',
      'Hubungan keluarga tidak sesuai di KK'
    ];
    rejectReason = reasons[i % reasons.length];
  }

  const inmates = getInmates();
  const assignedInmate = inmates[i % inmates.length];
  
  return {
    id: `CNT${1000 + i}`,
    inmateId: assignedInmate.id,
    wbpRegNumber: assignedInmate.wbpRegNumber,
    napiName: `${assignedInmate.name} (${assignedInmate.wbpRegNumber})`,
    inmateObj: assignedInmate,
    contactName: ['Siti Aminah', 'Ani Suryani', 'Dewi Lestari', 'Rini Puspita', 'Lestari Suhartini'][i % 5],
    relation: ['Istri', 'Ibu', 'Adik', 'Anak', 'Kakak'][i % 5],
    phone: `0812345678${i}`,
    status: status,
    rejectReason: rejectReason,
    date: new Date(Date.now() - i * 86400000).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  };
});

const Contacts = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [inmatesList, setInmatesList] = useState([]);
  
  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [exportToast, setExportToast] = useState('');
  
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Form New Contact state
  const [newContactForm, setNewContactForm] = useState({
    inmateId: '',
    contactName: '',
    relation: 'Istri',
    phone: ''
  });
  const [newContactError, setNewContactError] = useState('');

  useEffect(() => {
    const list = getInmates();
    setInmatesList(list);
    if (list.length > 0) {
      setNewContactForm(prev => ({ ...prev, inmateId: list[0].id }));
    }
  }, []);

  const handleExport = () => {
    const success = exportToCSV(filteredContacts, `Daftar_Kontak_PasCall_${filterStatus}.csv`);
    if (success !== false) {
      setExportToast(`Berhasil mengunduh ${filteredContacts.length} data kontak keluarga (.csv)!`);
      setTimeout(() => setExportToast(''), 4000);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const matchesStatus = filterStatus === 'All' ? true : c.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
                          c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.napiName.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleViewKK = (contact) => {
    setSelectedContact(contact);
    setIsImageModalOpen(true);
  };

  const handleViewDetail = (contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleResetPending = (contact) => {
    setContacts(contacts.map(c => 
      c.id === contact.id ? { ...c, status: 'Pending', rejectReason: '' } : c
    ));
    if (selectedContact?.id === contact.id) {
      setSelectedContact({ ...contact, status: 'Pending', rejectReason: '' });
    }
  };

  const confirmApprove = () => {
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? { ...c, status: 'Approved', rejectReason: '' } : c
    ));
    if (selectedContact) {
      setSelectedContact(prev => ({ ...prev, status: 'Approved', rejectReason: '' }));
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Alasan penolakan tidak boleh kosong.');
      return false;
    }
    setContacts(contacts.map(c => 
      c.id === selectedContact.id ? { ...c, status: 'Rejected', rejectReason: rejectReason } : c
    ));
    if (selectedContact) {
      setSelectedContact(prev => ({ ...prev, status: 'Rejected', rejectReason: rejectReason }));
    }
    return true;
  };

  const handleCreateContactSubmit = (e) => {
    e.preventDefault();
    if (!newContactForm.contactName.trim() || !newContactForm.phone.trim() || !newContactForm.inmateId) {
      setNewContactError('Semua field wajib diisi.');
      return false;
    }

    const selectedInmate = inmatesList.find(i => i.id === newContactForm.inmateId);
    if (!selectedInmate) return false;

    const newEntry = {
      id: `CNT${1000 + contacts.length}`,
      inmateId: selectedInmate.id,
      wbpRegNumber: selectedInmate.wbpRegNumber,
      napiName: `${selectedInmate.name} (${selectedInmate.wbpRegNumber})`,
      inmateObj: selectedInmate,
      contactName: `${newContactForm.contactName} (Keluarga)`,
      relation: newContactForm.relation,
      phone: newContactForm.phone,
      status: 'Pending',
      rejectReason: '',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setContacts([newEntry, ...contacts]);
    setIsAddContactModalOpen(false);
    setNewContactForm({ inmateId: inmatesList[0]?.id || '', contactName: '', relation: 'Istri', phone: '' });
    setNewContactError('');
    setExportToast(`Permohonan kontak baru untuk ${selectedInmate.name} berhasil diajukan!`);
    setTimeout(() => setExportToast(''), 4000);
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
              {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === status 
                      ? 'bg-white text-primary shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'All' ? 'Semua' : status}
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

        {exportToast && (
          <div className="mx-5 my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            {exportToast}
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6 text-left whitespace-nowrap w-40">Tgl Diajukan</th>
                <th className="py-3.5 px-6 text-left">Nama Narapidana</th>
                <th className="py-3.5 px-6 text-left">Kontak &amp; Hubungan</th>
                <th className="py-3.5 px-6 text-center whitespace-nowrap w-40">Status</th>
                <th className="py-3.5 px-6 text-center whitespace-nowrap w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-600 whitespace-nowrap">
                      {contact.date}
                    </td>
                    <td className="py-3.5 px-6">
                      <Link 
                        to={`/branch/inmates/${contact.inmateId}`}
                        className="font-bold text-slate-800 hover:text-primary transition-colors flex items-center gap-1.5 group"
                        title="Lihat Profil Narapidana"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>{contact.napiName.split(' (')[0]}</span>
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        No ID: {contact.wbpRegNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-800">{contact.contactName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{contact.relation} • <span className="font-mono text-slate-600">{contact.phone}</span></div>
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      {contact.status === 'Rejected' ? (
                        <button
                          type="button"
                          onClick={() => handleViewDetail(contact)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs group"
                          title={`Klik untuk lihat alasan penolakan`}
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                          <span>{contact.status}</span>
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          contact.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                          'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {contact.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {contact.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{contact.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      {contact.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => handleApprove(contact)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-200 cursor-pointer shadow-2xs"
                          >
                            Setujui
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleReject(contact)}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                          >
                            Tolak
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleViewDetail(contact)}
                            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => handleViewDetail(contact)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200/80 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="Lihat Rincian Kontak"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" /> Detail
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
                      <p className="font-bold text-slate-700">Tidak ada kontak ditemukan</p>
                      <p className="text-xs mt-1 text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Safety */}
        {filteredContacts.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div className="font-medium">Menampilkan 1-{filteredContacts.length} dari {filteredContacts.length} kontak</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Sebelumnya</button>
              <button type="button" className="px-3 py-1.5 border border-primary bg-primary text-white rounded-lg font-bold text-xs shadow-sm">1</button>
              <button type="button" disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 text-xs font-semibold">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Contact Modal */}
      <Modal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onConfirm={handleCreateContactSubmit}
        title="Ajukan Kontak Keluarga Baru"
        confirmText="Simpan Permohonan"
      >
        <form onSubmit={handleCreateContactSubmit} className="space-y-4 text-xs">
          {newContactError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {newContactError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Pilih Narapidana Terkait <span className="text-rose-500">*</span>
            </label>
            <select
              value={newContactForm.inmateId}
              onChange={(e) => setNewContactForm({ ...newContactForm, inmateId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              required
            >
              {inmatesList.map(inmate => (
                <option key={inmate.id} value={inmate.id}>
                  {inmate.name} ({inmate.wbpRegNumber}) - {inmate.blockRoom}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Mengambil relasi langsung dari data /branch/inmates</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nama Kontak Keluarga <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Contoh: Siti Aminah"
              value={newContactForm.contactName}
              onChange={(e) => setNewContactForm({ ...newContactForm, contactName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Hubungan</label>
              <select
                value={newContactForm.relation}
                onChange={(e) => setNewContactForm({ ...newContactForm, relation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="Istri">Istri</option>
                <option value="Suami">Suami</option>
                <option value="Ibu">Ibu</option>
                <option value="Ayah">Ayah</option>
                <option value="Anak">Anak</option>
                <option value="Adik">Adik</option>
                <option value="Kakak">Kakak</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Nomor Telepon <span className="text-rose-500">*</span>
              </label>
              <input 
                type="tel"
                placeholder="0812xxxxxxxx"
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Upload Dokumen Kartu Keluarga (KK)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 text-center text-slate-500">
              <Camera className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <span className="text-[11px] font-medium">Klik untuk upload foto Kartu Keluarga (KK)</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal 
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Konfirmasi Persetujuan Kontak"
        message={`Apakah Anda yakin ingin menyetujui kontak ${selectedContact?.contactName} untuk narapidana ${selectedContact?.napiName}?`}
        confirmText="Ya, Setujui Kontak"
      />

      {/* Reject Modal */}
      <Modal 
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={confirmReject}
        title="Konfirmasi Penolakan Kontak"
        confirmText="Tolak Kontak"
        isDanger={true}
      >
        <div className="mb-4 space-y-3">
          <p className="text-slate-600 text-xs font-medium">
            Berikan alasan penolakan untuk permohonan kontak <strong>{selectedContact?.contactName}</strong>:
          </p>
          <textarea 
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (e.target.value.trim()) setRejectError('');
            }}
            className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 min-h-[100px] transition-all font-medium ${
              rejectError 
                ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
            }`}
            placeholder="Contoh: Foto Kartu Keluarga tidak jelas / nama pemohon tidak ada dalam KK..."
            required
          ></textarea>
          {rejectError && <p className="text-rose-600 text-xs font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{rejectError}</p>}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detail Kontak - ${selectedContact?.id}`}
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
                  {selectedContact.status}
                </span>
              </div>
              {selectedContact.status === 'Rejected' && selectedContact.rejectReason && (
                <div className="text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 font-medium">
                  <strong>Alasan Penolakan:</strong> {selectedContact.rejectReason}
                </div>
              )}
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
                <span className="text-slate-400 font-medium block">Nomor Telepon:</span>
                <span className="font-bold font-mono text-slate-800">{selectedContact.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Narapidana Terkait:</span>
                <span className="font-bold text-slate-800">{selectedContact.napiName}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-slate-400">Ubah status langsung:</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    handleResetPending(selectedContact);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reset ke Pending
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`Foto Kartu Keluarga (KK) - ${selectedContact?.contactName}`}
        cancelText="Tutup"
        confirmText="Selesai"
        onConfirm={() => setIsImageModalOpen(false)}
      >
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-xl">
          <div className="w-full max-w-sm aspect-[1.6/1] bg-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="w-10 h-10 mb-2 text-slate-400" />
            <p className="font-bold text-xs text-slate-700">Dokumen Kartu Keluarga (KK) Terverifikasi</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Atas Nama: {selectedContact?.contactName}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">No. KK: 317508******0001</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Contacts;
