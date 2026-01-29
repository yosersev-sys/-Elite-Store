
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
    if (sortBy === 'price-low') return result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return result.sort((a, b) => b.price - a.price);
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [products, category.id, sortBy]);

  return (
    <div className="animate-fadeIn space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="hover:text-indigo-600 transition">الرئيسية</button>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-600">الأقسام</span>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-800 font-black bg-indigo-50 px-2 py-1 rounded-md">{category.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-12 md:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              {category.name}
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl font-bold max-w-lg leading-relaxed opacity-90">
              تصفح أفضل التشكيلات والمنتجات الحصرية المتاحة الآن في قسم {category.name}.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 text-center min-w-[200px] shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">المنتجات المتوفرة</p>
            <p className="text-5xl font-black">{categoryProducts.length}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl text-sm font-black transition group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للرئيسية
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ترتيب حسب:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 px-6 py-3 rounded-2xl outline-none text-sm font-black text-gray-700 border-none focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="newest">الأحدث وصولاً</option>
            <option value="price-low">السعر: من الأقل</option>
            <option value="price-high">السعر: من الأعلى</option>
          </select>
        </div>
      </div>

      {/* Grid */}
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
        <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 shadow-inner">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-slate-400 font-black text-xl">هذا القسم لا يحتوي على منتجات حالياً.</p>
          <button onClick={onBack} className="mt-6 text-indigo-600 font-black hover:underline">العودة لتصفح المتجر</button>
        </div>
      )}
    </div>
  );
};

export default CategoryPageView;
