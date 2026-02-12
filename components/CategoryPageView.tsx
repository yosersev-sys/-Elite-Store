
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const productsGridRef = useRef<HTMLDivElement>(null);

  // التمرير التلقائي لشبكة المنتجات عند تحميل القسم
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productsGridRef.current) {
        // حساب الإزاحة لتكون الشبكة في منتصف الشاشة أو تحت الهيدر قليلاً
        const yOffset = -120; 
        const element = productsGridRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 800); // تأخير بسيط للسماح للأنيميشن بالبدء

    return () => clearTimeout(timer);
  }, [category.id]);

  const categoryProducts = useMemo(() => {
    let result = products.filter(p => p.categoryId === category.id);
    if (sortBy === 'price-low') return [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return [...result].sort((a, b) => b.price - a.price);
    return [...result].sort((a, b) => b.createdAt - a.createdAt);
  }, [products, category.id, sortBy]);

  const getTheme = () => {
    const name = category.name;
    if (name.includes('خضر')) return { color: 'text-emerald-600', bg: 'bg-emerald-600', gradient: 'from-emerald-500 to-green-700', icon: '🥦' };
    if (name.includes('فواك')) return { color: 'text-rose-600', bg: 'bg-rose-600', gradient: 'from-rose-500 to-red-700', icon: '🍎' };
    if (name.includes('سوبر')) return { color: 'text-indigo-600', bg: 'bg-indigo-600', gradient: 'from-indigo-500 to-blue-700', icon: '🛒' };
    if (name.includes('ألبان')) return { color: 'text-sky-600', bg: 'bg-sky-600', gradient: 'from-sky-500 to-blue-600', icon: '🥛' };
    return { color: 'text-slate-600', bg: 'bg-slate-900', gradient: 'from-slate-700 to-slate-900', icon: '📦' };
  };

  const theme = getTheme();

  return (
    <div className="animate-fadeIn space-y-12 pb-20">
      {/* 1. Header Section */}
      <section className={`relative overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-br ${theme.gradient} p-8 md:p-20 text-white shadow-2xl transition-all duration-700`}>
        <div className="relative z-10 space-y-4 md:space-y-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition font-black text-xs uppercase tracking-widest"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            الرئيسية
          </button>
          <div className="flex items-center gap-4">
            <span className="text-4xl md:text-6xl animate-bounce">{theme.icon}</span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter">{category.name}</h1>
          </div>
          <p className="text-white/80 text-sm md:text-xl font-bold max-w-xl">اكتشف أجود أنواع {category.name} في فاقوس ستور، نضمن لك الطزاجة والجودة العالية يومياً.</p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </section>

      {/* 2. Controls & Filter Bar - سيعمل كنقطة مرجع للتمرير */}
      <div 
        ref={productsGridRef}
        className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-24 z-30 transition-all duration-500"
      >
        <div className="flex items-center gap-4">
          <div className={`w-3 h-8 ${theme.bg} rounded-full`}></div>
          <p className="font-black text-slate-800 text-lg md:text-xl">متوفر حالياً ({categoryProducts.length}) منتج</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ترتيب حسب:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-grow md:flex-grow-0 bg-slate-50 border-none px-6 py-3 rounded-xl outline-none font-black text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          >
            <option value="newest">الأحدث وصولاً</option>
            <option value="price-low">السعر: من الأقل</option>
            <option value="price-high">السعر: من الأعلى</option>
          </select>
        </div>
      </div>

      {/* 3. Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {categoryProducts.map(product => (
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
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
           <span className="text-6xl block mb-6 opacity-20">📦</span>
           <p className="text-slate-400 font-black text-2xl">هذا القسم لا يحتوي على منتجات حالياً</p>
           <button onClick={onBack} className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black">العودة للمتجر</button>
        </div>
      )}
    </div>
  );
};

export default CategoryPageView;
