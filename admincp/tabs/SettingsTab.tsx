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
  const [serverStatus, setServerStatus] = useState({ gd_enabled: true, webp_supported: true });

  // إعدادات المتجر
  const [storeSettings, setStoreSettings] = useState({
    whatsapp_number: '201026034170',
    delivery_fee: '0',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settings, imgStatus] = await Promise.all([
        ApiService.getStoreSettings(),
        ApiService.getUnoptimizedCount()
      ]);
      
      if (settings) setStoreSettings(prev => ({ ...prev, ...settings }));
      if (imgStatus) {
        setUnoptimizedCount(imgStatus.count);
        setServerStatus({ 
          // Fixed: Access correctly typed gd_enabled property from ApiService response
          gd_enabled: imgStatus.gd_enabled, 
          // Fixed: Access correctly typed webp_supported property from ApiService response
          webp_supported: imgStatus.webp_supported 
        });
      }
      
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOptimization = async () => {
    if (!serverStatus.gd_enabled) {
      alert("⚠️ السيرفر الخاص بك لا يدعم معالجة الصور (مكتبة GD مفقودة). يرجى التواصل مع الدعم الفني للاستضافة لتفعيلها.");
      return;
    }

    if (unoptimizedCount === 0) {
      alert("الصور محسنة بالكامل بالفعل! ✨");
      return;
    }
    
    setIsOptimizing(true);
    setTotalToOptimize(unoptimizedCount);
    let remaining = unoptimizedCount;
    
    try {
      while (remaining > 0) {
        const res = await ApiService.optimizeNextBatch();
        if (res && res.status === 'success') {
          remaining = res.remaining;
          setUnoptimizedCount(remaining);
          
          // حساب النسبة المئوية
          const progress = totalToOptimize > 0 ? ((totalToOptimize - remaining) / totalToOptimize) * 100 : 100;
          setOptimizationProgress(Math.min(100, Math.round(progress)));
          
          if (remaining <= 0 || res.processed === 0) break;
          
          // تأخير بسيط لإراحة السيرفر
          await new Promise(r => setTimeout(r, 500));
        } else {
          throw new Error("Batch failed");
        }
      }
      alert('تم الانتهاء من تحسين جميع الصور بنجاح! 🚀');
    } catch (err) {
      console.error(err);
      alert('توقفت العملية. قد يكون السبب انتهاء وقت محاولة السيرفر. تم تحسين الصور التي عولجت بنجاح.');
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
      loadData();
    }
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
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🖼️</div>
            <div>
              <h3 className="text-xl font-black text-slate-800">محسن الصور الذكي (WebP)</h3>
              <p className="text-slate-400 text-xs font-bold">تسريع الموقع بتقليل أحجام صور المنتجات</p>
            </div>
          </div>
          <button onClick={loadData} className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all">🔄</button>
        </div>

        {!serverStatus.gd_enabled && (
          <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl flex items-start gap-4 animate-pulse">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="font-black text-rose-700 text-sm">تنبيه تقني: ميزة التحسين معطلة</p>
              <p className="text-rose-600 text-xs font-bold mt-1 leading-relaxed">
                مكتبة معالجة الصور (PHP GD Library) غير مفعلة في استضافتك. يرجى مراسلة دعم الاستضافة لتفعيلها لتتمكن من ضغط الصور.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className={`p-6 rounded-3xl border transition-all ${unoptimizedCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
               <p className={`text-[10px] font-black uppercase mb-1 ${unoptimizedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>صور بانتظار التحسين</p>
               <p className={`text-4xl font-black ${unoptimizedCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{unoptimizedCount} <small className="text-sm">منتج</small></p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              سيتم ضغط الصور الأصلية وتحويلها إلى <b>WebP</b>، مما يقلل الحجم بنسبة 60% مع الحفاظ على الجودة العالية.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {isOptimizing ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">جاري ضغط الصور...</span>
                  <span className="text-xl font-black text-slate-800">{optimizationProgress}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${optimizationProgress}%` }}
                  ></div>
                </div>
                <p className="text-center text-[9px] font-bold text-slate-400 animate-pulse italic">يتم الآن معالجة الصور دفعات.. يرجى الانتظار</p>
              </div>
            ) : (
              <button 
                onClick={handleStartOptimization}
                disabled={unoptimizedCount === 0 || !serverStatus.gd_enabled}
                className={`w-full py-6 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${unoptimizedCount === 0 || !serverStatus.gd_enabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-900/10'}`}
              >
                <span>{unoptimizedCount === 0 ? 'الصور محسنة بالكامل ✨' : 'بدء التحسين الشامل'}</span>
                {unoptimizedCount > 0 && <span className="text-[10px] opacity-60 font-bold">توفير مساحة وسرعة مذهلة</span>}
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
          onClick={async () => {
            setIsSaving(true);
            try {
              if (await ApiService.updateStoreSettings(storeSettings)) alert('تم الحفظ بنجاح! ✨');
            } finally { setIsSaving(false); }
          }}
          disabled={isSaving}
          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل 💾'}
        </button>
      </section>

      {/* أدوات الأرشفة */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-indigo-500 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🗺️</div>
          <h3 className="text-xl font-black text-slate-800">أدوات الأرشفة (Sitemap)</h3>
        </div>
        <button 
          onClick={async () => {
            setIsGeneratingSitemap(true);
            try { if (await ApiService.generateSitemap()) alert('تم توليد ملف Sitemap.xml بنجاح!'); } finally { setIsGeneratingSitemap(false); }
          }} 
          disabled={isGeneratingSitemap} 
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
        >
          {isGeneratingSitemap ? 'جاري التوليد...' : 'توليد ملف Sitemap الآن'}
        </button>
      </section>
    </div>
  );
};

export default SettingsTab;