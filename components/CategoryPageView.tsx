
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

  // ألوان هوية بصرية لكل قسم
  const themeStyles = useMemo(() => {
    if (category.id.includes('electronics')) return { gradient: 'from-indigo-600 to-blue-500', accent: 'bg-indigo-600', text: 'text-indigo-600' };
    if (category.id.includes('fashion')) return { gradient: 'from-pink-600 to-rose-500', accent: 'bg-rose-600', text: 'text-rose-600' };
    if (category.id.includes('home')) return { gradient: 'from-amber-600 to-orange-500', accent: 'bg-orange-600', text: 'text-orange-600' };
    if (category.id.includes('beauty')) return { gradient: 'from-emerald-600 to-teal-500', accent: 'bg-emerald-600', text: 'text-emerald-600' };
    return { gradient: 'from-slate-800 to-slate-700', accent: 'bg-slate-800', text: 'text-slate-800' };
  }, [category.id]);

  return (
    <div className="animate-fadeIn space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="opacity-20">/</span>
        <span className="text-slate-300">أقسامنا</span>
        <span className="opacity-20">/</span>
        <span className={`${themeStyles.text} bg-slate-50 px-3 py-1 rounded-lg`}>{category.name}</span>
      </nav>

      {/* Hero Landing Section */}
      <section className={`relative overflow-hidden rounded-[4rem] bg-gradient-to-br ${themeStyles.gradient} p-12 md:p-24 text-white shadow-2xl`}>
        {/* Background Decorative Shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              مجموعة حصرية 2024
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] animate-slideUp">
              {category.name}
            </h1>
            
            <p className="text-white/80 text-lg md:text-2xl font-bold leading-relaxed max-w-xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              اكتشف تشكيلة النخبة في قسم {category.name}، حيث تجتمع الجودة العالمية مع الأسعار التنافسية في مكان واحد.
            </p>

            <div className="flex flex-wrap gap-4 pt-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
               <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/20 flex items-center gap-4">
                  <div className="text-3xl font-black">{categoryProducts.length}</div>
                  <div className="text-[10px] font-black uppercase opacity-60 leading-tight">منتج متاح<br/>الآن</div>
               </div>
               <div className="bg-white text-slate-900 px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-slate-50 transition cursor-pointer">
                 تسوق التشكيلة
               </div>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="group hidden xl:flex flex-col items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/20 transition-all duration-500"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:-translate-x-3 transition-transform">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <span className="font-black text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100 transition">العودة للرئيسية</span>
          </button>
        </div>
      </section>

      {/* Sorting Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm sticky top-24 z-30 backdrop-blur-md bg-white/90">
        <h3 className="font-black text-slate-800 text-2xl flex items-center gap-4">
          <span className={`w-3 h-10 ${themeStyles.accent} rounded-full`}></span>
          قائمة المعروضات
        </h3>

        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">ترتيب حسب:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none px-8 py-4 rounded-[1.5rem] outline-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-50 transition cursor-pointer shadow-inner"
          >
            <option value="newest">وصل حديثاً ✨</option>
            <option value="price-low">السعر: الأقل أولاً 💰</option>
            <option value="price-high">السعر: الأعلى أولاً 💎</option>
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
        <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner flex flex-col items-center">
          <div className="bg-slate-50 w-28 h-28 rounded-full flex items-center justify-center mb-10">
             <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <h4 className="text-slate-400 font-black text-3xl mb-4 tracking-tighter">هذا القسم قيد التحديث</h4>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto font-bold leading-relaxed">نحن بصدد إضافة منتجات حصرية جديدة، يرجى تصفح الأقسام الأخرى حالياً.</p>
          <button onClick={onBack} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition tracking-tighter">العودة للمتجر الرئيسي</button>
        </div>
      )}

      {/* Bottom Promotion Card */}
      {categoryProducts.length > 0 && (
         <div className="bg-slate-900 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
               <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">هل تحتاج إلى استشارة في اختيار منتجات {category.name}؟</h3>
               <p className="text-slate-400 text-lg font-bold">فريق خبراء النخبة متاح على مدار الساعة لمساعدتك في الحصول على أفضل تجربة تسوق ممكنة.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <button className="bg-white text-slate-900 px-12 py-5 rounded-[2rem] font-black text-lg hover:scale-105 transition shadow-2xl">تحدث مع خبير 💬</button>
                  <button onClick={onBack} className="bg-slate-800 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-700 transition border border-slate-700">تصفح المزيد</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CategoryPageView;
