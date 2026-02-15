import React from 'react';
import { View } from '../types';

interface FloatingQuickInvoiceButtonProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const FloatingQuickInvoiceButton: React.FC<FloatingQuickInvoiceButtonProps> = ({ currentView, onNavigate }) => {
  // لا يظهر الزر إذا كنا بالفعل في صفحة الفاتورة أو لوحة التحكم
  if (currentView === 'quick-invoice' || currentView === 'admin' || currentView === 'admin-invoice') return null;

  return (
    <div className="hidden md:block fixed bottom-32 right-12 z-50 group">
      {/* التلميح (Tooltip) */}
      <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
        إنشاء فاتورة سريعة 🧾
        <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900"></div>
      </div>

      {/* الزر الرئيسي */}
      <button
        onClick={() => onNavigate('quick-invoice')}
        className="relative w-16 h-16 bg-white text-emerald-600 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-500 transform hover:scale-110 active:scale-90 border-2 border-emerald-50 overflow-visible"
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