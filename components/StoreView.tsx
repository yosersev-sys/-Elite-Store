
import React, { useMemo } from 'react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import Slider from './Slider';
import BrandsSection from './BrandsSection';
import BestSellers from './BestSellers';

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
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  return (
    <div className="space-y-12 animate-fadeIn">
      <Slider />
      <BrandsSection />

      {selectedCategoryId === 'all' && searchQuery === '' && (
        <BestSellers 
          products={products} 
          onAddToCart={onAddToCart} 
          onViewProduct={onViewProduct} 
          wishlist={wishlist}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100 pt-12">
          <div className="space-y-1">
             <h2 className="text-3xl font-black text-gray-900">
               {selectedCategoryId === 'all' ? 'كل المنتجات' : `قسم ${categories.find(c => c.id === selectedCategoryId)?.name}`}
             </h2>
             <p className="text-gray-400 text-sm font-bold">تصفح مجموعتنا الحصرية في جميع الأقسام</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onCategorySelect('all')}
              className={`px-5 py-2 rounded-full text-xs transition font-black border-2 ${selectedCategoryId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`px-5 py-2 rounded-full text-xs transition font-black border-2 ${selectedCategoryId === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              category={categories.find(c => c.id === product.categoryId)?.name || 'غير مصنف'}
              onAddToCart={() => onAddToCart(product)} 
              onView={() => onViewProduct(product)}
              isFavorite={wishlist.includes(product.id)}
              onToggleFavorite={() => onToggleFavorite(product.id)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
             <p className="text-gray-400 font-bold">لا توجد منتجات تطابق بحثك حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
