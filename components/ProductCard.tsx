
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded) return;
    setIsAdded(true);
    onAddToCart(product, imageRef.current?.getBoundingClientRect());
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-[1.25rem] md:rounded-[2.5rem] border border-slate-100/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 cursor-pointer" onClick={onView}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>
        )}
        <img 
          ref={imageRef}
          src={product.images[0]} 
          alt={product.name}
          width="300"
          height="375"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10">
          <span className="bg-white/90 backdrop-blur-md px-2 md:px-4 py-1 rounded-full text-[7px] md:text-[10px] font-black text-slate-800 shadow-sm">
            {category}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          className={`absolute top-2 md:top-4 left-2 md:left-4 z-10 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-90 ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500 backdrop-blur-md'}`}
        >
          <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow bg-white">
        <h3 className="font-black text-xs md:text-lg text-slate-800 line-clamp-2 mb-2 md:mb-3 h-8 md:h-14 leading-tight">
          {product.name}
        </h3>
        <div className="mt-auto space-y-2 md:space-y-4">
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-sm md:text-2xl font-black text-slate-900">{product.price.toLocaleString()}</span>
            <span className="text-[8px] md:text-[10px] font-black text-emerald-600">ج.م</span>
          </div>
          <button 
            onClick={handleAddToCart}
            aria-label={`إضافة ${product.name} إلى السلة`}
            className={`w-full h-9 md:h-12 px-2 md:px-6 rounded-lg md:rounded-2xl flex items-center justify-center gap-1.5 md:gap-2 transition-all duration-300 shadow-sm active:scale-95 ${
              isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'
            }`}
          >
            <span className="text-[9px] md:text-sm font-black">{isAdded ? 'تمت الإضافة' : 'أضف للسلة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
