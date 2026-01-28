
import React, { useState } from 'react';
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
  cartCount, 
  wishlistCount,
  currentView, 
  categories, 
  selectedCategoryId,
  onNavigate, 
  onSearch,
  onCategorySelect
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatsOpen, setIsCatsOpen] = useState(false);

  const handleCategoryClick = (id: string | 'all') => {
    onCategorySelect(id);
    setIsCatsOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <h1 
            onClick={() => { onNavigate('store'); onCategorySelect('all'); }}
            className="text-2xl font-black text-indigo-600 cursor-pointer select-none tracking-tighter"
          >
            ELITE<span className="text-slate-900">STORE</span>
          </h1>
          
          <nav className="hidden lg:flex items-center gap-2">
            <button 
              onClick={() => { onNavigate('store'); onCategorySelect('all'); }}
              className={`px-4 py-2 rounded-xl text-sm transition font-bold ${currentView === 'store' && selectedCategoryId === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
            >
              الرئيسية
            </button>
            
            <div className="relative group">
              <button 
                onMouseEnter={() => setIsCatsOpen(true)}
                className={`px-4 py-2 rounded-xl text-sm transition font-bold flex items-center gap-1 ${selectedCategoryId !== 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                التصنيفات
                <svg className={`w-4 h-4 transition-transform duration-200 ${isCatsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                onMouseLeave={() => setIsCatsOpen(false)}
                className={`absolute top-full right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 transition-all duration-200 transform origin-top ${isCatsOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                <button 
                  onClick={() => handleCategoryClick('all')}
                  className="w-full text-right px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  كل المنتجات
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-right px-6 py-2.5 text-sm font-bold transition hover:bg-indigo-50 hover:text-indigo-600 ${selectedCategoryId === cat.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onNavigate('admin')}
              className={`px-4 py-2 rounded-xl text-sm transition font-bold ${currentView === 'admin' || currentView === 'admin-form' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
            >
              لوحة الإدارة
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="relative hidden md:block flex-grow max-w-md mx-4">
          <input 
            type="text" 
            placeholder="ابحث عن منتجك المفضل..." 
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm font-medium"
          />
          <svg className="absolute right-4 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Wishlist Icon */}
          <button 
            onClick={() => onNavigate('wishlist')}
            className={`relative p-2.5 rounded-xl transition group ${currentView === 'wishlist' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
          >
            <svg className="w-6 h-6" fill={currentView === 'wishlist' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button 
            onClick={() => onNavigate('cart')}
            className={`relative p-2.5 rounded-xl transition group ${currentView === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => onNavigate('auth')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-indigo-600 transition shadow-lg active:scale-95"
          >
            <span>دخول</span>
          </button>

          {/* Mobile Menu Toggle */}
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

      {/* Mobile Navigation Menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-[80vh] border-t border-gray-100' : 'max-h-0'}`}>
        <div className="p-4 space-y-4 bg-white font-bold">
           <button onClick={() => { onNavigate('store'); onCategorySelect('all'); setIsMenuOpen(false); }} className="w-full text-right p-2 hover:bg-gray-50 rounded-lg">الرئيسية</button>
           <button onClick={() => { onNavigate('wishlist'); setIsMenuOpen(false); }} className="w-full text-right p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between">
            المفضلة
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">{wishlistCount}</span>
           </button>
           <button onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }} className="w-full text-right p-2 hover:bg-gray-50 rounded-lg text-indigo-600">لوحة الإدارة</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
