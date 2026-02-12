
import React, { useMemo, useEffect, useRef } from 'react';
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
  const productsListRef = useRef<HTMLDivElement>(null);

  // دالة مخصصة للتمرير البطيء جداً (قابلة للتحكم في الوقت)
  const slowScrollTo = (targetY: number, duration: number) => {
    const startY = window.pageYOffset;
    const diff = targetY - startY;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percent = Math.min(progress / duration, 1);
      
      // معادلة Ease-in-out للحصول على حركة انسيابية
      const ease = percent < 0.5 
        ? 2 * percent * percent 
        : -1 + (4 - 2 * percent) * percent;

      window.scrollTo(0, startY + diff * ease);

      if (progress < duration) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  // مراقبة تغيير القسم لتشغيل التمرير
  useEffect(() => {
    // لا نريد التمرير عند التحميل الأول للصفحة إذا كان القسم "all"
    // ولكن نريد التمرير إذا قام المستخدم بالنقر فعلياً على قسم معين
    if (selectedCategoryId !== 'all' || searchQuery) {
      const timer = setTimeout(() => {
        const element = document.getElementById('products-list');
        if (element) {
          const headerOffset = 160; // المسافة المطلوبة تحت الهيدر الثابت
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          // تمرير بطيء يستغرق 1.5 ثانية (1500ms)
          slowScrollTo(offsetPosition, 1500);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCategoryId, searchQuery]);

  // تصفية المنتجات حسب البحث والقسم
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
    <div className="space-y-12 md:space-y-20 animate-fadeIn">
      {/* السلايدر الرئيسي */}
      <Slider />
      
      {/* شبكة اختيار الأقسام */}
      <CategorySection 
        categories={categories} 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={onCategorySelect} 
      />

      {/* منطقة عرض المنتجات */}
      <div className="space-y-8 md:space-y-12" id="products-list" ref={productsListRef}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-100 pt-10 md:pt-16">
          <div className="space-y-1 md:space-y-2">
             <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter">
               {searchQuery ? `نتائج البحث عن: ${searchQuery}` : activeCategoryName}
             </h2>
             <p className="text-gray-400 text-sm md:text-lg font-bold">
               {filteredProducts.length} منتج متاح
             </p>
          </div>
          
          <div className="hidden md:block">
             <span className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                موسم {new Date().getFullYear()}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-10">
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
          <div className="text-center py-20 md:py-32 bg-gray-50 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-gray-200">
             <div className="text-4xl md:text-6xl mb-4">🔍</div>
             <p className="text-gray-400 font-black text-base md:text-xl">عذراً، لم نجد منتجات تطابق اختيارك.</p>
             <button 
               onClick={() => onCategorySelect('all')}
               className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black transition-transform active:scale-95"
             >
               عرض كل المنتجات
             </button>
          </div>
        )}
      </div>

      {/* الماركات في الأسفل */}
      <div className="pt-10">
        <BrandsSection />
      </div>
    </div>
  );
};

export default StoreView;
