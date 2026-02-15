
import React from 'react';

const SettingsTab: React.FC = () => {
  return (
    <div className="max-w-2xl">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
         <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2"><span>📱</span> إعدادات التواصل</h4>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم واتساب الإدارة</label>
               <input placeholder="201026034170" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" dir="ltr" />
            </div>
         </div>
         
         <div className="space-y-4 pt-6 border-t">
            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2"><span>🛡️</span> الأمان والنظام</h4>
            <p className="text-sm text-slate-500 font-bold">يتم تأمين كافة المعاملات بتشفير عالي المستوى. لوحة التحكم تدعم وضع الأوفلاين للعمليات السريعة.</p>
         </div>

         <button onClick={() => alert('تم حفظ الإعدادات بنجاح!')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-colors">حفظ إعدادات النظام</button>
      </div>
    </div>
  );
};

export default SettingsTab;
