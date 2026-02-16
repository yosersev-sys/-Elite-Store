
import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fixed: Removed 'readonly' modifier to prevent identical modifier error in global augmentation
    aistudio?: AIStudio;
  }
}

const ApiKeysTab: React.FC = () => {
  const [dbKey, setDbKey] = useState('');
  const [hasAistudioKey, setHasAistudioKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // 1. التحقق من مفتاح المتصفح (AI Studio)
      if (window.aistudio) {
        const status = await window.aistudio.hasSelectedApiKey();
        setHasAistudioKey(status);
      }

      // 2. جلب المفتاح المخزن في قاعدة البيانات (للبيئات المستضافة)
      const settings = await ApiService.getStoreSettings();
      if (settings && settings.gemini_api_key) {
        setDbKey(settings.gemini_api_key);
      }
    } catch (err) {
      console.error("Error loading API settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAistudioConnect = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasAistudioKey(true);
        alert("تم ربط المفتاح عبر المتصفح بنجاح! سيتم استخدامه في الجلسة الحالية.");
      }
    } catch (err) {
      console.error("Error opening key selector:", err);
    }
  };

  const handleDbSave = async () => {
    if (!dbKey.trim()) return alert('يرجى إدخال مفتاح API صحيح');
    setIsSaving(true);
    try {
      const success = await ApiService.updateStoreSettings({
        gemini_api_key: dbKey.trim()
      });
      if (success) {
        alert('تم حفظ مفتاح API في إعدادات السيرفر بنجاح! سيتم تفعيله لجميع المستخدمين عند تحديث الصفحة.');
        // Fixed: Removed invalid window.process access. The environment handles process.env.
      } else {
        alert('فشل حفظ الإعدادات، يرجى التحقق من صلاحيات المدير');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري التحقق من إعدادات النظام...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-fadeIn space-y-8">
      {/* القسم الأول: ربط المتصفح (AI Studio) - يظهر فقط إذا كان متاحاً */}
      {window.aistudio && (
        <div className="bg-emerald-600 p-8 md:p-12 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-right">
               <div className="flex items-center justify-center md:justify-start gap-4">
                 <span className="text-4xl">✨</span>
                 <h4 className="text-2xl font-black">ربط Google AI Studio</h4>
               </div>
               <p className="text-emerald-100 font-bold text-sm max-w-md leading-relaxed">
                 استخدم ميزة الربط المباشر من جوجل لتشغيل ميزات الذكاء الاصطناعي (Veo & Gemini 3) بأعلى أداء.
               </p>
               <div className="flex items-center justify-center md:justify-start gap-2">
                 <span className={`w-3 h-3 rounded-full ${hasAistudioKey ? 'bg-white animate-pulse' : 'bg-emerald-800'}`}></span>
                 <span className="text-xs font-black uppercase tracking-widest">
                   الحالة: {hasAistudioKey ? 'متصل بالمتصفح' : 'غير متصل'}
                 </span>
               </div>
            </div>
            <button 
              onClick={handleAistudioConnect}
              className="bg-white text-emerald-600 px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 whitespace-nowrap"
            >
              {hasAistudioKey ? 'تحديث الربط 🔄' : 'ربط المفتاح الآن 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* القسم الثاني: إعدادات السيرفر (الخيار الدائم) */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-10 relative">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
            ⚙️
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800">إعدادات مفتاح السيرفر (الربط الدائم)</h4>
            <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Server-side Gemini Integration</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 space-y-6">
          <p className="text-slate-500 text-sm leading-relaxed font-bold">
            قم بإدخال مفتاح API الخاص بك هنا لحفظه بشكل دائم في قاعدة بيانات المتجر. سيتم استخدام هذا المفتاح لجميع ميزات AI (وصف المنتجات، تحليل القوائم) لجميع الزوار.
          </p>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Gemini API KEY</label>
            <div className="relative group">
              <input 
                type={showKey ? "text" : "password"}
                value={dbKey}
                onChange={e => setDbKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-8 py-5 bg-white border-2 border-transparent focus:border-emerald-500 rounded-[1.5rem] outline-none font-bold text-sm shadow-sm transition-all pr-14"
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200">
                 🔑
              </div>
            </div>
            <div className="flex justify-between items-center px-2">
              <p className="text-[9px] text-slate-400 font-bold">يتم تشفير المفتاح وحفظه بأمان في بيئة السيرفر.</p>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-emerald-600 hover:underline">الحصول على مفتاح جديد 🔗</a>
            </div>
          </div>

          <div className="pt-4">
            <button 
              disabled={isSaving}
              onClick={handleDbSave}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isSaving ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span>حفظ في إعدادات السيرفر 💾</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
           <span className="text-2xl">💡</span>
           <div className="space-y-1">
              <p className="font-black text-amber-900 text-sm">ملاحظة تقنية</p>
              <p className="text-amber-700 text-[10px] font-bold leading-relaxed">
                إذا كنت تستخدم ميزات متقدمة مثل توليد الصور عالية الجودة، يفضل استخدام خيار "ربط المتصفح" في الأعلى. أما للعمليات اليومية (وصف، كاشير ذكي)، فإن "مفتاح السيرفر" كافٍ تماماً.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysTab;
