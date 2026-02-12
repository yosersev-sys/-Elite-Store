
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
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  return (
    <div className="animate-fadeIn pb-20">
      {/* Slider يظهر في الصفحة الرئيسية فقط عند عدم وجود بحث */}
      {showHero && searchQuery === '' && selectedCategoryId === 'all' && (
        <div className="mb-16">
          <Slider />
          <div className="container mx-auto px-4 mt-12">
            <BrandsSection />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 space-y-16">
        {/* تصفح الأقسام */}
        <CategorySection 
          categories={categories} 
          selectedCategoryId={selectedCategoryId} 
          onCategorySelect={onCategorySelect} 
        />

        {/* المنتجات */}
        <div className="space-y-10" id="products-list">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-100 pb-6">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                 {searchQuery ? `نتائج البحث: ${searchQuery}` : 'منتجات فاقوس ستور'}
               </h2>
               <p className="text-slate-400 text-sm font-bold">لدينا {filteredProducts.length} منتج متاح الآن</p>
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
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-orange-100">
               <p className="text-slate-400 font-black">لم نجد أي منتجات تطابق بحثك..</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreView;
