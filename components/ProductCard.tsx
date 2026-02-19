import React, { useState } from 'react';
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
  const [imageLoaded, setImageLoaded] = useState(false);

  const getUnitName = (u: string) => {
    if (u === 'kg') return 'كجم';
    if (u === 'gram') return 'جم';
    return 'قطعة';
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group">
      
      {/* Container with fixed aspect ratio to prevent CLS */}
      <div 
        onClick={onView}
        className="relative w-full aspect-[4/5] bg-slate-100 cursor-pointer overflow-hidden"
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          width="300"
          height="375"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse"></div>
        )}

        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
          <span className="bg-white/90 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black text-slate-800 shadow-sm border border-white/50">
            {category}
          </span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          className={`absolute top-2 left-2 md:top-4 md:left-4 z-10 p-2 rounded-xl shadow-lg transition-all active:scale-90 ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-400 hover:text-rose-500'}`}
        >
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow">
        <h3 className="font-black text-xs md:text-lg text-slate-800 line-clamp-2 mb-2 h-8 md:h-14 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-auto space-y-2 md:space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-sm md:text-2xl font-black text-slate-900">{product.price}</span>
            <span className="text-[8px] md:text-xs font-bold text-emerald-600">ج.م / {getUnitName(product.unit)}</span>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="w-full bg-slate-900 text-white py-2 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>أضف للسلة</span>
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;