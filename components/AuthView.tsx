
import React, { useState } from 'react';

interface AuthViewProps {
  onSuccess: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // هنا يتم الربط مع الـ Backend مستقبلاً
    console.log('Form submitted:', formData);
    alert(isLogin ? 'تم تسجيل الدخول بنجاح!' : 'تم إنشاء الحساب بنجاح!');
    onSuccess();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-gray-50 relative overflow-hidden">
        
        {/* الديكور الخلفي */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {isLogin ? 'مرحباً بعودتك' : 'انضم للنخبة الآن'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {isLogin ? 'سجل دخولك للوصول إلى سلتك وطلباتك' : 'أنشئ حساباً لتبدأ تجربة تسوق استثنائية'}
          </p>
        </div>

        <form className="mt-8 space-y-5 relative" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="animate-slideDown">
              <label className="sr-only">الاسم الكامل</label>
              <input
                type="text"
                required
                className="appearance-none rounded-2xl relative block w-full px-5 py-4 border border-gray-100 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                placeholder="الاسم الكامل"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="sr-only">البريد الإلكتروني</label>
            <input
              type="email"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 border border-gray-100 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <label className="sr-only">كلمة المرور</label>
            <input
              type="password"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 border border-gray-100 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
              placeholder="كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {!isLogin && (
            <div className="animate-slideUp">
              <label className="sr-only">تأكيد كلمة المرور</label>
              <input
                type="password"
                required
                className="appearance-none rounded-2xl relative block w-full px-5 py-4 border border-gray-100 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-sm"
                placeholder="تأكيد كلمة المرور"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label className="mr-2 text-gray-500 font-bold cursor-pointer">تذكرني</label>
              </div>
              <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500 transition">نسيت كلمة المرور؟</a>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-xl active:scale-95"
            >
              {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400 font-bold">أو استمر عبر</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:shadow-sm transition font-bold text-sm">
              Google
            </button>
            <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:shadow-sm transition font-bold text-sm">
              Apple
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-black text-indigo-600 hover:text-indigo-500 transition"
          >
            {isLogin ? 'اشترك الآن' : 'سجل دخولك'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthView;
