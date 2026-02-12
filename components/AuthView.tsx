
import React, { useState } from 'react';
import { ApiService } from '../services/api.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onClose }) => {
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
      alert('يرجى إدخال رقم جوال مصري صحيح مكون من 11 رقم (مثال: 01012345678)');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
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
      console.error("Auth Error:", err);
      alert('عذراً، حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with animation */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-slideUp">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-6 left-6 text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center relative pt-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-emerald-100 rotate-3">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
             </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isLogin ? 'أهلاً بك في سوق العصر' : 'إنشاء حساب جديد'}
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
            {isLogin ? 'سجل دخولك لمتابعة التسوق' : 'انضم إلينا الآن في فاقوس'}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="animate-fadeIn">
              <label className="block text-[10px] font-black text-slate-400 mr-2 mb-1 uppercase tracking-widest">الاسم بالكامل</label>
              <input
                type="text"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:bg-white outline-none transition-all font-bold text-sm"
                placeholder="مثال: محمد أحمد"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 mr-2 mb-1 uppercase tracking-widest">رقم الجوال المصري</label>
            <input
              type="tel"
              required
              maxLength={11}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:bg-white outline-none transition-all font-bold text-sm text-left"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mr-2 mb-1 uppercase tracking-widest">كلمة المرور</label>
            <input
              type="password"
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:bg-white outline-none transition-all font-bold text-sm text-right"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'تسجيل الدخول' : 'إنشاء حسابي'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-50 pt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            type="button"
            className="text-xs font-black text-emerald-600 hover:text-slate-900 transition"
          >
            {isLogin ? 'ليس لديك حساب؟ اشترك مجاناً' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
