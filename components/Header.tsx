
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
  wishlistCount,
  categories, 
  selectedCategoryId,
  onSearch,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-[100] border-b border-orange-100">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link 
              to="/"
              className="text-2xl md:text-3xl font-black cursor-pointer select-none tracking-tighter flex items-center gap-2 group"
            >
              <div className="bg-orange-500 p-2 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-200">
                <span className="text-2xl text-white">🛍️</span>
              </div>
              <span className="text-orange-500">فاقوس <span className="text-slate-900">ستور</span></span>
            </Link>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-2">
              <NavLink 
                to="/"
                end
                className={({isActive}) => `px-5 py-2.5 rounded-2xl text-sm transition-all font-black ${isActive && selectedCategoryId === 'all' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                الرئيسية
              </NavLink>
              <NavLink 
                to="/wishlist"
                className={({isActive}) => `px-5 py-2.5 rounded-2xl text-sm transition-all font-black ${isActive ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                المفضلة
              </NavLink>
              <NavLink 
                to="/admin/products"
                className={({isActive}) => `px-5 py-2.5 rounded-2xl text-sm transition-all font-black ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                لوحة الإدارة
              </NavLink>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="relative hidden lg:block flex-grow max-w-lg mx-8">
            <input 
              type="text" 
              placeholder="ابحث في فاقوس ستور..." 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-6 pr-14 py-3 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm font-bold shadow-inner"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <NavLink 
              to="/cart"
              className={({isActive}) => `p-3 rounded-2xl transition-all relative group ${isActive ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-500'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </NavLink>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-orange-50 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isMenuOpen ? "M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-3 border-t border-orange-50">
          <NavLink
            to="/"
            end
            className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${
              isActive && selectedCategoryId === 'all' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'
            }`}
          >
            الكل
          </NavLink>
          {categories.map(cat => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.id}`}
              className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${
                isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-orange-200'
              }`}
            >
              {cat.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden border-t border-orange-50 bg-white p-6 space-y-3 animate-fadeIn shadow-2xl">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-slate-700 bg-slate-50 hover:bg-orange-50">الرئيسية</Link>
          <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-slate-700 bg-slate-50 hover:bg-orange-50">المفضلة</Link>
          <Link to="/admin/products" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-2xl font-black text-white bg-slate-900">الإدارة</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
