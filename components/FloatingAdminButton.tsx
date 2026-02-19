import React from 'react';
import { View } from '../types';

interface FloatingAdminButtonProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const FloatingAdminButton: React.FC<FloatingAdminButtonProps> = ({ currentView, onNavigate }) => {
  // الكشف المباشر من الهاش لضمان الاختفاء في لوحة التحكم
  const isAlreadyAdmin = window.location.hash.toLowerCase().includes('cp') || 
                         window.location.hash.toLowerCase().includes('admin');

  if (isAlreadyAdmin) return null;

  return (
    <div className="fixed bottom-8 left-8 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
        لوحة التحكم ⚙️
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
      </div>

      {/* Main Button */}
      <button
        onClick={() => { window.location.hash = '#/cp'; }}
        className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center justify-center hover:bg-slate-900 transition-all duration-500 transform hover:scale-110 active:scale-90 group-hover:rotate-90 border-4 border-white"
        aria-label="Admin Dashboard"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2.5" 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </button>
      <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20 pointer-events-none"></span>
    </div>
  );
};

export default FloatingAdminButton;