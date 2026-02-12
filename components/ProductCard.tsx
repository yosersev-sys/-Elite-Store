
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
  product, 
  category, 
  onAddToCart, 
  onView,
  isFavorite = false,
  onToggleFavorite
}) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-orange-50 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full relative">
      <div 
        className="relative aspect-square overflow-hidden cursor-pointer bg-slate-50"
        onClick={onView}
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          className={`absolute top-4 left-4 z-20 p-2.5 rounded-2xl transition-all shadow-md backdrop-blur-sm active:scale-90 ${isFavorite ? 'bg-orange-500 text-white' : 'bg-white/80 text-gray-400 hover:text-orange-500'}`}
        >
          <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute top-4 right-4 z-10">
          <span className="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-lg border border-white/20">
            {category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 
          className="font-black text-xl text-gray-800 line-clamp-1 mb-2 cursor-pointer hover:text-orange-500 transition-colors tracking-tighter"
          onClick={onView}
        >
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-grow font-bold">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-orange-50">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-orange-600 leading-none">
              {product.price} <small className="text-xs font-bold">ر.س</small>
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">متوفر بالمخزون</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-orange-500 transition shadow-lg active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
