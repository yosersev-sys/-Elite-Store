import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/api';

interface AnalyticsTabProps {
  isOnline?: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Feature flags
  const [flags, setFlags] = useState({
    analytics_enabled: '1',
    analytics_track_cart: '1',
    analytics_track_search: '1',
    analytics_track_social: '1'
  });

  const [summaryData, setSummaryData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);

  // Load Flags and Data
  const loadFlags = async () => {
    try {
      const s = await ApiService.getStoreSettings();
      if (s) {
        setFlags({
          analytics_enabled: s.analytics_enabled ?? '1',
          analytics_track_cart: s.analytics_track_cart ?? '1',
          analytics_track_search: s.analytics_track_search ?? '1',
          analytics_track_social: s.analytics_track_social ?? '1'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let urlParams = `period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        urlParams += `&startDate=${startMs}&endDate=${endMs}`;
      }

      // Fetch summary
      const response = await fetch(`api.php?action=get_analytics_summary&${urlParams}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.status === 'success') {
          setSummaryData(res);
        }
      }

      // Fetch search data
      const searchRes = await fetch(`api.php?action=get_search_analytics`, {
        headers: { 'Accept': 'application/json' }
      });
      if (searchRes.ok) {
        const res = await searchRes.json();
        if (res.status === 'success') {
          setSearchData(res);
        }
      }
    } catch (e) {
      console.error('Failed to load analytics data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      loadAnalytics();
    }
  }, [period, startDate, endDate]);

  const handleToggleFlag = async (key: keyof typeof flags) => {
    const nextVal = flags[key] === '1' ? '0' : '1';
    const nextFlags = { ...flags, [key]: nextVal };
    setFlags(nextFlags);
    try {
      await ApiService.updateStoreSettings({ [key]: nextVal });
    } catch (e) {
      console.error('Failed to toggle flag', e);
    }
  };

  const runMaintenance = async () => {
    setIsMaintenanceRunning(true);
    setMaintenanceMsg('جاري تشغيل الصيانة وترقية الجداول...');
    try {
      const response = await fetch('api.php?action=run_analytics_maintenance', {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.status === 'success') {
          setMaintenanceMsg(`اكتملت الصيانة بنجاح. تم تنظيف وأرشفة سجلات التحليلات بنجاح!`);
          loadAnalytics();
        } else {
          setMaintenanceMsg(`خطأ: ${res.message}`);
        }
      } else {
        setMaintenanceMsg('فشلت صيانة الخادم المؤقتة.');
      }
    } catch (e: any) {
      setMaintenanceMsg(`فشل الاتصال: ${e.message}`);
    } finally {
      setIsMaintenanceRunning(false);
    }
  };

  // Safe percentage helper
  const getPercent = (value: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.round((value / total) * 100);
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds === null) return '0 ثانية';
    if (seconds < 60) return `${Math.round(seconds)} ثانية`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins} دقيقة ${secs > 0 ? `و ${secs} ثانية` : ''}`;
  };

  // Funnel conversions calculation
  const funnelSteps = useMemo(() => {
    if (!summaryData || !summaryData.funnel) return [];
    const f = summaryData.funnel;
    
    const storeVal = f.store || 0;
    const prodVal = f.product || 0;
    const cartVal = f.cart || 0;
    const checkVal = f.checkout || 0;
    const compVal = f.complete || 0;

    return [
      { key: 'الرئيسية', val: storeVal, percentOfTotal: 100, dropPercent: 0 },
      { key: 'تفاصيل المنتجات', val: prodVal, percentOfTotal: getPercent(prodVal, storeVal), dropPercent: storeVal ? getPercent(storeVal - prodVal, storeVal) : 0 },
      { key: 'إضافة للسلة', val: cartVal, percentOfTotal: getPercent(cartVal, storeVal), dropPercent: prodVal ? getPercent(prodVal - cartVal, prodVal) : 0 },
      { key: 'بدء الدفع', val: checkVal, percentOfTotal: getPercent(checkVal, storeVal), dropPercent: cartVal ? getPercent(cartVal - checkVal, cartVal) : 0 },
      { key: 'الطلبات المكتملة', val: compVal, percentOfTotal: getPercent(compVal, storeVal), dropPercent: checkVal ? getPercent(checkVal - compVal, checkVal) : 0 },
    ];
  }, [summaryData]);

  if (loading && !summaryData) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-Cairo font-black text-slate-700 animate-pulse text-sm">جاري معالجة الإحصائيات وبناء التقارير المحلية...</p>
      </div>
    );
  }

  const kpis = summaryData?.summary || {
    pageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    returningVisitors: 0,
    conversionRate: 0
  };

  return (
    <div className="space-y-10 pb-16 font-Cairo">
      
      {/* 1. Header with Period Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-800">📊 مركز تحليلات زوار الموقع</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">تتبع سلوك المستخدمين ومصادر الحملات التسويقية محلياً</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              اليوم
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              آخر 30 يوماً
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              فترة مخصصة
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-700 outline-none px-2"
              />
              <span className="text-slate-400 font-bold text-xs">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-700 outline-none px-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المشاهدات</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg">👁️</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(kpis.pageViews || 0).toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">صفحة تم تصفحها</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الزوار الفريدون</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-lg">👥</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(kpis.uniqueVisitors || 0).toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">زائر فريد جديد ومكرر</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الجلسات الكلية</span>
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl text-lg">⏱️</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(kpis.sessions || 0).toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">جلسات تصفح منفصلة</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الزوار العائدون</span>
            <span className="p-2 bg-pink-50 text-pink-600 rounded-xl text-lg">🔄</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(kpis.returningVisitors || 0).toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">زوار مكررين خلال الفترة</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل التحويل</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl text-lg">💰</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-amber-600">{kpis.conversionRate}%</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">نسبة إتمام الشراء للزوار</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل الارتداد</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl text-lg">🏃‍♂️</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-rose-600">{kpis.bounceRate}%</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">جلسة زارت صفحة واحدة وغادرت</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-3 lg:col-span-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">متوسط الجلسة</span>
            <span className="p-2 bg-violet-50 text-violet-600 rounded-xl text-lg">⏳</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{formatDuration(kpis.avgSessionDuration)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1">معدل البقاء والنشاط الفعلي داخل الموقع</p>
          </div>
        </div>

      </div>

      {/* 3. Funnel & Campaign row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Funnel chart (2/3 cols) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">🏁 مسار تحويل المبيعات (Sales Funnel)</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">نسب التحويل ونقاط الفقدان بين مراحل الشراء</p>
          </div>

          <div className="space-y-4">
            {funnelSteps.map((step, idx) => {
              const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
              const lossPercent = prevStep && prevStep.val ? getPercent(prevStep.val - step.val, prevStep.val) : 0;
              return (
                <div key={step.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">{step.key}</span>
                    <div className="flex gap-4">
                      <span className="text-slate-500">{(step.val || 0).toLocaleString()} جلسة</span>
                      <span className="text-emerald-600 font-black">{step.percentOfTotal}%</span>
                    </div>
                  </div>
                  <div className="h-5 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative">
                    <div 
                      className={`h-full transition-all duration-500 ${idx === 4 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-300'}`}
                      style={{ width: `${step.percentOfTotal}%` }}
                    ></div>
                    {idx > 0 && prevStep && prevStep.val > 0 && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-rose-500">
                        📉 هبوط: -{lossPercent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device & OS Dist (1/3 cols) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">📱 توزيع الأجهزة والأنظمة</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">المنصات والمتصفحات المفضلة لزوارك</p>
          </div>

          {/* Devices list */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">الهواتف والأجهزة</h4>
            <div className="space-y-2">
              {summaryData?.devices?.map((d: any) => (
                <div key={d.deviceType} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {d.deviceType === 'Mobile' ? '📱 جوال' : d.deviceType === 'Tablet' ? '📟 تابلت' : '💻 حاسوب'}
                  </span>
                  <span className="font-black text-slate-800">{(d.count || 0).toLocaleString()} جلسة</span>
                </div>
              )) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات متاحة</p>}
            </div>

            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 pt-2">أنظمة التشغيل الأكثر استخداماً</h4>
            <div className="space-y-2">
              {summaryData?.os?.map((o: any) => (
                <div key={o.osName} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{o.osName}</span>
                  <span className="font-black text-slate-800">{(o.count || 0).toLocaleString()} جلسة</span>
                </div>
              )) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات متاحة</p>}
            </div>

            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1 pt-2">مصادر الزيارات الأكثر نشاطاً</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {summaryData?.referrers?.map((r: any, idx: number) => {
                let refLabel = r.referrer;
                if (!refLabel || refLabel === '' || refLabel === 'null' || refLabel.includes('Direct') || refLabel.toLowerCase() === 'direct') {
                  refLabel = 'Direct / Bookmark (زيارة مباشرة)';
                } else if (refLabel.includes('google')) {
                  refLabel = '🔍 محرك بحث جوجل (Google)';
                } else if (refLabel.includes('facebook') || refLabel.includes('fb.me')) {
                  refLabel = '👥 فيسبوك (Facebook)';
                } else if (refLabel.includes('whatsapp') || refLabel.includes('wa.me')) {
                  refLabel = '💬 واتساب (WhatsApp)';
                } else if (refLabel.includes('instagram')) {
                  refLabel = '📸 إنستغرام (Instagram)';
                } else if (refLabel.includes('t.co') || refLabel.includes('twitter') || refLabel.includes('x.com')) {
                  refLabel = '🐦 منصة إكس (Twitter/X)';
                } else {
                  refLabel = refLabel.replace(/https?:\/\/(www\.)?/, '');
                }
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[170px]" title={r.referrer}>{refLabel}</span>
                    <span className="font-black text-slate-800">{(r.count || 0).toLocaleString()} زيارة</span>
                  </div>
                );
              }) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات مصادر زيارات</p>}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Products View vs Cart & Search Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">🔝 السلع الأكثر زيارة وتفاعلاً</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">المنتجات التي تحظى باهتمام الزوار</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">المنتج</th>
                  <th className="pb-3 font-bold text-left">المشاهدات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.topProducts?.map((p: any) => (
                  <tr key={p.productId} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700">{p.productName || p.productId}</td>
                    <td className="py-3 font-black text-slate-800 text-left">{(p.viewsCount || 0).toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">لا توجد بيانات مشاهدات حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search Keywords Analytics */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">🔍 تحليلات محرك البحث</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">ماذا يبحث الزوار داخل المتجر ونتائج البحث</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Searches */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase border-b pb-1">الكلمات الأكثر بحثاً</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                {searchData?.topQueries?.map((q: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">🔍 {q.queryText}</span>
                    <span className="font-black text-slate-500">{q.count} مرة</span>
                  </div>
                )) || <p className="text-xs text-slate-400">لا توجد سجلات بحث</p>}
              </div>
            </div>

            {/* Zero Results Searches */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-rose-500 uppercase border-b pb-1">عمليات بحث بلا نتائج (Zero Results)</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                {searchData?.zeroResults?.map((q: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">⚠️ {q.queryText}</span>
                    <span className="font-black text-rose-500">{q.count} مرة</span>
                  </div>
                )) || <p className="text-xs text-slate-400">لا توجد عمليات بحث بدون نتائج</p>}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 5. Campaign UTM Tracking */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-800">📣 أداء حملات التسويق (UTM Campaign Tracking)</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1">تتبع العملاء القادمين من إعلانات فيسبوك، جوجل، أو وسائل التواصل الاجتماعي</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">الحملة الإعلانية (Campaign)</th>
                <th className="pb-3 font-bold">المصدر (Source)</th>
                <th className="pb-3 font-bold text-center">عدد الزوار</th>
                <th className="pb-3 font-bold text-center">الطلبات المكتملة</th>
                <th className="pb-3 font-bold text-left">معدل التحويل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summaryData?.utmCampaigns?.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-800">📣 {c.utm_campaign}</td>
                  <td className="py-3 font-bold text-slate-500">{c.utm_source || 'Unknown'}</td>
                  <td className="py-3 font-black text-slate-700 text-center">{Number(c.visitors).toLocaleString()}</td>
                  <td className="py-3 font-black text-emerald-600 text-center">{Number(c.conversions).toLocaleString()}</td>
                  <td className="py-3 font-black text-indigo-600 text-left">
                    {c.visitors > 0 ? getPercent(c.conversions, c.visitors) : 0}%
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">لم يتم رصد أي حملات UTM مسجلة خلال الفترة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Abandoned Carts Log */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-800">🛒 السلال المتروكة (Abandoned Carts Log)</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1">الزوار الذين أضافوا منتجات للسلة ولم يكملوا الشراء</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">معرف الجلسة / المدينة</th>
                <th className="pb-3 font-bold">آخر وقت نشاط</th>
                <th className="pb-3 font-bold">آخر محتويات السلة</th>
                <th className="pb-3 font-bold text-left">إجمالي السلة المفقودة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summaryData?.abandonedCarts?.map((c: any, idx: number) => {
                const total = c.items?.items?.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-bold text-slate-800">{c.sessionId.slice(-8).toUpperCase()}</div>
                      <div className="text-[10px] font-bold text-slate-400">{c.city || 'פקוס'}</div>
                    </td>
                    <td className="py-3 font-bold text-slate-500">
                      {new Date(c.lastActive).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.lastActive).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3">
                      <div className="text-slate-600 font-bold max-w-xs truncate">
                        {c.items?.items?.map((item: any) => `${item.name} (${item.quantity})`).join(', ') || 'منتج غير معروف'}
                      </div>
                    </td>
                    <td className="py-3 font-black text-rose-600 text-left">
                      {total > 0 ? `${total.toLocaleString()} ج.م` : 'غير متوفر'}
                    </td>
                  </tr>
                );
              }) || (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">لا توجد سلال متروكة حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Settings Feature Flags & Maintenance Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flags Control (2/3 cols) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">⚙️ أعلام التحكم بميزات التحليلات (Feature Flags)</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">تفعيل أو تعطيل التتبع لزيادة الخصوصية أو توفير الأداء</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-700 block">تفعيل التحليلات بالكامل</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">تشغيل أو إيقاف التتبع للزوار</span>
              </div>
              <button 
                onClick={() => handleToggleFlag('analytics_enabled')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${flags.analytics_enabled === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${flags.analytics_enabled === '1' ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-700 block">تتبع سلة المشتريات</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">إضافة/حذف السلة وبدء الدفع</span>
              </div>
              <button 
                onClick={() => handleToggleFlag('analytics_track_cart')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${flags.analytics_track_cart === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${flags.analytics_track_cart === '1' ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-700 block">تتبع عمليات البحث</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">سجل الكلمات المبحوثة ونسبة النتائج</span>
              </div>
              <button 
                onClick={() => handleToggleFlag('analytics_track_search')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${flags.analytics_track_search === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${flags.analytics_track_search === '1' ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-700 block">تتبع التفاعل والمشاركة</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">مشاركة منتج ونقرات التواصل</span>
              </div>
              <button 
                onClick={() => handleToggleFlag('analytics_track_social')}
                className={`w-12 h-6 rounded-full p-1 transition-all ${flags.analytics_track_social === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${flags.analytics_track_social === '1' ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

          </div>
        </div>

        {/* Maintenance Box (1/3 cols) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">🧹 صيانة سجلات البيانات</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">تنظيف السجلات الخام وترقية الجداول التاريخية</p>
          </div>

          <div className="space-y-4">
            <p className="text-slate-500 text-[10px] font-bold leading-relaxed">
              تقوم الصيانة بتجميع سجلات الأيام السابقة في ملخصات إحصائية خفيفة، ثم حذف سجلات الزيارات والتتبع الخام التي مر عليها 180 يوماً. يوفر ذلك مساحة كبيرة في قاعدة البيانات ويحافظ على سرعة الاستعلامات السنوية.
            </p>

            <button
              onClick={runMaintenance}
              disabled={isMaintenanceRunning}
              className="w-full bg-slate-900 text-white font-black text-xs py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>🧹 تشغيل الصيانة والأرشفة الآن</span>
            </button>

            {maintenanceMsg && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-[10px] font-bold text-emerald-700 text-center animate-fadeIn leading-relaxed">
                {maintenanceMsg}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsTab;
