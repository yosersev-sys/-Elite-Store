
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
  const [activeShiftExpenses, setActiveShiftExpenses] = useState<number>(0);

  const [activeModal, setActiveModal] = useState<'sales' | 'profit' | 'cash' | 'digital' | 'debt' | 'expenses' | null>(null);
  const [shiftDetails, setShiftDetails] = useState<any>(null);
  const [shiftExpenses, setShiftExpenses] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const fetchShiftDetails = (type: any) => {
    setActiveModal(type);
    if (!activeShift || !activeShift.id) return;
    setIsLoadingDetails(true);
    setDetailsError(null);
    setShiftDetails(null);

    Promise.all([
      ApiService.getShiftDetails(activeShift.id),
      ApiService.getExpenses()
    ])
      .then(([details, expenses]) => {
        if (!details) {
          throw new Error('تعذر جلب تفاصيل الوردية من السيرفر');
        }
        setShiftDetails(details);
        const relatedExpenses = expenses.filter((e: any) => e.shiftId === activeShift.id && e.status === 'active');
        setShiftExpenses(relatedExpenses);
      })
      .catch(err => {
        console.error("Error loading shift details:", err);
        setDetailsError(err.message || 'فشل الاتصال بالسيرفر. يرجى التحقق من الشبكة وإعادة المحاولة.');
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  };

  useEffect(() => {
    ApiService.getActiveShift()
      .then(shift => {
        setActiveShift(shift);
        if (shift && shift.id) {
          ApiService.getExpenses()
            .then(list => {
              const shiftExp = list
                .filter(e => e.shiftId === shift.id && e.status === 'active')
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);
              setActiveShiftExpenses(shiftExp);
            })
            .catch(err => console.error('Failed to load active shift expenses', err));
        }
      })
      .catch(err => console.error('Failed to load active shift for stats dashboard', err));
  }, [isLoading]);

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
      return { sales: 0, profit: 0, ordersCount: 0, cashSales: 0, digitalSales: 0, debtSales: 0, vodafoneSales: 0, instapaySales: 0, visaSales: 0, avgOrderValue: 0, duration: '' };
    }

    const safeOrders = Array.isArray(orders) ? orders : [];
    const shiftOrders = safeOrders.filter(o => 
      o && (o.confirmedShiftId === activeShift.id || o.shiftId === activeShift.id) && o.status === 'completed'
    );

    const sales = shiftOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const ordersCount = shiftOrders.length;

    let cost = 0;
    let cashSales = 0;
    let debtSales = 0;
    let vodafoneSales = 0;
    let instapaySales = 0;
    let visaSales = 0;

    shiftOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          if (item) cost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
        });
      }
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          const method = String(p.method || '').toLowerCase();
          const amount = Number(p.amount || 0);
          if (method === 'cash' || method.includes('نقدي')) {
            cashSales += amount;
          } else if (method === 'vodafone' || method.includes('فودافون')) {
            vodafoneSales += amount;
          } else if (method === 'instapay' || method.includes('انستا')) {
            instapaySales += amount;
          } else if (method === 'visa' || method.includes('فيزا') || method.includes('card') || method.includes('بطاقة')) {
            visaSales += amount;
          } else {
            visaSales += amount;
          }
        });
        debtSales += Number(o.outstandingAmount || 0);
      } else {
        const methodStr = String(o.paymentMethod || '').toLowerCase();
        const totalAmount = Number(o.total || 0);
        if (methodStr.includes('نقدي') || methodStr.includes('عند الاستلام') || methodStr === 'cash') {
          cashSales += totalAmount;
        } else if (methodStr.includes('آجل') || methodStr.includes('debt') || methodStr.includes('credit')) {
          debtSales += totalAmount;
        } else if (methodStr.includes('فودافون') || methodStr.includes('vodafone')) {
          vodafoneSales += totalAmount;
        } else if (methodStr.includes('انستا') || methodStr.includes('instapay')) {
          instapaySales += totalAmount;
        } else if (methodStr.includes('فيزا') || methodStr.includes('visa') || methodStr.includes('card') || methodStr.includes('بطاقة')) {
          visaSales += totalAmount;
        } else {
          visaSales += totalAmount;
        }
      }
    });

    const digitalSales = vodafoneSales + instapaySales + visaSales;

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
      vodafoneSales,
      instapaySales,
      visaSales,
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
              <div 
                onClick={() => fetchShiftDetails('sales')} 
                className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-lg shadow-emerald-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
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
              <div 
                onClick={() => fetchShiftDetails('profit')} 
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-lg shadow-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
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
              <div 
                onClick={() => onNavigateToTab('invoices', '', 'shift:' + activeShift.id)} 
                className="group relative bg-gradient-to-br from-indigo-500 to-violet-600 p-5 rounded-2xl shadow-lg shadow-indigo-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
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
              <div 
                onClick={() => fetchShiftDetails('cash')} 
                className="group relative bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-2xl shadow-lg shadow-amber-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
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

            {/* تفاصيل طرق الدفع والمصروفات بالوردية */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
              {/* إجمالي نقدي */}
              <div 
                onClick={() => fetchShiftDetails('cash')} 
                className="group relative bg-gradient-to-br from-emerald-600 to-teal-600 p-4 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -left-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">💵</span>
                    <span className="text-[7px] font-black text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full">نقدي</span>
                  </div>
                  <p className="text-[8px] font-bold text-emerald-100 mb-0.5">إجمالي النقدي</p>
                  <p className="text-lg font-black text-white tracking-tight">{shiftStats.cashSales.toLocaleString()} <span className="text-[9px] font-bold text-emerald-100">ج.م</span></p>
                </div>
              </div>

              {/* إجمالي فودافون كاش */}
              <div 
                onClick={() => fetchShiftDetails('digital')} 
                className="group relative bg-gradient-to-br from-red-600 to-rose-700 p-4 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">📱</span>
                    <span className="text-[7px] font-black text-red-100 bg-white/15 px-2 py-0.5 rounded-full">فودافون كاش</span>
                  </div>
                  <p className="text-[8px] font-bold text-red-100 mb-0.5">فودافون كاش</p>
                  <p className="text-lg font-black text-white tracking-tight">{shiftStats.vodafoneSales.toLocaleString()} <span className="text-[9px] font-bold text-red-100">ج.م</span></p>
                </div>
              </div>

              {/* إجمالي انستا باي */}
              <div 
                onClick={() => fetchShiftDetails('digital')} 
                className="group relative bg-gradient-to-br from-pink-600 to-pink-800 p-4 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -left-2 -top-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">💸</span>
                    <span className="text-[7px] font-black text-pink-100 bg-white/15 px-2 py-0.5 rounded-full">انستا باي</span>
                  </div>
                  <p className="text-[8px] font-bold text-pink-100 mb-0.5">انستا باي</p>
                  <p className="text-lg font-black text-white tracking-tight">{shiftStats.instapaySales.toLocaleString()} <span className="text-[9px] font-bold text-pink-100">ج.م</span></p>
                </div>
              </div>

              {/* إجمالي الفيزا */}
              <div 
                onClick={() => fetchShiftDetails('digital')} 
                className="group relative bg-gradient-to-br from-cyan-600 to-blue-700 p-4 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">💳</span>
                    <span className="text-[7px] font-black text-cyan-100 bg-white/15 px-2 py-0.5 rounded-full">الفيزا</span>
                  </div>
                  <p className="text-[8px] font-bold text-cyan-100 mb-0.5">إجمالي الفيزا</p>
                  <p className="text-lg font-black text-white tracking-tight">{shiftStats.visaSales.toLocaleString()} <span className="text-[9px] font-bold text-cyan-100">ج.م</span></p>
                </div>
              </div>

              {/* إجمالي أجل الوردية */}
              <div 
                onClick={() => fetchShiftDetails('debt')} 
                className="group relative bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -left-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">⏳</span>
                    <span className="text-[7px] font-black text-amber-100 bg-white/15 px-2 py-0.5 rounded-full">آجل</span>
                  </div>
                  <p className="text-[8px] font-bold text-amber-100 mb-0.5">آجل الوردية</p>
                  <p className="text-lg font-black text-white tracking-tight">{shiftStats.debtSales.toLocaleString()} <span className="text-[9px] font-bold text-amber-100">ج.م</span></p>
                </div>
              </div>

              {/* مصروفات الوردية */}
              <div 
                onClick={() => fetchShiftDetails('expenses')} 
                className="group relative bg-gradient-to-br from-rose-500 to-red-600 p-4 rounded-2xl shadow-md overflow-hidden animate-pulse-once cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">📤</span>
                    <span className="text-[7px] font-black text-rose-100 bg-white/15 px-2 py-0.5 rounded-full">المصروفات</span>
                  </div>
                  <p className="text-[8px] font-bold text-rose-100 mb-0.5">مصروفات الوردية</p>
                  <p className="text-lg font-black text-white tracking-tight">{activeShiftExpenses.toLocaleString()} <span className="text-[9px] font-bold text-rose-100">ج.م</span></p>
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
                onClick={() => onNavigateToTab('invoices')} 
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
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <QuickActionButton label="المخزن" icon="📦" onClick={() => onNavigateToTab('products')} />
              <QuickActionButton label="الفواتير" icon="🧾" onClick={() => onNavigateToTab('invoices')} />
              <QuickActionButton label="طلبات المتجر" icon="🛍️" onClick={() => onNavigateToTab('store-orders')} />
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

      {activeModal && (
        <ShiftDetailsModal
          type={activeModal}
          activeShift={activeShift}
          isLoading={isLoadingDetails}
          details={shiftDetails}
          expenses={shiftExpenses}
          error={detailsError}
          onClose={() => { setActiveModal(null); setShiftDetails(null); setDetailsError(null); }}
          onRetry={() => fetchShiftDetails(activeModal)}
          onNavigateToTab={onNavigateToTab}
        />
      )}
    </div>
  );
};

const QuickActionButton = ({ label, icon, onClick }: any) => (
  <button onClick={onClick} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-900 hover:text-white transition-all active:scale-95 group shadow-sm">
    <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ShiftDetailsModal = ({ 
  type, activeShift, isLoading, details, expenses, error, onClose, onRetry, onNavigateToTab 
}: { 
  type: 'sales' | 'profit' | 'cash' | 'digital' | 'debt' | 'expenses';
  activeShift: Shift | null;
  isLoading: boolean;
  details: any;
  expenses: any[];
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onNavigateToTab: (tab: any, search?: string, filter?: string) => void;
}) => {
  const getModalTitle = () => {
    switch (type) {
      case 'sales': return '📊 ملخص مبيعات الوردية';
      case 'profit': return '📈 تفاصيل أرباح الوردية';
      case 'cash': return '💵 تفاصيل النقدية والدرج';
      case 'digital': return '💳 تفاصيل الدفع الإلكتروني والبنكي';
      case 'debt': return '⏳ تفاصيل فواتير الآجل (الديون)';
      case 'expenses': return '📤 مصروفات الوردية';
      default: return 'ملخص تفصيلي';
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <span className="text-4xl text-rose-500 font-Cairo">⚠️</span>
          <p className="text-sm font-black text-rose-600 font-Cairo">{error}</p>
          <button 
            onClick={onRetry} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer font-Cairo"
          >
            إعادة المحاولة 🔄
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-500 animate-pulse font-Cairo">جاري تحميل البيانات التفصيلية من السيرفر...</p>
        </div>
      );
    }

    const shiftOrders = details?.orders || [];

    switch (type) {
      case 'sales': {
        const totalSales = shiftOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
        const avgOrder = shiftOrders.length > 0 ? Math.round(totalSales / shiftOrders.length) : 0;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-600 mb-1">إجمالي المبيعات</p>
                <p className="text-sm font-black text-emerald-800">{totalSales.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
                <p className="text-[9px] font-bold text-indigo-600 mb-1">الفواتير</p>
                <p className="text-sm font-black text-indigo-800">{shiftOrders.length} فاتورة</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 mb-1">متوسط الفاتورة</p>
                <p className="text-sm font-black text-slate-800">{avgOrder} ج.م</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">سجل المبيعات</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {shiftOrders.length === 0 ? (
                  <p className="text-center py-6 text-slate-300 font-bold text-xs">لا توجد فواتير في هذه الوردية</p>
                ) : (
                  shiftOrders.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors">
                      <div>
                        <p className="font-black text-slate-700 text-xs">#{o.id} - {o.customerName || 'عميل نقدي'}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(o.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})} · {o.phone || 'بدون هاتف'}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-emerald-600 text-xs">{Number(o.total || 0).toLocaleString()} ج.م</p>
                        <span className="text-[8px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">{o.paymentMethod || 'نقدي'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button 
              onClick={() => { onClose(); onNavigateToTab('invoices', '', 'shift:' + activeShift?.id); }}
              className="w-full bg-slate-900 text-white font-black text-xs py-3.5 rounded-xl active:scale-95 transition-all text-center cursor-pointer"
            >
              عرض كافة الفواتير في صفحة إدارة الفواتير بالتفصيل ←
            </button>
          </div>
        );
      }

      case 'profit': {
        const totalSales = shiftOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
        let cost = 0;
        shiftOrders.forEach((o: any) => {
          if (o.items) {
            o.items.forEach((item: any) => {
              cost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
            });
          }
        });
        const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const netProfit = totalSales - cost - totalExp;

        return (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-xs font-bold text-slate-400 mb-1">صافي الربح الفعلي للوردية</p>
              <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{netProfit.toLocaleString()} ج.م</p>
              <p className="text-[9px] text-slate-500 font-bold mt-1.5">الحساب يتم بالكامل من السيرفر بالمعادلة التالية:</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">إجمالي مبيعات الوردية (+)</span>
                <span className="font-black text-slate-800">+{totalSales.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">تكلفة البضاعة المباعة (-)</span>
                <span className="font-black text-rose-500">-{cost.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">المصروفات النشطة للوردية (-)</span>
                <span className="font-black text-rose-500">-{totalExp.toLocaleString()} ج.م</span>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="flex justify-between items-center text-sm font-black">
                <span className="text-slate-800">صافي الربح النهائي للوردية</span>
                <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{netProfit.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        );
      }

      case 'cash': {
        const startCash = activeShift?.startingCash || 0;
        
        let cashSales = 0;
        shiftOrders.forEach((o: any) => {
          if (o.payments && o.payments.length > 0) {
            o.payments.forEach((p: any) => {
              const method = String(p.method || '').toLowerCase();
              if (method === 'cash' || method.includes('نقدي')) {
                cashSales += Number(p.amount);
              }
            });
          } else {
            const methodStr = String(o.paymentMethod || '').toLowerCase();
            if (methodStr.includes('نقدي') || methodStr.includes('عند الاستلام') || methodStr === 'cash') {
              cashSales += Number(o.total || 0);
            }
          }
        });

        const txs = details?.transactions || [];
        const deposits = txs.filter((t: any) => t.type === 'deposit').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const withdrawals = txs.filter((t: any) => t.type === 'withdrawal').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const drawerExpenses = expenses.filter((e: any) => e.paymentSource === 'drawer').reduce((sum, e) => sum + Number(e.amount), 0);

        const expectedCash = startCash + cashSales + deposits - withdrawals - drawerExpenses;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-100">
                <p className="text-[9px] font-bold text-amber-600 mb-1">الرصيد الحالي بالدرج</p>
                <p className="text-sm font-black text-amber-800">{(activeShift?.currentCashBalance || 0).toLocaleString()} ج.م</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 mb-1">الرصيد المالي المتوقع</p>
                <p className="text-sm font-black text-slate-800">{expectedCash.toLocaleString()} ج.م</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">رصيد البداية (الدرج)</span>
                <span className="font-black text-slate-800">+{startCash.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">المبيعات النقدية (+)</span>
                <span className="font-black text-emerald-600">+{cashSales.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">إيداعات يدوية (+)</span>
                <span className="font-black text-emerald-600">+{deposits.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">سحوبات يدوية (-)</span>
                <span className="font-black text-rose-500">-{withdrawals.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">مصروفات من الدرج (-)</span>
                <span className="font-black text-rose-500">-{drawerExpenses.toLocaleString()} ج.م</span>
              </div>
              <div className="h-px bg-slate-200 my-1"></div>
              <div className="flex justify-between items-center font-black text-sm">
                <span className="text-slate-800">الرصيد المتوقع للدرج</span>
                <span className="text-slate-900">{expectedCash.toLocaleString()} ج.م</span>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">سجل الحركات اليدوية</h4>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {txs.length === 0 ? (
                  <p className="text-center py-4 text-slate-300 font-bold text-xs">لا توجد حركات يدوية مسجلة</p>
                ) : (
                  txs.map((t: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-100/50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-black text-slate-700 text-xs">{t.reason}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(t.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})} · {t.userName}</p>
                      </div>
                      <span className={`text-xs font-black ${t.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'digital': {
        let vodafone = 0;
        let instapay = 0;
        let visa = 0;

        shiftOrders.forEach((o: any) => {
          if (o.payments && o.payments.length > 0) {
            o.payments.forEach((p: any) => {
              const method = String(p.method || '').toLowerCase();
              const amount = Number(p.amount || 0);
              if (method === 'vodafone' || method.includes('فودافون')) {
                vodafone += amount;
              } else if (method === 'instapay' || method.includes('انستا')) {
                instapay += amount;
              } else if (method === 'visa' || method.includes('فيزا') || method.includes('card') || method.includes('بطاقة')) {
                visa += amount;
              }
            });
          } else {
            const methodStr = String(o.paymentMethod || '').toLowerCase();
            const totalAmount = Number(o.total || 0);
            if (methodStr.includes('فودافون') || methodStr.includes('vodafone')) {
              vodafone += totalAmount;
            } else if (methodStr.includes('انستا') || methodStr.includes('instapay')) {
              instapay += totalAmount;
            } else if (methodStr.includes('فيزا') || methodStr.includes('visa') || methodStr.includes('card') || methodStr.includes('بطاقة')) {
              visa += totalAmount;
            }
          }
        });

        const totalDigital = vodafone + instapay + visa;
        const digitalOrders = shiftOrders.filter((o: any) => {
          const method = String(o.paymentMethod || '').toLowerCase();
          return method.includes('vodafone') || method.includes('فودافون') || method.includes('انستا') || method.includes('instapay') || method.includes('فيزا') || method.includes('visa') || method.includes('card') || method.includes('بطاقة') || (o.payments && o.payments.some((p: any) => p.method !== 'cash'));
        });

        return (
          <div className="space-y-6">
            <div className="bg-indigo-600 text-white p-5 rounded-3xl text-center">
              <p className="text-xs font-bold text-indigo-200 mb-1">إجمالي الدفع الإلكتروني والبنكي</p>
              <p className="text-2xl font-black">{totalDigital.toLocaleString()} ج.م</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-red-800">
                <p className="text-[9px] font-bold text-red-500 mb-1">📱 فودافون كاش</p>
                <p className="font-black text-sm">{vodafone.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 text-pink-800">
                <p className="text-[9px] font-bold text-pink-500 mb-1">💸 انستا باي</p>
                <p className="font-black text-sm">{instapay.toLocaleString()} ج.م</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-cyan-800">
                <p className="text-[9px] font-bold text-cyan-500 mb-1">💳 الفيزا والبطاقات</p>
                <p className="font-black text-sm">{visa.toLocaleString()} ج.م</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">الفواتير الإلكترونية</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {digitalOrders.length === 0 ? (
                  <p className="text-center py-4 text-slate-300 font-bold text-xs">لا توجد عمليات دفع إلكترونية في هذه الوردية</p>
                ) : (
                  digitalOrders.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors">
                      <div>
                        <p className="font-black text-slate-700 text-xs">#{o.id} - {o.customerName || 'عميل نقدي'}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(o.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-indigo-600 text-xs">{Number(o.total || 0).toLocaleString()} ج.م</p>
                        <span className="text-[8px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">{o.paymentMethod}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'debt': {
        let debtSales = 0;
        shiftOrders.forEach((o: any) => {
          if (o.payments && o.payments.length > 0) {
            debtSales += Number(o.outstandingAmount || 0);
          } else {
            const methodStr = String(o.paymentMethod || '').toLowerCase();
            if (methodStr.includes('آجل') || methodStr.includes('debt') || methodStr.includes('credit')) {
              debtSales += Number(o.total || 0);
            }
          }
        });

        const creditOrders = shiftOrders.filter((o: any) => {
          const method = String(o.paymentMethod || '').toLowerCase();
          return method.includes('آجل') || method.includes('debt') || method.includes('credit') || Number(o.outstandingAmount || 0) > 0;
        });

        return (
          <div className="space-y-6">
            <div className="bg-orange-500 text-white p-5 rounded-3xl text-center">
              <p className="text-xs font-bold text-orange-100 mb-1">إجمالي المبيعات الآجلة (الديون) بالوردية</p>
              <p className="text-2xl font-black">{debtSales.toLocaleString()} ج.م</p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">الفواتير الآجلة</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {creditOrders.length === 0 ? (
                  <p className="text-center py-4 text-slate-300 font-bold text-xs">لا توجد فواتير آجلة في هذه الوردية</p>
                ) : (
                  creditOrders.map((o: any, i: number) => {
                    const outstanding = o.outstandingAmount !== undefined ? o.outstandingAmount : o.total;
                    return (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors">
                        <div>
                          <p className="font-black text-slate-700 text-xs">#{o.id} - {o.customerName}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(o.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})} · {o.phone || 'بدون هاتف'}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-orange-600 text-xs">{Number(outstanding).toLocaleString()} ج.م</p>
                          <span className="text-[8px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">مستحق</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'expenses': {
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        return (
          <div className="space-y-6">
            <div className="bg-rose-600 text-white p-5 rounded-3xl text-center">
              <p className="text-xs font-bold text-rose-200 mb-1">إجمالي مصروفات الوردية</p>
              <p className="text-2xl font-black">{totalExpenses.toLocaleString()} ج.م</p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">كشف المصروفات بالوردية</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {expenses.length === 0 ? (
                  <p className="text-center py-4 text-slate-300 font-bold text-xs">لا توجد مصروفات مسجلة في هذه الوردية</p>
                ) : (
                  expenses.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors">
                      <div>
                        <p className="font-black text-slate-700 text-xs">{e.title} · <span className="text-[10px] font-bold text-slate-400">{e.category}</span></p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{new Date(e.date || e.createdAt || Date.now()).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})} · طريقة الدفع: {e.paymentSource === 'drawer' ? 'درج الخزينة' : 'مصدر خارجي'}</p>
                        {e.notes && <p className="text-[9px] text-slate-500 mt-1 bg-slate-100 p-1.5 rounded-lg font-bold">{e.notes}</p>}
                      </div>
                      <span className="text-xs font-black text-rose-600">
                        -{Number(e.amount).toLocaleString()} ج.م
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp max-h-[85vh] flex flex-col font-Cairo text-right" dir="rtl">
        {/* Modal Header */}
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black">{getModalTitle()}</h3>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5">الوردية #{activeShift?.id} · {activeShift?.shiftName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto flex-grow space-y-6">
          {renderContent()}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-slate-950 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;

