
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
    switch (sortBy) {
      case 'price-low': return result.sort((a, b) => a.price - b.price);
      case 'price-high': return result.sort((a, b) => b.price - a.price);
      default: return result.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [products, category.id, sortBy]);

  return (
    <div className="animate-fadeIn space-y-10">
      <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-600">أقسام المتجر</span>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-800">{category.name}</span>
      </nav>

      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 md:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              {category.name}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-bold max-w-lg leading-relaxed">
              اكتشف أحدث العروض والمنتجات الحصرية في قسم {category.name}. جودة مضمونة وسعر منافس.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center min-w-[200px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">إجمالي المنتجات</p>
            <p className="text-4xl font-black">{categoryProducts.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl text-sm font-black transition group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          الرجوع للمتجر
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">الترتيب:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 px-6 py-3 rounded-2xl outline-none text-sm font-black text-gray-700 border-none focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
          >
            <option value="newest">وصل حديثاً</option>
            <option value="price-low">الأقل سعراً</option>
            <option value="price-high">الأعلى سعراً</option>
          </select>
        </div>
      </div>

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
        <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
          <p className="text-slate-400 font-bold text-xl">عذراً، لا توجد منتجات حالياً في هذا القسم.</p>
          <button onClick={onBack} className="mt-6 text-indigo-600 font-black hover:underline">تصفح الأقسام الأخرى</button>
        </div>
      )}
    </div>
  );
};

export default CategoryPageView;
