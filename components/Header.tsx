import React, { useState, useEffect, useRef } from 'react';
import { Category, User } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  categories: Category[];
  currentUser: User | null;
  onNavigate: (view: any) => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onCategorySelect: (id: string | 'all') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, wishlistCount, categories, currentUser,
  onNavigate, onLoginClick, onLogout, onSearch, onCategorySelect 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchVal, setSearchVal] = useState('');
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

    const handleForceShow = () => setIsVisible(true);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('force-header-show', handleForceShow);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('force-header-show', handleForceShow);
    };
  }, []);

  const handleScanResult = (code: string) => {
    setSearchVal(code);
    onSearch(code);
    setShowScanner(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'} ${scrolled ? 'py-1 md:py-2' : 'py-2 md:py-4'}`}>
      {showScanner && <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
      
      <div className="container mx-auto px-2 md:px-4">
        <div className="bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] px-2 md:px-6 py-1.5 md:py-3 flex items-center justify-between gap-2 shadow-lg shadow-emerald-900/5">
          
          <div onClick={() => onNavigate('store')} className="flex items-center gap-1.5 md:gap-3 cursor-pointer group shrink-0">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform overflow-hidden p-1">
              <img 
                src="https://soqelasr.com/shopping-bag.png" 
                alt="سوق العصر" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[9px] md:text-xl font-black text-slate-800 leading-none whitespace-nowrap">سوق العصر</h1>
              <p className="block text-[5px] md:text-[9px] font-black text-emerald-600 uppercase mt-0.5">اول سوق الكتروني في فاقوس</p>
            </div>
          </div>

          <div className="flex-grow max-w-lg min-w-0">
            <div className="relative group flex items-center">
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الباركود..." 
                value={searchVal}
                onChange={(e) => { setSearchVal(e.target.value); onSearch(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl py-1.5 md:py-3 px-7 md:px-10 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-[10px] md:text-sm"
              />
              <svg className="absolute right-2 top-2 md:right-3.5 md:top-3.5 h-3.5 w-3.5 md:h-5 md:w-5 text-slate-300 group-focus-within:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/* تعديل: إضافة md:hidden لإخفاء الزر على الكمبيوتر */}
              <button 
                onClick={() => setShowScanner(true)}
                className="absolute left-2 md:hidden bg-emerald-100 p-1 md:p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                title="مسح باركود"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <div className="relative">
              {currentUser ? (
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 bg-slate-50 hover:bg-emerald-50 px-1.5 py-1.5 md:px-4 md:py-3 rounded-xl border border-slate-100 transition-all group"
                >
                  <div className="w-5 h-5 md:w-8 md:h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-black text-[8px] md:text-xs">
                    {currentUser.name[0].toUpperCase()}
                  </div>
                </button>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="hidden md:block bg-slate-900 text-white px-2.5 py-2 md:px-6 md:py-3.5 rounded-lg md:rounded-2xl font-black text-[9px] md:text-sm hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                >
                  دخول
                </button>
              )}

              {showUserMenu && currentUser && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute left-0 mt-3 w-48 md:w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-20 py-2 md:py-3 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                       <p className="font-black text-slate-800 text-xs md:text-sm truncate">{currentUser.name}</p>
                       <p className="text-[9px] text-slate-400 font-bold">{currentUser.phone}</p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button onClick={() => {onNavigate('admin'); setShowUserMenu(false);}} className="w-full text-right px-4 py-2 text-[10px] md:text-sm font-black text-emerald-600 hover:bg-emerald-50 transition">لوحة التحكم ⚙️</button>
                    )}
                    <button onClick={() => {onNavigate('profile'); setShowUserMenu(false);}} className="w-full text-right px-4 py-2 text-[10px] md:text-sm font-black text-slate-600 hover:bg-slate-50 transition">تعديل الحساب 👤</button>
                    <button onClick={() => {onNavigate('my-orders'); setShowUserMenu(false);}} className="w-full text-right px-4 py-2 text-[10px] md:text-sm font-black text-slate-600 hover:bg-slate-50 transition">طلباتي 📦</button>
                    <button onClick={() => {onLogout(); setShowUserMenu(false);}} className="w-full text-right px-4 py-2 text-[10px] md:text-sm font-black text-rose-500 hover:bg-rose-50 transition">تسجيل الخروج 👋</button>
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

export default Header;