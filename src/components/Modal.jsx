import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Konfirmasi', cancelText = 'Batal', isDanger = false, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative z-10 overflow-hidden transform transition-all my-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate pr-2">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
          {message && <p className="text-slate-600 text-sm mb-4">{message}</p>}
          {children}
        </div>
        
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              if (onConfirm) {
                const res = onConfirm();
                if (res !== false) onClose();
              } else {
                onClose();
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm text-white shadow-sm transition-all ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                : 'bg-primary hover:bg-primary-light shadow-primary/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
