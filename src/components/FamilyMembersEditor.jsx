import React from 'react';
import { Plus, Trash2, User, Phone, Users, AlertCircle } from 'lucide-react';

export const FAMILY_RELATIONSHIP_OPTIONS = [
  'Istri',
  'Anak',
  'Suami',
  'Orang Tua',
  'Saudara',
  'Lainnya'
];

/**
 * Validator data keluarga
 */
export const validateFamilies = (families) => {
  const errors = {};
  let hasError = false;
  const seenPhones = new Map();

  families.forEach((fam, index) => {
    const rowErrors = {};
    const name = (fam.name || '').trim();
    if (!name) {
      rowErrors.name = 'Nama keluarga wajib diisi';
      hasError = true;
    }

    const relationship = (fam.relationship || '').trim();
    if (!relationship) {
      rowErrors.relationship = 'Status keluarga wajib dipilih';
      hasError = true;
    }

    const rawPhone = (fam.phone || '').trim();
    const cleanPhone = rawPhone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      rowErrors.phone = 'No. telepon keluarga wajib diisi';
      hasError = true;
    } else if (!/^(\+62|62|08)[0-9]{8,13}$/.test(cleanPhone)) {
      rowErrors.phone = 'Format harus no. telepon Indonesia (08xx atau +62xx, 10-15 digit)';
      hasError = true;
    } else {
      if (seenPhones.has(cleanPhone)) {
        rowErrors.phone = 'No. telepon tidak boleh ganda dalam satu narapidana';
        const prevIndex = seenPhones.get(cleanPhone);
        if (!errors[prevIndex]) errors[prevIndex] = {};
        errors[prevIndex].phone = 'No. telepon tidak boleh ganda dalam satu narapidana';
        hasError = true;
      } else {
        seenPhones.set(cleanPhone, index);
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      errors[index] = { ...(errors[index] || {}), ...rowErrors };
    }
  });

  return { isValid: !hasError, errors };
};

/**
 * Komponen Editor Keluarga Narapidana
 */
const FamilyMembersEditor = ({ families = [], onChange, errors = {}, readOnly = false }) => {
  const handleAdd = () => {
    if (readOnly) return;
    const newMember = {
      id: `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      relationship: 'Istri',
      phone: '',
    };
    onChange([...families, newMember]);
  };

  const handleRemove = (index) => {
    if (readOnly) return;
    const updated = families.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleChangeField = (index, field, value) => {
    if (readOnly) return;
    const updated = families.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Keluarga Terdaftar ({families.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Daftar kontak keluarga yang terhubung dengan narapidana
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-primary rounded-xl text-xs font-bold transition-all border border-blue-200/80 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Keluarga</span>
          </button>
        )}
      </div>

      {families.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-50/80 border-2 border-dashed border-slate-200 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">Belum ada keluarga terdaftar</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {!readOnly
              ? 'Tambahkan kontak keluarga narapidana untuk whitelist panggilan dan verifikasi.'
              : 'Narapidana ini belum memiliki data keluarga yang terdaftar.'}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Keluarga Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {families.map((fam, index) => {
            const rowErr = errors[index] || {};
            return (
              <div
                key={fam.id || index}
                className="p-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-50 border border-slate-200/90 transition-all space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-primary text-[10px] font-extrabold flex items-center justify-center">
                      {index + 1}
                    </span>
                    Keluarga #{index + 1}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                      title="Hapus anggota keluarga ini"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline text-rose-600">Hapus</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start text-xs">
                  {/* Nama Keluarga */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> Nama Keluarga <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={fam.name || ''}
                      onChange={(e) => handleChangeField(index, 'name', e.target.value)}
                      placeholder="Contoh: Siti Rohayati"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                        rowErr.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {rowErr.name && (
                      <p className="text-[10.5px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {rowErr.name}
                      </p>
                    )}
                  </div>

                  {/* Status Hubungan */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Status Hubungan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      disabled={readOnly}
                      value={fam.relationship || 'Istri'}
                      onChange={(e) => handleChangeField(index, 'relationship', e.target.value)}
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all ${
                        rowErr.relationship ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    >
                      {FAMILY_RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {rowErr.relationship && (
                      <p className="text-[10.5px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {rowErr.relationship}
                      </p>
                    )}
                  </div>

                  {/* No. Telepon */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> No. Telepon <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      disabled={readOnly}
                      value={fam.phone || ''}
                      onChange={(e) => handleChangeField(index, 'phone', e.target.value)}
                      placeholder="081234567890 atau +62..."
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                        rowErr.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {rowErr.phone && (
                      <p className="text-[10.5px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {rowErr.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FamilyMembersEditor;
