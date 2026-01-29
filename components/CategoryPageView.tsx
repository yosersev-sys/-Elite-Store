
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
    let result = products.filter(p => p.categoryId === category.id);
    if (sortBy === 'price-low') return [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return [...result].sort((a, b) => b.price - a.price);
    return [...result].sort((a, b) => b.createdAt - a.createdAt);
  }, [products, category.id, sortBy]);

  // ألوان وهوية مخصصة لكل قسم
  const theme = useMemo(() => {
    if (category.id.includes('electronics')) return { gradient: 'from-blue-600 to-indigo-800', text: 'text-blue-600', bg: 'bg-blue-600', icon: '⚡' };
    if (category.id.includes('fashion')) return { gradient: 'from-pink-500 to-rose-700', text: 'text-rose-600', bg: 'bg-rose-600', icon: '✨' };
    if (category.id.includes('home')) return { gradient: 'from-amber-500 to-orange-700', text: 'text-orange-600', bg: 'bg-orange-600', icon: '🏠' };
    if (category.id.includes('beauty')) return { gradient: 'from-emerald-500 to-teal-700', text: 'text-emerald-600', bg: 'bg-emerald-600', icon: '💄' };
    return { gradient: 'from-slate-700 to-slate-900', text: 'text-slate-900', bg: 'bg-slate-900', icon: '📦' };
  }, [category.id]);

  return (
    <div className="animate-fadeIn space-y-20 pb-24">
      {/* التنقل العلوي (Breadcrumbs) */}
      <nav className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white p-4 rounded-2xl shadow-sm w-fit">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="opacity-20">/</span>
        <span className="text-slate-300">أقسامنا المميزة</span>
        <span className="opacity-20">/</span>
        <span className={`${theme.text}`}>{category.name}</span>
      </nav>

      {/* Hero Section - الصفحة كأنها موقع مستقل */}
      <section className={`relative overflow-hidden rounded-[4rem] bg-gradient-to-br ${theme.gradient} p-12 md:p-24 text-white shadow-2xl animate-slideUp`}>
        {/* أشكال زخرفية في الخلفية */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
           <svg className="w-full h-full scale-150 rotate-12" viewBox="0 0 100 100" fill="none">
             <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
           </svg>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-xs font-black uppercase tracking-widest">
              {theme.icon} مجموعة حصرية 2024
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.85]">
              {category.name}
            </h1>
            
            <p className="text-white/80 text-xl md:text-3xl font-bold leading-relaxed max-w-xl">
               مجموعة النخبة المختارة بعناية في قسم {category.name}. جودة عالمية بين يديك.
            </p>

            <div className="flex flex-wrap gap-4 pt-6">
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 flex flex-col">
                  <span className="text-4xl font-black">{categoryProducts.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">منتج فاخر</span>
               </div>
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 flex flex-col">
                  <span className="text-4xl font-black">4.9/5</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">تقييم العملاء</span>
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

      {/* شريط التحكم (Toolbar) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm sticky top-24 z-30 backdrop-blur-md bg-white/90">
        <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4 tracking-tighter">
           <span className={`w-3 h-12 ${theme.bg} rounded-full`}></span>
           اكتشف التشكيلة
        </h3>
        
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">ترتيب حسب:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none px-8 py-5 rounded-[2rem] outline-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-50 transition cursor-pointer shadow-inner"
          >
            <option value="newest">وصل حديثاً ✨</option>
            <option value="price-low">السعر: من الأقل 💰</option>
            <option value="price-high">السعر: من الأعلى 💎</option>
          </select>
        </div>
      </div>

      {/* شبكة المنتجات */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
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
        <div className="text-center py-48 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner flex flex-col items-center">
           <div className="text-8xl mb-8 opacity-20">📦</div>
           <p className="text-slate-400 font-black text-3xl mb-10 tracking-tighter">هذا القسم قيد التجهيز حالياً</p>
           <button onClick={onBack} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-600 transition tracking-tighter">العودة للمتجر الرئيسي</button>
        </div>
      )}

      {/* ترويج سفلي خاص بالقسم */}
      {categoryProducts.length > 0 && (
         <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
               <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight italic">
                 هل تبحث عن الأفضل في {category.name}؟
               </h3>
               <p className="text-slate-400 text-xl font-bold leading-relaxed">فريقنا يختار لك المنتجات بمعايير النخبة لضمان رضاك التام.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button className="bg-white text-slate-900 px-14 py-6 rounded-[2.5rem] font-black text-xl hover:scale-105 transition-all shadow-2xl">تحدث مع خبير 💬</button>
                  <button onClick={onBack} className="bg-slate-800 text-white px-14 py-6 rounded-[2.5rem] font-black text-xl hover:bg-slate-700 transition border border-slate-700">تصفح أقسام أخرى</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CategoryPageView;
