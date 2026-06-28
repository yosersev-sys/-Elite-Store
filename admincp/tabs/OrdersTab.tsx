
import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { WhatsAppService } from '../../services/whatsappService';

interface OrdersTabProps {
  orders: Order[];
  adminSearch: string;
  isLoading: boolean;
  setAdminSearch: (val: string) => void;
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onUpdateOrderPayment: (id: string, paymentMethod: string) => Promise<void> | void;
  onReturnOrder: (id: string) => Promise<void> | void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, adminSearch, isLoading, setAdminSearch, onViewOrder, onEditOrder, onUpdateOrderPayment, onReturnOrder }) => {
  const [orderPage, setOrderPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const ordersPerPage = 10;
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handleReturnOrder = async (id: string) => {
    if (!confirm('هل تريد استرجاع هذه الفاتورة وإلغاء مبيعاتها وإعادة الكميات للمخزن؟')) return;
    setProcessingIds(prev => [...prev, id]);
    try {
      await onReturnOrder(id);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleUpdatePayment = async (id: string, paymentMethod: string) => {
    if (!confirm('هل تريد تأكيد استلام النقدية وإتمام الفاتورة؟')) return;
    setProcessingIds(prev => [...prev, id]);
    try {
      await onUpdateOrderPayment(id, paymentMethod);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    const q = adminSearch.toLowerCase().trim();
    if (!q) return result;
    return result.filter(o => 
      o.id.toLowerCase().includes(q) || 
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.paymentMethod && String(o.paymentMethod).toLowerCase().includes(q))
    );
  }, [orders, adminSearch, statusFilter]);

  const handleStatusFilterChange = (filter: 'all' | 'pending' | 'completed' | 'cancelled') => {
    setStatusFilter(filter);
    setOrderPage(1);
  };

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, orderPage]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex justify-end">
           <div className="w-80 h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
        </div>
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
           <div className="p-8 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                     <div className="space-y-2">
                        <div className="w-48 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="w-32 h-3 bg-slate-50 rounded-lg animate-pulse"></div>
                     </div>
                  </div>
                  <div className="w-20 h-6 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
              ))}
           </div>
           <div className="bg-slate-50 p-4 text-center">
              <p className="text-slate-400 font-black text-xs animate-bounce">جاري جلب أحدث الطلبات...</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'completed', 'cancelled'] as const).map(f => {
            let label = 'الكل';
            let colorClass = 'bg-slate-50 text-slate-500 border-slate-200';
            let activeColorClass = 'bg-slate-900 text-white border-slate-900';
            
            if (f === 'pending') {
              label = 'المعلقة ⏳';
              colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
              activeColorClass = 'bg-amber-500 text-white border-amber-500';
            } else if (f === 'completed') {
              label = 'المكتملة ✓';
              colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              activeColorClass = 'bg-emerald-600 text-white border-emerald-600';
            } else if (f === 'cancelled') {
              label = 'الملغاة ✕';
              colorClass = 'bg-rose-50 text-rose-600 border-rose-100';
              activeColorClass = 'bg-rose-500 text-white border-rose-500';
            }
            
            const isActive = statusFilter === f;
            
            return (
              <button
                key={f}
                onClick={() => handleStatusFilterChange(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isActive ? activeColorClass : `${colorClass} hover:bg-slate-100`}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="رقم الطلب أو الهاتف أو 'آجل'..." 
            value={adminSearch} 
            onChange={e => { setAdminSearch(e.target.value); setOrderPage(1); }} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all" 
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
              const currentPayment = o.paymentMethod || 'نقدي (تم الدفع)';
              const isDebt = String(currentPayment).includes('آجل');
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
                    ) : o.status === 'pending' ? (
                      <span className="px-4 py-1.5 bg-amber-100 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-200">معلق بانتظار التأكيد ⏳</span>
                    ) : isDebt ? (
                      <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-orange-200">آجل (مديونية) ⏳</span>
                    ) : (
                      <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-200">تم الدفع نقداً 💰</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                        {o.status === 'pending' && (
                          <button 
                            disabled={processingIds.includes(o.id)}
                            onClick={() => handleUpdatePayment(o.id, o.paymentMethod)} 
                            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-black disabled:opacity-50 flex items-center justify-center min-w-[36px]" 
                            title="تأكيد واستلام النقدية"
                          >
                            {processingIds.includes(o.id) ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : '✓'}
                          </button>
                        )}
                        <button onClick={() => WhatsAppService.sendInvoiceToCustomer(o, o.phone)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="إرسال واتساب">📱</button>
                        <button onClick={() => onViewOrder(o)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="عرض الفاتورة">🧾</button>
                        {!isCancelled && (
                          <button onClick={() => onEditOrder(o)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="تعديل الأصناف والحالة">✎</button>
                        )}
                        {!isCancelled && (
                          <button 
                            disabled={processingIds.includes(o.id)}
                            onClick={() => handleReturnOrder(o.id)} 
                            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[36px]" 
                            title="استرجاع الفاتورة"
                          >
                            {processingIds.includes(o.id) ? (
                              <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
                            ) : '↩'}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                  لا توجد طلبات مسجلة حالياً
                </td>
              </tr>
            )}
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
