
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
  onCategorySelect,
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  // Filter products by both Search and Category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'منتجاتنا الحصرية';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'منتجات القسم';
  }, [categories, selectedCategoryId]);

  return (
    <div className="space-y-20 animate-fadeIn">
      {/* Visual Elements */}
      <Slider />
      
      {/* Brands Section */}
      <BrandsSection />

      {/* Category Selection Grid - NEW */}
      <CategorySection 
        categories={categories} 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={onCategorySelect} 
      />

      {/* Only show Best Sellers if no specific category or search is active */}
      {searchQuery === '' && selectedCategoryId === 'all' && (
        <BestSellers 
          products={products} 
          onAddToCart={onAddToCart} 
          onViewProduct={onViewProduct} 
          wishlist={wishlist}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Products Grid */}
      <div className="space-y-12" id="products-list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100 pt-16">
          <div className="space-y-2">
             <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-gray-400 text-lg font-bold">
               {filteredProducts.length} منتج متاح في هذا القسم
             </p>
          </div>
          
          <div className="hidden md:block">
             <span className="bg-green-50 text-green-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                موسم {new Date().getFullYear()}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
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
          <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
             <div className="text-6xl mb-4">🔍</div>
             <p className="text-gray-400 font-black text-xl">عذراً، لم نجد منتجات تطابق اختيارك.</p>
             <button 
               onClick={() => onCategorySelect('all')}
               className="mt-6 bg-green-600 text-white px-8 py-3 rounded-2xl font-black"
             >
               عرض كل المنتجات
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
