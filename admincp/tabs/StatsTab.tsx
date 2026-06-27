
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Order, Category, Supplier, Shift } from '../../types';
import { ApiService } from '../../services/api';

interface StatsTabProps {
  products: Product[];
  orders: Order[];
  categories: Category[];
  suppliers: Supplier[];
  isLoading: boolean;
  onNavigateToTab: (tab: any, search?: string, filter?: string) => void;
  onOpenAddForm: () => void;
  // يمكن تمرير ملخص جاهز من السيرفر لسرعة فائقة
  adminSummary?: any; 
  loadProgress?: number;
}

const StatsTab: React.FC<StatsTabProps> = ({ 
  products = [], orders = [], categories = [], suppliers = [], 
  isLoading, onNavigateToTab, onOpenAddForm, adminSummary, loadProgress
}) => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  useEffect(() => {
    ApiService.getActiveShift()
      .then(setActiveShift)
      .catch(err => console.error('Failed to load active shift for stats dashboard', err));
  }, []);

  const todayStats = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    
    const safeOrders = Array.isArray(orders) ? orders : [];
    const todayOrders = safeOrders.filter(o => {
      if (!o) return false;
      const d = Number(o.createdAt);
      return d >= todayStart && d <= todayEnd && o.status === 'completed';
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const todayOrdersCount = todayOrders.length;

    let todayCashSales = 0;
    let todayDigitalSales = 0;
    let todayDebtSales = 0;

    todayOrders.forEach(o => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          if (p.method === 'cash') {
            todayCashSales += Number(p.amount);
          } else {
            todayDigitalSales += Number(p.amount);
          }
        });
        todayDebtSales += Number(o.outstandingAmount || 0);
      } else {
        if (String(o.paymentMethod).includes('نقدي') || String(o.paymentMethod).includes('عند الاستلام')) {
          todayCashSales += Number(o.total || 0);
        } else if (String(o.paymentMethod).includes('آجل')) {
          todayDebtSales += Number(o.total || 0);
        } else {
          todayDigitalSales += Number(o.total || 0);
        }
      }
    });

    return {
      todaySales,
      todayOrdersCount,
      todayCashSales,
      todayDigitalSales,
      todayDebtSales
    };
  }, [orders]);

  const stats = useMemo(() => {
    // إذا كان لدينا ملخص جاهز من السيرفر، نستخدمه فوراً
    if (adminSummary) {
      const catStats = Array.isArray(categories) ? categories.map(cat => {
        const count = Array.isArray(products) ? products.filter(p => p.categoryId === cat.id).reduce((s, p) => s + (Number(p.salesCount) || 0), 0) : 0;
        return { name: cat.name, count };
      }).sort((a, b) => b.count - a.count).slice(0, 4) : [];

      return {
        totalSales: adminSummary.total_revenue || 0,
        totalDebtAmount: adminSummary.total_customer_debt || 0,
        totalSupplierDebt: adminSummary.total_supplier_debt || 0,
        lowStockCount: adminSummary.low_stock_count || 0,
        newOrders: adminSummary.new_orders_count || 0,
        netProfit: adminSummary.total_revenue * 0.25, // تقديري حتى اكتمال جلب الطلبات
        catStats
      };
    }

    // الطريقة التقليدية (Fallback) في حال عدم وصول الملخص
    const safeOrders = Array.isArray(orders) ? orders : [];
    const activeOrders = safeOrders.filter(o => o && o.status === 'completed');
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

    const safeProducts = Array.isArray(products) ? products : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const catStats = safeCategories.map(cat => {
      const count = safeProducts.filter(p => p && p.categoryId === cat.id).reduce((s, p) => s + (Number(p.salesCount) || 0), 0);
      return { name: cat.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 4);

    return { 
      totalSales, 
      netProfit: totalSales - totalCost,
      lowStockCount: safeProducts.filter(p => Number(p.stockQuantity || 0) < (p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5)).length,
      totalDebtAmount: activeOrders.reduce((s, o) => {
        if (o.outstandingAmount !== undefined) return s + Number(o.outstandingAmount || 0);
        return String(o.paymentMethod).includes('آجل') ? s + Number(o.total || 0) : s;
      }, 0),
      totalSupplierDebt: safeSuppliers.reduce((s, sup) => s + Number(sup.balance || 0), 0),
      catStats,
      newOrders: 0
    };
  }, [products, orders, categories, suppliers, adminSummary]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {isLoading && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl space-y-3 animate-fadeIn">
           <div className="flex justify-between items-center font-black text-xs text-emerald-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                مزامنة أحدث الأرقام المباشرة...
              </span>
              <span>{loadProgress || 0}%</span>
           </div>
           <div className="w-full bg-emerald-100/50 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${loadProgress || 0}%` }}
              ></div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.totalDebtAmount > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/30 animate-pulse">⏳</div>
              <div>
                <h4 className="text-xl font-black leading-tight">ديون العملاء</h4>
                <p className="text-orange-50 font-bold text-[10px] mt-1 tracking-wide">مطلوب تحصيل {stats.totalDebtAmount.toLocaleString()} ج.م</p>
              </div>
            </div>
            <button onClick={() => onNavigateToTab('ledger')} className="relative z-10 bg-white text-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">🔍</button>
          </div>
        )}

        {stats.totalSupplierDebt > 0 && (
          <div className="bg-gradient-to-r from-rose-600 to-rose-400 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/30">🚛</div>
              <div>
                <h4 className="text-xl font-black leading-tight">حسابات الموردين</h4>
                <p className="text-rose-50 font-bold text-[10px] mt-1 tracking-wide">مستحق دفع {stats.totalSupplierDebt.toLocaleString()} ج.م</p>
              </div>
            </div>
            <button onClick={() => onNavigateToTab('suppliers', '', 'debtors')} className="relative z-10 bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">📋</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ج.م`} icon="💰" color="emerald" />
          <StatCard title="صافي الأرباح" value={`${stats.netProfit.toLocaleString()} ج.م`} icon="📈" color="indigo" isDark />
          <StatCard title="نواقص المخزن" value={stats.lowStockCount} icon="⚠️" color="rose" onClick={() => onNavigateToTab('products', '', 'low_stock')} />
          <StatCard title="طلبات اليوم" value={stats.newOrders || todayStats.todayOrdersCount} icon="⚡" color="amber" onClick={() => onNavigateToTab('orders')} />
      </div>

      {/* قسم النشاط المالي وحالة الوردية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* حالة الوردية الجارية */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-between">
           <div>
              <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                 <span>حالة الوردية الجارية</span>
                 <span className="animate-pulse">⏱️</span>
              </h4>
              <p className="text-slate-400 text-xs font-bold mt-1">تتبع كاشير الوردية الحالية ونقدية الخزينة</p>
           </div>
           
           {activeShift && activeShift.id ? (
             <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100">
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase">الوردية المفتوحة</p>
                      <p className="text-sm font-black mt-0.5">#{activeShift.id} - {activeShift.openedByName || 'أدمن'}</p>
                   </div>
                   <span className="text-2xl">🟢</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-slate-400 text-[10px] font-black mb-1">نقدية البداية</p>
                      <p className="text-sm font-black text-slate-800">{Number(activeShift.startingCash).toFixed(2)} ج.م</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-slate-400 text-[10px] font-black mb-1">رصيد الدرج المتوقع</p>
                      <p className="text-sm font-black text-emerald-600">{Number(activeShift.currentCashBalance).toFixed(2)} ج.م</p>
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center mt-2">
                   بدأت الوردية في: {new Date(activeShift.startTime).toLocaleString('ar-EG')}
                </p>
             </div>
           ) : (
             <div className="mt-6 p-8 bg-slate-50 rounded-3xl border border-dashed text-center space-y-3">
                <span className="text-3xl">🔒</span>
                <p className="text-xs font-black text-slate-700">لا توجد وردية مفتوحة بالدرج حالياً</p>
                <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto">الفواتير الجديدة ستبقي معلقة حتى يتم فتح وردية جديدة لتسجيل حركات الخزينة.</p>
             </div>
           )}
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end gap-3">
               {activeShift && activeShift.id && (
                 <button 
                   onClick={() => {
                     localStorage.setItem('shifts_tab_initial_action', 'close');
                     onNavigateToTab('shifts');
                   }} 
                   className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-rose-100 active:scale-95 cursor-pointer"
                 >
                    إغلاق الوردية 🔒
                 </button>
               )}
               <button 
                 onClick={() => onNavigateToTab('shifts')} 
                 className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-2.5 rounded-xl font-black text-xs transition-all"
               >
                  إدارة الخزينة والورديات ←
               </button>
            </div>
        </div>

        {/* مبيعات اليوم وتفاصيل الدفع */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-between">
           <div>
              <h4 className="font-black text-lg text-slate-800">حركة المبيعات اليومية</h4>
              <p className="text-slate-400 text-xs font-bold mt-1">تفاصيل فواتير اليوم وتصنيف طرق تحصيلها</p>
           </div>

           <div className="mt-6 space-y-6">
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 mb-1">إجمالي مبيعات اليوم</p>
                    <p className="text-3xl font-black text-slate-800">{todayStats.todaySales.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
                 </div>
                 <div className="text-left font-bold text-slate-500 text-xs">
                    {todayStats.todayOrdersCount} فواتير مكتملة
                 </div>
              </div>

              {/* شريط توزيع طرق الدفع لليوم */}
              {todayStats.todaySales > 0 ? (
                <div className="space-y-4">
                   <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-50">
                      {todayStats.todayCashSales > 0 && (
                        <div 
                          style={{ width: `${(todayStats.todayCashSales / todayStats.todaySales) * 100}%` }} 
                          className="h-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-black"
                        >
                           نقدي
                        </div>
                      )}
                      {todayStats.todayDigitalSales > 0 && (
                        <div 
                          style={{ width: `${(todayStats.todayDigitalSales / todayStats.todaySales) * 100}%` }} 
                          className="h-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-black"
                        >
                           بنكي
                        </div>
                      )}
                      {todayStats.todayDebtSales > 0 && (
                        <div 
                          style={{ width: `${(todayStats.todayDebtSales / todayStats.todaySales) * 100}%` }} 
                          className="h-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-black"
                        >
                           آجل
                        </div>
                      )}
                   </div>
                   <div className="flex flex-wrap gap-4 text-[9px] font-black text-slate-500">
                      <div className="flex items-center gap-1.5">
                         <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                         <span>نقدي: {todayStats.todayCashSales.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                         <span>بنكي/فيزا: {todayStats.todayDigitalSales.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                         <span>آجل (ديون): {todayStats.todayDebtSales.toLocaleString()} ج.م</span>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-300 font-bold text-xs">لا يوجد مبيعات مسجلة لليوم بعد</div>
              )}
           </div>

           <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
              <button 
                onClick={() => onNavigateToTab('orders')} 
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-black text-xs transition-all"
              >
                 عرض فواتير اليوم ←
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
           <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xl text-slate-800">الأدوات السريعة</h4>
                <p className="text-slate-400 text-xs font-bold mt-1">الوصول المباشر لأقسام المتجر</p>
              </div>
              <button onClick={onOpenAddForm} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px]">إضافة صنف +</button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionButton label="المخزن" icon="📦" onClick={() => onNavigateToTab('products')} />
              <QuickActionButton label="الطلبات" icon="🛍️" onClick={() => onNavigateToTab('orders')} />
              <QuickActionButton label="الأعضاء" icon="👥" onClick={() => onNavigateToTab('members')} />
              <QuickActionButton label="الموردين" icon="🚛" onClick={() => onNavigateToTab('suppliers')} />
           </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100">
           <h4 className="font-black text-xl text-slate-800 mb-8">الأكثر طلباً 🏆</h4>
           <div className="space-y-6">
              {stats.catStats.length > 0 ? stats.catStats.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-black text-slate-700">{cat.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{cat.count} قطعة</span>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats.catStats[0].count > 0 ? (cat.count / stats.catStats[0].count) * 100 : 0}%` }}></div>
                   </div>
                </div>
              )) : <p className="text-center py-10 text-slate-300 font-bold">لا توجد بيانات مبيعات</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

const QuickActionButton = ({ label, icon, onClick }: any) => (
  <button onClick={onClick} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-900 hover:text-white transition-all active:scale-95 group shadow-sm">
    <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color, onClick, isDark }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <div onClick={onClick} className={`p-8 rounded-[3rem] border shadow-xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden group ${isDark ? 'bg-slate-900 text-white border-slate-800' : themes[color]} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`text-4xl ${isDark ? 'text-emerald-500' : ''}`}>{icon}</div>
      </div>
      <div className="relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-400' : 'opacity-60'}`}>{title}</p>
        <p className="text-2xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default StatsTab;
