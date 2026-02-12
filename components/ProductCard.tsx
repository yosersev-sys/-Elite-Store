
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  category: string;
  onAddToCart: () => void;
  onView: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, category, onAddToCart, onView, isFavorite = false, onToggleFavorite
}) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded) return;
    
    setIsAdded(true);
    onAddToCart();
    
    // إعادة حالة الزر بعد 1.5 ثانية
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-50 overflow-hidden card-shadow hover-lift flex flex-col h-full group">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 cursor-pointer" onClick={onView}>
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Badge */}
        <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10">
          <span className="glass px-2 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black text-slate-800 uppercase tracking-widest shadow-sm">
            {category}
          </span>
        </div>

        {/* Favorite */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          className={`absolute top-2 md:top-4 left-2 md:left-4 z-10 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-90 ${isFavorite ? 'bg-rose-500 text-white' : 'glass text-slate-400 hover:text-rose-500'}`}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Overlay Action */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
           <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-xs text-slate-800 shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform">
             عرض التفاصيل
           </div>
        </div>
      </div>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow">
        <h3 className="font-black text-sm md:text-lg text-slate-800 line-clamp-1 mb-1 md:mb-2 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-slate-400 text-[10px] md:text-xs font-medium line-clamp-2 mb-3 md:mb-6 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="flex flex-col shrink-0">
            <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">السعر</span>
            <div className="flex items-baseline gap-0.5 md:gap-1">
              <span className="text-base md:text-2xl font-black text-slate-900 tracking-tighter">{product.price}</span>
              <span className="text-[8px] md:text-[10px] font-black text-indigo-600">ج.م</span>
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={`flex-grow md:flex-grow-0 h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 whitespace-nowrap overflow-hidden relative ${
              isAdded ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-900 text-white hover:bg-indigo-600'
            }`}
          >
            {isAdded ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-[10px] md:text-sm font-black">تمت الإضافة</span>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-sm font-black">شراء</span>
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
