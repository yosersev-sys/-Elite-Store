
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import CategorySection from './CategorySection';

interface StoreViewProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: string | 'all';
  onCategorySelect: (id: string | 'all') => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  onToggleFavorite: (id: string) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ 
  products, 
  categories, 
  searchQuery, 
  selectedCategoryId,
  onCategorySelect,
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  const productsListRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // فلاتر السعر
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // دالة مخصصة للتمرير البطيء جداً
  const slowScrollTo = (targetY: number, duration: number) => {
    const startY = window.pageYOffset;
    const diff = targetY - startY;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percent = Math.min(progress / duration, 1);
      const ease = percent < 0.5 
        ? 2 * percent * percent 
        : -1 + (4 - 2 * percent) * percent;

      window.scrollTo(0, startY + diff * ease);
      if (progress < duration) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    if (selectedCategoryId !== 'all' || searchQuery || minPrice || maxPrice) {
      const timer = setTimeout(() => {
        const element = document.getElementById('products-list');
        if (element) {
          const headerOffset = 160;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          slowScrollTo(offsetPosition, 1000);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCategoryId, searchQuery]);

  // منطق التصفية المطور ليشمل السعر
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      
      const price = p.price;
      const min = minPrice === '' ? 0 : parseFloat(minPrice);
      const max = maxPrice === '' ? Infinity : parseFloat(maxPrice);
      const matchesPrice = price >= min && price <= max;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchQuery, selectedCategoryId, minPrice, maxPrice]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'منتجاتنا الحصرية';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'منتجات القسم';
  }, [categories, selectedCategoryId]);

  const resetFilters = () => {
    onCategorySelect('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = selectedCategoryId !== 'all' || minPrice !== '' || maxPrice !== '';

  return (
    <div className="space-y-12 md:space-y-20 animate-fadeIn">
      {/* السلايدر الرئيسي */}
      <Slider />
      
      {/* شبكة اختيار الأقسام */}
      <CategorySection 
        categories={categories} 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={onCategorySelect} 
      />

      {/* منطقة عرض المنتجات */}
      <div className="space-y-8 md:space-y-12" id="products-list" ref={productsListRef}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-gray-100 pt-10 md:pt-16">
          <div className="space-y-1 md:space-y-2">
             <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-gray-400 text-sm md:text-lg font-bold">
               {filteredProducts.length} منتج متاح
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             {hasActiveFilters && (
               <button 
                onClick={resetFilters}
                className="text-rose-500 font-black text-xs px-4 py-2 hover:bg-rose-50 rounded-xl transition"
               >
                 إعادة ضبط الفلاتر ✕
               </button>
             )}
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
             >
               <span>{showFilters ? 'إخفاء الفلاتر' : 'تصفية النتائج'}</span>
               <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
               </svg>
             </button>
          </div>
        </div>

        {/* لوحة الفلاتر المتقدمة */}
        {showFilters && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-900/5 animate-slideDown grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">نطاق السعر (ج.م)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  placeholder="من" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                />
                <span className="text-slate-300">إلى</span>
                <input 
                  type="number" 
                  placeholder="إلى" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">القسم المختار</label>
              <select 
                value={selectedCategoryId}
                onChange={(e) => onCategorySelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm text-slate-700 cursor-pointer appearance-none"
              >
                <option value="all">كل الأقسام</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-xs">✨</div>
                  <p className="text-[10px] font-black text-emerald-800 leading-tight">نصيحة: استخدم نطاق السعر للوصول لمنتجات تناسب ميزانيتك في فاقوس.</p>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-10">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              category={categories.find(c => c.id === product.categoryId)?.name || 'عام'}
              onAddToCart={() => onAddToCart(product)} 
              onView={() => onViewProduct(product)}
              isFavorite={wishlist.includes(product.id)}
              onToggleFavorite={() => onToggleFavorite(product.id)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 md:py-32 bg-gray-50 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-gray-200">
             <div className="text-4xl md:text-6xl mb-4">🔍</div>
             <p className="text-gray-400 font-black text-base md:text-xl">عذراً، لم نجد منتجات تطابق اختيارك وفلاتر البحث.</p>
             <button 
               onClick={resetFilters}
               className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black transition-transform active:scale-95"
             >
               عرض كل المنتجات
             </button>
          </div>
        )}
      </div>

      <div className="pt-10">
        <BrandsSection />
      </div>
    </div>
  );
};

export default StoreView;
