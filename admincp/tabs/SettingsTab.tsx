
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
    homepage_keywords: 'سوق العصر، فاقوس، سوبر ماركت فاقوس، خضروات فاقوس، توصيل فاقوس'
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
        alert('تم توليد ملف Sitemap.xml بنجاح!');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const handleUpdateAdminProfile = async () => {
    if (!adminData.name || !adminData.phone) return alert('الاسم ورقم الهاتف مطلوبان');
    
    if (window.confirm('تغيير بيانات الدخول سيؤدي إلى تسجيل خروجك، هل تريد المتابعة؟')) {
      setIsSaving(true);
      try {
        const res = await ApiService.updateProfile(adminData);
        if (res.status === 'success') {
          alert('تم التحديث بنجاح. سيتم تسجيل الخروج الآن.');
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
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  const sitemapUrl = `${window.location.origin}${window.location.pathname.replace('index.php', '')}sitemap.xml`;

  return (
    <div className="max-w-4xl space-y-10 animate-fadeIn pb-20">
      
      {/* قسم مصاريف الشحن والتواصل */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">⚙️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات التشغيل</h3>
            <p className="text-slate-400 text-xs font-bold">الشحن وأرقام التواصل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">سعر التوصيل (ج.م)</label>
            <div className="relative">
              <input 
                type="number"
                value={storeSettings.delivery_fee}
                onChange={e => setStoreSettings({...storeSettings, delivery_fee: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-black transition-all shadow-inner"
                placeholder="0.00"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mr-2">اكتب 0 إذا كان التوصيل مجاني لجميع الطلبات.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم واتساب المتجر</label>
            <div className="relative">
              <input 
                value={storeSettings.whatsapp_number}
                onChange={e => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all shadow-inner text-left"
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
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات الأساسية 💾'}
        </button>
      </section>

      {/* قسم Sitemap */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-indigo-500 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🗺️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">أدوات الأرشفة (Sitemap)</h3>
            <p className="text-slate-400 text-xs font-bold">تسهيل وصول جوجل لكافة منتجاتك</p>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
           <button 
            onClick={handleGenerateSitemap}
            disabled={isGeneratingSitemap}
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50"
           >
             {isGeneratingSitemap ? 'جاري التوليد...' : 'توليد ملف Sitemap الآن'}
           </button>
           <code className="text-xs font-bold text-slate-700 break-all">{sitemapUrl}</code>
        </div>
      </section>

      {/* قسم SEO */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🌍</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات محركات البحث (SEO)</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <input value={storeSettings.homepage_title} onChange={e => setStoreSettings({...storeSettings, homepage_title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="العنوان (Meta Title)" />
          <textarea value={storeSettings.homepage_description} onChange={e => setStoreSettings({...storeSettings, homepage_description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold min-h-[100px]" placeholder="الوصف (Meta Description)" />
        </div>
        <button onClick={handleSaveStoreSettings} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black">حفظ إعدادات SEO 💾</button>
      </section>

      {/* قسم حساب المدير */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-rose-500 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🔐</div>
          <h3 className="text-xl font-black text-slate-800">بيانات دخول المدير</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input value={adminData.name} onChange={e => setAdminData({...adminData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
          <input type="tel" value={adminData.phone} onChange={e => setAdminData({...adminData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
          <div className="md:col-span-2 relative">
            <input type={showPassword ? "text" : "password"} value={adminData.password} onChange={e => setAdminData({...adminData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="كلمة مرور جديدة (اختياري)" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? '🙈' : '👁️'}</button>
          </div>
        </div>
        <button onClick={handleUpdateAdminProfile} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black">تحديث بيانات الحساب 🛡️</button>
      </section>
    </div>
  );
};

export default SettingsTab;
