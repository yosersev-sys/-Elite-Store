
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, User } from '../types';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  categories: Category[];
  currentUser: User | null;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onCategorySelect: (id: string | 'all') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, wishlistCount, categories, currentUser,
  onNavigate, onLogout, onSearch, onCategorySelect 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      if (currentScrollY <= 0) setIsVisible(true);
      else if (currentScrollY - lastScrollY.current > 10) setIsVisible(false);
      else if (lastScrollY.current - currentScrollY > 10) setIsVisible(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="bg-white border border-slate-100 rounded-[2rem] px-4 md:px-6 py-2 md:py-3 flex items-center justify-between gap-3 shadow-lg shadow-emerald-900/5">
          
          <div onClick={() => onNavigate('store')} className="flex items-center gap-2 md:gap-3 cursor-pointer group shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg text-white group-hover:rotate-6 transition-transform">
              <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="M3 9l2.44-4.91A2 2 0 0 1 7.23 3h9.54a2 2 0 0 1 1.79 1.09L21 9" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-slate-800 leading-none">سوق العصر</h1>
              <p className="text-[8px] md:text-[9px] font-black text-emerald-600 tracking-tight uppercase">فاقوس أونلاين</p>
            </div>
          </div>

          <div className="flex-grow max-w-lg">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="ابحث في فاقوس..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 md:py-3 px-5 pr-10 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all font-bold text-sm"
              />
              <svg className="absolute right-3.5 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-slate-300 group-focus-within:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <ActionButton 
              count={cartCount} 
              variant="primary"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
              onClick={() => onNavigate('cart')}
            />

            <div className="relative">
              {currentUser ? (
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-emerald-50 px-3 py-2 md:px-4 md:py-3 rounded-2xl border border-slate-100 transition-all group"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-black text-xs">
                    {currentUser.name[0].toUpperCase()}
                  </div>
                  <span className="hidden md:block font-black text-slate-700 text-sm">{currentUser.name.split(' ')[0]}</span>
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate('auth')}
                  className="bg-slate-900 text-white px-4 py-2.5 md:px-6 md:py-3.5 rounded-2xl font-black text-xs md:text-sm hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                >
                  دخول
                </button>
              )}

              {showUserMenu && currentUser && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute left-0 mt-3 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-20 py-3 animate-fadeIn">
                    <div className="px-5 py-3 border-b border-slate-50 mb-2">
                       <p className="font-black text-slate-800 text-sm truncate">{currentUser.name}</p>
                       <p className="text-[10px] text-slate-400 font-bold">{currentUser.phone}</p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button onClick={() => {onNavigate('admin'); setShowUserMenu(false);}} className="w-full text-right px-5 py-3 text-sm font-black text-emerald-600 hover:bg-emerald-50 transition">لوحة التحكم ⚙️</button>
                    )}
                    <button className="w-full text-right px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 transition">طلباتي 📦</button>
                    <button onClick={() => {onLogout(); setShowUserMenu(false);}} className="w-full text-right px-5 py-3 text-sm font-black text-rose-500 hover:bg-rose-50 transition">تسجيل الخروج 👋</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const ActionButton = ({ count, icon, onClick, variant = 'secondary' }: any) => (
  <button onClick={onClick} className={`relative p-2.5 md:p-3.5 rounded-2xl transition-all active:scale-90 ${variant === 'primary' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
    {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[8px] md:text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white">{count}</span>}
  </button>
);

export default Header;
