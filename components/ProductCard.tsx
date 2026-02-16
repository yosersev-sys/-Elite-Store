
import React, { useState, useRef } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  category: string;
  onAddToCart: (product: Product, rect?: DOMRect) => void;
  onView: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, category, onAddToCart, onView, isFavorite = false, onToggleFavorite
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded) return;
    
    setIsAdded(true);
    
    // التقاط موقع الصورة لبدء أنيميشن الطيران
    const rect = imageRef.current?.getBoundingClientRect();
    onAddToCart(product, rect);
    
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const getUnitName = (u: string) => {
    if (u === 'kg') return 'كجم';
    if (u === 'gram') return 'جم';
    return 'قطعة';
  };

  return (
    <div className="bg-white rounded-[1.25rem] md:rounded-[2.5rem] border border-slate-100/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group">
      {/* منطقة الصورة */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 cursor-pointer" onClick={onView}>
        <img 
          ref={imageRef}
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* طبقة تظليل خفيفة أسفل الصورة لتحسين وضوح العناصر العائمة */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-60"></div>

        {/* القسم/الفئة */}
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10">
          <span className="bg-white/90 backdrop-blur-md px-2 md:px-4 py-1 rounded-full text-[7px] md:text-[10px] font-black text-slate-800 uppercase tracking-wider shadow-sm border border-white/50">
            {category}
          </span>
        </div>

        {/* زر المفضلة */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          className={`absolute top-2 md:top-4 left-2 md:left-4 z-10 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-90 ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500 backdrop-blur-md'}`}
        >
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* تلميح العرض السريع (للكمبيوتر فقط) */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
           <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-xs text-slate-800 shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform">
             تفاصيل المنتج
           </div>
        </div>
      </div>
      
      {/* منطقة المحتوى */}
      <div className="p-2.5 md:p-6 flex flex-col flex-grow bg-white">
        <h3 className="font-black text-xs md:text-lg text-slate-800 line-clamp-2 mb-2 md:mb-3 h-8 md:h-14 group-hover:text-emerald-600 transition-colors leading-tight">
          {product.name}
        </h3>
        
        <div className="mt-auto space-y-2 md:space-y-4">
          {/* تفاصيل السعر والوحدة */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">السعر لكل {getUnitName(product.unit)}</span>
            <div className="flex items-baseline gap-0.5 md:gap-1">
              <span className="text-sm md:text-2xl font-black text-slate-900 tracking-tight">{product.price.toLocaleString()}</span>
              <span className="text-[8px] md:text-[10px] font-black text-emerald-600">ج.م</span>
            </div>
          </div>
          
          {/* زر الإضافة للسلة */}
          <button 
            onClick={handleAddToCart}
            className={`w-full h-9 md:h-12 px-2 md:px-6 rounded-lg md:rounded-2xl flex items-center justify-center gap-1.5 md:gap-2 transition-all duration-300 shadow-sm active:scale-95 relative overflow-hidden ${
              isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-900/10'
            }`}
          >
            {isAdded ? (
              <div className="flex items-center gap-1.5 animate-fadeIn">
                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[9px] md:text-sm font-black">تمت الإضافة</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-[9px] md:text-sm font-black">أضف للسلة</span>
                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
