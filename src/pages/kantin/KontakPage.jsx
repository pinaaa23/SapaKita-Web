import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  Video, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react';
import { getInmates } from '../../services/inmateService';
import { getContacts, createContact, deleteContact } from '../../services/contactService';

export default function KontakPage() {
  const [inmates, setInmates] = useState([]);
  const [searchInmateQuery, setSearchInmateQuery] = useState('');
  const [selectedInmate, setSelectedInmate] = useState(null);
  
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingInmates, setIsLoadingInmates] = useState(false);

  // Modal Tambah Kontak
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Istri',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal Hapus Kontak
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchTimerRef = useRef(null);

  // Load Inmates: server-side search dengan debounce 400ms
  const fetchInmates = useCallback(async (search = '') => {
    setIsLoadingInmates(true);
    try {
      const data = await getInmates({ search: search.trim(), limit: 20 });
      // getInmates() mengembalikan { items, total, ... } — ambil .items
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setInmates(list);
    } catch (err) {
      console.error('Gagal mengambil daftar WBP:', err);
      setInmates([]);
    } finally {
      setIsLoadingInmates(false);
    }
  }, []);

  // Load awal saat halaman dibuka
  useEffect(() => {
    fetchInmates('');
  }, [fetchInmates]);

  // Debounce pencarian: trigger server-side search setelah 400ms diam
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchInmates(searchInmateQuery);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchInmateQuery, fetchInmates]);

  // filteredInmates = seluruh hasil dari server (sudah difilter BE)
  const filteredInmates = inmates;

  // Load Contacts for Selected Inmate
  const fetchContactsForInmate = useCallback(async (inmateId) => {
    if (!inmateId) {
      setContacts([]);
      return;
    }
    setIsLoadingContacts(true);
    try {
      const list = await getContacts({ inmateId });
      setContacts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Gagal mengambil kontak WBP:', err);
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const handleSelectInmate = (inmate) => {
    setSelectedInmate(inmate);
    fetchContactsForInmate(inmate.id);
  };

  const handleOpenAddModal = () => {
    setFormError('');
    setFormData({
      name: '',
      relationship: 'Istri',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInmate) return;

    if (!formData.name.trim()) {
      setFormError('Nama lengkap keluarga wajib diisi');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setFormError('Nomor telepon minimal 8 digit');
      return;
    }

    if (contacts.length >= 10) {
      setFormError('Batas maksimal kontak tercapai (Maksimal 10 kontak per WBP)');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await createContact({
        inmateId: selectedInmate.id,
        name: formData.name.trim(),
        relationship: formData.relationship,
        phone: formData.phone.trim(),
      });

      setSuccessToast(`Kontak ${formData.name} berhasil didaftarkan!`);
      setTimeout(() => setSuccessToast(''), 4000);
      setIsModalOpen(false);
      fetchContactsForInmate(selectedInmate.id);
    } catch (err) {
      setFormError(err.message || 'Gagal mendaftarkan kontak');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContact(contactToDelete.id);
      setSuccessToast(`Kontak ${contactToDelete.contactName || contactToDelete.name} berhasil dihapus.`);
      setTimeout(() => setSuccessToast(''), 4000);
      setContactToDelete(null);
      fetchContactsForInmate(selectedInmate.id);
    } catch (err) {
      alert(err.message || 'Gagal menghapus kontak');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 md:p-6 text-slate-800">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-semibold transition-all">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Kantin Lapas • Manajemen Kontak WBP</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kelola Kontak Keluarga WBP
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Daftarkan maksimal 10 nomor kontak keluarga untuk setiap warga binaan. Sistem otomatis mendeteksi kanal WhatsApp atau GSM.
          </p>
        </div>

        {selectedInmate && (
          <button
            onClick={handleOpenAddModal}
            disabled={contacts.length >= 10}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 ${
              contacts.length >= 10
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kontak ({contacts.length}/10)</span>
          </button>
        )}
      </div>

      {/* Grid: Kiri Pencarian WBP, Kanan Daftar Kontak */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pemilihan WBP */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-800">1. Pilih Warga Binaan</h2>
            {selectedInmate && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Terpilih
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInmateQuery}
              onChange={(e) => setSearchInmateQuery(e.target.value)}
              placeholder="Cari NIP atau nama WBP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* List WBP */}
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
            {isLoadingInmates ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">Memuat data WBP...</div>
            ) : filteredInmates.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">WBP tidak ditemukan.</div>
            ) : (
              filteredInmates.map((inmate) => {
                const isSelected = selectedInmate?.id === inmate.id;
                const regNo = inmate.wbpRegNumber || inmate.identifier || '-';
                return (
                  <button
                    key={inmate.id}
                    onClick={() => handleSelectInmate(inmate)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{inmate.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        NIP: <span className="font-semibold text-slate-700">{regNo}</span>
                      </div>
                      {inmate.blockRoom && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{inmate.blockRoom}</div>
                      )}
                    </div>
                    {isSelected && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail WBP & Tabel Kontak */}
        <div className="lg:col-span-8 space-y-5">
          {selectedInmate ? (
            <>
              {/* Card Ringkasan WBP Terpilih */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                    {selectedInmate.name ? selectedInmate.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Warga Binaan Terpilih
                    </div>
                    <div className="text-lg font-black text-slate-900">{selectedInmate.name}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      NIP/Reg: <span className="font-bold text-slate-800">{selectedInmate.wbpRegNumber || selectedInmate.identifier}</span>
                      {selectedInmate.blockRoom && ` • ${selectedInmate.blockRoom}`}
                    </div>
                  </div>
                </div>

                {/* Progress Kuota Kontak */}
                <div className="flex flex-col items-end w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Kuota Kontak:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      contacts.length >= 10
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {contacts.length} / 10 Nomor Terdaftar
                    </span>
                  </div>
                  <div className="w-full sm:w-36 bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        contacts.length >= 10 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, (contacts.length / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Kontak */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Daftar Kontak Keluarga Terdaftar</span>
                    <span className="text-xs text-slate-400 font-semibold">({contacts.length})</span>
                  </h3>
                  <button
                    onClick={() => fetchContactsForInmate(selectedInmate.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Segarkan data kontak"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingContacts ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">Memuat kontak...</div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-14 px-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-sm text-slate-800">Belum Ada Kontak Keluarga Terdaftar</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                      WBP ini belum memiliki nomor kontak keluarga yang terhubung. Klik tombol di bawah untuk mendaftarkan nomor telepon pertama.
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Kontak Keluarga Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Nama Keluarga</th>
                          <th className="py-3 px-4">Hubungan</th>
                          <th className="py-3 px-4">Nomor HP</th>
                          <th className="py-3 px-4">Kanal Deteksi</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {contacts.map((c) => {
                          const isWA = c.hasWhatsapp === true;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {c.contactName || c.name || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">
                                {c.relation || c.relationship || '-'}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                                {c.phone}
                              </td>
                              <td className="py-3.5 px-4">
                                {isWA ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>WhatsApp (VC / Audio)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                                    <span>GSM Seluler (SIP Trunk)</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Disetujui</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setContactToDelete(c)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus kontak ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State Belum Memilih WBP */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">Pilih Warga Binaan Terlebih Dahulu</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Pilih atau cari warga binaan dari panel di sebelah kiri untuk melihat dan mengelola kontak keluarga yang terdaftar pada akun mereka.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Kontak */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tambah Kontak Keluarga</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Untuk WBP: <span className="font-bold text-blue-600">{selectedInmate?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Nama Lengkap Keluarga</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hubungan Keluarga</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="Istri">Istri</option>
                  <option value="Suami">Suami</option>
                  <option value="Ibu Kandung">Ibu Kandung</option>
                  <option value="Ayah Kandung">Ayah Kandung</option>
                  <option value="Anak">Anak</option>
                  <option value="Saudara Kandung">Saudara Kandung</option>
                  <option value="Keluarga / Kerabat">Keluarga / Kerabat</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Sistem otomatis mengecek ke server Fonnte WhatsApp untuk menentukan jalur panggilan video/suara.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Memeriksa & Menyimpan...' : 'Simpan Kontak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Kontak */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Hapus Kontak Keluarga?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus kontak <span className="font-bold text-slate-800">{contactToDelete.contactName || contactToDelete.name}</span> ({contactToDelete.phone}) dari akun WBP ini?
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5 text-xs font-bold">
              <button
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
