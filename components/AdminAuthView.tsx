
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api.ts';
import { User } from '../types.ts';

interface AdminAuthViewProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

const AdminAuthView: React.FC<AdminAuthViewProps> = ({ onSuccess, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // استعادة البيانات المحفوظة للمدير
  useEffect(() => {
    const savedPhone = localStorage.getItem('souq_admin_phone');
    const savedPass = localStorage.getItem('souq_admin_pass');
    if (savedPhone && savedPass) {
      try {
        setPhone(savedPhone);
        setPassword(atob(savedPass));
        setRememberMe(true);
      } catch (e) {
        console.error("Error loading admin credentials");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await ApiService.login(phone, password);
      if (res && res.status === 'success' && res.user) {
        if (res.user.role === 'admin') {
          // حفظ البيانات إذا تم اختيار "تذكرني"
          if (rememberMe) {
            localStorage.setItem('souq_admin_phone', phone);
            localStorage.setItem('souq_admin_pass', btoa(password));
          } else {
            localStorage.removeItem('souq_admin_phone');
            localStorage.removeItem('souq_admin_pass');
          }
          onSuccess(res.user);
        } else {
          setError('عذراً، هذا الحساب لا يمتلك صلاحيات المدير.');
          await ApiService.logout();
        }
      } else {
        setError(res?.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.value = input.value.replace(/[\u0600-\u06FF]/g, '');
    setPassword(input.value);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-[450px] animate-slideUp">
        <div className="bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 rotate-12">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">لوحة تحكم الإدارة</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Soq Al-Asr Panel</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl mb-6 text-center font-bold text-sm animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">رقم الجوال</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 px-6 py-4 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold text-left tracking-widest"
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  dir="ltr"
                  lang="en"
                  onInput={handlePasswordInput}
                  value={password}
                  className="w-full bg-slate-800/50 border border-slate-700 px-6 py-4 pl-12 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-right"
                  placeholder="كلمة المرور"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2">
               <input 
                  type="checkbox" 
                  id="admin-remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
               />
               <label htmlFor="admin-remember" className="text-xs font-black text-slate-400 cursor-pointer select-none">حفظ بيانات الدخول للإدارة</label>
            </div>

            <button 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>
          </form>

          <button 
            onClick={onClose}
            className="w-full mt-6 text-slate-600 font-bold text-sm hover:text-slate-400 transition"
          >
            العودة للمتجر الرئيسي
          </button>
        </div>

        <p className="text-center mt-8 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
          نظام مشفر ومحمي بواسطة سوق العصر &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AdminAuthView;
