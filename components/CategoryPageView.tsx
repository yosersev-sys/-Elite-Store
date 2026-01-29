
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

  // تحديد ألوان الهوية البصرية بناءً على القسم
  const theme = useMemo(() => {
    if (category.id.includes('electronics')) return { gradient: 'from-blue-600 to-indigo-700', text: 'text-blue-600', bg: 'bg-blue-600' };
    if (category.id.includes('fashion')) return { gradient: 'from-rose-500 to-pink-600', text: 'text-rose-600', bg: 'bg-rose-600' };
    if (category.id.includes('home')) return { gradient: 'from-orange-500 to-amber-600', text: 'text-orange-600', bg: 'bg-orange-600' };
    if (category.id.includes('beauty')) return { gradient: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-600' };
    return { gradient: 'from-slate-700 to-slate-900', text: 'text-slate-900', bg: 'bg-slate-900' };
  }, [category.id]);

  return (
    <div className="animate-fadeIn space-y-16 pb-20">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="opacity-20">/</span>
        <span className="text-slate-300">الأقسام</span>
        <span className="opacity-20">/</span>
        <span className={`${theme.text} font-black`}>{category.name}</span>
      </nav>

      {/* Hero Landing Section */}
      <section className={`relative overflow-hidden rounded-[4rem] bg-gradient-to-br ${theme.gradient} p-12 md:p-24 text-white shadow-2xl`}>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
           <svg className="w-full h-full scale-150 rotate-12" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" /></svg>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="max-w-3xl space-y-8">
            <div className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-[10px] font-black uppercase tracking-widest">
              مجموعة حصرية 2024
            </div>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none animate-slideUp">
              {category.name}
            </h1>
            <p className="text-white/80 text-lg md:text-2xl font-bold leading-relaxed max-w-xl">
               نقدم لك تشكيلة النخبة المختارة بعناية في قسم {category.name}. جودة لا تضاهى وتصاميم تواكب العصر.
            </p>
            <div className="flex gap-4 pt-4">
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                  <div className="text-3xl font-black">{categoryProducts.length}</div>
                  <div className="text-[10px] font-black uppercase opacity-60">منتج متاح</div>
               </div>
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                  <div className="text-3xl font-black">4.9/5</div>
                  <div className="text-[10px] font-black uppercase opacity-60">تقييم العملاء</div>
               </div>
            </div>
          </div>

          <button 
            onClick={onBack}
            className="group hidden lg:flex flex-col items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/20 transition-all duration-500 shadow-xl"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:-translate-x-3 transition-transform">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <span className="font-black text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition">العودة للرئيسية</span>
          </button>
        </div>
      </section>

      {/* Toolbar: Sorting & Title */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm sticky top-24 z-30">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
           <span className={`w-3 h-10 ${theme.bg} rounded-full`}></span>
           تصفح المعروضات
        </h3>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ترتيب:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none px-8 py-4 rounded-2xl outline-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-50 transition cursor-pointer"
          >
            <option value="newest">وصل حديثاً ✨</option>
            <option value="price-low">السعر: من الأقل 💰</option>
            <option value="price-high">السعر: من الأعلى 💎</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
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
        <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
           <p className="text-slate-400 font-black text-2xl mb-6">لا توجد منتجات متوفرة حالياً في هذا القسم</p>
           <button onClick={onBack} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 transition">تصفح أقسام أخرى</button>
        </div>
      )}

      {/* Newsletter / CTA for the category */}
      <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)]"></div>
         <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h3 className="text-4xl font-black tracking-tighter">كن أول من يعرف بجديد قسم {category.name}</h3>
            <p className="text-slate-400 text-lg font-bold">اشترك في قائمتنا البريدية للحصول على عروض حصرية وخصومات تصل إلى 30% على منتجات هذا القسم.</p>
            <div className="flex flex-col sm:flex-row gap-4">
               <input placeholder="بريدك الإلكتروني..." className="flex-grow bg-white/10 border border-white/20 rounded-2xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/50 font-bold" />
               <button className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 hover:text-white transition">اشترك الآن</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CategoryPageView;
