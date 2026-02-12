
import React, { useMemo } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import BestSellers from './BestSellers';
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
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'أحدث المنتجات المتوفرة';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'منتجات القسم';
  }, [categories, selectedCategoryId]);

  return (
    <div className="space-y-12 animate-fadeIn pt-20 md:pt-28">
      {/* Hero Section: Slider & Brands */}
      {showHero && searchQuery === '' && selectedCategoryId === 'all' && (
        <div className="space-y-16">
          <Slider />
          <BrandsSection />
        </div>
      )}

      {/* Quick Navigation: Categories Icons */}
      <div className="container mx-auto">
        <CategorySection 
          categories={categories} 
          selectedCategoryId={selectedCategoryId} 
          onCategorySelect={onCategorySelect} 
        />
      </div>

      {/* Highlights: Best Sellers */}
      {showHero && searchQuery === '' && selectedCategoryId === 'all' && (
        <div className="container mx-auto">
          <BestSellers 
            products={products} 
            onAddToCart={onAddToCart} 
            onViewProduct={onViewProduct} 
            wishlist={wishlist}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}

      {/* Main Grid: All Products */}
      <div className="container mx-auto space-y-10" id="products-list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-orange-100 pb-8">
          <div className="space-y-1">
             <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
               <span className="w-8 h-1 bg-orange-500 rounded-full"></span>
               {filteredProducts.length} منتج متاح للتسوق الآن
             </p>
          </div>
          
          <div className="flex gap-2">
             <div className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
                فرز حسب: الأحدث
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
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
          <div className="text-center py-28 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 animate-pulse">
             <div className="text-7xl mb-6">🏜️</div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">عذراً، لم نجد ما تبحث عنه</h3>
             <p className="text-slate-400 font-bold mb-8">حاول استخدام كلمات بحث أخرى أو تصفح الأقسام</p>
             <button 
               onClick={() => onCategorySelect('all')}
               className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-900 transition-all"
             >
               عرض جميع المنتجات
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
