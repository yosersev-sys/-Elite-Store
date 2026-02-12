
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  onCategorySelect
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm z-40 border-b border-green-50 sticky top-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link 
              to="/"
              onClick={() => onCategorySelect('all')}
              className="text-2xl font-black text-green-600 cursor-pointer select-none tracking-tighter flex items-center gap-2"
            >
              <span className="text-3xl">🛍️</span>
              <span>فاقوس <span className="text-slate-900">ستور</span></span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                to="/"
                className={`px-4 py-2 rounded-xl text-sm transition font-bold ${isActive('/') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
              >
                الرئيسية
              </Link>
              <Link 
                to="/wishlist"
                className={`px-4 py-2 rounded-xl text-sm transition font-bold ${isActive('/wishlist') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
              >
                مفضلاتي
              </Link>
              <Link 
                to="/admin"
                className={`px-4 py-2 rounded-xl text-sm transition font-bold ${location.pathname.startsWith('/admin') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
              >
                لوحة التحكم
              </Link>
            </nav>
          </div>

          <div className="relative hidden md:block flex-grow max-w-md mx-4">
            <input 
              type="text" 
              placeholder="ابحث عن خضروات، فواكه، أو معلبات..." 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-green-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition text-sm font-medium"
            />
            <svg className="absolute right-4 top-2.5 h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/wishlist" className={`p-2.5 rounded-xl transition relative ${isActive('/wishlist') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">{wishlistCount}</span>}
            </Link>

            <Link to="/cart" className={`p-2.5 rounded-xl transition relative ${isActive('/cart') ? 'bg-green-600 text-green-600' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">{cartCount}</span>}
            </Link>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onCategorySelect('all')}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCategoryId === 'all' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-green-50 hover:border-green-200'}`}
          >
            جميع الأصناف
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCategoryId === cat.id ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-green-50 hover:border-green-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
