
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import CategorySection from './CategorySection';
import AboutSection from './AboutSection';
import BestSellers from './BestSellers';

interface StoreViewProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedCategoryId: string | 'all';
  onCategorySelect: (id: string | 'all') => void;
  onAddToCart: (product: Product, rect?: DOMRect) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  onToggleFavorite: (id: string) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ 
  products, 
  categories, 
  searchQuery, 
  onSearch,
  selectedCategoryId,
  onCategorySelect,
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  const productsListRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const slowScrollTo = (targetY: number, duration: number) => {
    window.dispatchEvent(new CustomEvent('force-header-show'));
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
  }, [selectedCategoryId, searchQuery, minPrice, maxPrice]);

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

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'منتجاتنا الحصرية';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'منتجات القسم';
  }, [categories, selectedCategoryId]);

  const resetFilters = () => {
    onCategorySelect('all');
    setMinPrice('');
    setMaxPrice('');
    onSearch('');
    setVisibleCount(12);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="space-y-12 md:space-y-20 animate-fadeIn">
      <Slider />
      
      <CategorySection 
        categories={categories} 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={onCategorySelect} 
      />

      {/* قسم الأكثر مبيعاً يظهر فقط في الصفحة الرئيسية وبدون بحث */}
      {selectedCategoryId === 'all' && !searchQuery && products.length > 0 && (
        <BestSellers 
          products={products}
          onAddToCart={onAddToCart}
          onViewProduct={onViewProduct}
          wishlist={wishlist}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      <div className="space-y-8 md:space-y-12" id="products-list" ref={productsListRef}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-gray-100 pt-10 md:pt-16">
          <div className="space-y-1 md:space-y-2">
             <h2 className="text-2xl md:text-4xl font-black text-gray-900">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-gray-400 text-sm md:text-lg font-bold">
               {products.length === 0 ? 'جاري تحديث المخزن...' : `عرض ${displayedProducts.length} من أصل ${filteredProducts.length} منتج`}
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             {(selectedCategoryId !== 'all' || minPrice || maxPrice || searchQuery) && (
               <button onClick={resetFilters} className="text-rose-500 font-black text-xs px-4 py-2 hover:bg-rose-50 rounded-xl transition">إعادة ضبط ✕</button>
             )}
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
             >
               <span>الفلترة</span>
               <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
               </svg>
             </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-slideUp grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase">نطاق السعر</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="من" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-sm" />
                <input type="number" placeholder="إلى" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-sm" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase">القسم</label>
              <select value={selectedCategoryId} onChange={e => onCategorySelect(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-black text-sm">
                <option value="all">كل الأقسام</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
               <button onClick={resetFilters} className="w-full py-3 rounded-xl font-black text-xs bg-slate-100 text-slate-500 hover:bg-rose-50 transition">مسح الفلاتر</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-10">
          {products.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
            ))
          ) : (
            displayedProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                category={categories.find(c => c.id === product.categoryId)?.name || 'عام'}
                onAddToCart={onAddToCart} 
                onView={() => onViewProduct(product)}
                isFavorite={wishlist.includes(product.id)}
                onToggleFavorite={() => onToggleFavorite(product.id)}
              />
            ))
          )}
        </div>

        {filteredProducts.length > visibleCount && (
          <div className="flex justify-center pt-8">
            <button 
              onClick={loadMore}
              className="bg-white border-2 border-emerald-500 text-emerald-600 px-12 py-4 rounded-[2rem] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-xl active:scale-95"
            >
              عرض المزيد من المنتجات 🛍️
            </button>
          </div>
        )}
      </div>

      <BrandsSection />
      <AboutSection />
    </div>
  );
};

export default StoreView;
