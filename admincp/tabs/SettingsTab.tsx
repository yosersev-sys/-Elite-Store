import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { User } from '../../types';

interface SettingsTabProps {
  currentUser: User | null;
  onLogout: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser, onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // إعدادات المتجر (SEO وتواصل وشحن)
  const [storeSettings, setStoreSettings] = useState({
    whatsapp_number: '201026034170',
    delivery_fee: '0',
    homepage_title: 'سوق العصر - أول سوق إلكتروني في فاقوس',
    homepage_description: 'تسوق أفضل الخضروات، الفواكه، ومنتجات السوبر ماركت في فاقوس أونلاين بضغطة زر.',
    homepage_keywords: 'سوق العصر، فاقوس، سوبر ماركت فاقوس، خضروات فاقوس، توصيل فاقوس',
    out_of_stock_policy: 'prevent',
    negative_stock_limit: '0'
  });

  // بيانات المدير
  const [adminData, setAdminData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const settings = await ApiService.getStoreSettings();
      if (settings) {
        setStoreSettings(prev => ({
          ...prev,
          ...settings
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    setIsSaving(true);
    try {
      const success = await ApiService.updateStoreSettings(storeSettings);
      if (success) {
        alert('تم حفظ إعدادات المتجر بنجاح! ✨');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      const success = await ApiService.generateSitemap();
      if (success) {
        alert('تم توليد ملف Sitemap.xml بنجاح! يمكنك الآن تقديمه لمحركات البحث.');
      } else {
        alert('حدث خطأ أثناء توليد الملف، يرجى التحقق من صلاحيات السيرفر.');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const handleUpdateAdminProfile = async () => {
    if (!adminData.name || !adminData.phone) return alert('الاسم ورقم الموبايل مطلوبان');
    
    if (window.confirm('تغيير بيانات الدخول سيؤدي إلى تسجيل خروجك لإعادة المصادقة، هل تريد المتابعة؟')) {
      setIsSaving(true);
      try {
        const res = await ApiService.updateProfile(adminData);
        if (res.status === 'success') {
          alert('تم تحديث بيانات المدير بنجاح. سيتم تسجيل الخروج الآن.');
          onLogout();
        } else {
          alert(res.message || 'فشل التحديث');
        }
      } catch (err) {
        alert('خطأ في الاتصال بالسيرفر');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  const sitemapUrl = `${window.location.origin}${window.location.pathname.replace('index.php', '')}sitemap.xml`;

  return (
    <div className="max-w-4xl space-y-10 animate-fadeIn pb-20">
      
      {/* القسم الأول: إعدادات الشحن والتواصل */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🚚</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات الشحن والتواصل</h3>
            <p className="text-slate-400 text-xs font-bold">التحكم في تكلفة التوصيل وأرقام التواصل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تكلفة التوصيل (ج.م)</label>
            <div className="relative">
              <input 
                type="number"
                value={storeSettings.delivery_fee}
                onChange={e => setStoreSettings({...storeSettings, delivery_fee: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-lg transition-all shadow-inner"
                placeholder="0"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">ج.م</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mr-2">ضع 0 إذا كان التوصيل مجاني لجميع الطلبات.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم واتساب المتجر</label>
            <div className="relative">
              <input 
                value={storeSettings.whatsapp_number}
                onChange={e => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-lg transition-all shadow-inner text-left"
                dir="ltr"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">💬</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveStoreSettings}
          disabled={isSaving}
          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل 💾'}
        </button>
      </section>

      {/* القسم الجديد: سياسة المخزون والبيع */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">📦</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">سياسة بيع المنتجات عند نفاد المخزون</h3>
            <p className="text-slate-400 text-xs font-bold font-Cairo">تحديد سلوك الكاشير ونقاط البيع عند محاولة بيع منتج منتهي المخزون</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">سياسة البيع</label>
            <select 
              value={storeSettings.out_of_stock_policy}
              onChange={e => setStoreSettings({...storeSettings, out_of_stock_policy: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-sm transition-all shadow-inner"
            >
              <option value="prevent">منع البيع نهائياً (حظر البيع)</option>
              <option value="admin_only">السماح للمدير فقط بالبيع</option>
              <option value="allow_any">السماح للجميع بالبيع في أي حال</option>
              <option value="allow_negative">السماح حتى حد مخزون سالب محدد</option>
            </select>
          </div>

          {storeSettings.out_of_stock_policy === 'allow_negative' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">حد المخزون السالب المسموح به</label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  value={storeSettings.negative_stock_limit}
                  onChange={e => setStoreSettings({...storeSettings, negative_stock_limit: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black text-lg transition-all shadow-inner"
                  placeholder="0"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">وحدة</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mr-2">مثال: إذا كان الحد 10، فسيسمح بخصم الكمية حتى يصل المخزون إلى -10.</p>
            </div>
          )}
        </div>

        <button 
          onClick={handleSaveStoreSettings}
          disabled={isSaving}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ سياسة المخزون 💾'}
        </button>
      </section>

      {/* قسم Sitemap */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-indigo-500 space-y-8 relative overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🗺️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">أدوات الأرشفة (Sitemap)</h3>
            <p className="text-slate-400 text-xs font-bold">تسهيل وصول جوجل لكافة منتجاتك</p>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-slate-600 text-sm font-bold mb-4 leading-relaxed">
                ملف الـ Sitemap يساعد محركات البحث في فهرسة موقعك بشكل أسرع وأكثر دقة.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 items-center">
                 <button 
                  onClick={handleGenerateSitemap}
                  disabled={isGeneratingSitemap}
                  className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                   {isGeneratingSitemap ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🔄'}
                   {isGeneratingSitemap ? 'جاري التوليد...' : 'توليد ملف Sitemap الآن'}
                 </button>
                 
                 <a 
                  href={sitemapUrl} 
                  target="_blank" 
                  className="w-full md:w-auto bg-white border-2 border-slate-100 text-indigo-600 px-8 py-4 rounded-2xl font-black text-center hover:bg-slate-50 transition-all"
                 >
                   👁️ عرض الملف الحالي
                 </a>
              </div>
           </div>
        </div>
      </section>

      {/* إعدادات SEO */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🌍</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات محركات البحث (SEO)</h3>
            <p className="text-slate-400 text-xs font-bold">تحسين ظهور الصفحة الرئيسية في جوجل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">عنوان الموقع (Meta Title)</label>
            <input 
              value={storeSettings.homepage_title}
              onChange={e => setStoreSettings({...storeSettings, homepage_title: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">وصف الموقع (Meta Description)</label>
            <textarea 
              value={storeSettings.homepage_description}
              onChange={e => setStoreSettings({...storeSettings, homepage_description: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all shadow-inner min-h-[100px]"
            />
          </div>
        </div>

        <button 
          onClick={handleSaveStoreSettings}
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
        >
          حفظ إعدادات SEO 💾
        </button>
      </section>

      {/* حساب المدير */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-rose-500 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🔐</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">بيانات دخول المدير</h3>
            <p className="text-slate-400 text-xs font-bold">تحديث رقم الموبايل وكلمة السر</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاسم الشخصي</label>
            <input 
              value={adminData.name}
              onChange={e => setAdminData({...adminData, name: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم الموبايل</label>
            <input 
              type="tel"
              value={adminData.phone}
              onChange={e => setAdminData({...adminData, phone: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-500 rounded-2xl outline-none font-bold transition-all shadow-inner text-left"
              dir="ltr"
            />
          </div>
        </div>

        <button 
          onClick={handleUpdateAdminProfile}
          disabled={isSaving}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
        >
          تحديث بيانات المدير 🛡️
        </button>
      </section>

    </div>
  );
};

export default SettingsTab;