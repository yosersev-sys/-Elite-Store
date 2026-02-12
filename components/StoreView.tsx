
import React, { useMemo } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import CategorySection from './CategorySection';

interface StoreViewProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: string | 'all';
  showHero?: boolean;
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
  selectedCategoryId,
  showHero = true,
  onCategorySelect,
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  return (
    <div className="animate-fadeIn pb-20">
      {/* عرض السلايدر في الصفحة الرئيسية فقط */}
      {showHero && searchQuery === '' && selectedCategoryId === 'all' && (
        <div className="mb-16">
          <div className="container mx-auto px-4">
            <Slider />
            <div className="mt-12">
              <BrandsSection />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 space-y-16">
        {/* تصنيفات سريعة */}
        <CategorySection 
          categories={categories} 
          selectedCategoryId={selectedCategoryId} 
          onCategorySelect={onCategorySelect} 
        />

        {/* شبكة المنتجات */}
        <div className="space-y-10" id="products-list">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-100 pb-8">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                 {searchQuery ? `نتائج البحث عن: ${searchQuery}` : 'أحدث المحاصيل والمنتجات'}
               </h2>
               <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
                 <span className="w-6 h-1 bg-orange-500 rounded-full"></span>
                 متوفر حالياً {filteredProducts.length} منتج طازج
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                category={categories.find(c => c.id === product.categoryId)?.name || 'عام'}
                onAddToCart={() => onAddToCart(product)} 
                onView={() => onViewProduct(product)}
                isFavorite={wishlist.includes(product.id)}
                onToggleFavorite={() => onToggleFavorite(product.id)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-orange-50">
               <div className="text-6xl mb-4">🔍</div>
               <p className="text-slate-400 font-black text-xl">لم نجد أي منتجات تطابق اختيارك حالياً.</p>
               <button onClick={() => onCategorySelect('all')} className="mt-6 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black">عرض كل المنتجات</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreView;
