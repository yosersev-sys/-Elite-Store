
import React from 'react';
import { Order } from '../types';
import { WhatsAppService } from '../services/whatsappService';

interface NewOrderPopupProps {
  orders: Order[];
  onClose: (id: string) => void;
  onView: (order: Order) => void;
}

const NewOrderPopup: React.FC<NewOrderPopupProps> = ({ orders, onClose, onView }) => {
  if (orders.length === 0) return null;

  // نعرض أحدث طلب وصل في القائمة
  const order = orders[0];
  const isQuickInvoice = order.id.startsWith('INV-') || order.id.startsWith('OFF-') || order.id.startsWith('OFFLINE-') || order.isOffline;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-slideUp">
        {/* Header Section */}
        <div className={`${isQuickInvoice ? 'bg-indigo-600' : 'bg-emerald-600'} p-6 text-white relative`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">{isQuickInvoice ? '🧾' : '🛍️'}</div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce">
              {isQuickInvoice ? '⚡' : '🔥'}
            </div>
            <div>
              <h3 className="text-xl font-black">
                {isQuickInvoice ? 'فاتورة سريعة جديدة!' : 'وصل طلب جديد الآن!'}
              </h3>
              <p className={`${isQuickInvoice ? 'text-indigo-100' : 'text-emerald-100'} text-[10px] font-bold uppercase tracking-widest`}>
                {isQuickInvoice ? 'بيان فوري' : 'طلب من المتجر'} : #{order.id}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-50 pb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">العميل</p>
              <p className="text-xl font-black text-slate-800">{order.customerName}</p>
              <p className={`${isQuickInvoice ? 'text-indigo-600' : 'text-emerald-600'} font-bold text-sm`}>{order.phone}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الفاتورة</p>
              <p className={`text-2xl font-black ${isQuickInvoice ? 'text-indigo-600' : 'text-emerald-600'}`}>
                {order.total.toLocaleString()} ج.م
              </p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">الأصناف المطلوبة</p>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white ${isQuickInvoice ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                  {isQuickInvoice ? 'فاتورة سريعة' : 'طلب سلة'}
                </span>
             </div>
             <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
               {order.items.map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                   <div className="flex items-center gap-3">
                     <img src={item.images[0]} className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="" />
                     <span className="font-bold text-slate-700 truncate max-w-[180px]">{item.name}</span>
                   </div>
                   <span className="text-slate-400 font-black">×{item.quantity}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
             <span className="text-xl">📍</span>
             <p className="text-amber-800 text-[11px] font-bold leading-relaxed">العنوان: {order.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => { onView(order); onClose(order.id); }}
              className="bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              فتح وتجهيز الفاتورة 🧾
            </button>
            <button 
              onClick={() => WhatsAppService.sendOrderNotification(order, order.phone)}
              className={`${isQuickInvoice ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} py-4 rounded-2xl font-black text-xs transition-all active:scale-95`}
            >
              تواصل واتساب 💬
            </button>
          </div>
          
          <button 
            onClick={() => onClose(order.id)}
            className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest pt-2 hover:text-rose-500 transition-colors"
          >
            إغلاق التنبيه
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPopup;
