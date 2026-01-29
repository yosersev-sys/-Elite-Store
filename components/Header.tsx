
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

  return (
    <header className="bg-white shadow-sm z-40 border-b border-gray-100 sticky top-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 
              onClick={() => { onNavigate('store'); onCategorySelect('all'); }}
              className="text-2xl font-black text-indigo-600 cursor-pointer select-none tracking-tighter"
            >
              ELITE<span className="text-slate-900">STORE</span>
            </h1>
            
            <nav className="hidden lg:flex items-center gap-1">
              <button 
                onClick={() => onNavigate('store')}
                className={`px-4 py-2 rounded-xl text-sm transition font-bold ${currentView === 'store' && selectedCategoryId === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
              >
                الرئيسية
              </button>
              <button 
                onClick={() => onNavigate('wishlist')}
                className={`px-4 py-2 rounded-xl text-sm transition font-bold ${currentView === 'wishlist' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
              >
                المفضلة
              </button>
            </nav>
          </div>

          <div className="relative hidden md:block flex-grow max-w-md mx-4">
            <input 
              type="text" 
              placeholder="ابحث عن الجودة..." 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm font-medium"
            />
            <svg className="absolute right-4 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('wishlist')}
              className={`p-2.5 rounded-xl transition relative group ${currentView === 'wishlist' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => onNavigate('cart')}
              className={`p-2.5 rounded-xl transition relative group ${currentView === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
            
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

        {/* Categories Chips - تفتح في رابط خاص */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onCategorySelect('all')}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${
              selectedCategoryId === 'all' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'
            }`}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${
                selectedCategoryId === cat.id 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white p-4 space-y-2 animate-fadeIn">
          <button onClick={() => { onNavigate('store'); setIsMenuOpen(false); }} className="w-full text-right p-3 rounded-xl font-bold text-gray-700 hover:bg-indigo-50">الرئيسية</button>
          <button onClick={() => { onNavigate('wishlist'); setIsMenuOpen(false); }} className="w-full text-right p-3 rounded-xl font-bold text-gray-700 hover:bg-indigo-50">المفضلة</button>
          <button onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }} className="w-full text-right p-3 rounded-xl font-bold text-gray-700 hover:bg-indigo-50">لوحة الإدارة</button>
        </div>
      )}
    </header>
  );
};

export default Header;
