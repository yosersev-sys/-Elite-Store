
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
          <input type="text" placeholder="رقم الطلب أو الهاتف..." value={adminSearch} onChange={e => { setAdminSearch(e.target.value); setOrderPage(1); }} className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold" />
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
            {paginatedOrders.map(o => (
              <tr key={o.id} className={`hover:bg-slate-50 transition-colors ${o.status === 'cancelled' ? 'opacity-40 grayscale' : ''}`}>
                <td className="px-8 py-5">
                   <p className="font-black text-slate-700">#{o.id} - {o.customerName}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleString('ar-EG')} • {o.phone}</p>
                </td>
                <td className="px-8 py-5 font-black text-emerald-600">{(o.total || 0).toLocaleString()} ج.م</td>
                <td className="px-8 py-5">
                   <select 
                     value={o.paymentMethod} 
                     onChange={(e) => onUpdateOrderPayment(o.id, e.target.value)}
                     disabled={o.status === 'cancelled'}
                     className={`px-3 py-1.5 rounded-xl text-[10px] font-black border-none outline-none ${o.paymentMethod.includes('آجل') ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}
                   >
                     <option value="نقدي (تم الدفع)">نقدي ✅</option>
                     <option value="آجل (مديونية)">آجل ⏳</option>
                   </select>
                </td>
                <td className="px-8 py-5">
                  <div className="flex justify-center gap-2">
                     <button onClick={() => WhatsAppService.sendInvoiceToCustomer(o, o.phone)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">📱</button>
                     <button onClick={() => onViewOrder(o)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">🧾</button>
                     {o.status !== 'cancelled' && (
                       <button onClick={() => onReturnOrder(o.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">↩</button>
                     )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalOrderPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
           <button disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)} className="p-3 bg-white rounded-xl shadow-sm disabled:opacity-30">🡒</button>
           <span className="font-black text-xs text-slate-500">صفحة {orderPage} من {totalOrderPages}</span>
           <button disabled={orderPage === totalOrderPages} onClick={() => setOrderPage(p => p + 1)} className="p-3 bg-white rounded-xl shadow-sm disabled:opacity-30">🡐</button>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
