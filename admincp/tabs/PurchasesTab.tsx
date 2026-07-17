import React, { useState, useEffect, useMemo } from 'react';
import { DrawerTransaction, User } from '../../types';
import { ApiService } from '../../services/api';

interface PurchasesTabProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

type PeriodType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom' | 'all';

const PurchasesTab: React.FC<PurchasesTabProps> = ({ currentUser, onRefreshData }) => {
  const [transactions, setTransactions] = useState<DrawerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'userName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getDrawerTransactions();
      setTransactions(data);
    } catch (e) {
      console.error('Failed to load purchases log', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Helper date matching functions
  const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getStartOfYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    // In Egypt, week usually starts on Saturday. Let's make it start 7 days ago or standard Sunday.
    // Let's make it start from last Sunday or 7 days ago. Let's do 7 days ago for simplicity.
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getStartOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  };

  const getStartOfLastMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
  };

  const getEndOfLastMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime();
  };

  const getStartOfYear = () => {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1).getTime();
  };

  // Filtered transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let list = [...transactions];

    // 1. Period filter
    const nowTime = Date.now();
    const startOfToday = getStartOfToday();
    const startOfYesterday = getStartOfYesterday();
    
    if (period === 'today') {
      list = list.filter(t => t.createdAt >= startOfToday);
    } else if (period === 'yesterday') {
      list = list.filter(t => t.createdAt >= startOfYesterday && t.createdAt < startOfToday);
    } else if (period === 'this_week') {
      list = list.filter(t => t.createdAt >= getStartOfWeek());
    } else if (period === 'this_month') {
      list = list.filter(t => t.createdAt >= getStartOfMonth());
    } else if (period === 'last_month') {
      const start = getStartOfLastMonth();
      const end = getEndOfLastMonth();
      list = list.filter(t => t.createdAt >= start && t.createdAt <= end);
    } else if (period === 'this_year') {
      list = list.filter(t => t.createdAt >= getStartOfYear());
    } else if (period === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        list = list.filter(t => t.createdAt >= start.getTime());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter(t => t.createdAt <= end.getTime());
      }
    }

    // 2. Search query ( userName, shiftId/shiftName, amount, reason )
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t => {
        const matchUser = t.userName && t.userName.toLowerCase().includes(q);
        const matchShift = (String(t.shiftId).includes(q)) || (t.shiftName && t.shiftName.toLowerCase().includes(q));
        const matchAmount = String(t.amount).includes(q);
        const matchReason = t.reason && t.reason.toLowerCase().includes(q);
        return matchUser || matchShift || matchAmount || matchReason;
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'createdAt') {
        valA = a.createdAt;
        valB = b.createdAt;
      } else if (sortBy === 'amount') {
        valA = Number(a.amount);
        valB = Number(b.amount);
      } else if (sortBy === 'userName') {
        valA = (a.userName || '').toLowerCase();
        valB = (b.userName || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [transactions, searchQuery, period, startDate, endDate, sortBy, sortOrder]);

  // General Statistics (independent of filter period, or helper values)
  const todayPurchasesSum = useMemo(() => {
    const startToday = getStartOfToday();
    return transactions
      .filter(t => t.createdAt >= startToday)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const thisMonthPurchasesSum = useMemo(() => {
    const startMonth = getStartOfMonth();
    return transactions
      .filter(t => t.createdAt >= startMonth)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  // Statistics for the currently filtered/selected period
  const stats = useMemo(() => {
    const list = filteredAndSortedTransactions;
    const count = list.length;
    const total = list.reduce((sum, t) => sum + Number(t.amount), 0);
    const avg = count > 0 ? (total / count) : 0;
    const max = count > 0 ? Math.max(...list.map(t => Number(t.amount))) : 0;
    return { count, total, avg, max };
  }, [filteredAndSortedTransactions]);

  const handleSort = (field: 'createdAt' | 'amount' | 'userName') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Printable report handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = localStorage.getItem('store_name') || 'سوق العصر';
    const creatorName = currentUser?.name || 'مسؤول النظام';
    const reportDate = new Date().toLocaleString('ar-EG');
    
    let periodText = 'كافة الفترات';
    if (period === 'today') periodText = 'اليوم';
    else if (period === 'yesterday') periodText = 'أمس';
    else if (period === 'this_week') periodText = 'هذا الأسبوع';
    else if (period === 'this_month') periodText = 'هذا الشهر';
    else if (period === 'last_month') periodText = 'الشهر الماضي';
    else if (period === 'this_year') periodText = 'هذا العام';
    else if (period === 'custom') {
      periodText = `الفترة من ${startDate || 'البداية'} إلى ${endDate || 'اليوم'}`;
    }

    const rowsHtml = filteredAndSortedTransactions.map((t, idx) => `
      <tr style="border-bottom: 1px solid #ddd; text-align: right;">
        <td style="padding: 10px; border-right: 1px solid #eee;">#${t.id}</td>
        <td style="padding: 10px; border-right: 1px solid #eee;">${new Date(t.createdAt).toLocaleString('ar-EG')}</td>
        <td style="padding: 10px; border-right: 1px solid #eee; font-weight: bold;">${Number(t.amount).toFixed(2)} ج.م</td>
        <td style="padding: 10px; border-right: 1px solid #eee;">${t.balanceAfter !== undefined && t.balanceAfter !== null ? Number(t.balanceAfter).toFixed(2) + ' ج.م' : '-'}</td>
        <td style="padding: 10px; border-right: 1px solid #eee;">${t.reason || ''}</td>
        <td style="padding: 10px; border-right: 1px solid #eee;">#${t.shiftId} ${t.shiftName ? `(${t.shiftName})` : ''}</td>
        <td style="padding: 10px;">${t.userName || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
      <head>
        <title>تقرير مشتريات البضاعة النقدية</title>
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #059669; font-size: 24px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; color: #666; font-weight: bold; }
          .meta-info { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 20px; font-size: 12px; font-weight: bold; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eaeaea; }
          .meta-info div { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #1e293b; color: white; padding: 12px 10px; border: 1px solid #334155; }
          td { padding: 10px; border: 1px solid #e2e8f0; }
          .summary-footer { margin-top: 30px; display: flex; justify-content: flex-end; }
          .summary-card { background: #f1f5f9; padding: 15px 25px; border-radius: 12px; border: 1px solid #cbd5e1; font-weight: bold; width: fit-content; text-align: right; }
          .summary-card p { margin: 5px 0; }
          .footer-signature { margin-top: 50px; text-align: left; font-size: 11px; font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${storeName}</h1>
          <p>تقرير مشتريات البضاعة النقدية (الخزينة)</p>
        </div>
        <div class="meta-info">
          <div><strong>الفترة المحددة:</strong> ${periodText}</div>
          <div><strong>تاريخ الطباعة:</strong> ${reportDate}</div>
          <div><strong>الموظف المسؤول:</strong> ${creatorName}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>رقم الحركة</th>
              <th>التاريخ والوقت</th>
              <th>المبلغ</th>
              <th>الرصيد بعد الحركة</th>
              <th>البيان / تفاصيل الشراء</th>
              <th>الوردية</th>
              <th>الموظف</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="summary-footer">
          <div class="summary-card">
            <p>إجمالي المشتريات: <span style="color: #059669; font-size: 18px;">${stats.total.toLocaleString()} ج.م</span></p>
            <p>عدد العمليات: <span>${stats.count} عملية</span></p>
          </div>
        </div>
        
        <div class="footer-signature">
          طبع بواسطة: ${creatorName} · نظام سوق العصر المتكامل
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['رقم الحركة', 'التاريخ والوقت', 'المبلغ', 'الرصيد بعد الحركة', 'البيان', 'الوردية', 'الموظف'];
    const rows = filteredAndSortedTransactions.map(t => [
      t.id,
      new Date(t.createdAt).toLocaleString('ar-EG'),
      t.amount,
      t.balanceAfter !== undefined && t.balanceAfter !== null ? t.balanceAfter : '',
      t.reason || '',
      t.shiftId,
      t.userName || ''
    ]);

    // Construct CSV content with BOM for Excel Arabic encoding
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases_report_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-fadeIn font-Cairo text-right" dir="rtl">
      
      {/* 1. Statistics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* Today's Purchases */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all">
          <div className="absolute -left-2 -bottom-2 w-14 h-14 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] text-indigo-100 font-bold mb-1 uppercase tracking-wider">مشتريات اليوم 📅</p>
          <p className="text-xl font-black tracking-tight">{todayPurchasesSum.toLocaleString()} <span className="text-xs font-bold">ج.م</span></p>
        </div>

        {/* This Month's Purchases */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all">
          <div className="absolute -left-2 -bottom-2 w-14 h-14 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] text-teal-100 font-bold mb-1 uppercase tracking-wider">مشتريات الشهر 🗓️</p>
          <p className="text-xl font-black tracking-tight">{thisMonthPurchasesSum.toLocaleString()} <span className="text-xs font-bold">ج.م</span></p>
        </div>

        {/* Selected Period Total */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all border border-slate-800">
          <div className="absolute -left-2 -bottom-2 w-14 h-14 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">إجمالي المشتريات المحددة 💰</p>
          <p className="text-xl font-black tracking-tight text-emerald-400">{stats.total.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
        </div>

        {/* Average Purchase Transaction */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-md relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all">
          <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">متوسط قيمة العملية 📊</p>
          <p className="text-xl font-black text-slate-800 tracking-tight">{Math.round(stats.avg).toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
        </div>

        {/* Largest Purchase Transaction */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-md relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all">
          <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">أكبر عملية شراء 🏆</p>
          <p className="text-xl font-black text-rose-600 tracking-tight">{stats.max.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
        </div>

        {/* Number of Operations */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-md relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all">
          <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">عدد العمليات 📋</p>
          <p className="text-xl font-black text-indigo-600 tracking-tight">{stats.count} <span className="text-xs font-bold text-slate-400">عملية</span></p>
        </div>

      </section>

      {/* 2. Advanced Filter and Search Bar */}
      <section className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100 space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالموظف، الوردية، القيمة، أو التفاصيل..."
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-xs transition"
            />
          </div>

          {/* Quick period filters */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as PeriodType)}
              className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs outline-none cursor-pointer"
            >
              <option value="today">اليوم</option>
              <option value="yesterday">أمس</option>
              <option value="this_week">هذا الأسبوع</option>
              <option value="this_month">هذا الشهر</option>
              <option value="last_month">الشهر الماضي</option>
              <option value="this_year">هذا العام</option>
              <option value="custom">فترة مخصصة</option>
              <option value="all">كافة المعاملات</option>
            </select>

            <button
              onClick={handlePrint}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span> طباعة التقرير
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>📥</span> تصدير Excel
            </button>
          </div>

        </div>

        {/* Custom date range pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-50 animate-slideDown">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ البداية (من)</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block mr-1">تاريخ النهاية (إلى)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
              />
            </div>
          </div>
        )}

      </section>

      {/* 3. Detailed Data Table */}
      <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        
        <div className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-black text-white text-sm">تفاصيل حركات شراء البضائع</h4>
          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            {filteredAndSortedTransactions.length} حركة شراء
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 font-bold text-xs animate-pulse">
              جاري تحميل سجل المشتريات من قاعدة البيانات...
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-black text-sm space-y-2">
              <span className="text-3xl block">🛒</span>
              <p>لا توجد حركات شراء بضائع مسجلة للفترة المحددة.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-right text-xs">
              
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase font-bold">
                  <th className="p-4">رقم الحركة</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition" onClick={() => handleSort('createdAt')}>
                    التاريخ والوقت {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition" onClick={() => handleSort('amount')}>
                    المبلغ {sortBy === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-4">الرصيد بعد الحركة</th>
                  <th className="p-4">تفاصيل الشراء / البيان</th>
                  <th className="p-4">الوردية</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition" onClick={() => handleSort('userName')}>
                    المسؤول {sortBy === 'userName' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-400">#{t.id}</td>
                    <td className="p-4 text-slate-500 font-bold">
                      {new Date(t.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 font-black text-rose-600 text-sm">
                      {Number(t.amount).toFixed(2)} ج.م
                    </td>
                    <td className="p-4 font-bold text-slate-600">
                      {t.balanceAfter !== undefined && t.balanceAfter !== null 
                        ? `${Number(t.balanceAfter).toFixed(2)} ج.م` 
                        : '-'
                      }
                    </td>
                    <td className="p-4 font-bold text-slate-700 max-w-sm truncate" title={t.reason}>
                      {t.reason}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-black text-[10px]">
                        #{t.shiftId} {t.shiftName ? `(${t.shiftName})` : ''}
                      </span>
                    </td>
                    <td className="p-4 font-black text-indigo-600">{t.userName}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>

      </section>

    </div>
  );
};

export default PurchasesTab;
