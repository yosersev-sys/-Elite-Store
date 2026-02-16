
import React from 'react';

// Fixed: This tab was simplified because GenAI rules strictly forbid manual API key entry UI.
// API keys are managed exclusively via secure environment variables.
const ApiKeysTab: React.FC = () => {
  return (
    <div className="max-w-3xl animate-fadeIn">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
            ℹ️
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800">إدارة الذكاء الاصطناعي</h4>
            <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">معلومات النظام</p>
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-emerald-800 text-sm font-bold leading-relaxed text-right">
            يتم إدارة مفاتيح الوصول للذكاء الاصطناعي بشكل آمن ومؤتمت عبر بيئة النظام. 
            لضمان استمرارية الخدمة وأمان البيانات، لا يمكن تعديل هذه الإعدادات يدوياً من واجهة الإدارة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysTab;
