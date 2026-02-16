
import React, { useState, useEffect } from 'react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

/**
 * ApiKeysTab provides the interface for users to connect their paid Google AI Studio account.
 * This is used for high-performance features like Veo video generation.
 */
const ApiKeysTab: React.FC = () => {
  const [hasAistudioKey, setHasAistudioKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Check if an API key has already been selected via the AI Studio dialog
      if (window.aistudio) {
        const status = await window.aistudio.hasSelectedApiKey();
        setHasAistudioKey(status);
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
        // Open the Google AI Studio key selection dialog
        await window.aistudio.openSelectKey();
        setHasAistudioKey(true);
        alert("تم ربط المفتاح عبر المتصفح بنجاح! سيتم استخدامه في الجلسة الحالية.");
      }
    } catch (err) {
      console.error("Error opening key selector:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري التحقق من إعدادات النظام...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-fadeIn space-y-8">
      {/* Selection UI for Google AI Studio - Permitted as part of the Veo selection process */}
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
                 استخدم ميزة الربط المباشر من جوجل لتشغيل ميزات الذكاء الاصطناعي المتطورة بأعلى أداء.
                 يتطلب ذلك اختيار مشروع GCP مفعل به الفوترة.
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
          
          <div className="mt-8 pt-6 border-t border-emerald-500/30 text-center md:text-right">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-emerald-100 hover:text-white underline font-black"
            >
              مراجعة وثائق الفوترة والأسعار الخاصة بجوجل
            </a>
          </div>
        </div>
      )}

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
        <h4 className="text-xl font-black text-slate-800">إدارة ميزات الذكاء الاصطناعي</h4>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
           <span className="text-2xl">🛡️</span>
           <div className="space-y-1">
              <p className="font-black text-slate-700 text-sm">أمان مفاتيح البرمجة</p>
              <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                يتم إدارة مفاتيح API الخاصة بالمتجر آلياً لضمان الخصوصية والأمان. 
                لا تقم بمشاركة مفتاحك مع أي جهة غير موثوقة.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysTab;
