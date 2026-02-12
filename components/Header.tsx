
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Category } from '../types';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  currentView: string;
  categories: Category[];
  selectedCategoryId: string | 'all';
  onNavigate: (view: any) => void;
  onSearch: (query: string) => void;
  onCategorySelect: (id: string | 'all') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  categories, 
  selectedCategoryId,
  onSearch,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] shadow-2xl">
      {/* شريط تمييز علوي للتأكد من عمل التحديث */}
      <div className="bg-orange-600 h-1 w-full"></div>
      
      <div className="bg-white/95 backdrop-blur-md border-b border-orange-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              to="/"
              className="text-2xl md:text-4xl font-black tracking-tighter flex items-center gap-3 group"
            >
              <div className="bg-orange-500 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-100">
                <span className="text-2xl text-white">🥗</span>
              </div>
              <span className="text-orange-500">فاقوس <span className="text-slate-900">ستور</span></span>
            </Link>
            
            {/* Desktop Search */}
            <div className="hidden lg:block relative flex-grow max-w-xl mx-12">
              <input 
                type="text" 
                placeholder="ابحث عن المنتجات الطازجة..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-6 pr-14 py-3.5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-bold"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <NavLink 
                to="/admin/products"
                className={({isActive}) => `hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${isActive ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                ⚙️ لوحة الإدارة
              </NavLink>
              
              <NavLink 
                to="/cart"
                className={({isActive}) => `p-3.5 rounded-2xl transition-all relative ${isActive ? 'bg-orange-500 text-white shadow-xl' : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-500'}`}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white animate-bounce">
                    {cartCount}
                  </span>
                )}
              </NavLink>

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-3 bg-slate-50 text-slate-600 rounded-2xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Categories Nav */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-t border-orange-50 pt-3">
            <NavLink
              to="/"
              end
              className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${isActive && selectedCategoryId === 'all' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'}`}
            >
              جميع الأصناف
            </NavLink>
            {categories.map(cat => (
              <NavLink
                key={cat.id}
                to={`/category/${cat.id}`}
                className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${isActive ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'}`}
              >
                {cat.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-orange-50 p-6 space-y-4 animate-fadeIn shadow-2xl">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-slate-700 bg-slate-50">🏠 الرئيسية</Link>
          <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-slate-700 bg-slate-50">🛒 سلة التسوق</Link>
          <Link to="/admin/products" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-white bg-slate-900">⚙️ الإدارة</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
