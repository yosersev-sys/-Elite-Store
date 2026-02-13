
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api.ts';
import { User } from '../types.ts';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });

  // تأثير قفل التمرير
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '0px';
    };
  }, []);

  const validatePhone = (phone: string) => {
    return /^01[0125][0-9]{8}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(formData.phone)) {
      alert('يرجى إدخال رقم جوال مصري صحيح مكون من 11 رقم');
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
      alert('عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl animate-fadeIn transition-all duration-500"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-[420px] bg-white/95 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden animate-slideUp z-10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <button 
          onClick={onClose}
          type="button"
          className="absolute top-6 left-6 text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-2xl transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10 pt-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 rotate-3 transition-transform hover:rotate-0 duration-500">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
             </svg>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
            {isLogin ? 'أهلاً بك مجدداً' : 'انضم لأسرة المتجر'}
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">
            {isLogin ? 'سجل دخولك لمتابعة التسوق' : 'أنشئ حسابك وابدأ رحلة التوفير'}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="animate-fadeIn">
                <div className="relative group">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                   </div>
                   <input
                    type="text"
                    required
                    className="w-full pr-12 pl-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm"
                    placeholder="الاسم بالكامل"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="relative group">
               <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
               </div>
               <input
                type="tel"
                required
                maxLength={11}
                className="w-full pr-12 pl-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm text-left tracking-widest"
                placeholder="01xxxxxxxxx"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="relative group">
               <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00 2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
               </div>
               <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pr-12 pl-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm"
                placeholder="كلمة المرور"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors p-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4.5 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-slate-900 hover:bg-emerald-600 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 mt-6 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (isLogin ? 'دخول للمتجر' : 'تأكيد التسجيل')}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-emerald-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2 mx-auto group"
            >
              <span>{isLogin ? 'ليس لديك حساب؟ سجل مجاناً' : 'لديك حساب بالفعل؟ سجل دخولك'}</span>
              <svg className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 12H5m7 7l-7-7 7-7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
