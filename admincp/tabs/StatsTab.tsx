import React, { useMemo } from 'react';
import { Product, Order, Category, Supplier } from '../../types';

interface StatsTabProps {
  products: Product[];
  orders: Order[];
  categories: Category[];
  suppliers: Supplier[];
  isLoading: boolean;
  onNavigateToTab: (tab: any, search?: string, filter?: string) => void;
  onOpenAddForm: () => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ products = [], orders = [], categories = [], suppliers = [], isLoading, onNavigateToTab, onOpenAddForm }) => {
  const stats = useMemo(() => {
    // التأكد من أن جميع المدخلات مصفوفات
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const activeOrders = safeOrders.filter(o => o && o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    
    let totalCost = 0;
    activeOrders.forEach(o => {
      if (o && o.items) {
        o.items.forEach(item => {
          if (item) {
            totalCost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
          }
        });
      }
    });

    const netProfit = totalSales - totalCost;
    const avgOrderValue = activeOrders.length > 0 ? totalSales / activeOrders.length : 0;
    const lowStock = safeProducts.filter(p => p && Number(p.stockQuantity || 0) < 5);
    
    const debtOrders = activeOrders.filter(o => o && o.paymentMethod && String(o.paymentMethod).includes('آجل'));
    const totalDebtAmount = debtOrders.reduce((s, o) => s + Number(o.total || 0), 0);

    const debtorSuppliers = safeSuppliers.filter(s => s && Number(s.balance || 0) > 0);
    const totalSupplierDebt = debtorSuppliers.reduce((s, sup) => s + Number(sup.balance || 0), 0);

    const catStats = safeCategories.map(cat => {
      const count = safeProducts.filter(p => p && p.categoryId === cat.id).reduce((s, p) => s + (Number(p.salesCount) || 0), 0);
      return { name: cat.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 4);

    return { 
      totalSales, 
      totalCost,
      netProfit,
      avgOrderValue,
      lowStockCount: lowStock.length, 
      totalOrders: safeOrders.length, 
      totalProducts: safeProducts.length,
      debtCount: debtOrders.length,
      totalDebtAmount,
      totalSupplierDebt,
      debtorSuppliersCount: debtorSuppliers.length,
      catStats
    };
  }, [products, orders, categories, suppliers]);

  if (isLoading && (!stats || stats.totalProducts === 0)) {
    return (
      <div className="space-y-10 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="h-32 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse flex items-center p-8 gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-100 rounded-lg"></div>
                <div className="w-48 h-3 bg-slate-50 rounded-lg"></div>
              </div>
           </div>
           <div className="h-32 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse flex items-center p-8 gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-100 rounded-lg"></div>
                <div className="w-48 h-3 bg-slate-50 rounded-lg"></div>
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[...Array(4)].map((_, i) => (
             <div key={i} className="h-44 bg-white rounded-[3rem] border border-slate-100 animate-pulse p-8">
                <div className="flex justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                  <div className="w-12 h-4 bg-slate-50 rounded-full"></div>
                </div>
                <div className="space-y-2">
                   <div className="w-20 h-2 bg-slate-50 rounded"></div>
                   <div className="w-28 h-6 bg-slate-100 rounded"></div>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.debtCount > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/30 animate-pulse">⏳</div>
              <div>
                <h4 className="text-xl font-black leading-tight">ديون العملاء</h4>
                <p className="text-orange-50 font-bold text-[10px] mt-1 tracking-wide">مطلوب تحصيل {stats.totalDebtAmount.toLocaleString()} ج.م</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigateToTab('orders', 'آجل')} 
              className="relative z-10 bg-white text-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
            >
              🔍
            </button>
          </div>
        )}

        {stats.debtorSuppliersCount > 0 && (
          <div className="bg-gradient-to-r from-rose-600 to-rose-400 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/30">🚛</div>
              <div>
                <h4 className="text-xl font-black leading-tight">حسابات الموردين</h4>
                <p className="text-rose-50 font-bold text-[10px] mt-1 tracking-wide">مستحق دفع {stats.totalSupplierDebt.toLocaleString()} ج.م</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigateToTab('suppliers', '', 'debtors')} 
              className="relative z-10 bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl hover:bg-white hover:text-rose-600 transition-all active:scale-95"
              title="عرض الموردين المدينين"
            >
              📋
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج.م`} icon="💰" color="emerald" trend="+12% اليوم" />
         <StatCard title="صافي الأرباح" value={`${stats.netProfit.toLocaleString()} ج.م`} icon="📈" color="indigo" isDark />
         <StatCard title="نواقص المخزن" value={stats.lowStockCount} icon="⚠️" color="rose" onClick={() => onNavigateToTab('products', '', 'low_stock')} trend="بحاجة لطلب" />
         <StatCard title="ديون الموردين" value={`${stats.totalSupplierDebt.toLocaleString()} ج.م`} icon="💸" color="amber" onClick={() => onNavigateToTab('suppliers')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
           <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xl text-slate-800">تحليل المبيعات والمخزون</h4>
                <p className="text-slate-400 text-xs font-bold mt-1">مقارنة بين التكلفة وصافي الربح</p>
              </div>
              <div className="flex gap-2">
                <button onClick={onOpenAddForm} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px]">إضافة صنف +</button>
              </div>
           </div>

           <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-end px-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">هيكل الدخل الحالي</span>
                    <span className="text-xs font-bold text-emerald-600">الربح الصافي: {stats.totalSales > 0 ? ((stats.netProfit/stats.totalSales)*100).toFixed(1) : 0}%</span>
                 </div>
                 <div className="h-14 w-full bg-slate-100 rounded-2xl overflow-hidden flex shadow-inner border-4 border-white">
                    <div 
                      style={{ width: `${stats.totalSales > 0 ? (stats.totalCost / stats.totalSales) * 100 : 0}%` }} 
                      className="h-full bg-slate-300 flex items-center justify-center text-[9px] text-white font-black transition-all duration-1000"
                    >
                      التكلفة
                    </div>
                    <div 
                      style={{ width: `${stats.totalSales > 0 ? (stats.netProfit / stats.totalSales) * 100 : 0}%` }} 
                      className="h-full bg-emerald-500 flex items-center justify-center text-[9px] text-white font-black transition-all duration-1000"
                    >
                      صافي الربح ✨
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <QuickActionButton label="المخزن" icon="📦" onClick={() => onNavigateToTab('products')} />
                 <QuickActionButton label="الطلبات" icon="🛍️" onClick={() => onNavigateToTab('orders')} />
                 <QuickActionButton label="الأعضاء" icon="👥" onClick={() => onNavigateToTab('members')} />
                 <QuickActionButton label="الموردين" icon="🚛" onClick={() => onNavigateToTab('suppliers')} />
              </div>
           </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100">
           <h4 className="font-black text-xl text-slate-800 mb-8">الأكثر طلباً 🏆</h4>
           <div className="space-y-6">
              {stats.catStats.length > 0 ? stats.catStats.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-black text-slate-700">{cat.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{cat.count} مبيعة</span>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 delay-${idx*200}`}
                        style={{ width: `${stats.catStats[0].count > 0 ? (cat.count / stats.catStats[0].count) * 100 : 0}%` }}
                      ></div>
                   </div>
                </div>
              )) : <p className="text-center py-10 text-slate-300 font-bold">لا توجد بيانات مبيعات</p>}
           </div>
           <button onClick={() => onNavigateToTab('categories')} className="w-full mt-10 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] hover:bg-emerald-50 hover:text-emerald-600 transition-colors">إدارة الأقسام ←</button>
        </div>
      </div>
    </div>
  );
};

const QuickActionButton = ({ label, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-900 hover:text-white transition-all active:scale-95 group shadow-sm"
  >
    <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color, onClick, trend, isDark }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div 
      onClick={onClick} 
      className={`p-8 rounded-[3rem] border shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden group ${
        isDark ? 'bg-slate-900 text-white border-slate-800' : themes[color]
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 text-7xl">{icon}</div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`text-4xl ${isDark ? 'text-emerald-500' : ''}`}>{icon}</div>
        {trend && (
           <span className={`text-[8px] font-black px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/50 text-current'}`}>
             {trend}
           </span>
        )}
      </div>
      <div className="relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-400' : 'opacity-60'}`}>{title}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default StatsTab;