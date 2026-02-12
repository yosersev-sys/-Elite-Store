
import React, { useMemo } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import CategorySection from './CategorySection';
import BestSellers from './BestSellers.tsx';

interface StoreViewProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onCategorySelect: (id: string | 'all') => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  onToggleFavorite: (id: string) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ 
  products, 
  categories, 
  searchQuery, 
  onCategorySelect,
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  // تصفية المنتجات للبحث فقط في الصفحة الرئيسية إذا كان هناك بحث
  const searchedProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // أحدث المنتجات (New Arrivals)
  const newArrivals = useMemo(() => {
    return [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  }, [products]);

  return (
    <div className="space-y-16 md:space-y-24 animate-fadeIn pb-20">
      {/* 1. السلايدر الرئيسي */}
      <Slider />
      
      {/* 2. إذا كان هناك بحث، اعرض النتائج أولاً */}
      {searchQuery && (
        <div className="space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-3xl font-black text-slate-800">نتائج البحث عن: <span className="text-emerald-600">{searchQuery}</span></h2>
            <p className="text-slate-400 font-bold">{searchedProducts.length} منتج موجود</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {searchedProducts.map(p => (
              <ProductCard 
                key={p.id} product={p} 
                category={categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                onAddToCart={() => onAddToCart(p)} onView={() => onViewProduct(p)}
                isFavorite={wishlist.includes(p.id)} onToggleFavorite={() => onToggleFavorite(p.id)}
              />
            ))}
          </div>
          {searchedProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
              <p className="text-slate-400 font-bold text-xl">لا توجد نتائج تطابق بحثك</p>
            </div>
          )}
        </div>
      )}

      {/* 3. شبكة الأقسام للانتقال السريع */}
      <CategorySection 
        categories={categories} 
        selectedCategoryId="all" 
        onCategorySelect={onCategorySelect} 
      />

      {/* 4. الأكثر مبيعاً (Best Sellers) */}
      <BestSellers 
        products={products}
        onAddToCart={onAddToCart}
        onViewProduct={onViewProduct}
        wishlist={wishlist}
        onToggleFavorite={onToggleFavorite}
      />

      {/* 5. وصل حديثاً (New Arrivals) */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">✨ وصل حديثاً</h2>
          <span className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">موسم {new Date().getFullYear()}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map(p => (
            <ProductCard 
              key={p.id} product={p} 
              category={categories.find(c => c.id === p.categoryId)?.name || 'عام'}
              onAddToCart={() => onAddToCart(p)} onView={() => onViewProduct(p)}
              isFavorite={wishlist.includes(p.id)} onToggleFavorite={() => onToggleFavorite(p.id)}
            />
          ))}
        </div>
      </div>

      {/* 6. الماركات */}
      <BrandsSection />
    </div>
  );
};

export default StoreView;
