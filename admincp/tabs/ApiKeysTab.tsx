
import React, { useState, useEffect } from 'react';

// Fix for conflicting global declarations of window.aistudio
// This ensures that our local type augmentation matches the pre-defined global type AIStudio.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // The existing global declaration for aistudio is likely readonly.
    // We use the AIStudio interface name as required by the compiler to fix type mismatch.
    readonly aistudio: AIStudio;
  }
}

const ApiKeysTab: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      if (window.aistudio) {
        const status = await window.aistudio.hasSelectedApiKey();
        setHasKey(status);
      }
    } catch (err) {
      console.error("Error checking API key status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume key selection was successful after triggering openSelectKey as per guidelines.
        setHasKey(true);
      } else {
        alert("عذراً، ميزة ربط المفاتيح غير متاحة في هذا المتصفح.");
      }
    } catch (err) {
      console.error("Error opening key selector:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري التحقق من الاتصال...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-fadeIn">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
            🔑
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-800">إدارة محرك الذكاء الاصطناعي</h4>
            <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Google Gemini Integration</p>
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <p className="font-black text-slate-700">حالة الربط الحالية:</p>
            {hasKey ? (
              <span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                متصل وجاهز للعمل
              </span>
            ) : (
              <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                غير متصل
              </span>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-slate-500 text-sm leading-relaxed font-bold mb-8">
              لتمكين ميزات "مساعد السوق الذكي"، "توليد وصف المنتجات"، و "تحليل قوائم المشتريات"، يرجى ربط مفتاح API الخاص بك من Google AI Studio. 
              يتم التعامل مع المفتاح بشكل آمن تماماً عبر بيئة النظام.
            </p>

            <button 
              onClick={handleConnect}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
            >
              <span>{hasKey ? 'تحديث أو تغيير المفتاح' : 'ربط مفتاح Gemini الآن'}</span>
              <svg className="w-6 h-6 transition-transform group-hover:translate-x-[-5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
           <span className="text-2xl">💡</span>
           <div className="space-y-1">
              <p className="font-black text-amber-900 text-sm">أين أجد المفتاح؟</p>
              <p className="text-amber-700 text-xs font-bold leading-relaxed">
                يمكنك الحصول على مفتاح API مجاني أو مدفوع عبر <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">منصة Google AI Studio الرسميّة</a>.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysTab;
