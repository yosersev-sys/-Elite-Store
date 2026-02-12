
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
      console.error("Auth Error:", err);
      alert('عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full z-[1000] flex items-center justify-center p-4">
      {/* Backdrop with strong blur */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-fadeIn transition-all duration-700"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-[440px] bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-slideUp">
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Header Section */}
        <div className="relative p-10 pb-4 text-center">
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
             </svg>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'سوق العصر يرحب بك' : 'حساب جديد في فاقوس'}
          </h2>
          <p className="mt-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            {isLogin ? 'سجل دخولك لتتمتع بأفضل العروض' : 'انضم لآلاف المتسوقين في منطقتك'}
          </p>
        </div>

        {/* Forms with transition */}
        <div className="px-10 pb-12">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="animate-fadeIn">
                <label className="block text-[10px] font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">الاسم بالكامل</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                   </div>
                   <input
                    type="text"
                    required
                    className="w-full pr-14 pl-6 py-4.5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm"
                    placeholder="مثال: محمد علي"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">رقم الجوال المصري</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </div>
                 <input
                  type="tel"
                  required
                  maxLength={11}
                  className="w-full pr-14 pl-6 py-4.5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm text-left tracking-widest"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mr-4 mb-2 uppercase tracking-widest">كلمة المرور</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00 2 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </div>
                 <input
                  type="password"
                  required
                  className="w-full pr-14 pl-6 py-4.5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-5 px-4 border border-transparent text-sm font-black rounded-[1.5rem] text-white bg-slate-900 hover:bg-emerald-600 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 mt-4 overflow-hidden"
            >
              <span className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري التحميل...</span>
                  </div>
                ) : (isLogin ? 'تسجيل الدخول' : 'تفعيل الحساب مجاناً')}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-8 text-center pt-6 border-t border-slate-50">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-emerald-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2 mx-auto group"
            >
              <span>{isLogin ? 'ليس لديك حساب؟ اشترك مجاناً' : 'لديك حساب بالفعل؟ سجل دخولك'}</span>
              <svg className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 12H5m7 7l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
