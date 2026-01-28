
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
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fadeIn">
        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">سلة التسوق فارغة</h2>
        <p className="text-gray-500 mt-2 mb-8">لم تضف أي منتجات بعد. ابدأ بالتسوق الآن!</p>
        <button 
          onClick={onContinueShopping}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition"
        >
          اكتشف المنتجات
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-3xl font-bold mb-6">سلة التسوق ({cart.length})</h2>
        {cart.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="bg-white p-4 rounded-2xl flex gap-4 items-center border border-gray-100 hover:shadow-md transition">
            <img src={item.images[0]} className="w-24 h-24 rounded-xl object-cover" alt={item.name} />
            <div className="flex-grow">
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 mb-3">
                {item.selectedSize && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                    المقاس: {item.selectedSize}
                  </span>
                )}
                {item.selectedColor && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                    اللون: {item.selectedColor}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="px-3 py-1 hover:bg-gray-50 font-bold"
                  >+</button>
                  <span className="px-4 py-1 border-x border-gray-200 font-semibold">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="px-3 py-1 hover:bg-gray-50 font-bold"
                  >-</button>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-red-500 text-sm font-semibold hover:underline"
                >إزالة</button>
              </div>
            </div>
            <div className="text-xl font-bold text-indigo-600 min-w-[100px] text-left">
              {item.price * item.quantity} ر.س
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
          <h3 className="text-xl font-bold mb-6 pb-4 border-b">ملخص الطلب</h3>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-600 font-bold">
              <span>المجموع الفرعي</span>
              <span>{total} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-600 font-bold">
              <span>التوصيل</span>
              <span className="text-green-600">مجاني</span>
            </div>
            <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t">
              <span>الإجمالي</span>
              <span className="text-indigo-600">{total} ر.س</span>
            </div>
          </div>
          <button 
            onClick={onCheckout}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition shadow-lg active:scale-95"
          >
            الانتقال لإتمام الطلب
          </button>
          <button 
            onClick={onContinueShopping}
            className="w-full mt-3 text-gray-500 py-3 rounded-2xl font-bold hover:bg-gray-50 transition text-sm"
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartView;
