
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
  onAddToCart, 
  onViewProduct,
  wishlist,
  onToggleFavorite
}) => {
  // الصفحة الرئيسية تعرض كل المنتجات دائماً أو ما يطابق البحث فقط
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-20 animate-fadeIn">
      {/* عناصر الواجهة الرئيسية الثابتة */}
      <Slider />
      <BrandsSection />

      {searchQuery === '' && (
        <BestSellers 
          products={products} 
          onAddToCart={onAddToCart} 
          onViewProduct={onViewProduct} 
          wishlist={wishlist}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* قسم المنتجات في الرئيسية - تم إزالة أزرار الفلترة منه لفك الارتباط بالهيدر */}
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100 pt-16">
          <div className="space-y-2">
             <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : 'كل المعروضات'}
             </h2>
             <p className="text-gray-400 text-lg font-bold">استكشف تشكيلتنا الكاملة من المنتجات المختارة</p>
          </div>
          
          {/* تم إزالة أزرار التصنيفات من هنا لأنها موجودة في الهيدر وتفتح صفحات مستقلة */}
          <div className="hidden md:block">
             <span className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                Elite Collection 2024
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
             <p className="text-gray-400 font-black text-xl">عذراً، لم نجد منتجات تطابق بحثك.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
