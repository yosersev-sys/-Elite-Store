
import React from 'react';
import { View } from '../types';

interface MobileNavProps {
  currentView: View;
  cartCount: number;
  onNavigate: (view: View) => void;
  onCartClick: () => void;
  isAdmin: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, cartCount, onNavigate, onCartClick, isAdmin }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
      <NavItem 
        active={currentView === 'store'} 
        icon="🏠" 
        label="الرئيسية" 
        onClick={() => onNavigate('store')} 
      />
      
      <NavItem 
        active={currentView === 'my-orders'} 
        icon="📦" 
        label="طلباتي" 
        onClick={() => onNavigate('my-orders')} 
      />

      <div className="relative -mt-10" onClick={onCartClick}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all border-4 border-white ${currentView === 'cart' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
          🛒
        </div>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {cartCount}
          </span>
        )}
      </div>

      <NavItem 
        active={currentView === 'quick-invoice'} 
        icon="🧾" 
        label="فاتورة" 
        onClick={() => onNavigate('quick-invoice')} 
      />

      <NavItem 
        active={currentView === 'profile'} 
        icon="👤" 
        label="حسابي" 
        onClick={() => onNavigate('profile')} 
      />

      {isAdmin && (
        <NavItem 
          active={currentView === 'admin'} 
          icon="⚙️" 
          label="الإدارة" 
          onClick={() => onNavigate('admin')} 
        />
      )}
    </nav>
  );
};

const NavItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[50px]">
    <span className={`text-xl transition-transform ${active ? 'scale-110' : 'opacity-40 grayscale'}`}>
      {icon}
    </span>
    <span className={`text-[9px] font-black transition-colors ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
      {label}
    </span>
  </button>
);

export default MobileNav;
