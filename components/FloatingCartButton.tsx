
import React from 'react';

interface FloatingCartButtonProps {
  count: number;
  onClick: () => void;
  isVisible: boolean;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ count, onClick, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 group md:bottom-12 md:right-12">
      {/* التلميح (Tooltip) */}
      <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
        عرض سلة المشتريات 🛒
        <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900"></div>
      </div>

      {/* الزر الرئيسي */}
      <button
        onClick={onClick}
        className="relative w-16 h-16 bg-emerald-600 text-white rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center justify-center hover:bg-slate-900 transition-all duration-500 transform hover:scale-110 active:scale-90 border-4 border-white overflow-visible"
      >
        <svg 
          className="w-8 h-8" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2.5" 
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
          />
        </svg>

        {/* عداد المنتجات */}
        {count > 0 && (
          <span className="absolute -top-1 -left-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {count}
          </span>
        )}
      </button>

      {/* تأثير النبض الزخرفي */}
      {count > 0 && (
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 pointer-events-none"></span>
      )}
    </div>
  );
};

export default FloatingCartButton;
