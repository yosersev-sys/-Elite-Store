
import React, { useState, useEffect, useRef } from 'react';
import { View, Category } from '../types';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  currentView: View;
  categories: Category[];
  selectedCategoryId: string | 'all';
  onNavigate: (view: View) => void;
  onSearch: (query: string) => void;
  onCategorySelect: (id: string | 'all') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, wishlistCount, currentView, categories, 
  selectedCategoryId, onNavigate, onSearch, onCategorySelect 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if at the top for aesthetic changes
      setScrolled(currentScrollY > 20);

      // Hide/Show logic based on scroll direction
      if (currentScrollY <= 0) {
        // At the very top, always show
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling Down - hide if past threshold
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling Up - show
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'py-1 md:py-2' : 'py-3 md:py-4'}`}>
      <div className="container mx-auto px-2 md:px-4">
        <div className={`glass rounded-[1.5rem] md:rounded-[2rem] px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-8 card-shadow transition-all duration-500 ${scrolled ? 'mx-1 md:mx-2' : 'mx-0'}`}>
          
          {/* Logo Section - Always Visible */}
          <div 
            onClick={() => { onNavigate('store'); onCategorySelect('all'); }}
            className="flex items-center gap-2 md:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 md:w-12 md:h-12 bg-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
              🏪
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-xl font-black text-slate-800 leading-none whitespace-nowrap">فاقوس ستور</h1>
              <p className="text-[7px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 md:mt-1">Faqous Store</p>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            <HeaderLink active={currentView === 'store'} onClick={() => onNavigate('store')} label="المتجر" />
            <HeaderLink active={currentView === 'wishlist'} onClick={() => onNavigate('wishlist')} label="المفضلة" />
            <HeaderLink active={currentView === 'admin'} onClick={() => onNavigate('admin')} label="الإدارة" />
          </nav>

          {/* Search Bar - Responsive */}
          <div className="flex-grow max-w-xl">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="ابحث عن منتج..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl py-1.5 md:py-3 px-3 md:px-6 pr-8 md:pr-12 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all font-bold text-[10px] md:text-sm"
              />
              <svg className="absolute right-2.5 md:right-4 top-2 md:top-3.5 h-3.5 w-3.5 md:h-5 md:w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <ActionButton 
              count={wishlistCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
              onClick={() => onNavigate('wishlist')}
              className="hidden sm:flex"
            />
            <ActionButton 
              count={cartCount} 
              variant="primary"
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
              onClick={() => onNavigate('cart')}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-2 md:mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <CategoryChip 
            active={selectedCategoryId === 'all'} 
            onClick={() => onCategorySelect('all')} 
            label="الكل" 
            icon="✨"
          />
          {categories.map(cat => (
            <CategoryChip 
              key={cat.id}
              active={selectedCategoryId === cat.id} 
              onClick={() => onCategorySelect(cat.id)} 
              label={cat.name} 
              icon="🌿"
            />
          ))}
        </div>
      </div>
    </header>
  );
};

const HeaderLink = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}`}
  >
    {label}
  </button>
);

const ActionButton = ({ count, icon, onClick, variant = 'secondary', className = '' }: any) => (
  <button 
    onClick={onClick}
    className={`relative p-2 md:p-3 rounded-xl md:rounded-2xl transition-all active:scale-90 ${variant === 'primary' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-white border border-slate-100'} ${className}`}
  >
    <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-5 md:h-5 bg-rose-500 text-white text-[7px] md:text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white">
        {count}
      </span>
    )}
  </button>
);

const CategoryChip = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`whitespace-nowrap flex items-center gap-1.5 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full text-[9px] md:text-xs font-black transition-all border ${active ? 'bg-slate-800 border-slate-800 text-white shadow-xl translate-y-[-1px]' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
  >
    <span className={active ? '' : 'grayscale'}>{icon}</span>
    {label}
  </button>
);

export default Header;
