
import React from 'react';
import { View } from '../types';

interface FloatingQuickInvoiceButtonProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const FloatingQuickInvoiceButton: React.FC<FloatingQuickInvoiceButtonProps> = ({ currentView, onNavigate }) => {
  // يختفي الزر فقط إذا كنا بالفعل "داخل" عملية إنشاء الفاتورة أو شاشة الدخول
  if (currentView === 'quick-invoice' || currentView === 'admin-invoice' || currentView === 'admin-auth' || currentView === 'checkout') return null;

  return (
    <div className={`hidden md:block fixed z-50 group ${currentView === 'admin' ? 'bottom-8 right-8' : 'bottom-32 right-12'}`}>
      {/* التلميح (Tooltip) */}
      <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
        إنشاء فاتورة سريعة 🧾
        <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900"></div>
      </div>

      {/* الزر الرئيسي */}
      <button
        onClick={() => onNavigate('quick-invoice')}
        className={`relative w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-90 border-2 overflow-visible ${currentView === 'admin' ? 'bg-emerald-600 text-white border-white shadow-emerald-500/20' : 'bg-white text-emerald-600 border-emerald-50'}`}
        aria-label="Quick Invoice"
      >
        <span className="text-3xl">🧾</span>
        
        {/* تأثير النبض الزخرفي */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-10 pointer-events-none"></span>
      </button>
    </div>
  );
};

export default FloatingQuickInvoiceButton;
