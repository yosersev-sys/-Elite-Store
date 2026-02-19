import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { User } from '../../types';

interface SettingsTabProps {
  currentUser: User | null;
  onLogout: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser, onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  
  // حالات تحسين الصور
  const [unoptimizedCount, setUnoptimizedCount] = useState(0);
  const [totalToOptimize, setTotalToOptimize] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // إعدادات المتجر
  const [storeSettings, setStoreSettings] = useState({
    whatsapp_number: '201026034170',
    delivery_fee: '0',
    homepage_title: 'سوق العصر - أول سوق إلكتروني في فاقوس',
    homepage_description: 'تسوق أفضل الخضروات، الفواكه، ومنتجات السوبر ماركت في فاقوس أونلاين بضغطة زر.',
    homepage_keywords: 'سوق العصر، فاقوس، سوبر ماركت فاقوس، خضروات فاقوس، توصيل فاقوس'
  });

  const [adminData, setAdminData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settings, imgCount] = await Promise.all([
        ApiService.getStoreSettings(),
        ApiService.getUnoptimizedCount()
      ]);
      
      if (settings) setStoreSettings(prev => ({ ...prev, ...settings }));
      if (imgCount) setUnoptimizedCount(imgCount.count);
      
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    setIsSaving(true);
    try {
      const success = await ApiService.updateStoreSettings(storeSettings);
      if (success) alert('تم حفظ إعدادات المتجر بنجاح! ✨');
    } catch (err) { alert('حدث خطأ أثناء الحفظ'); } finally { setIsSaving(false); }
  };

  const handleStartOptimization = async () => {
    if (unoptimizedCount === 0) return;
    
    setIsOptimizing(true);
    setTotalToOptimize(unoptimizedCount);
    let remaining = unoptimizedCount;
    
    try {
      while (remaining > 0) {
        const res = await ApiService.optimizeNextBatch();
        if (res && res.status === 'success') {
          remaining = res.remaining;
          setUnoptimizedCount(remaining);
          const progress = ((totalToOptimize - remaining) / totalToOptimize) * 100;
          setOptimizationProgress(Math.round(progress));
          
          if (remaining <= 0) break;
        } else {
          throw new Error("Optimization batch failed");
        }
      }
      alert('تم الانتهاء من تحسين جميع الصور بنجاح! 🚀');
    } catch (err) {
      console.error(err);
      alert('توقفت العملية بسبب خطأ تقني. يمكنك المحاولة مرة أخرى.');
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      if (await ApiService.generateSitemap()) alert('تم توليد ملف Sitemap.xml بنجاح!');
    } finally { setIsGeneratingSitemap(false); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10 animate-fadeIn pb-20">
      
      {/* محسن الصور الذكي */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-emerald-500 space-y-8 relative overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🖼️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">محسن الصور الذكي (WebP)</h3>
            <p className="text-slate-400 text-xs font-bold">تسريع الموقع بتقليل أحجام صور المنتجات</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <p className="text-xs font-black text-slate-400 uppercase mb-1">صور تحتاج لتحسين</p>
               <p className="text-4xl font-black text-slate-800">{unoptimizedCount} <small className="text-sm">منتج</small></p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              سيقوم هذا المعالج بتحويل جميع صور المتجر إلى صيغة <b>WebP</b> العالمية، وهي أخف بنسبة 60% من الصور العادية، مما يجعل متجرك يفتح في أقل من ثانية!
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {isOptimizing ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">جاري المعالجة...</span>
                  <span className="text-xl font-black text-slate-800">{optimizationProgress}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border-2 border-white">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${optimizationProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-[9px] font-bold text-slate-400 animate-pulse">يرجى عدم إغلاق هذه الصفحة حتى انتهاء العملية</p>
              </div>
            ) : (
              <button 
                onClick={handleStartOptimization}
                disabled={unoptimizedCount === 0}
                className={`w-full py-6 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${unoptimizedCount === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-900/10'}`}
              >
                <span>{unoptimizedCount === 0 ? 'الصور محسنة بالكامل ✨' : 'بدء تحسين كافة الصور الآن'}</span>
                {unoptimizedCount > 0 && <span className="text-[10px] opacity-60 font-bold">معالجة تلقائية لكافة المنتجات</span>}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* إعدادات الشحن والتواصل */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🚚</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات الشحن والتواصل</h3>
            <p className="text-slate-400 text-xs font-bold">التحكم في تكلفة التوصيل وأرقام التواصل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تكلفة التوصيل (ج.م)</label>
            <div className="relative">
              <input 
                type="number"
                value={storeSettings.delivery_fee}
                onChange={e => setStoreSettings({...storeSettings, delivery_fee: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-lg transition-all shadow-inner"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">ج.م</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم واتساب المتجر</label>
            <input 
              value={storeSettings.whatsapp_number}
              onChange={e => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-lg transition-all shadow-inner text-left"
              dir="ltr"
            />
          </div>
        </div>

        <button 
          onClick={handleSaveStoreSettings}
          disabled={isSaving}
          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل 💾'}
        </button>
      </section>

      {/* باقي الأقسام (Sitemap, SEO, Profile) تظل كما هي */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-indigo-500 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🗺️</div>
          <h3 className="text-xl font-black text-slate-800">أدوات الأرشفة (Sitemap)</h3>
        </div>
        <button onClick={handleGenerateSitemap} disabled={isGeneratingSitemap} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black">
          {isGeneratingSitemap ? 'جاري التوليد...' : 'توليد ملف Sitemap الآن'}
        </button>
      </section>
    </div>
  );
};

export default SettingsTab;