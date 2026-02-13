
import React from 'react';
import { Order } from '../types';

interface MyOrdersViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onBack: () => void;
}

const MyOrdersView: React.FC<MyOrdersViewProps> = ({ orders, onViewDetails, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">طلباتي 📦</h2>
          <p className="text-slate-400 font-bold text-sm mt-1">تتبع مشترياتك السابقة من سوق العصر</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-white border-2 border-slate-100 px-6 py-2.5 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          رجوع
        </button>
      </div>

      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div 
              key={order.id}
              className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-emerald-50 transition-colors">
                  🧾
                </div>
                <div>
                  <p className="font-black text-slate-800 text-lg">طلب #{order.id}</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {new Date(order.createdAt).toLocaleString('ar-SA')} • {order.items.length} منتجات
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-center md:text-left flex-grow md:flex-grow-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الإجمالي</p>
                  <p className="text-xl font-black text-emerald-600">{order.total.toFixed(2)} ج.م</p>
                </div>
                <button 
                  onClick={() => onViewDetails(order)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                >
                  عرض الفاتورة
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-20 text-center">
            <div className="text-6xl mb-6 opacity-20">🛒</div>
            <p className="text-slate-400 font-black text-xl">لا توجد طلبات مسجلة باسمك بعد.</p>
            <button onClick={onBack} className="mt-6 bg-emerald-600 text-white px-10 py-3 rounded-2xl font-black shadow-lg">ابدأ التسوق الآن</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersView;
