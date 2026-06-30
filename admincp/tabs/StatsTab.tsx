
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

  // حساب إحصائيات الوردية المفتوحة حالياً فقط
  const shiftStats = useMemo(() => {
    if (!activeShift || !activeShift.id) {
      return { sales: 0, profit: 0, ordersCount: 0, cashSales: 0, digitalSales: 0, debtSales: 0, avgOrderValue: 0, duration: '' };
    }

    const safeOrders = Array.isArray(orders) ? orders : [];
    const shiftOrders = safeOrders.filter(o => 
      o && (o.confirmedShiftId === activeShift.id || o.shiftId === activeShift.id) && o.status === 'completed'
    );

    const sales = shiftOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const ordersCount = shiftOrders.length;

    let cost = 0;
    let cashSales = 0;
    let digitalSales = 0;
    let debtSales = 0;

    shiftOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          if (item) cost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
        });
      }
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          if (p.method === 'cash') cashSales += Number(p.amount);
          else digitalSales += Number(p.amount);
        });
        debtSales += Number(o.outstandingAmount || 0);
      } else {
        if (String(o.paymentMethod).includes('نقدي') || String(o.paymentMethod).includes('عند الاستلام')) {
          cashSales += Number(o.total || 0);
        } else if (String(o.paymentMethod).includes('آجل')) {
          debtSales += Number(o.total || 0);
        } else {
          digitalSales += Number(o.total || 0);
        }
      }
    });

    // حساب مدة الوردية
    const startMs = Number(activeShift.startTime);
    const nowMs = Date.now();
    const diffMs = nowMs - startMs;
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const duration = hours > 0 ? `${hours} س ${mins} د` : `${mins} دقيقة`;

    return {
      sales,
      profit: sales - cost,
      ordersCount,
      cashSales,
      digitalSales,
      debtSales,
      avgOrderValue: ordersCount > 0 ? Math.round(sales / ordersCount) : 0,
      duration
    };
  }, [orders, activeShift]);

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

      {/* بطاقات إحصائيات الوردية المفتوحة حالياً */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        {/* هيدر الوردية */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg border ${activeShift?.id ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-slate-700/50 border-slate-600/30'}`}>
              {activeShift?.id ? '🟢' : '🔒'}
            </div>
            <div>
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                {activeShift?.id ? `الوردية #${activeShift.id}` : 'لا توجد وردية مفتوحة'}
                {activeShift?.id && (
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20">مفتوحة</span>
                )}
              </h4>
              <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                {activeShift?.id 
                  ? `${activeShift.openedByName || 'أدمن'} · منذ ${shiftStats.duration}`
                  : 'يرجى فتح وردية جديدة من الخزينة'
                }
              </p>
            </div>
          </div>
          {activeShift?.id && (
            <button 
              onClick={() => onNavigateToTab('shifts')}
              className="text-[10px] font-black text-slate-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all"
            >إدارة الورديات ←</button>
          )}
        </div>

        {activeShift?.id ? (
          <div className="p-6">
            {/* الصف الأول: 4 بطاقات رئيسية */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* مبيعات الوردية */}
              <div className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-lg shadow-emerald-100 overflow-hidden">
                <div className="absolute -left-3 -bottom-3 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">💰</span>
                    <span className="text-[8px] font-black text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full">الوردية</span>
                  </div>
                  <p className="text-[9px] font-bold text-emerald-100 mb-0.5">مبيعات الوردية</p>
                  <p className="text-xl font-black text-white tracking-tight">{shiftStats.sales.toLocaleString()} <span className="text-[10px] font-bold text-emerald-100">ج.م</span></p>
                </div>
              </div>

              {/* صافي ربح الوردية */}
              <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-lg shadow-slate-200 overflow-hidden">
                <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">📈</span>
                    <span className="text-[8px] font-black text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">الربح</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mb-0.5">صافي أرباح الوردية</p>
                  <p className={`text-xl font-black tracking-tight ${shiftStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{shiftStats.profit.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">ج.م</span></p>
                </div>
              </div>

              {/* عدد الفواتير */}
              <div className="group relative bg-gradient-to-br from-indigo-500 to-violet-600 p-5 rounded-2xl shadow-lg shadow-indigo-100 overflow-hidden">
                <div className="absolute -left-3 -top-3 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">🧾</span>
                    <span className="text-[8px] font-black text-indigo-100 bg-white/15 px-2 py-0.5 rounded-full">فواتير</span>
                  </div>
                  <p className="text-[9px] font-bold text-indigo-100 mb-0.5">فواتير الوردية</p>
                  <p className="text-xl font-black text-white tracking-tight">{shiftStats.ordersCount} <span className="text-[10px] font-bold text-indigo-100">فاتورة</span></p>
                </div>
              </div>

              {/* رصيد الدرج */}
              <div className="group relative bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-2xl shadow-lg shadow-amber-100 overflow-hidden">
                <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">🏦</span>
                    <span className="text-[8px] font-black text-amber-100 bg-white/15 px-2 py-0.5 rounded-full">الخزينة</span>
                  </div>
                  <p className="text-[9px] font-bold text-amber-100 mb-0.5">رصيد الدرج</p>
                  <p className="text-xl font-black text-white tracking-tight">{Number(activeShift.currentCashBalance).toLocaleString()} <span className="text-[10px] font-bold text-amber-100">ج.م</span></p>
                </div>
              </div>
            </div>

            {/* الصف الثاني: توزيع طرق الدفع + متوسط الفاتورة */}
            {shiftStats.sales > 0 && (
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-slate-500">توزيع التحصيل في الوردية</p>
                  <p className="text-[10px] font-bold text-slate-400">متوسط الفاتورة: <span className="text-slate-600 font-black">{shiftStats.avgOrderValue.toLocaleString()} ج.م</span></p>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden flex shadow-inner border border-slate-100">
                  {shiftStats.cashSales > 0 && (
                    <div style={{ width: `${(shiftStats.cashSales / shiftStats.sales) * 100}%` }} className="h-full bg-emerald-500 transition-all duration-700"></div>
                  )}
                  {shiftStats.digitalSales > 0 && (
                    <div style={{ width: `${(shiftStats.digitalSales / shiftStats.sales) * 100}%` }} className="h-full bg-indigo-500 transition-all duration-700"></div>
                  )}
                  {shiftStats.debtSales > 0 && (
                    <div style={{ width: `${(shiftStats.debtSales / shiftStats.sales) * 100}%` }} className="h-full bg-amber-500 transition-all duration-700"></div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2.5 text-[9px] font-black text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>نقدي: {shiftStats.cashSales.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span>بنكي: {shiftStats.digitalSales.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>آجل: {shiftStats.debtSales.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center space-y-3">
            <span className="text-4xl block">🔒</span>
            <p className="text-sm font-black text-slate-700">لا توجد وردية مفتوحة حالياً</p>
            <p className="text-[11px] text-slate-400 font-bold max-w-sm mx-auto">قم بفتح وردية جديدة من قسم الورديات لتتبع حركة المبيعات والخزينة</p>
            <button 
              onClick={() => onNavigateToTab('shifts')}
              className="mt-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >فتح وردية جديدة ←</button>
          </div>
        )}
      </div>

      {/* قسم النشاط المالي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

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


export default StatsTab;

