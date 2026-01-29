
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

  // تحديد ألوان ديناميكية بناءً على معرف القسم
  const themeColor = useMemo(() => {
    if (category.id.includes('electronics')) return 'from-indigo-600 to-blue-500';
    if (category.id.includes('fashion')) return 'from-pink-600 to-rose-500';
    if (category.id.includes('home')) return 'from-amber-600 to-orange-500';
    if (category.id.includes('beauty')) return 'from-emerald-600 to-teal-500';
    return 'from-slate-800 to-slate-700';
  }, [category.id]);

  return (
    <div className="animate-fadeIn space-y-12">
      {/* Navigation Breadcrumbs */}
      <nav className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="opacity-30">/</span>
        <span className="text-slate-300">الأقسام</span>
        <span className="opacity-30">/</span>
        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg">{category.name}</span>
      </nav>

      {/* Hero Landing Section */}
      <div className={`relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br ${themeColor} p-12 md:p-20 text-white shadow-2xl`}>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none animate-slideUp">
              {category.name}
            </h1>
            <p className="text-white/80 text-lg md:text-2xl font-bold leading-relaxed max-w-xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
               تصفح تشكيلة حصرية من المنتجات التي تم اختيارها بعناية لتناسب ذوقك الرفيع في قسم {category.name}.
            </p>
            <div className="flex gap-4 pt-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
                    <p className="text-[10px] font-black uppercase opacity-60">عدد القطع</p>
                    <p className="text-2xl font-black">{categoryProducts.length}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
                    <p className="text-[10px] font-black uppercase opacity-60">توصيل مجاني</p>
                    <p className="text-2xl font-black">نشط ✅</p>
                </div>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="group hidden lg:flex flex-col items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 transition-all duration-500 shadow-inner"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:-translate-x-2 transition-transform">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </div>
            <span className="font-black text-sm uppercase tracking-widest">الرئيسية</span>
          </button>
        </div>
      </div>

      {/* Sorting & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-24 z-30 backdrop-blur-md bg-white/90">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
          <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
          قائمة المنتجات
        </h3>

        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ترتيب النتائج:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none px-6 py-3 rounded-2xl outline-none text-sm font-black text-slate-700 focus:ring-4 focus:ring-indigo-50 transition cursor-pointer"
          >
            <option value="newest">الأحدث وصـولاً</option>
            <option value="price-low">السعر: من الأقل</option>
            <option value="price-high">السعر: من الأعلى</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
             <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <h4 className="text-slate-400 font-black text-2xl mb-4">نحن نأسف، لا تتوفر منتجات حالياً</h4>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">هذا القسم قيد التحديث، يرجى العودة لاحقاً لاكتشاف القطع الجديدة.</p>
          <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition">تصفح أقسام أخرى</button>
        </div>
      )}

      {/* Bottom CTA */}
      {categoryProducts.length > 0 && (
         <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-3xl font-black mb-4">هل تبحث عن شيء محدد في {category.name}؟</h3>
               <p className="text-slate-400 mb-8 max-w-lg mx-auto font-bold">تواصل مع فريق الدعم الفني لدينا لنساعدك في اختيار القطعة المثالية لك.</p>
               <button className="bg-white text-slate-900 px-12 py-4 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 hover:text-white transition">تحدث معنا الآن</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default CategoryPageView;
