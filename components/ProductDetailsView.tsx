
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductDetailsViewProps {
  product: Product;
  categoryName: string;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ 
  product, 
  categoryName, 
  onAddToCart, 
  onBack,
  isFavorite,
  onToggleFavorite
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Safe Access for properties
  const images = Array.isArray(product?.images) ? product.images : [];
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '');

  if (!product) return <div className="p-20 text-center font-bold">عذراً، لم يتم العثور على المنتج</div>;

  const isOutOfStock = (product.stockQuantity || 0) <= 0;
  const isLowStock = (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) < 5;

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition mb-8 font-bold"
      >
        <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        العودة للمتجر
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          <div className="p-6 md:p-10 bg-gray-50/30 flex flex-col gap-6">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-lg bg-white">
              {images.length > 0 ? (
                <img 
                  key={activeImageIndex}
                  src={images[activeImageIndex]} 
                  alt={product.name} 
                  className={`w-full h-full object-cover animate-fadeIn ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">لا توجد صورة</div>
              )}
              
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                   <span className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xl shadow-2xl transform -rotate-12 border-4 border-white">
                     نفذت الكمية!
                   </span>
                </div>
              )}

              <button 
                onClick={() => onToggleFavorite(product.id)}
                className={`absolute top-6 left-6 z-10 p-4 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
              >
                <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition ${activeImageIndex === idx ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-10 lg:p-16 flex flex-col justify-center">
            <div className="space-y-8">
              <div>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block tracking-widest">
                  {categoryName}
                </span>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                  {product.name}
                </h1>
                
                {isLowStock && (
                  <div className="mt-4 flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold">عجل! تبقى فقط {product.stockQuantity} قطع في المخزون.</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-4 py-4 border-y border-gray-100">
                <span className="text-5xl font-black text-indigo-600">
                  {product.price} <small className="text-lg font-bold">ر.س</small>
                </span>
              </div>

              {sizes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">المقاس</h3>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map(size => (
                      <button 
                        key={size} 
                        onClick={() => setSelectedSize(size)} 
                        className={`min-w-[50px] h-12 px-4 rounded-xl font-bold transition-all border-2 ${selectedSize === size ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">اللون</h3>
                  <div className="flex flex-wrap gap-4">
                    {colors.map(color => (
                      <button 
                        key={color} 
                        onClick={() => setSelectedColor(color)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all border-2 ${selectedColor === color ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                      >
                        <span className="text-sm">{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">الوصف</h3>
                <p className="text-gray-500 leading-relaxed text-lg">{product.description || 'لا يوجد وصف متوفر لهذا المنتج.'}</p>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product, selectedSize, selectedColor)}
                  className={`flex-grow py-5 px-8 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${
                    isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gray-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {isOutOfStock ? 'غير متوفر' : 'شراء الآن'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsView;
