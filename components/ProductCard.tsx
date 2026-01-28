
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full relative">
      <div 
        className="relative aspect-[4/3] overflow-hidden cursor-pointer bg-gray-50"
        onClick={onView}
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          className={`absolute top-3 left-3 z-20 p-2 rounded-xl transition-all shadow-sm backdrop-blur-md active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
        >
          <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/90 backdrop-blur-md text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm border border-white/50">
            {category}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 
          className="font-bold text-lg text-gray-800 line-clamp-1 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={onView}
        >
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-black text-indigo-700">
            {product.price} <small className="text-xs font-normal">ر.س</small>
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-indigo-600 transition shadow-sm active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
