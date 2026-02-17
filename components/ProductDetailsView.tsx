
import React, { useState, useRef } from 'react';
import { Product } from '../types';

interface ProductDetailsViewProps {
  product: Product;
  categoryName: string;
  onAddToCart: (product: Product, size?: string, color?: string, rect?: DOMRect, quantity?: number) => void;
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
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const mainImageRef = useRef<HTMLImageElement>(null);
  
  const images = Array.isArray(product?.images) ? product.images : [];
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '');

  const isWeightUnit = product?.unit === 'kg' || product?.unit === 'gram';

  if (!product) return <div className="p-20 text-center font-bold">عذراً، لم يتم العثور على المنتج</div>;

  const isOutOfStock = (product.stockQuantity || 0) <= 0;

  const handleAddClick = () => {
    const rect = mainImageRef.current?.getBoundingClientRect();
    onAddToCart(product, selectedSize, selectedColor, rect, quantity);
  };

  const handleManualQuantity = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setQuantity(n);
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto py-8 px-4">
      {copyFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl animate-slideDown">
          تم نسخ رابط المنتج! 🔗
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition mb-8 font-bold">
        <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        العودة للمتجر
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-6 md:p-10 bg-gray-50/30 flex flex-col gap-6">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-lg bg-white">
              <img ref={mainImageRef} key={activeImageIndex} src={images[activeImageIndex]} alt={product.name} className={`w-full h-full object-cover animate-fadeIn ${isOutOfStock ? 'grayscale opacity-60' : ''}`} />
              <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                <button onClick={() => onToggleFavorite(product.id)} className={`p-4 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}><svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition ${activeImageIndex === idx ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60'}`}><img src={img} className="w-full h-full object-cover" alt="" /></button>
                ))}
              </div>
            )}
          </div>

          <div className="p-10 lg:p-16 flex flex-col justify-center">
            <div className="space-y-8">
              <div>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block tracking-widest">{categoryName}</span>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">{product.name}</h1>
              </div>

              <div className="flex items-baseline gap-4 py-4 border-y border-gray-100">
                <span className="text-5xl font-black text-indigo-600">{product.price} <small className="text-lg font-bold">ج.م / {product.unit === 'kg' ? 'كجم' : product.unit === 'gram' ? 'جرام' : 'قطعة'}</small></span>
              </div>

              {/* اختيار الكمية/الوزن */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{isWeightUnit ? 'الوزن المطلوب' : 'الكمية'}</h3>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border w-fit">
                   <button onClick={() => setQuantity(q => Math.max(0, q + (isWeightUnit ? 0.1 : 1)))} className="w-12 h-12 bg-white rounded-xl shadow-sm text-xl font-black text-indigo-600">+</button>
                   <input 
                    type="number" 
                    step={isWeightUnit ? "0.05" : "1"}
                    value={quantity}
                    onChange={(e) => handleManualQuantity(e.target.value)}
                    className="bg-transparent border-none outline-none font-black text-2xl w-24 text-center text-slate-800"
                   />
                   <button onClick={() => setQuantity(q => Math.max(0, q - (isWeightUnit ? 0.1 : 1)))} className="w-12 h-12 bg-white rounded-xl shadow-sm text-xl font-black text-indigo-600">-</button>
                   <span className="ml-4 font-black text-slate-400">{product.unit === 'kg' ? 'كجم' : product.unit === 'gram' ? 'جرام' : 'قطعة'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">المجموع الفرعي</h3>
                <p className="text-3xl font-black text-emerald-600">{(product.price * quantity).toFixed(2)} ج.م</p>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  disabled={isOutOfStock || quantity <= 0}
                  onClick={handleAddClick}
                  className={`flex-grow py-5 px-8 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${
                    isOutOfStock || quantity <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gray-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {isOutOfStock ? 'غير متوفر' : 'أضف للسلة'}
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
