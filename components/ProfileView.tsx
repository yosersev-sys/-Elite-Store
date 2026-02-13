
import React, { useState } from 'react';
import { User } from '../types';
import { ApiService } from '../services/api';

interface ProfileViewProps {
  currentUser: User;
  onSuccess: () => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert('يرجى ملء جميع الحقول المطلوبة');
    
    // التحقق من رقم الموبايل المصري
    if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      return alert('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم');
    }

    setIsLoading(true);
    try {
      const res = await ApiService.updateProfile(formData);
      if (res.status === 'success') {
        alert('تم تحديث بياناتك بنجاح. يرجى تسجيل الدخول مجدداً بالبيانات الجديدة.');
        onSuccess(); // سيؤدي هذا لتسجيل الخروج في App.tsx
      } else {
        alert(res.message || 'حدث خطأ أثناء التحديث');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">إعدادات الحساب 👤</h2>
        <button 
          onClick={onBack}
          className="bg-white border-2 border-slate-100 px-6 py-2 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition"
        >
          رجوع
        </button>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-emerald-50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">الاسم بالكامل</label>
            <input 
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition shadow-inner"
              placeholder="مثال: محمد أحمد"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">رقم الموبايل (رقم الدخول)</label>
            <input 
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition shadow-inner text-left"
              dir="ltr"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">كلمة المرور الجديدة (اختياري)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition shadow-inner"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mr-2">اتركها فارغة إذا كنت لا تريد تغييرها</p>
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition shadow-lg active:scale-95 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات ✨'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
           <p className="text-[10px] font-bold text-slate-400">عند تغيير رقم الموبايل أو كلمة المرور، سيتم تسجيل خروجك تلقائياً لضمان أمان حسابك.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
