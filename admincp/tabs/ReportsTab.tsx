
import React, { useState, useMemo } from 'react';
import { Order } from '../../types';

interface ReportsTabProps {
  orders: Order[];
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders }) => {
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const financialData = useMemo(() => {
    const start = new Date(reportStart).setHours(0, 0, 0, 0);
    const end = new Date(reportEnd).setHours(23, 59, 59, 999);
    
    const periodOrders = orders.filter(o => {
      const d = Number(o.createdAt);
      return d >= start && d <= end && o.status !== 'cancelled';
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    const detailedOrders = periodOrders.map(order => {
      let orderCost = 0;
      (order.items || []).forEach(item => {
        const itemCost = (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0);
        const itemQty = (Number(item.quantity) || 0);
        orderCost += itemCost * itemQty;
        totalItemsSold += itemQty;
      });
      
      const orderProfit = Number(order.total || 0) - orderCost;
      totalRevenue += Number(order.total || 0);
      totalCost += orderCost;

      return {
        ...order,
        orderCost,
        orderProfit
      };
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0;

    // الطلبات الأكثر ربحاً
    const topProfitableOrders = [...detailedOrders]
      .sort((a, b) => b.orderProfit - a.orderProfit)
      .slice(0, 5);

    return { 
      totalRevenue, 
      totalCost, 
      netProfit, 
      profitMargin, 
      avgOrderValue, 
      orderCount: periodOrders.length,
      totalItemsSold,
      topProfitableOrders
    };
  }, [orders, reportStart, reportEnd]);

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      
      {/* قسم الفلترة */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">📅</div>
           <div>
             <h3 className="text-xl font-black text-slate-800">تحديد الفترة المالية</h3>
             <p className="text-slate-400 text-xs font-bold">عرض تقارير الأرباح والمبيعات</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 mr-2 uppercase">من</span>
            <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-3 outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 mr-2 uppercase">إلى</span>
            <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-3 outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" />
          </div>
        </div>
      </div>

      {/* المؤشرات الرئيسية (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="إجمالي المبيعات" value={financialData.totalRevenue} icon="💰" color="indigo" />
        <KPICard title="صافي الربح" value={financialData.netProfit} icon="📈" color="emerald" isSpecial />
        <KPICard title="عدد الطلبات" value={financialData.orderCount} icon="🛍️" color="amber" isUnitless />
        <KPICard title="هامش الربح" value={financialData.profitMargin.toFixed(1) + '%'} icon="🎯" color="rose" isUnitless />
      </div>

      {/* التحليل البصري والمخطط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* المخطط البصري للمقارنة */}
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-between">
           <div className="mb-8">
              <h4 className="font-black text-xl text-slate-800">تحليل هيكل الإيرادات</h4>
              <p className="text-slate-400 text-xs font-bold">مقارنة بين إجمالي التكاليف وصافي الأرباح</p>
           </div>
           
           <div className="space-y-10">
              <div className="space-y-4">
                 <div className="flex justify-between items-end px-2">
                    <span className="text-sm font-black text-slate-600">توزيع المبيعات</span>
                    <span className="text-xs font-bold text-slate-400">الإجمالي: {financialData.totalRevenue.toLocaleString()} ج.م</span>
                 </div>
                 <div className="h-14 w-full bg-slate-100 rounded-2xl overflow-hidden flex shadow-inner border-4 border-slate-50">
                    <div 
                      style={{ width: `${(financialData.totalCost / financialData.totalRevenue) * 100}%` }} 
                      className="h-full bg-slate-400 flex items-center justify-center text-[10px] text-white font-black transition-all duration-1000"
                    >
                      {financialData.totalRevenue > 0 && 'التكاليف'}
                    </div>
                    <div 
                      style={{ width: `${(financialData.netProfit / financialData.totalRevenue) * 100}%` }} 
                      className="h-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black transition-all duration-1000"
                    >
                      {financialData.totalRevenue > 0 && 'الأرباح'}
                    </div>
                 </div>
                 <div className="flex gap-6 px-2">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                       <span className="text-[10px] font-black text-slate-500">تكلفة البضاعة: {financialData.totalCost.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                       <span className="text-[10px] font-black text-slate-500">صافي الربح: {financialData.netProfit.toLocaleString()} ج.م</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">متوسط قيمة الطلب</p>
                    <p className="text-xl font-black text-slate-800">{financialData.avgOrderValue.toFixed(0)} <small className="text-[10px]">ج.م</small></p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي القطع المباعة</p>
                    <p className="text-xl font-black text-slate-800">{financialData.totalItemsSold} <small className="text-[10px]">وحدة</small></p>
                 </div>
              </div>
           </div>
        </div>

        {/* الطلبات الأكثر ربحية */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100">
           <h4 className="font-black text-xl text-slate-800 mb-6">أعلى صفقات الربح 💎</h4>
           <div className="space-y-4">
              {financialData.topProfitableOrders.length > 0 ? (
                financialData.topProfitableOrders.map(order => (
                  <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-xs text-slate-700">#{order.id} - {order.customerName}</p>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">+{order.orderProfit.toFixed(0)} ج.م ربح</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                      <span className="group-hover:text-emerald-500 transition-colors">عرض التفاصيل ←</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-xs font-black">لا توجد بيانات لهذه الفترة</p>
                </div>
              )}
           </div>
        </div>

      </div>

      {/* ملخص ذكي */}
      <div className="bg-indigo-900 text-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl shadow-2xl backdrop-blur-xl border border-white/20">💡</div>
            <div className="flex-grow text-center md:text-right">
               <h4 className="text-2xl font-black mb-2">ملخص الأداء الذكي</h4>
               <p className="text-indigo-200 font-bold leading-relaxed max-w-2xl">
                 خلال الفترة من {new Date(reportStart).toLocaleDateString('ar-EG')} إلى {new Date(reportEnd).toLocaleDateString('ar-EG')}، 
                 حقق المتجر مبيعات إجمالية قدرها {financialData.totalRevenue.toLocaleString()} ج.م، بمتوسط ربح قدره {financialData.profitMargin.toFixed(1)}% لكل عملية بيع. 
                 يعتبر هذا الأداء {financialData.profitMargin > 20 ? 'ممتازاً جداً' : 'جيداً'} مقارنة بالسوق المحلي.
               </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 whitespace-nowrap"
            >
              طباعة التقرير المالي 🖨️
            </button>
         </div>
      </div>

    </div>
  );
};

const KPICard = ({ title, value, icon, color, isSpecial, isUnitless }: any) => {
  const themes: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className={`p-8 rounded-[3rem] border shadow-xl transition-all duration-500 hover:scale-105 ${isSpecial ? 'bg-slate-900 text-white border-slate-800' : themes[color]}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`text-3xl ${isSpecial ? 'opacity-100' : 'opacity-80'}`}>{icon}</div>
        <div className={`w-1 h-8 rounded-full ${isSpecial ? 'bg-emerald-500' : 'bg-current/10'}`}></div>
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSpecial ? 'text-slate-400' : 'opacity-60'}`}>{title}</p>
      <p className="text-2xl font-black tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value} 
        {!isUnitless && <small className="text-[10px] mr-1 font-bold">ج.م</small>}
      </p>
    </div>
  );
};

export default ReportsTab;
