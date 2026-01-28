
import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';

interface CategoryPageViewProps {
  category: Category;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
}

// Map common Arabic color names to CSS classes or hex codes for visual swatches
const COLOR_MAP: Record<string, string> = {
  'أسود': '#000000',
  'أبيض': '#FFFFFF',
  'أحمر': '#EF4444',
  'أزرق': '#3B82F6',
  'أخضر': '#10B981',
  'أصفر': '#F59E0B',
  'رمادي': '#9CA3AF',
  'وردي': '#EC4899',
  'بنفسجي': '#8B5CF6',
  'بني': '#78350F',
  'فضي': '#E5E7EB',
  'ذهبي': '#D4AF37'
};

const CategoryPageView: React.FC<CategoryPageViewProps> = ({ 
  category, 
  products, 
  onAddToCart, 
  onViewProduct, 
  wishlist, 
  onToggleFavorite,
  onBack 
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // States for filters
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Extract available filter options from current category products
  const categoryProducts = useMemo(() => products.filter(p => p.categoryId === category.id), [products, category.id]);
  
  const filterOptions = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    let maxPrice = 0;

    categoryProducts.forEach(p => {
      p.colors?.forEach(c => colors.add(c));
      p.sizes?.forEach(s => sizes.add(s));
      if (p.price > maxPrice) maxPrice = p.price;
    });

    return {
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      maxPrice: Math.ceil(maxPrice)
    };
  }, [categoryProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = categoryProducts.filter(p => {
      const matchesPrice = p.price >= priceRange.min && p.price <= (priceRange.max || Infinity);
      const matchesColor = selectedColors.length === 0 || (p.colors?.some(c => selectedColors.includes(c)));
      const matchesSize = selectedSizes.length === 0 || (p.sizes?.some(s => selectedSizes.includes(s)));
      const matchesStock = !onlyInStock || p.stockQuantity > 0;
      
      return matchesPrice && matchesColor && matchesSize && matchesStock;
    });

    switch (sortBy) {
      case 'price-low':
        return result.sort((a, b) => a.price - b.price);
      case 'price-high':
        return result.sort((a, b) => b.price - a.price);
      default:
        return result.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [categoryProducts, sortBy, priceRange, selectedColors, selectedSizes, onlyInStock]);

  const clearFilters = () => {
    setPriceRange({ min: 0, max: filterOptions.maxPrice });
    setSelectedColors([]);
    setSelectedSizes([]);
    setOnlyInStock(false);
  };

  const removeColor = (color: string) => setSelectedColors(prev => prev.filter(c => c !== color));
  const removeSize = (size: string) => setSelectedSizes(prev => prev.filter(s => s !== size));

  const hasActiveFilters = selectedColors.length > 0 || selectedSizes.length > 0 || onlyInStock || priceRange.min > 0 || (priceRange.max < filterOptions.maxPrice && priceRange.max > 0);

  const FilterSidebar = () => (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="font-black text-gray-900 text-lg">تصفية حسب</h3>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">إعادة ضبط</button>
        )}
      </div>

      {/* Availability Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">التوفر</h4>
        <button 
          onClick={() => setOnlyInStock(!onlyInStock)}
          className="flex items-center justify-between w-full group"
        >
          <span className={`text-sm font-bold transition ${onlyInStock ? 'text-indigo-600' : 'text-gray-600 group-hover:text-gray-900'}`}>القطع المتوفرة فقط</span>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${onlyInStock ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${onlyInStock ? 'right-6' : 'right-1'}`}></div>
          </div>
        </button>
      </div>

      {/* Price Range Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">الميزانية (ر.س)</h4>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">من</span>
            <input 
              type="number" 
              value={priceRange.min || ''}
              onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all"
              placeholder="0"
            />
          </div>
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">إلى</span>
            <input 
              type="number" 
              value={priceRange.max || ''}
              onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all"
              placeholder={filterOptions.maxPrice.toString()}
            />
          </div>
        </div>
      </div>

      {/* Colors Swatches Section */}
      {filterOptions.colors.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">اللون</h4>
          <div className="grid grid-cols-4 gap-3">
            {filterOptions.colors.map(color => {
              const hex = COLOR_MAP[color] || '#CCCCCC';
              const isSelected = selectedColors.includes(color);
              return (
                <button
                  key={color}
                  title={color}
                  onClick={() => setSelectedColors(prev => isSelected ? prev.filter(c => c !== color) : [...prev, color])}
                  className="group flex flex-col items-center gap-1"
                >
                  <div 
                    className={`w-10 h-10 rounded-full border-4 transition-all flex items-center justify-center relative ${isSelected ? 'border-indigo-600 scale-110 shadow-lg' : 'border-white shadow-sm group-hover:border-gray-100'}`}
                    style={{ backgroundColor: hex }}
                  >
                    {isSelected && (
                      <svg className={`w-4 h-4 ${hex === '#FFFFFF' ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes Section */}
      {filterOptions.sizes.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">المقاس</h4>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sizes.map(size => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSizes(prev => isSelected ? prev.filter(s => s !== size) : [...prev, size])}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${isSelected ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-100'}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fadeIn space-y-10">
      {/* Header Path */}
      <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-600">تسوق حسب الفئة</span>
      </nav>

      {/* Visual Hero Header */}
      <div className="relative overflow-hidden rounded-[4rem] bg-indigo-600 p-12 md:p-20 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
            {category.name}
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl font-bold max-w-lg leading-relaxed opacity-80">
            اكتشف أحدث تشكيلة من منتجات {category.name} المختارة بعناية لتناسب ذوقك الرفيع.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-xs font-black">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {filteredAndSortedProducts.length} منتج حصري
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 sticky top-28">
          <FilterSidebar />
        </aside>

        <div className="flex-grow space-y-8 w-full">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            
            {/* Active Chips (Dynamic) */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 active:scale-95 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                فلاتر متقدمة
              </button>

              <div className="hidden lg:flex flex-wrap items-center gap-2">
                {selectedColors.map(color => (
                  <button key={color} onClick={() => removeColor(color)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black group hover:bg-red-50 hover:text-red-600 transition">
                    <span>{color}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ))}
                {selectedSizes.map(size => (
                  <button key={size} onClick={() => removeSize(size)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black group hover:bg-red-50 hover:text-red-600 transition">
                    <span>المقاس: {size}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ))}
                {onlyInStock && (
                  <button onClick={() => setOnlyInStock(false)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black group hover:bg-red-50 hover:text-red-600 transition">
                    <span>متوفر فقط</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">الترتيب حسب:</span>
              <div className="relative w-full sm:w-64">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white px-6 py-3 rounded-2xl outline-none text-sm font-black text-gray-700 border border-gray-100 shadow-sm focus:border-indigo-300 transition appearance-none"
                >
                  <option value="newest">وصل حديثاً</option>
                  <option value="price-low">السعر: تصاعدي</option>
                  <option value="price-high">السعر: تنازلي</option>
                </select>
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Grid or Empty State */}
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredAndSortedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  category={category.name}
                  onAddToCart={() => onAddToCart(product)} 
                  onView={() => onViewProduct(product)}
                  isFavorite={wishlist.includes(product.id)}
                  onToggleFavorite={() => onToggleFavorite(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">لم نجد أي نتائج</h3>
                <p className="text-slate-400 font-bold max-w-xs mx-auto">جرب تغيير الفلاتر أو إعادة ضبط البحث للوصول لما تبحث عنه.</p>
              </div>
              <button onClick={clearFilters} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100">إعادة ضبط كافة الفلاتر</button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl animate-slideRight flex flex-col rounded-r-[3rem]">
            <div className="p-8 bg-white border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
                <h3 className="font-black text-2xl text-gray-900">تصفية المنتجات</h3>
              </div>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-slate-50 rounded-full transition text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
              <FilterSidebar />
            </div>

            <div className="p-8 bg-slate-50 border-t border-gray-100 flex flex-col gap-4">
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 active:scale-95 transition"
              >
                عرض النتائج ({filteredAndSortedProducts.length})
              </button>
              <button onClick={clearFilters} className="text-center text-sm font-black text-slate-400 hover:text-indigo-600 transition">إعادة تعيين الكل</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        @keyframes slideRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideRight { animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default CategoryPageView;
