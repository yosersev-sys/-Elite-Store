
import React, { useState, useMemo } from 'react';
import { Order } from '../../types';

interface ReportsTabProps {
  orders: Order[];
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders }) => {
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const profitStats = useMemo(() => {
    const start = new Date(reportStart).setHours(0, 0, 0, 0);
    const end = new Date(reportEnd).setHours(23, 59, 59, 999);
    const periodOrders = orders.filter(o => {
      const d = Number(o.createdAt);
      return d >= start && d <= end && o.status !== 'cancelled';
    });
    let revenue = 0;
    let cost = 0;
    periodOrders.forEach(order => {
      revenue += Number(order.total || 0);
      (order.items || []).forEach(item => {
        cost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
      });
    });
    return { revenue, cost, profit: revenue - cost };
  }, [orders, reportStart, reportEnd]);

  return (
    <div className="space-y-10">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
         <h3 className="font-black text-slate-800 text-xl mb-8">فلترة النتائج المالية</h3>
         <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-grow space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">من تاريخ</label>
              <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="w-full bg-slate-50 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm border-2 border-transparent focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex-grow space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">إلى تاريخ</label>
              <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="w-full bg-slate-50 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm border-2 border-transparent focus:border-emerald-400 transition-all" />
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ReportCard title="إجمالي المبيعات" value={profitStats.revenue} color="slate" />
        <ReportCard title="تكلفة البضاعة" value={profitStats.cost} color="amber" />
        <ReportCard title="صافي الربح الفعلي" value={profitStats.profit} color="emerald" isSpecial />
      </div>
    </div>
  );
};

const ReportCard = ({ title, value, color, isSpecial }: any) => (
  <div className={`p-10 rounded-[3.5rem] shadow-xl border text-center transition-transform hover:scale-105 ${isSpecial ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white border-slate-100'}`}>
    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isSpecial ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
    <p className={`text-4xl font-black ${!isSpecial && color === 'amber' ? 'text-amber-600' : !isSpecial ? 'text-slate-800' : ''}`}>{value.toLocaleString()} <small className="text-xs">ج.م</small></p>
  </div>
);

export default ReportsTab;
