import React, { useState } from 'react';
import { ApiService } from '../services/api.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });

  const validatePhone = (phone: string) => {
    return /^01[0125][0-9]{8}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      alert('يرجى إدخال رقم جوال مصري صحيح (مثال: 01012345678)');
      return;
    }

    setIsLoading(true);
    try {
      const res = isLogin 
        ? await ApiService.login(formData.phone, formData.password)
        : await ApiService.register(formData.name, formData.phone, formData.password);

      if (res && res.status === 'success' && res.user) {
        onSuccess(res.user);
      } else {
        alert(res?.message || 'رقم الجوال أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      alert('عذراً، تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fadeIn">
      <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-50 relative overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl"></div>

        <div className="relative text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl rotate-3">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 0 1-2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'أهلاً بك في فاقوس' : 'انضم لسوق العصر'}
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            {isLogin ? 'سجل دخولك برقم الجوال' : 'أنشئ حساباً جديداً في ثوانٍ'}
          </p>
        </div>

        <form className="mt-10 space-y-5 relative" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="animate-slideDown">
              <label className="block text-xs font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">الاسم بالكامل</label>
              <input
                type="text"
                required
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm"
                placeholder="مثال: أحمد محمد"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">رقم الجوال المصري</label>
            <input
              type="tel"
              required
              maxLength={11}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm text-left"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">كلمة المرور</label>
            <input
              type="password"
              required
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-5 px-4 border border-transparent text-sm font-black rounded-[1.5rem] text-white bg-slate-900 hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب الآن')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-black text-emerald-600 hover:text-slate-900 transition"
          >
            {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;