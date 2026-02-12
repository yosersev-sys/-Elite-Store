
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
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'منتجاتنا المختارة بعناية';
    return categories.find(c => c.id === selectedCategoryId)?.name || 'منتجات القسم';
  }, [categories, selectedCategoryId]);

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* السلايدر وشركاء الجودة يظهرون في الصفحة الرئيسية فقط وعند عدم وجود بحث */}
      {showHero && searchQuery === '' && (
        <div className="space-y-12">
          <Slider />
          <BrandsSection />
        </div>
      )}

      {/* أقسام التصفح السريع */}
      <CategorySection 
        categories={categories} 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={onCategorySelect} 
      />

      {/* الأكثر مبيعاً يظهر في الرئيسية فقط */}
      {showHero && searchQuery === '' && selectedCategoryId === 'all' && (
        <BestSellers 
          products={products} 
          onAddToCart={onAddToCart} 
          onViewProduct={onViewProduct} 
          wishlist={wishlist}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* شبكة المنتجات */}
      <div className="space-y-8" id="products-list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-orange-100 pt-12">
          <div className="space-y-1">
             <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
               {searchQuery ? `نتائج البحث: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-gray-400 text-sm font-bold">
               اكتشف {filteredProducts.length} منتج طازج وعالي الجودة
             </p>
          </div>
          
          <div className="hidden md:block">
             <span className="bg-orange-50 text-orange-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
                تسوق ممتع في فاقوس ستور
             </span>
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
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-orange-100">
             <div className="text-5xl mb-4">🔍</div>
             <p className="text-gray-400 font-black text-lg">لم نجد أي نتائج تطابق بحثك..</p>
             <button 
               onClick={() => onCategorySelect('all')}
               className="mt-6 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-900 transition"
             >
               العودة لجميع المنتجات
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
