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
      else if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
        setIsVisible(currentScrollY < lastScrollY.current);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'} ${scrolled ? 'py-1' : 'py-2 md:py-4'}`}>
      {showScanner && <BarcodeScanner onScan={(code) => { setSearchVal(code); onSearch(code); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
      
      <div className="container mx-auto px-2 md:px-4">
        <div className="bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] px-2 md:px-6 py-2 flex items-center justify-between gap-2 shadow-lg shadow-emerald-900/5">
          
          <div onClick={() => onNavigate('store')} className="flex items-center gap-1.5 md:gap-3 cursor-pointer shrink-0">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1">
              <img 
                src="https://soqelasr.com/shopping-bag.png" 
                alt="سوق العصر" 
                width="40"
                height="40"
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] md:text-xl font-black text-slate-800 leading-none">سوق العصر</h1>
              <p className="text-[5px] md:text-[9px] font-bold text-emerald-600 uppercase mt-0.5">اول سوق الكتروني في فاقوس</p>
            </div>
          </div>

          <div className="flex-grow max-w-lg min-w-0">
            <div className="relative group flex items-center">
              <input 
                type="search" 
                aria-label="ابحث في المنتجات"
                placeholder="ابحث بالاسم أو الباركود..." 
                value={searchVal}
                onChange={(e) => { setSearchVal(e.target.value); onSearch(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl py-1.5 md:py-3 px-8 md:px-12 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-[10px] md:text-sm"
              />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-5 md:w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button 
                onClick={() => setShowScanner(true)}
                aria-label="مسح الباركود"
                className="absolute left-2 md:hidden bg-emerald-100 p-1 rounded-lg text-emerald-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="قائمة المستخدم"
                className="w-8 h-8 md:w-11 md:h-11 bg-slate-50 border rounded-xl flex items-center justify-center text-emerald-600 font-black text-xs md:text-sm"
              >
                {currentUser.name[0].toUpperCase()}
              </button>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-slate-900 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-lg md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-emerald-600 transition-all"
              >
                دخول
              </button>
            )}
            
            {showUserMenu && currentUser && (
              <div className="absolute left-2 md:left-4 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border p-2 z-[60]">
                <button onClick={() => { onNavigate('profile'); setShowUserMenu(false); }} className="w-full text-right p-2 text-xs font-bold hover:bg-slate-50 rounded-lg">حسابي 👤</button>
                <button onClick={() => { onLogout(); setShowUserMenu(false); }} className="w-full text-right p-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg">خروج 👋</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;