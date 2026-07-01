import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/api';

interface AnalyticsTabProps {
  isOnline?: boolean;
}

// ═══════════════════════════════════════════════════
// CSV Export Helper (supports Arabic via UTF-8 BOM)
// ═══════════════════════════════════════════════════
const exportToCSV = (rows: Record<string, any>[], headers: { key: string; label: string }[], filename: string) => {
  const csvRows: string[] = [];
  csvRows.push(headers.map(h => `"${h.label}"`).join(','));
  rows.forEach(row => {
    const values = headers.map(h => {
      const val = row[h.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  const csvContent = '\ufeff' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════
// Trend Badge Component: shows % change with color
// ═══════════════════════════════════════════════════
const TrendBadge: React.FC<{ current: number; prior: number; invertColor?: boolean; suffix?: string }> = ({ current, prior, invertColor = false, suffix = '' }) => {
  if (prior === 0 && current === 0) return <span className="text-[9px] font-bold text-slate-400">—</span>;
  if (prior === 0) return <span className="text-[9px] font-black text-emerald-600">جديد ✨</span>;

  const change = ((current - prior) / prior) * 100;
  const rounded = Math.round(change);
  const isPositive = rounded > 0;
  const isNegative = rounded < 0;

  let colorClass = 'text-slate-400';
  if (isPositive) colorClass = invertColor ? 'text-rose-600' : 'text-emerald-600';
  if (isNegative) colorClass = invertColor ? 'text-emerald-600' : 'text-rose-600';

  return (
    <span className={`text-[9px] font-black ${colorClass}`}>
      {isPositive ? '📈' : isNegative ? '📉' : '➡️'} {rounded > 0 ? '+' : ''}{rounded}%{suffix}
    </span>
  );
};

// ═══════════════════════════════════════════════════
// Export Button Component
// ═══════════════════════════════════════════════════
const ExportBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-[9px] font-black text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
    title="تصدير CSV"
  >
    📥 تصدير CSV
  </button>
);

// ═══════════════════════════════════════════════════
// Section Card Wrapper
// ═══════════════════════════════════════════════════
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: string; title: string; subtitle: string; extra?: React.ReactNode }> = ({ icon, title, subtitle, extra }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div>
      <h3 className="text-sm font-black text-slate-800">{icon} {title}</h3>
      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{subtitle}</p>
    </div>
    {extra}
  </div>
);

// ═══════════════════════════════════════════════════
// Referrer label helper
// ═══════════════════════════════════════════════════
const formatReferrerLabel = (ref: string | null | undefined): string => {
  if (!ref || ref === '' || ref === 'null' || ref === 'direct' || ref.includes('Direct') || ref.toLowerCase() === 'direct') {
    return 'زيارة مباشرة (Direct / Bookmark)';
  } else if (ref.includes('google')) {
    return '🔍 محرك بحث جوجل (Google)';
  } else if (ref.includes('facebook') || ref.includes('fb.me')) {
    return '👥 فيسبوك (Facebook)';
  } else if (ref.includes('whatsapp') || ref.includes('wa.me')) {
    return '💬 واتساب (WhatsApp)';
  } else if (ref.includes('instagram')) {
    return '📸 إنستغرام (Instagram)';
  } else if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) {
    return '🐦 منصة إكس (Twitter/X)';
  }
  return ref.replace(/https?:\/\/(www\.)?/, '');
};

// Page label helper
const formatPageLabel = (page: string): string => {
  const map: Record<string, string> = {
    'store': '🏠 الرئيسية',
    'product-details': '📦 تفاصيل المنتج',
    'cart': '🛒 السلة',
    'checkout': '💳 الدفع',
    'order-success': '✅ نجاح الطلب',
    'profile': '👤 الملف الشخصي',
    'my-orders': '📋 طلباتي',
    'auth': '🔐 تسجيل الدخول',
    'categories': '📂 الأقسام',
  };
  return map[page] || page;
};

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
      { key: 'الرئيسية', val: storeVal, percentOfTotal: 100, icon: '🏠' },
      { key: 'تفاصيل المنتجات', val: prodVal, percentOfTotal: getPercent(prodVal, storeVal), icon: '📦' },
      { key: 'إضافة للسلة', val: cartVal, percentOfTotal: getPercent(cartVal, storeVal), icon: '🛒' },
      { key: 'بدء الدفع', val: checkVal, percentOfTotal: getPercent(checkVal, storeVal), icon: '💳' },
      { key: 'الطلبات المكتملة', val: compVal, percentOfTotal: getPercent(compVal, storeVal), icon: '✅' },
    ];
  }, [summaryData]);

  // ═══════════════════════════════════════════════════
  // Smart Alerts
  // ═══════════════════════════════════════════════════
  const smartAlerts = useMemo(() => {
    if (!summaryData) return [];
    const alerts: { type: 'warning' | 'danger' | 'info'; icon: string; message: string }[] = [];
    const cur = summaryData.summary || {};
    const prior = summaryData.priorSummary || {};

    // Traffic drop > 20%
    if (prior.uniqueVisitors > 0 && cur.uniqueVisitors < prior.uniqueVisitors) {
      const drop = Math.round(((prior.uniqueVisitors - cur.uniqueVisitors) / prior.uniqueVisitors) * 100);
      if (drop >= 20) {
        alerts.push({ type: 'danger', icon: '📉', message: `انخفاض حاد في الزوار بنسبة ${drop}% مقارنة بالفترة السابقة. تحقق من حملاتك التسويقية ومصادر الزيارات.` });
      }
    }

    // High bounce rate
    if (cur.bounceRate > 60) {
      alerts.push({ type: 'warning', icon: '🏃', message: `معدل الارتداد مرتفع (${cur.bounceRate}%). يغادر أغلب الزوار بعد مشاهدة صفحة واحدة فقط. حسّن محتوى الصفحة الرئيسية.` });
    }

    // High value abandoned cart
    const absStats = summaryData.abandonedStats || {};
    if (absStats.totalAbandonedValue > 500) {
      alerts.push({ type: 'warning', icon: '🛒', message: `يوجد سلال متروكة بإجمالي ${Number(absStats.totalAbandonedValue).toLocaleString()} ج.م! راجع قسم السلال المتروكة وأرسل تذكيرات للعملاء.` });
    }

    // Slow page load
    const loadTime = summaryData.avgLoadTimeSec || 0;
    if (loadTime > 3) {
      alerts.push({ type: 'danger', icon: '⚡', message: `متوسط سرعة تحميل الصفحات بطيء جداً (${loadTime} ثانية). المواقع البطيئة تفقد عملاء. حسّن أحجام الصور وأداء السيرفر.` });
    }

    return alerts;
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
    pageViews: 0, uniqueVisitors: 0, sessions: 0, bounceRate: 0,
    avgSessionDuration: 0, returningVisitors: 0, conversionRate: 0
  };
  const priorKpis = summaryData?.priorSummary || {
    pageViews: 0, uniqueVisitors: 0, sessions: 0, bounceRate: 0,
    avgSessionDuration: 0, returningVisitors: 0, conversionRate: 0
  };

  return (
    <div className="space-y-8 pb-16 font-Cairo">

      {/* ═══════════════════════════════════════════════ */}
      {/* 0. SMART ALERTS */}
      {/* ═══════════════════════════════════════════════ */}
      {smartAlerts.length > 0 && (
        <div className="space-y-2">
          {smartAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed flex items-start gap-3 animate-fadeIn ${
                alert.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <span className="text-lg shrink-0">{alert.icon}</span>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 1. HEADER WITH PERIOD SELECTION */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-800">📊 مركز تحليلات زوار الموقع</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">تتبع سلوك المستخدمين ومصادر الحملات التسويقية محلياً</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            {(['today', 'week', 'month', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${period === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {p === 'today' ? 'اليوم' : p === 'week' ? 'آخر 7 أيام' : p === 'month' ? 'آخر 30 يوماً' : 'فترة مخصصة'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent font-bold text-xs text-slate-700 outline-none px-2" />
              <span className="text-slate-400 font-bold text-xs">إلى</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent font-bold text-xs text-slate-700 outline-none px-2" />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 1.5 DAILY DIGEST PANEL */}
      {/* ═══════════════════════════════════════════════ */}
      {summaryData?.dailyDigest && (
        <div className="bg-gradient-to-l from-indigo-50 to-violet-50 p-5 rounded-3xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📰</span>
            <h3 className="text-xs font-black text-indigo-800">ملخص يوم أمس السريع</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'الزوار', val: summaryData.dailyDigest.yesterday?.uniqueVisitors || 0, prior: summaryData.dailyDigest.dayBefore?.uniqueVisitors || 0 },
              { label: 'المشاهدات', val: summaryData.dailyDigest.yesterday?.pageViews || 0, prior: summaryData.dailyDigest.dayBefore?.pageViews || 0 },
              { label: 'الطلبات', val: summaryData.dailyDigest.yesterday?.orders || 0, prior: summaryData.dailyDigest.dayBefore?.orders || 0 },
              { label: 'التحويل', val: summaryData.dailyDigest.yesterday?.conversionRate || 0, prior: summaryData.dailyDigest.dayBefore?.conversionRate || 0 },
            ].map((item, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm p-3 rounded-2xl text-center">
                <p className="text-[9px] font-bold text-indigo-400">{item.label}</p>
                <p className="text-lg font-black text-indigo-800 my-0.5">{item.label === 'التحويل' ? `${item.val}%` : item.val.toLocaleString()}</p>
                <TrendBadge current={item.val} prior={item.prior} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 2. KPI CARDS WITH TREND INDICATORS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المشاهدات', val: kpis.pageViews, prior: priorKpis.pageViews, icon: '👁️', bg: 'indigo', sub: 'صفحة تم تصفحها' },
          { label: 'الزوار الفريدون', val: kpis.uniqueVisitors, prior: priorKpis.uniqueVisitors, icon: '👥', bg: 'emerald', sub: 'زائر فريد جديد ومكرر' },
          { label: 'الجلسات الكلية', val: kpis.sessions, prior: priorKpis.sessions, icon: '⏱️', bg: 'sky', sub: 'جلسات تصفح منفصلة' },
          { label: 'الزوار العائدون', val: kpis.returningVisitors, prior: priorKpis.returningVisitors, icon: '🔄', bg: 'pink', sub: 'زوار مكررين خلال الفترة' },
          { label: 'معدل التحويل', val: kpis.conversionRate, prior: priorKpis.conversionRate, icon: '💰', bg: 'amber', sub: 'نسبة إتمام الشراء', isPercent: true },
          { label: 'معدل الارتداد', val: kpis.bounceRate, prior: priorKpis.bounceRate, icon: '🏃', bg: 'rose', sub: 'زيارات صفحة واحدة', isPercent: true, invert: true },
          { label: 'متوسط الجلسة', val: kpis.avgSessionDuration, prior: priorKpis.avgSessionDuration, icon: '⏳', bg: 'violet', sub: 'مدة البقاء الفعلي', isDuration: true },
          { label: 'سرعة التحميل', val: summaryData?.avgLoadTimeSec || 0, prior: 0, icon: '⚡', bg: 'teal', sub: 'متوسط وقت تحميل الصفحات', isSec: true },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
              <span className={`p-2 bg-${card.bg}-50 text-${card.bg}-600 rounded-xl text-lg`}>{card.icon}</span>
            </div>
            <div>
              <h3 className={`text-2xl font-black ${card.isPercent ? (card.invert ? 'text-rose-600' : 'text-amber-600') : 'text-slate-800'}`}>
                {card.isDuration ? formatDuration(card.val || 0) : card.isSec ? `${card.val} ثانية` : card.isPercent ? `${card.val}%` : (card.val || 0).toLocaleString()}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[9px] font-bold text-slate-400">{card.sub}</p>
                {card.prior !== undefined && !card.isSec && (
                  <TrendBadge current={card.val} prior={card.prior} invertColor={card.invert} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 3. FUNNEL TABLE & DEVICE/OS DISTRIBUTION */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Table */}
        <SectionCard className="lg:col-span-2">
          <SectionHeader icon="🏁" title="مسار تحويل المبيعات (Sales Funnel)" subtitle="نسب التحويل ونقاط الفقدان بين مراحل الشراء" />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">المرحلة</th>
                  <th className="pb-3 font-bold text-center">الجلسات</th>
                  <th className="pb-3 font-bold text-center">نسبة التحويل</th>
                  <th className="pb-3 font-bold text-left">الهبوط من المرحلة السابقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {funnelSteps.map((step, idx) => {
                  const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
                  const dropPercent = prevStep && prevStep.val > 0 ? getPercent(prevStep.val - step.val, prevStep.val) : 0;
                  return (
                    <tr key={step.key} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-700">{step.icon} {step.key}</td>
                      <td className="py-3 font-black text-slate-800 text-center">{(step.val || 0).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${step.percentOfTotal >= 50 ? 'bg-emerald-50 text-emerald-700' : step.percentOfTotal >= 20 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                          {step.percentOfTotal}%
                        </span>
                      </td>
                      <td className="py-3 text-left">
                        {idx > 0 && dropPercent > 0 ? (
                          <span className="text-[10px] font-black text-rose-500">📉 فقدان -{dropPercent}%</span>
                        ) : idx === 0 ? (
                          <span className="text-[10px] font-bold text-slate-300">—</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-500">✅ لا فقدان</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Device & OS Distribution */}
        <SectionCard>
          <SectionHeader icon="📱" title="توزيع الأجهزة والأنظمة" subtitle="المنصات والمتصفحات المفضلة لزوارك" />
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">الهواتف والأجهزة</h4>
              <div className="space-y-2 mt-2">
                {(() => {
                  const totalDev = summaryData?.devices?.reduce((s: number, d: any) => s + Number(d.count), 0) || 0;
                  return summaryData?.devices?.map((d: any) => {
                    const pct = totalDev > 0 ? Math.round((Number(d.count) / totalDev) * 100) : 0;
                    return (
                      <div key={d.deviceType} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {d.deviceType === 'Mobile' ? '📱 جوال' : d.deviceType === 'Tablet' ? '📟 تابلت' : '💻 حاسوب'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400">{pct}%</span>
                          <span className="font-black text-slate-800">{Number(d.count).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات</p>;
                })()}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">أنظمة التشغيل</h4>
              <div className="space-y-2 mt-2">
                {summaryData?.os?.map((o: any) => (
                  <div key={o.osName} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{o.osName}</span>
                    <span className="font-black text-slate-800">{Number(o.count).toLocaleString()} جلسة</span>
                  </div>
                )) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات</p>}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">المتصفحات</h4>
              <div className="space-y-2 mt-2">
                {summaryData?.browsers?.map((b: any) => (
                  <div key={b.browserName} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{b.browserName}</span>
                    <span className="font-black text-slate-800">{Number(b.count).toLocaleString()} جلسة</span>
                  </div>
                )) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات</p>}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b pb-1">مصادر الزيارات</h4>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto no-scrollbar">
                {summaryData?.referrers?.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[170px]" title={r.referrer}>{formatReferrerLabel(r.referrer)}</span>
                    <span className="font-black text-slate-800">{Number(r.count).toLocaleString()}</span>
                  </div>
                )) || <p className="text-xs text-slate-400 text-center">لا توجد بيانات</p>}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 4. PRODUCT PERFORMANCE & TOP PAGES */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Revenue & Cart Rate */}
        <SectionCard>
          <SectionHeader
            icon="💰"
            title="أداء المنتجات المالي والتحويل"
            subtitle="المشاهدات ونسبة الإضافة للسلة والإيرادات لكل منتج"
            extra={summaryData?.productPerformance?.length > 0 && (
              <ExportBtn onClick={() => exportToCSV(
                summaryData.productPerformance,
                [
                  { key: 'productName', label: 'المنتج' },
                  { key: 'viewsCount', label: 'المشاهدات' },
                  { key: 'cartAdds', label: 'إضافات السلة' },
                  { key: 'cartRate', label: 'نسبة الإضافة %' },
                  { key: 'ordersCount', label: 'الطلبات' },
                  { key: 'revenue', label: 'الإيرادات (ج.م)' }
                ],
                'product_performance'
              )} />
            )}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">المنتج</th>
                  <th className="pb-3 font-bold text-center">المشاهدات</th>
                  <th className="pb-3 font-bold text-center">السلة</th>
                  <th className="pb-3 font-bold text-center">نسبة السلة</th>
                  <th className="pb-3 font-bold text-center">الطلبات</th>
                  <th className="pb-3 font-bold text-left">الإيرادات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.productPerformance?.slice(0, 15).map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700 max-w-[150px] truncate" title={p.productName}>{p.productName || p.productId}</td>
                    <td className="py-3 font-black text-slate-600 text-center">{Number(p.viewsCount).toLocaleString()}</td>
                    <td className="py-3 font-black text-slate-600 text-center">{Number(p.cartAdds).toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${Number(p.cartRate) >= 30 ? 'bg-emerald-50 text-emerald-700' : Number(p.cartRate) >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                        {p.cartRate}%
                      </span>
                    </td>
                    <td className="py-3 font-black text-emerald-600 text-center">{Number(p.ordersCount).toLocaleString()}</td>
                    <td className="py-3 font-black text-indigo-700 text-left">{Number(p.revenue).toLocaleString()} ج.م</td>
                  </tr>
                )) || (
                  <tr><td colSpan={6} className="py-4 text-center text-slate-400">لا توجد بيانات حتى الآن</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Top Visited Pages */}
        <SectionCard>
          <SectionHeader
            icon="📄"
            title="الصفحات الأكثر زيارة"
            subtitle="عدد المشاهدات ومتوسط مدة البقاء لكل صفحة"
            extra={summaryData?.topPages?.length > 0 && (
              <ExportBtn onClick={() => exportToCSV(
                summaryData.topPages.map((p: any) => ({ ...p, pageLabel: formatPageLabel(p.page), avgDurFmt: formatDuration(Number(p.avgDuration) || 0) })),
                [
                  { key: 'pageLabel', label: 'الصفحة' },
                  { key: 'viewsCount', label: 'المشاهدات' },
                  { key: 'uniqueVisitors', label: 'الزوار الفريدون' },
                  { key: 'avgDurFmt', label: 'متوسط مدة البقاء' }
                ],
                'top_pages'
              )} />
            )}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">الصفحة</th>
                  <th className="pb-3 font-bold text-center">المشاهدات</th>
                  <th className="pb-3 font-bold text-center">الزوار</th>
                  <th className="pb-3 font-bold text-left">متوسط البقاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.topPages?.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700">{formatPageLabel(p.page)}</td>
                    <td className="py-3 font-black text-slate-800 text-center">{Number(p.viewsCount).toLocaleString()}</td>
                    <td className="py-3 font-black text-slate-600 text-center">{Number(p.uniqueVisitors).toLocaleString()}</td>
                    <td className="py-3 font-bold text-indigo-600 text-left">{formatDuration(Number(p.avgDuration) || 0)}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 5. SEARCH ANALYTICS */}
      {/* ═══════════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader icon="🔍" title="تحليلات محرك البحث" subtitle="ماذا يبحث الزوار داخل المتجر ونتائج البحث" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </SectionCard>

      {/* ═══════════════════════════════════════════════ */}
      {/* 6. GEOGRAPHICAL ANALYTICS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard>
          <SectionHeader icon="📍" title="المحافظات والمدن الأكثر زيارة" subtitle="توزيع الزوار جغرافياً داخل وخارج مصر" />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">الموقع</th>
                  <th className="pb-3 font-bold">الدولة</th>
                  <th className="pb-3 font-bold text-left">الزوار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.cities?.filter((c: any) => c.city && c.city !== 'Unknown').map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-800">📍 {c.city}</td>
                    <td className="py-3 font-bold text-slate-500">{c.country || 'مصر'}</td>
                    <td className="py-3 font-black text-slate-700 text-left">{Number(c.visitors).toLocaleString()}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">لم يتم رصد مواقع جغرافية بعد</td></tr>
                )}
                {summaryData?.cities?.filter((c: any) => c.city && c.city !== 'Unknown').length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">لم يتم رصد مواقع جغرافية بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon="💸" title="المناطق الأكثر شراءً" subtitle="توزيع إجمالي المبيعات حسب المناطق الجغرافية" />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">المنطقة الجغرافية</th>
                  <th className="pb-3 font-bold text-left">حجم المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.salesByCity?.filter((c: any) => c.city && c.city !== 'Unknown').map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-800">📍 {c.city}</td>
                    <td className="py-3 font-black text-emerald-600 text-left">{Number(c.totalSales).toLocaleString()} ج.م</td>
                  </tr>
                )) || (
                  <tr><td colSpan={2} className="py-4 text-center text-slate-400">لا توجد مبيعات مسجلة جغرافياً</td></tr>
                )}
                {summaryData?.salesByCity?.filter((c: any) => c.city && c.city !== 'Unknown').length === 0 && (
                  <tr><td colSpan={2} className="py-4 text-center text-slate-400">لا توجد مبيعات مسجلة جغرافياً</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Detailed Traffic Sources */}
      <SectionCard>
        <SectionHeader
          icon="🗺️"
          title="تفاصيل مصادر الزيارات الجغرافية والمنصات"
          subtitle="عرض تفصيلي يوضح مصادر الزيارة مع الموقع الجغرافي ونوع الأجهزة والمتصفحات"
          extra={summaryData?.referrerGeoDetails?.length > 0 && (
            <ExportBtn onClick={() => exportToCSV(
              summaryData.referrerGeoDetails.map((item: any) => ({
                ...item,
                refLabel: formatReferrerLabel(item.referrer),
                location: `${item.city || 'غير محدد'} (${item.country || 'مصر'})`,
                device: item.deviceType === 'Mobile' ? 'جوال' : item.deviceType === 'Tablet' ? 'تابلت' : 'حاسوب'
              })),
              [
                { key: 'refLabel', label: 'مصدر الزيارة' },
                { key: 'location', label: 'الموقع' },
                { key: 'device', label: 'الجهاز' },
                { key: 'browserName', label: 'المتصفح' },
                { key: 'visitsCount', label: 'الزيارات' },
                { key: 'uniqueVisitors', label: 'الزوار الفريدون' }
              ],
              'traffic_sources_details'
            )} />
          )}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">مصدر الزيارة</th>
                <th className="pb-3 font-bold">الموقع</th>
                <th className="pb-3 font-bold text-center">الجهاز</th>
                <th className="pb-3 font-bold text-center">المتصفح</th>
                <th className="pb-3 font-bold text-center">الزيارات</th>
                <th className="pb-3 font-bold text-left">الفريدون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summaryData?.referrerGeoDetails?.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-800 truncate max-w-[200px]" title={item.referrer}>{formatReferrerLabel(item.referrer)}</td>
                  <td className="py-3 font-bold text-slate-600">
                    📍 {item.city && item.city !== 'Unknown' ? item.city : 'غير محدد'} ({item.country || 'مصر'})
                  </td>
                  <td className="py-3 font-bold text-slate-500 text-center">
                    {item.deviceType === 'Mobile' ? '📱 جوال' : item.deviceType === 'Tablet' ? '📟 تابلت' : '💻 حاسوب'}
                  </td>
                  <td className="py-3 font-bold text-slate-500 text-center">{item.browserName || 'غير معروف'}</td>
                  <td className="py-3 font-black text-slate-700 text-center">{Number(item.visitsCount).toLocaleString()}</td>
                  <td className="py-3 font-black text-indigo-600 text-left">{Number(item.uniqueVisitors).toLocaleString()}</td>
                </tr>
              )) || (
                <tr><td colSpan={6} className="py-4 text-center text-slate-400">لا توجد بيانات تفصيلية</td></tr>
              )}
              {summaryData?.referrerGeoDetails?.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-slate-400">لا توجد بيانات تفصيلية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════ */}
      {/* 7. UTM CAMPAIGN TRACKING */}
      {/* ═══════════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader icon="📣" title="أداء حملات التسويق (UTM Campaign Tracking)" subtitle="تتبع العملاء القادمين من إعلانات فيسبوك، جوجل، أو وسائل التواصل" />
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-xs text-slate-700 leading-relaxed space-y-2">
          <p className="font-black text-emerald-800">💡 كيفية الاستخدام لتتبع حملاتك الإعلانية ومبيعاتها:</p>
          <p>عند عمل إعلانات ممولة، استخدم روابط تحتوي على معاملات تتبع (UTM) لكي يتعرف عليها النظام ويقوم بحساب الأرباح والزوار القادمين من هذا الإعلان بالتحديد.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] space-y-1">
              <span className="text-emerald-400 font-black text-[9px] block">🔗 إعلان ممول فيسبوك:</span>
              <span className="block break-all select-all">https://soqelasr.com/?utm_source=facebook&utm_campaign=summer_sale</span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] space-y-1">
              <span className="text-sky-400 font-black text-[9px] block">🔗 إعلان ممول جوجل:</span>
              <span className="block break-all select-all">https://soqelasr.com/?utm_source=google&utm_campaign=search_ads</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">الحملة (Campaign)</th>
                <th className="pb-3 font-bold">المصدر (Source)</th>
                <th className="pb-3 font-bold text-center">الزوار</th>
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
                  <td className="py-3 font-black text-indigo-600 text-left">{c.visitors > 0 ? getPercent(c.conversions, c.visitors) : 0}%</td>
                </tr>
              )) || (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">لم يتم رصد أي حملات UTM</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════ */}
      {/* 8. ABANDONED CARTS (ENHANCED) */}
      {/* ═══════════════════════════════════════════════ */}
      <SectionCard>
        <SectionHeader icon="🛒" title="السلال المتروكة المطورة (Abandoned Carts)" subtitle="الزوار الذين أضافوا منتجات ولم يكملوا الشراء — مع إحصائيات الاسترداد" />

        {/* Abandoned Stats Summary Cards */}
        {summaryData?.abandonedStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">
              <p className="text-[9px] font-bold text-rose-400">عدد السلال المتروكة</p>
              <p className="text-xl font-black text-rose-700 mt-1">{summaryData.abandonedStats.abandonedCount || 0}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
              <p className="text-[9px] font-bold text-emerald-400">السلال المستردة</p>
              <p className="text-xl font-black text-emerald-700 mt-1">{summaryData.abandonedStats.recoveredCount || 0}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-100">
              <p className="text-[9px] font-bold text-amber-400">معدل الاسترداد</p>
              <p className="text-xl font-black text-amber-700 mt-1">{summaryData.abandonedStats.recoveryRate || 0}%</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
              <p className="text-[9px] font-bold text-indigo-400">متوسط قيمة السلة</p>
              <p className="text-xl font-black text-indigo-700 mt-1">{Number(summaryData.abandonedStats.avgAbandonedValue || 0).toLocaleString()} ج.م</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">المعرف / المدينة</th>
                <th className="pb-3 font-bold">آخر نشاط</th>
                <th className="pb-3 font-bold">محتويات السلة</th>
                <th className="pb-3 font-bold text-center">القيمة</th>
                <th className="pb-3 font-bold text-left">تذكير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summaryData?.abandonedCarts?.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3">
                    <div className="font-bold text-slate-800">{c.sessionId.slice(-8).toUpperCase()}</div>
                    <div className="text-[10px] font-bold text-slate-400">{c.city || 'غير محدد'}</div>
                  </td>
                  <td className="py-3 font-bold text-slate-500">
                    {new Date(c.lastActive).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(c.lastActive).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-3">
                    <div className="text-slate-600 font-bold max-w-xs truncate">
                      {c.items?.items?.map((item: any) => `${item.name} (${item.quantity})`).join(', ') || 'منتج غير معروف'}
                    </div>
                  </td>
                  <td className="py-3 font-black text-rose-600 text-center">
                    {c.cartValue > 0 ? `${Number(c.cartValue).toLocaleString()} ج.م` : '—'}
                  </td>
                  <td className="py-3 text-left">
                    {c.phone ? (
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً 👋، لاحظنا أنك تركت منتجات في سلتك بمتجرنا سوق العصر. هل تحتاج مساعدة لإتمام طلبك؟ 🛒')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 active:scale-95 transition-all"
                      >
                        💬 واتساب
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300">لا يوجد هاتف</span>
                    )}
                  </td>
                </tr>
              )) || (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">لا توجد سلال متروكة حالياً</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════ */}
      {/* 9. COUPON PERFORMANCE & SOCIAL ENGAGEMENT */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coupon Performance */}
        <SectionCard>
          <SectionHeader icon="🎫" title="أداء الكوبونات" subtitle="عدد مرات الاستخدام والخصومات الممنوحة لكل كوبون" />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">كود الكوبون</th>
                  <th className="pb-3 font-bold text-center">ناجح</th>
                  <th className="pb-3 font-bold text-center">فاشل</th>
                  <th className="pb-3 font-bold text-left">إجمالي الخصم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.couponPerformance?.length > 0 ? summaryData.couponPerformance.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-800">🎫 {c.couponCode || '—'}</td>
                    <td className="py-3 font-black text-emerald-600 text-center">{Number(c.successCount).toLocaleString()}</td>
                    <td className="py-3 font-black text-rose-500 text-center">{Number(c.failCount).toLocaleString()}</td>
                    <td className="py-3 font-black text-indigo-700 text-left">{Number(c.totalDiscount || 0).toLocaleString()} ج.م</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">لم يتم رصد استخدام كوبونات خلال الفترة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Social Engagement */}
        <SectionCard>
          <SectionHeader icon="📱" title="التفاعلات الاجتماعية والمشاركة" subtitle="نقرات التواصل ومشاركات المنتجات عبر الشبكات" />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">الشبكة</th>
                  <th className="pb-3 font-bold text-center">نقرات التواصل</th>
                  <th className="pb-3 font-bold text-left">مشاركات المنتجات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summaryData?.socialEngagement?.length > 0 ? summaryData.socialEngagement.map((s: any, idx: number) => {
                  const netLabel = s.networkName === 'whatsapp' ? '💬 واتساب' : s.networkName === 'facebook' ? '👥 فيسبوك' : s.networkName === 'telegram' ? '📨 تيليجرام' : s.networkName === 'instagram' ? '📸 إنستغرام' : `🔗 ${s.networkName}`;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-800">{netLabel}</td>
                      <td className="py-3 font-black text-sky-600 text-center">{Number(s.clickCount).toLocaleString()}</td>
                      <td className="py-3 font-black text-emerald-600 text-left">{Number(s.shareCount).toLocaleString()}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">لم يتم رصد تفاعلات اجتماعية خلال الفترة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* 10. SETTINGS & MAINTENANCE */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags Control */}
        <SectionCard className="lg:col-span-2">
          <SectionHeader icon="⚙️" title="أعلام التحكم بميزات التحليلات (Feature Flags)" subtitle="تفعيل أو تعطيل التتبع لزيادة الخصوصية أو توفير الأداء" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'analytics_enabled' as const, label: 'تفعيل التحليلات بالكامل', sub: 'تشغيل أو إيقاف التتبع للزوار' },
              { key: 'analytics_track_cart' as const, label: 'تتبع سلة المشتريات', sub: 'إضافة/حذف السلة وبدء الدفع' },
              { key: 'analytics_track_search' as const, label: 'تتبع عمليات البحث', sub: 'سجل الكلمات المبحوثة ونسبة النتائج' },
              { key: 'analytics_track_social' as const, label: 'تتبع التفاعل والمشاركة', sub: 'مشاركة منتج ونقرات التواصل' },
            ].map(flag => (
              <div key={flag.key} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-700 block">{flag.label}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{flag.sub}</span>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag.key)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${flags[flag.key] === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${flags[flag.key] === '1' ? 'translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Maintenance */}
        <SectionCard>
          <SectionHeader icon="🧹" title="صيانة سجلات البيانات" subtitle="تنظيف السجلات الخام وترقية الجداول التاريخية" />
          <div className="space-y-4">
            <p className="text-slate-500 text-[10px] font-bold leading-relaxed">
              تقوم الصيانة بتجميع سجلات الأيام السابقة في ملخصات إحصائية خفيفة، ثم حذف سجلات الزيارات الخام التي مر عليها 180 يوماً. يوفر ذلك مساحة كبيرة في قاعدة البيانات.
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
        </SectionCard>
      </div>

    </div>
  );
};

export default AnalyticsTab;
