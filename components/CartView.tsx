
import React from 'react';
import { CartItem } from '../types';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

const CartView: React.FC<CartViewProps> = ({ cart, onUpdateQuantity, onRemove, onCheckout, onContinueShopping }) => {
  const safeCart = Array.isArray(cart) ? cart : [];
  const total = safeCart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

  if (safeCart.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100 animate-fadeIn">
        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tighter">سلة التسوق فارغة</h2>
        <p className="text-gray-500 mt-2 mb-8 font-bold">لم تضف أي منتجات بعد. ابدأ بالتسوق الآن!</p>
        <button 
          onClick={onContinueShopping}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
        >
          اكتشف المنتجات المميزة
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">🛒</span>
          سلة التسوق ({safeCart.length})
        </h2>
        {safeCart.map((item, idx) => {
          const images = Array.isArray(item.images) ? item.images : [];
          const displayImg = images.length > 0 ? images[0] : 'https://via.placeholder.com/150?text=No+Image';
          
          return (
            <div key={`${item.id}-${idx}`} className="bg-white p-5 rounded-[2rem] flex gap-6 items-center border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-50 shrink-0">
                <img src={displayImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
              </div>
              <div className="flex-grow">
                <h3 className="font-black text-gray-800 text-lg leading-tight">{item.name}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 mb-4">
                  {item.selectedSize && (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                      المقاس: {item.selectedSize}
                    </span>
                  )}
                  {item.selectedColor && (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                      اللون: {item.selectedColor}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-slate-50 rounded-xl px-1">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition font-black text-indigo-600"
                    >+</button>
                    <span className="px-4 font-black text-slate-700">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition font-black text-indigo-600"
                    >-</button>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="text-rose-500 text-xs font-black hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
                  >إزالة</button>
                </div>
              </div>
              <div className="text-xl font-black text-indigo-600 min-w-[120px] text-left">
                {(item.price * item.quantity).toLocaleString()} <small className="text-[10px] font-bold">ر.س</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-slate-200/50 sticky top-24">
          <h3 className="text-xl font-black mb-6 pb-4 border-b border-slate-50 text-slate-800">ملخص الفاتورة</h3>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>المجموع الفرعي</span>
              <span>{total.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>التوصيل والشحن</span>
              <span className="text-emerald-600">مجاني لفترة محدودة</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-slate-900 pt-5 border-t border-slate-50">
              <span>الإجمالي</span>
              <span className="text-indigo-600">{total.toLocaleString()} ر.س</span>
            </div>
          </div>
          <button 
            onClick={onCheckout}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            إتمام الطلب الآن
          </button>
          <button 
            onClick={onContinueShopping}
            className="w-full mt-3 text-slate-400 py-3 rounded-2xl font-black hover:bg-slate-50 transition text-xs tracking-widest uppercase"
          >
            العودة للتسوق
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartView;
