
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
          <h2 className="text-3xl font-black text-gray-900">
            {selectedCategoryId === 'all' ? 'كل المنتجات' : `قسم ${categories.find(c => c.id === selectedCategoryId)?.name}`}
          </h2>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onCategorySelect('all')}
              className={`px-5 py-2 rounded-full text-sm transition font-bold ${selectedCategoryId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`px-5 py-2 rounded-full text-sm transition font-bold ${selectedCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
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
      </div>
    </div>
  );
};

export default StoreView;
