
import React from 'react';
import { CartItem } from '../types';

interface CartViewProps {
  cart: CartItem[];
  deliveryFee: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, deliveryFee, onUpdateQuantity, onSetQuantity, onRemove, onCheckout, onContinueShopping }) => {
  const safeCart = Array.isArray(cart) ? cart : [];
  const subtotal = safeCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  const total = subtotal + deliveryFee;

  if (safeCart.length === 0) {
    return (
      <div className="text-center py-16 md:py-24 bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 animate-fadeIn mx-2">
        <div className="bg-gray-50 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tighter">سلة التسوق فارغة</h2>
        <p className="text-gray-500 mt-2 mb-8 font-bold text-sm md:text-base px-6">لم تضف أي منتجات بعد. ابدأ بالتسوق الآن!</p>
        <button 
          onClick={onContinueShopping}
          className="bg-emerald-600 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-100 active:scale-95"
        >
          اكتشف المنتجات المميزة
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fadeIn px-1 md:px-0 pb-24 md:pb-10">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2 md:mb-6 px-2">
          <h2 className="text-xl md:text-3xl font-black flex items-center gap-2 md:gap-3">
            <span className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl text-lg md:text-2xl">🛒</span>
            سلة التسوق ({safeCart.length})
          </h2>
          <button 
            onClick={onContinueShopping}
            className="text-xs font-bold text-indigo-600 hover:underline md:hidden"
          >
            إضافة المزيد +
          </button>
        </div>

        <div className="space-y-3 md:space-y-4">
          {safeCart.map((item, idx) => {
            const images = Array.isArray(item.images) ? item.images : [];
            const displayImg = images.length > 0 ? images[0] : 'https://via.placeholder.com/150?text=No+Image';
            
            const isWeightUnit = item.unit === 'kg';
            const step = isWeightUnit ? 0.1 : 1;

            return (
              <div key={`${item.id}-${idx}`} className="bg-white p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] flex gap-3 md:gap-6 items-start border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl overflow-hidden border border-slate-50 shrink-0 shadow-sm">
                  <img src={displayImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                </div>

                <div className="flex-grow flex flex-col min-w-0 h-full justify-between py-0.5">
                  <div className="space-y-1">
                    <h3 className="font-black text-gray-800 text-sm md:text-lg leading-tight line-clamp-2 md:line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                         {item.unit === 'kg' ? 'كيلو' : item.unit === 'gram' ? 'جرام' : 'قطعة'}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 md:mt-4">
                    <div className="flex items-center bg-slate-50 rounded-lg md:rounded-xl border border-slate-100 p-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, step)}
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg transition font-black text-indigo-600 active:scale-90"
                      >+</button>
                      <input 
                        type="number"
                        step={isWeightUnit ? "0.001" : "1"}
                        value={item.quantity}
                        onChange={(e) => onSetQuantity(item.id, parseFloat(e.target.value) || 0)}
                        className="w-16 md:w-20 bg-transparent text-center font-black text-slate-700 text-xs md:text-sm outline-none border-x border-slate-200"
                      />
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -step)}
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg transition font-black text-indigo-600 active:scale-90"
                      >-</button>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                       <div className="text-sm md:text-xl font-black text-indigo-600">
                        {(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})} <small className="text-[8px] md:text-[10px] font-bold">ج.م</small>
                      </div>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="text-rose-500 text-[9px] md:text-xs font-black hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                      >حذف ✕</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-xl shadow-slate-200/50 lg:sticky lg:top-32">
          <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 pb-3 md:pb-4 border-b border-slate-50 text-slate-800">ملخص الفاتورة</h3>
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <div className="flex justify-between text-slate-500 font-bold text-xs md:text-sm">
              <span>المجموع الفرعي</span>
              <span>{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold text-xs md:text-sm">
              <span>التوصيل والشحن</span>
              <span className={deliveryFee === 0 ? "text-emerald-600" : "text-slate-800"}>
                {deliveryFee === 0 ? "توصيل مجاني" : `${deliveryFee.toLocaleString()} ج.م`}
              </span>
            </div>
            <div className="flex justify-between text-xl md:text-2xl font-black text-slate-900 pt-4 md:pt-5 border-t border-slate-50">
              <span>الإجمالي</span>
              <span className="text-indigo-600">{total.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={onCheckout}
              className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>إتمام الطلب الآن</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={onContinueShopping}
              className="w-full text-slate-400 py-3 rounded-2xl font-black hover:bg-slate-50 transition text-[10px] md:text-xs tracking-widest uppercase"
            >
              العودة للتسوق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartView;
