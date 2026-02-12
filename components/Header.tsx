
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className={`glass rounded-[2rem] px-6 py-3 flex items-center justify-between card-shadow transition-all duration-500 ${scrolled ? 'mx-2' : 'mx-0'}`}>
          
          <div className="flex items-center gap-8">
            <div 
              onClick={() => { onNavigate('store'); onCategorySelect('all'); }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                🏪
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-800 leading-none">فاقوس</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Store Premium</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              <HeaderLink active={currentView === 'store'} onClick={() => onNavigate('store')} label="المتجر" />
              <HeaderLink active={currentView === 'wishlist'} onClick={() => onNavigate('wishlist')} label="المفضلة" />
              <HeaderLink active={currentView === 'admin'} onClick={() => onNavigate('admin')} label="لوحة التحكم" />
            </nav>
          </div>

          <div className="flex-grow max-w-lg mx-8 hidden md:block">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="ابحث عن منتج، قسم، أو علامة تجارية..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 pr-12 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all font-medium text-sm"
              />
              <svg className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ActionButton 
              count={wishlistCount} 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
              onClick={() => onNavigate('wishlist')}
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
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
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
    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}`}
  >
    {label}
  </button>
);

const ActionButton = ({ count, icon, onClick, variant = 'secondary' }: any) => (
  <button 
    onClick={onClick}
    className={`relative p-3 rounded-2xl transition-all active:scale-90 ${variant === 'primary' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-white border border-slate-100'}`}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white">
        {count}
      </span>
    )}
  </button>
);

const CategoryChip = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all border ${active ? 'bg-slate-800 border-slate-800 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
  >
    <span className={active ? '' : 'grayscale'}>{icon}</span>
    {label}
  </button>
);

export default Header;
