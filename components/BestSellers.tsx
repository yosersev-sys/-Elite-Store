
import React from 'react';
import { Product } from '../types';

interface BestSellersProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  wishlist: string[];
  onToggleFavorite: (id: string) => void;
}

const BestSellers: React.FC<BestSellersProps> = ({ products, onAddToCart, onViewProduct, wishlist, onToggleFavorite }) => {
  const topSellers = [...products]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  return (
    <section className="py-8 md:py-12 relative">
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-40"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-1 bg-orange-500 rounded-full"></span>
            <span className="text-orange-600 font-bold text-[10px] md:text-sm tracking-widest uppercase">الأكثر طلباً</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
            منتجات يعشقها <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">جميع عملائنا</span>
          </h2>
        </div>
        <p className="text-gray-500 max-w-md text-sm md:text-lg leading-relaxed hidden md:block">
          اخترنا لك الأفضل تقييماً والأكثر مبيعاً لهذا الأسبوع. جودة مضمونة وسعر منافس.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
        {topSellers.map((product, index) => {
          const isFavorite = wishlist.includes(product.id);
          return (
            <div 
              key={product.id} 
              className="group relative bg-white rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 shadow-xl shadow-gray-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 transform hover:-translate-y-2 border border-gray-50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Best Seller Badge */}
              <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-20 bg-gradient-to-tr from-orange-500 to-yellow-400 text-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              {/* Wishlist Button Overlay */}
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
                className={`absolute top-2 left-2 md:top-3 md:left-3 z-20 p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shadow-md backdrop-blur-md active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <div 
                className="relative aspect-square mb-4 md:mb-6 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden bg-gray-50 cursor-pointer"
                onClick={() => onViewProduct(product)}
              >
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold text-indigo-700 shadow-sm">
                  مباع {product.salesCount}+
                </div>
              </div>
              
              <div className="px-1 md:px-2 space-y-2 md:space-y-4">
                <div onClick={() => onViewProduct(product)} className="cursor-pointer">
                  <span className="text-indigo-500 text-[9px] md:text-xs font-bold uppercase tracking-wider">الأكثر مبيعاً</span>
                  <h3 className="font-black text-sm md:text-xl text-gray-900 mt-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 md:pt-2">
                  <div className="flex flex-col">
                    <span className="text-base md:text-2xl font-black text-gray-900 leading-none">
                      {product.price} <small className="text-[10px] md:text-sm font-bold">ج.م</small>
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="bg-indigo-600 hover:bg-gray-900 text-white px-4 md:px-6 h-10 md:h-12 flex items-center justify-center gap-2 rounded-xl md:rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-100"
                  >
                    <span className="text-[10px] md:text-sm font-black">شراء</span>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BestSellers;
