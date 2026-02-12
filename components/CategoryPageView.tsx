
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

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    let result = products.filter(p => p.categoryId === category.id);
    if (sortBy === 'price-low') return [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return [...result].sort((a, b) => b.price - a.price);
    return [...result].sort((a, b) => b.createdAt - a.createdAt);
  }, [products, category?.id, sortBy]);

  const theme = useMemo(() => {
    if (!category) return { gradient: 'from-slate-700 to-slate-900', text: 'text-slate-900', bg: 'bg-slate-900', icon: '📦' };
    const id = category.id.toLowerCase();
    if (id.includes('electronics')) return { gradient: 'from-blue-600 to-indigo-800', text: 'text-blue-600', bg: 'bg-blue-600', icon: '⚡' };
    if (id.includes('fashion')) return { gradient: 'from-pink-500 to-rose-700', text: 'text-rose-600', bg: 'bg-rose-600', icon: '✨' };
    if (id.includes('home')) return { gradient: 'from-amber-500 to-orange-700', text: 'text-orange-600', bg: 'bg-orange-600', icon: '🏠' };
    if (id.includes('beauty')) return { gradient: 'from-emerald-500 to-teal-700', text: 'text-emerald-600', bg: 'bg-emerald-600', icon: '💄' };
    return { gradient: 'from-slate-700 to-slate-900', text: 'text-slate-900', bg: 'bg-slate-900', icon: '📦' };
  }, [category?.id]);

  if (!category) return null;

  return (
    <div className="animate-fadeIn space-y-12 md:space-y-20 pb-24">
      <nav className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm w-fit">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="opacity-20">/</span>
        <span className="text-slate-300">أقسامنا المميزة</span>
        <span className="opacity-20">/</span>
        <span className={`${theme.text}`}>{category.name}</span>
      </nav>

      <section className={`relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-gradient-to-br ${theme.gradient} p-8 md:p-24 text-white shadow-2xl animate-slideUp`}>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
           <svg className="w-full h-full scale-150 rotate-12" viewBox="0 0 100 100" fill="none">
             <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
           </svg>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 md:gap-16">
          <div className="max-w-3xl space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 md:gap-3 bg-white/20 backdrop-blur-md px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-white/30 text-[8px] md:text-xs font-black uppercase tracking-widest">
              {theme.icon} مجموعة حصرية {new Date().getFullYear()}
            </div>
            
            <h1 className="text-4xl md:text-7xl lg:text-[10rem] font-black tracking-tighter leading-[0.95]">
              {category.name}
            </h1>
            
            <p className="text-white/80 text-base md:text-3xl font-bold leading-relaxed max-w-xl">
               مجموعة النخبة المختارة بعناية في قسم {category.name}. جودة عالمية بين يديك.
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4 pt-4 md:pt-6">
               <div className="bg-white/10 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/20 flex flex-col">
                  <span className="text-2xl md:text-4xl font-black">{categoryProducts.length}</span>
                  <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest opacity-60">منتج فاخر</span>
               </div>
            </div>
          </div>

          <button 
            onClick={onBack}
            className="group hidden xl:flex flex-col items-center gap-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-12 rounded-[4rem] border border-white/20 transition-all duration-500 shadow-2xl"
          >
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:-translate-x-4 transition-transform">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
            </div>
            <span className="font-black text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition">العودة للرئيسية</span>
          </button>
        </div>
      </section>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm sticky top-24 z-30 backdrop-blur-md bg-white/90">
        <h3 className="text-xl md:text-3xl font-black text-slate-800 flex items-center gap-4 tracking-tighter">
           <span className={`w-2 h-8 md:w-3 md:h-12 ${theme.bg} rounded-full`}></span>
           تصفح المنتجات
        </h3>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-grow md:flex-grow-0 bg-slate-50 border-none px-6 md:px-8 py-3 md:py-5 rounded-xl md:rounded-[2rem] outline-none text-xs md:text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-50 transition cursor-pointer shadow-inner"
          >
            <option value="newest">وصل حديثاً ✨</option>
            <option value="price-low">السعر: من الأقل 💰</option>
            <option value="price-high">السعر: من الأعلى 💎</option>
          </select>
        </div>
      </div>

      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-12">
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
        <div className="text-center py-24 md:py-48 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner flex flex-col items-center px-6">
           <div className="text-6xl md:text-8xl mb-6 md:mb-8 opacity-20">📦</div>
           <p className="text-slate-400 font-black text-xl md:text-3xl mb-8 md:mb-10 tracking-tighter">هذا القسم قيد التجهيز حالياً</p>
           <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 md:px-12 md:py-5 rounded-xl md:rounded-[2rem] font-black text-base md:text-lg shadow-2xl hover:bg-indigo-600 transition tracking-tighter">العودة للمتجر الرئيسي</button>
        </div>
      )}
    </div>
  );
};

export default CategoryPageView;
