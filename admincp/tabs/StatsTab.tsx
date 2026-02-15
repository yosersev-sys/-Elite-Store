
import React, { useMemo } from 'react';
import { Product, Order } from '../../types';

interface StatsTabProps {
  products: Product[];
  orders: Order[];
  onNavigateToTab: (tab: any) => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ products, orders, onNavigateToTab }) => {
  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const lowStock = products.filter(p => Number(p.stockQuantity || 0) < 5);
    const debtOrders = activeOrders.filter(o => o.paymentMethod && o.paymentMethod.includes('آجل'));
    const totalDebtAmount = debtOrders.reduce((s, o) => s + Number(o.total || 0), 0);

    return { 
      totalSales, 
      lowStockCount: lowStock.length, 
      totalOrders: orders.length, 
      totalProducts: products.length,
      debtCount: debtOrders.length,
      totalDebtAmount
    };
  }, [products, orders]);

  return (
    <div className="space-y-10">
      {stats.debtCount > 0 && (
        <div className="bg-orange-500 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-orange-700 animate-slideDown">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl animate-pulse">⏳</div>
            <div>
              <h4 className="text-2xl font-black">تحذير مديونيات معلقة!</h4>
              <p className="text-orange-100 font-bold text-sm mt-1">يوجد {stats.debtCount} فواتير آجل لم يتم تحصيلها بإجمالي {stats.totalDebtAmount.toLocaleString()} ج.م</p>
            </div>
          </div>
          <button onClick={() => onNavigateToTab('orders')} className="bg-white text-orange-600 px-8 py-3.5 rounded-2xl font-black text-xs shadow-lg hover:bg-slate-900 hover:text-white transition-all">تحصيل الآن ←</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج.م`} icon="💰" color="emerald" />
         <StatCard title="إجمالي الطلبات" value={stats.totalOrders} icon="🧾" color="indigo" onClick={() => onNavigateToTab('orders')} />
         <StatCard title="نواقص المخزن" value={stats.lowStockCount} icon="⚠️" color="rose" onClick={() => onNavigateToTab('products')} />
         <StatCard title="أصناف المتجر" value={stats.totalProducts} icon="📦" color="amber" onClick={() => onNavigateToTab('products')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h4 className="font-black text-xl text-slate-800 mb-8">أحدث الطلبات</h4>
            <div className="space-y-4">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-emerald-50 transition-colors">
                   <div>
                      <p className="font-black text-sm text-slate-700">#{order.id} - {order.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                   </div>
                   <p className="font-black text-emerald-600">{Number(order.total || 0).toLocaleString()} ج.م</p>
                </div>
              ))}
            </div>
         </div>
         <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <h4 className="font-black text-xl text-slate-800 mb-8">نواقص عاجلة</h4>
            <div className="space-y-4">
              {products.filter(p => Number(p.stockQuantity || 0) < 5).slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-4 p-5 bg-rose-50/30 rounded-[1.5rem] border border-rose-100/50">
                   <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                   <div className="flex-grow">
                      <p className="font-black text-sm text-slate-700">{p.name}</p>
                      <p className="text-[10px] text-rose-500 font-bold">متبقي {p.stockQuantity} وحدات</p>
                   </div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, onClick }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <div onClick={onClick} className={`p-8 rounded-[3rem] border shadow-xl transition-all duration-500 hover:scale-105 ${themes[color]} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="text-4xl">{icon}</div>
        <div className="w-2 h-10 bg-current/10 rounded-full"></div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
};

export default StatsTab;
