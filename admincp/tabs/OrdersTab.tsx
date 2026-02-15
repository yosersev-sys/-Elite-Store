
import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { WhatsAppService } from '../../services/whatsappService';

interface OrdersTabProps {
  orders: Order[];
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  onViewOrder: (order: Order) => void;
  onUpdateOrderPayment: (id: string, paymentMethod: string) => void;
  onReturnOrder: (id: string) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, adminSearch, setAdminSearch, onViewOrder, onUpdateOrderPayment, onReturnOrder }) => {
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;

  const filteredOrders = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(o => 
      o.id.toLowerCase().includes(q) || 
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q))
    );
  }, [orders, adminSearch]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, orderPage]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="رقم الطلب أو الهاتف..." 
            value={adminSearch} 
            onChange={e => { setAdminSearch(e.target.value); setOrderPage(1); }} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold" 
          />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-8 py-5">رقم الطلب والعميل</th>
              <th className="px-8 py-5">الإجمالي</th>
              <th className="px-8 py-5">حالة الدفع</th>
              <th className="px-8 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedOrders.map(o => {
              const isDebt = o.paymentMethod.includes('آجل');
              const isCancelled = o.status === 'cancelled';
              
              return (
                <tr key={o.id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'opacity-40 grayscale' : ''}`}>
                  <td className="px-8 py-5">
                     <p className="font-black text-slate-700">#{o.id} - {o.customerName}</p>
                     <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleString('ar-EG')} • {o.phone}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-emerald-600">{(o.total || 0).toLocaleString()} ج.م</td>
                  <td className="px-8 py-5">
                    {isCancelled ? (
                      <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest">مسترجع ↩️</span>
                    ) : (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50">
                        <button 
                          onClick={() => onUpdateOrderPayment(o.id, 'نقدي (تم الدفع)')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${!isDebt ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                        >
                          نقدي 💰
                        </button>
                        <button 
                          onClick={() => onUpdateOrderPayment(o.id, 'آجل (مديونية)')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${isDebt ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                        >
                          آجل ⏳
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => WhatsAppService.sendInvoiceToCustomer(o, o.phone)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="إرسال واتساب">📱</button>
                       <button onClick={() => onViewOrder(o)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="عرض الفاتورة">🧾</button>
                       {!isCancelled && (
                         <button onClick={() => onReturnOrder(o.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="استرجاع الفاتورة">↩</button>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalOrderPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
           <button disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)} className="p-3 bg-white rounded-xl shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">🡒</button>
           <div className="flex items-center gap-2">
              <span className="font-black text-xs text-slate-400 uppercase tracking-widest">صفحة</span>
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black">{orderPage}</span>
              <span className="font-black text-xs text-slate-400 uppercase tracking-widest">من {totalOrderPages}</span>
           </div>
           <button disabled={orderPage === totalOrderPages} onClick={() => setOrderPage(p => p + 1)} className="p-3 bg-white rounded-xl shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">🡐</button>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
