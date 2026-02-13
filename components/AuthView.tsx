
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
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    return () => { document.body.style.overflow = originalStyle; document.body.style.paddingRight = '0px'; };
  }, []);

  const validatePhone = (phone: string) => /^01[0125][0-9]{8}$/.test(phone);

  const handleMagicLogin = async () => {
    if (!validatePhone(formData.phone)) return alert('يرجى إدخال رقم هاتف صحيح أولاً');
    setIsLoading(true);
    try {
      const res = await ApiService.generateMagicToken(formData.phone);
      if (res && res.status === 'success' && res.token) {
        const magicLink = `${window.location.origin}${window.location.pathname}?token=${res.token}`;
        const message = `مرحباً،\nهذا رابط الدخول السريع الخاص بك لمتجر سوق العصر:\n${magicLink}\n\nيرجى الضغط عليه للدخول فوراً دون كلمة مرور.`;
        window.open(`https://wa.me/2${formData.phone}?text=${encodeURIComponent(message)}`, '_blank');
        alert('تم فتح واتساب! أرسل الرسالة لنفسك (أو لأي رقم) واضغط على الرابط بداخلها للدخول فوراً.');
      } else {
        alert(res?.message || 'هذا الرقم غير مسجل لدينا');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) return alert('رقم جوال غير صحيح');
    setIsLoading(true);
    try {
      const res = isLogin 
        ? await ApiService.login(formData.phone, formData.password)
        : await ApiService.register(formData.name, formData.phone, formData.password);

      if (res && res.status === 'success' && res.user) {
        if (res.user.role === 'admin') {
          alert('للمديرين فقط عبر لوحة التحكم');
          await ApiService.logout();
        } else onSuccess(res.user);
      } else alert(res?.message || 'بيانات خاطئة');
    } catch (err) { alert('خطأ في الاتصال'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl animate-fadeIn" onClick={onClose}></div>
      <div className="relative w-full max-w-[420px] bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-slideUp z-10 p-10">
        <button onClick={onClose} className="absolute top-6 left-6 text-slate-300 hover:text-rose-500 transition-all p-2 rounded-2xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl rotate-3">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">{isLogin ? 'دخول للمتجر' : 'حساب جديد'}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">سوق العصر - فاقوس</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none font-bold" placeholder="الاسم بالكامل" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          )}
          <input type="tel" required maxLength={11} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-center tracking-widest" placeholder="رقم الموبايل" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          
          {isLogin && (
            <div className="space-y-4">
              <input type={showPassword ? "text" : "password"} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-none font-bold" placeholder="كلمة المرور" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              
              <div className="py-2">
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-bold">أو جرب الطريقة الأسهل</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <button type="button" onClick={handleMagicLogin} className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs hover:bg-emerald-100 transition shadow-sm flex items-center justify-center gap-2">
                  <span>دخول سريع عبر رابط واتساب</span>
                  <span className="text-lg">⚡</span>
                </button>
                <p className="text-[9px] text-slate-400 mt-2 text-center font-bold">سيرسل لك النظام رابطاً على واتسابك، اضغط عليه لتدخل فوراً</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition shadow-xl active:scale-95 disabled:opacity-50 mt-4">
            {isLoading ? 'جاري التحميل...' : (isLogin ? 'دخول للمتجر' : 'تأكيد التسجيل')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-black text-emerald-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2 mx-auto">
            <span>{isLogin ? 'ليس لديك حساب؟ سجل مجاناً' : 'لديك حساب بالفعل؟ سجل دخولك'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
