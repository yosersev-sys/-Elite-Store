import React, { useState, useRef } from 'react';
import { Product } from '../types';

interface ProductDetailsViewProps {
  product: Product;
  categoryName: string;
  // Fixed: Moved qty (required) before size and color (optional) to satisfy TS requirements.
  onAddToCart: (product: Product, qty: number, size?: string, color?: string, rect?: DOMRect) => void;
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
  const [quantity, setQuantity] = useState<number>(1);
  const mainImageRef = useRef<HTMLImageElement>(null);
  
  const images = Array.isArray(product?.images) ? product.images : [];
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '');

  if (!product) return <div className="p-20 text-center font-bold">عذراً، لم يتم العثور على المنتج</div>;

  const isOutOfStock = (product.stockQuantity || 0) <= 0;
  const isLowStock = (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) < 5;
  const isWeightUnit = product.unit === 'kg';

  const handleAddClick = () => {
    const rect = mainImageRef.current?.getBoundingClientRect();
    // Fixed: Updated call to match new onAddToCart signature.
    onAddToCart(product, quantity, selectedSize, selectedColor, rect);
  };

  const productSlug = product ? product.name.trim().toLowerCase().replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-') : '';
  const shareUrl = product ? `${window.location.origin}${window.location.pathname}#product/${product.id}-${encodeURIComponent(productSlug)}` : '';
  const shareText = product ? `شاهد هذا المنتج الرائع "${product.name}" على سوق العصر!` : '';

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: shareText,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto py-8 px-4">
      {copyFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl animate-slideDown">
          تم نسخ رابط المنتج! 🔗
        </div>
      )}

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
                  ref={mainImageRef}
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

              <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                <button 
                  onClick={() => onToggleFavorite(product.id)}
                  className={`p-4 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
                >
                  <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button 
                  onClick={handleShare}
                  className="p-4 rounded-2xl shadow-xl backdrop-blur-md bg-white/90 text-slate-600 hover:text-emerald-600 transition-all active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
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
              </div>
              
              {isLowStock && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 animate-pulse">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-bold">تبقى فقط {product.stockQuantity} {product.unit === 'kg' ? 'كجم' : 'قطع'} في المخزن.</span>
                </div>
              )}

              <div className="flex items-baseline gap-4 py-4 border-y border-gray-100">
                <span className="text-5xl font-black text-indigo-600">
                  {product.price} <small className="text-lg font-bold">ج.م</small>
                </span>
                <span className="text-slate-400 font-bold text-sm">لكل {isWeightUnit ? 'كيلو' : 'وحدة'}</span>
              </div>

              {/* حقل اختيار الكمية/الوزن بدقة */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">الكمية المطلوبة</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
                       <button onClick={() => setQuantity(q => Math.max(0.1, q + (isWeightUnit ? 0.1 : 1)))} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 font-black text-xl hover:bg-indigo-50 transition">+</button>
                       <input 
                        type="number" 
                        step={isWeightUnit ? "0.001" : "1"}
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-transparent text-center font-black text-xl text-slate-800 outline-none"
                       />
                       <button onClick={() => setQuantity(q => Math.max(0.1, q - (isWeightUnit ? 0.1 : 1)))} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 font-black text-xl hover:bg-indigo-50 transition">-</button>
                    </div>
                    <span className="font-black text-slate-400 text-lg">{isWeightUnit ? 'كيلو جرام' : 'قطعة'}</span>
                 </div>
                 {isWeightUnit && quantity === 1.25 && (
                   <p className="text-emerald-600 font-bold text-xs animate-fadeIn">أهلاً بك! لقد اخترت كيلو وربع بدقة ✨</p>
                 )}
              </div>

              <div className="pt-8">
                <button 
                  disabled={isOutOfStock || quantity <= 0}
                  onClick={handleAddClick}
                  className={`w-full py-6 px-8 rounded-3xl font-black text-2xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 ${
                    isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {isOutOfStock ? 'نفذت الكمية' : 'إضافة للسلة الآن'}
                </button>
              </div>

              {/* أزرار المشاركة عبر التواصل الاجتماعي */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">مشاركة المنتج:</span>
                <div className="flex flex-wrap gap-2.5">
                  <a 
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-md hover:bg-[#20ba5a] hover:shadow-lg transition active:scale-95"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.733-1.458L0 24zm6.208-3.82c1.647.978 3.264 1.488 4.887 1.49 5.485-.004 9.985-4.485 9.988-9.93.001-2.639-1.02-5.12-2.871-6.973-1.852-1.854-4.328-2.877-6.974-2.878-5.49 0-9.99 4.483-9.993 9.93-.001 1.79.467 3.541 1.357 5.093l-.95 3.473 3.568-.936zM17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.476-.15-.676.15-.2.3-.778.98-.953 1.18-.175.2-.35.225-.651.075-3.007-1.5-5.05-2.778-6.196-4.747-.302-.518-.03-.8.228-1.056.232-.232.502-.589.752-.888.25-.299.333-.512.502-.852.167-.34.084-.639-.042-.889-.125-.25-1.008-2.433-1.38-3.328-.363-.872-.736-.753-.984-.766-.254-.012-.544-.015-.834-.015s-.76.11-1.157.545c-.397.436-1.517 1.484-1.517 3.619s1.554 4.195 1.77 4.492c.217.297 3.056 4.667 7.404 6.551 1.035.447 1.84.714 2.468.914 1.042.33 1.99.283 2.742.171.838-.125 1.78-.727 2.03-1.396.25-.67.25-1.242.175-1.396-.075-.15-.275-.25-.575-.401z"/>
                    </svg>
                    واتساب
                  </a>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-md hover:bg-[#1464cc] hover:shadow-lg transition active:scale-95"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    فيسبوك
                  </a>
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-md hover:bg-[#0077b3] hover:shadow-lg transition active:scale-95"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.62.15-.16 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.89 1.2-5.33 3.52-.5.35-.96.52-1.37.51-.46-.01-1.34-.26-1.99-.47-.8-.26-1.44-.4-1.38-.85.03-.23.35-.47.96-.71 3.76-1.64 6.27-2.72 7.53-3.25 3.58-1.51 4.32-1.77 4.8-.18z"/>
                    </svg>
                    تليجرام
                  </a>
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-md hover:bg-slate-200 transition active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    نسخ الرابط
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsView;