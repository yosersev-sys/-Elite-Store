
import React from 'react';
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

        {/* Overlay Action - Hidden on touch devices usually but keep for desktop hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
           <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-xs text-slate-800 shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform">
             عرض التفاصيل
           </div>
        </div>
      </div>
      
      <div className="p-3 md:p-6 flex flex-col flex-grow">
        <h3 className="font-black text-sm md:text-lg text-slate-800 line-clamp-1 mb-1 md:mb-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-slate-400 text-[10px] md:text-xs font-medium line-clamp-2 mb-3 md:mb-6 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">السعر</span>
            <div className="flex items-baseline gap-0.5 md:gap-1">
              <span className="text-base md:text-2xl font-black text-slate-900 tracking-tighter">{product.price}</span>
              <span className="text-[8px] md:text-[10px] font-black text-emerald-600">ر.س</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="px-3 md:px-5 h-9 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 hover:bg-emerald-500 transition-all shadow-xl active:scale-95 group/btn"
          >
            <span className="text-[10px] md:text-sm font-black">شراء</span>
            <svg className="w-3 h-3 md:w-5 md:h-5 transition-transform group-hover/btn:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
