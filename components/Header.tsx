
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
    <header className="bg-white shadow-md z-50 border-b border-orange-50 sticky top-0 w-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link 
              to="/"
              className="text-2xl font-black cursor-pointer select-none tracking-tighter flex items-center gap-2"
            >
              <span className="text-3xl">🛍️</span>
              <span className="text-orange-500">فاقوس <span className="text-slate-900">ستور</span></span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink 
                to="/"
                end
                className={({isActive}) => `px-4 py-2 rounded-xl text-sm transition font-bold ${isActive && selectedCategoryId === 'all' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                الرئيسية
              </NavLink>
              <NavLink 
                to="/wishlist"
                className={({isActive}) => `px-4 py-2 rounded-xl text-sm transition font-bold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                المفضلة
              </NavLink>
              <NavLink 
                to="/admin/products"
                className={({isActive}) => `px-4 py-2 rounded-xl text-sm transition font-bold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
              >
                لوحة الإدارة
              </NavLink>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block flex-grow max-w-md mx-4">
            <input 
              type="text" 
              placeholder="ابحث عن خضروات، فواكه، أو مواد غذائية..." 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition text-sm font-medium"
            />
            <svg className="absolute right-4 top-2.5 h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Icons & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <NavLink 
              to="/wishlist"
              className={({isActive}) => `p-2.5 rounded-xl transition relative group ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </NavLink>

            <NavLink 
              to="/cart"
              className={({isActive}) => `p-2.5 rounded-xl transition relative group ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'}`}
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
              className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Categories Navigation Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <NavLink
            to="/"
            end
            className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${
              isActive && selectedCategoryId === 'all'
              ? 'bg-orange-500 text-white shadow-lg' 
              : 'bg-white text-gray-400 border border-orange-50 hover:border-orange-200'
            }`}
          >
            جميع المحاصيل
          </NavLink>
          {categories.map(cat => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.id}`}
              className={({isActive}) => `whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${
                isActive
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-400 border border-orange-50 hover:border-orange-200'
              }`}
            >
              {cat.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-orange-50 bg-white p-4 space-y-2 animate-fadeIn">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-xl font-bold text-gray-700 hover:bg-orange-50 transition">الرئيسية</Link>
          <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-xl font-bold text-gray-700 hover:bg-orange-50 transition">مفضلاتي</Link>
          <Link to="/admin/products" onClick={() => setIsMenuOpen(false)} className="block w-full text-right p-4 rounded-xl font-bold text-gray-700 hover:bg-orange-50 transition">لوحة التحكم</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
