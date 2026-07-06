import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { User } from '../../types';

interface SettingsTabProps {
  currentUser: User | null;
  onLogout: () => void;
}

const DEFAULT_VILLAGES_LIST = [
  { name: 'مدينة فاقوس بالكامل', center: 'فاقوس (المدينة)', status: 'متاح فوراً (خلال ساعة إلى ساعتين)', fee: 10, desc: 'الخدمة الفورية لجميع أحياء وشوارع فاقوس بالكامل.' },
  { name: 'الديدامون', center: 'فاقوس', status: 'متاح (توصيل خلال 2-4 ساعات)', fee: 15, desc: 'تغطية كاملة لجميع شوارع وأنحاء قرية الديدامون الكبرى.' },
  { name: 'جهينة', center: 'فاقوس', status: 'متاح (توصيل خلال 2-4 ساعات)', fee: 15, desc: 'شحن يومي سريع لقرية جهينة والمناطق التابعة لها.' },
  { name: 'الصوالح', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'توصيل لباب المنزل لقرية الصوالح.' },
  { name: 'السماعنة', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'توصيل يومي لكافة مستلزمات البيوت بقرية السماعنة.' },
  { name: 'الغزالي', center: 'فاقوس', status: 'متاح (توصيل خلال 4-6 ساعات)', fee: 25, desc: 'تغطية التوصيل لقرية الغزالي وتوابعها.' },
  { name: 'ميت العز', center: 'فاقوس', status: 'متاح (توصيل خلال 4-6 ساعات)', fee: 25, desc: 'توصيل للمنازل بقرية ميت العز.' },
  { name: 'سوادة', center: 'فاقوس', status: 'متاح (توصيل خلال 2-4 ساعات)', fee: 15, desc: 'شحن مباشر وسريع لمنطقة سوادة.' },
  { name: 'السلاطنة', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'تغطية لقرية السلاطنة والمناطق المجاورة.' },
  { name: 'أكياد', center: 'فاقوس', status: 'متاح (توصيل خلال 4-6 ساعات)', fee: 25, desc: 'توصيل مجدول مرتين يومياً لقرية أكياد.' },
  { name: 'الخطارة', center: 'فاقوس', status: 'متاح (توصيل خلال 4-6 ساعات)', fee: 25, desc: 'شحن لقرية الخطارة وما حولها.' },
  { name: 'الدميين', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'خدمة التوصيل السريع لقرية الدميين.' },
  { name: 'النوافعة', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'توصيل يومي للطلبات بقرية النوافعة.' },
  { name: 'الهيصمية', center: 'فاقوس', status: 'متاح (توصيل خلال 4-6 ساعات)', fee: 25, desc: 'شحن وتوصيل لقرية الهيصمية.' },
  { name: 'أشكر', center: 'فاقوس', status: 'متاح (توصيل خلال 3-5 ساعات)', fee: 20, desc: 'توصيل مباشر لقرية أشكر.' },
  { name: 'بني صريد', center: 'فاقوس', status: 'متاح (توصيل خلال 2-4 ساعات)', fee: 15, desc: 'تغطية يومية لقرية بني صريد.' },
  { name: 'كفر الحوت', center: 'فاقوس', status: 'متاح (توصيل خلال 2-4 ساعات)', fee: 15, desc: 'شحن سريع لقرية كفر الحوت.' },
];

const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser, onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceAction, setDeviceAction] = useState(() => localStorage.getItem('pos_device_default_action') || 'print_and_open');
  const [offlineEnabled, setOfflineEnabled] = useState(() => localStorage.getItem('enable_offline_mode') !== 'false');

  // إعدادات المتجر (SEO وتواصل وشحن)
  const [storeSettings, setStoreSettings] = useState({
    whatsapp_number: '201026034170',
    delivery_fee: '0',
    homepage_title: 'سوق العصر - أول سوق إلكتروني في فاقوس',
    homepage_description: 'تسوق أفضل الخضروات، الفواكه، ومنتجات السوبر ماركت في فاقوس أونلاين بضغطة زر.',
    homepage_keywords: 'سوق العصر، فاقوس، سوبر ماركت فاقوس، خضروات فاقوس، توصيل فاقوس',
    out_of_stock_policy: 'prevent',
    negative_stock_limit: '0',
    delivery_villages_json: ''
  });

  const [villages, setVillages] = useState<any[]>(DEFAULT_VILLAGES_LIST);
  const [newVillage, setNewVillage] = useState({
    name: '',
    fee: '15',
    desc: 'توصيل لباب المنزل خلال ساعات.'
  });

  const handleAddVillage = () => {
    if (!newVillage.name.trim()) {
      alert('يرجى كتابة اسم القرية أو المنطقة أولاً');
      return;
    }
    if (villages.some(v => v.name.trim().toLowerCase() === newVillage.name.trim().toLowerCase())) {
      alert('هذه المنطقة مضافة بالفعل في القائمة');
      return;
    }
    const created = {
      name: newVillage.name.trim(),
      center: 'فاقوس',
      status: 'متاح (توصيل منزلي سريع)',
      fee: parseFloat(newVillage.fee) || 0,
      desc: newVillage.desc.trim() || 'توصيل لباب المنزل خلال ساعات.'
    };
    setVillages([...villages, created]);
    setNewVillage({
      name: '',
      fee: '15',
      desc: 'توصيل لباب المنزل خلال ساعات.'
    });
  };

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
        if (settings.delivery_villages_json) {
          try {
            const parsed = JSON.parse(settings.delivery_villages_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setVillages(parsed);
            }
          } catch(e) {}
        }
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
      const payload = {
        ...storeSettings,
        delivery_villages_json: JSON.stringify(villages)
      };
      const success = await ApiService.updateStoreSettings(payload);
      if (success) {
        alert('تم حفظ إعدادات المتجر والتوصيل بنجاح! ✨');
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
        
        {/* شبكة لتعديل أسعار توصيل القرى التابعة لفاقوس */}
        <div className="border-t border-slate-100 pt-8 space-y-4">
          <h4 className="text-sm font-black text-slate-700">📍 أسعار التوصيل المخصصة لقرى مركز فاقوس:</h4>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
            يمكنك تعديل رسوم التوصيل لكل قرية تابعة لمركز فاقوس أدناه. سيتم تطبيق الأسعار المعدلة فوراً في المتجر وفي تفاصيل التوصيل.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {villages.map((v, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between gap-2 relative">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-slate-700 truncate" title={v.name}>📍 {v.name}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف منطقة "${v.name}"؟`)) {
                        setVillages(villages.filter((_, i) => i !== idx));
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold text-[10px] px-1.5 py-0.5 hover:bg-rose-50 rounded-lg transition"
                    title="حذف"
                  >
                    حذف ✕
                  </button>
                </div>
                <div className="relative mt-1">
                  <input 
                    type="number"
                    value={v.fee}
                    onChange={e => {
                      const updated = [...villages];
                      updated[idx].fee = parseFloat(e.target.value) || 0;
                      setVillages(updated);
                    }}
                    className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-black text-xs text-left"
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">ج.م</span>
                </div>
              </div>
            ))}
          </div>

          {/* نموذج إضافة قرية أو منطقة توصيل جديدة */}
          <div className="bg-emerald-50/20 p-6 rounded-[2rem] border border-emerald-100/50 space-y-4 mt-6">
            <h5 className="text-xs font-black text-emerald-800 flex items-center gap-1">
              <span>➕ إضافة قرية أو منطقة توصيل جديدة:</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-1">اسم القرية / المنطقة</label>
                <input 
                  type="text"
                  placeholder="مثال: الديدامون الجديدة، كفر أبو درويش..."
                  value={newVillage.name}
                  onChange={e => setNewVillage({...newVillage, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-1">رسوم التوصيل (ج.م)</label>
                <input 
                  type="number"
                  placeholder="15"
                  value={newVillage.fee}
                  onChange={e => setNewVillage({...newVillage, fee: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 mr-1">وصف التغطية أو التوقيت المتوقع</label>
                <input 
                  type="text"
                  placeholder="توصيل للمنزل خلال 2-4 ساعات"
                  value={newVillage.desc}
                  onChange={e => setNewVillage({...newVillage, desc: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-bold text-xs"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddVillage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-6 py-2.5 rounded-xl transition active:scale-95 shadow-sm"
            >
              أضف المنطقة لقائمة الشحن ➕
            </button>
          </div>
        </div>

        <button 
          onClick={handleSaveStoreSettings}
          disabled={isSaving}
          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل والقرى 💾'}
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

      {/* القسم المضاف: إعدادات الطباعة والدرج للجهاز الحالي */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 font-Cairo text-right" dir="rtl">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🖨️</div>
          <div>
            <h3 className="text-xl font-black text-slate-800">إعدادات الطباعة والدرج (هذا الجهاز)</h3>
            <p className="text-slate-400 text-xs font-bold">تحديد السلوك الافتراضي لعمليات الحفظ والطباعة على هذا المتصفح</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 block">السلوك الافتراضي بعد حفظ الفاتورة مباشرة</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'print_and_open', label: '🖨️ حفظ وطباعة الفاتورة + فتح الدرج', desc: 'الخيار القياسي لنقاط البيع (يفتح الفاتورة والدرج معاً)' },
              { id: 'open_only', label: '🔓 حفظ وفتح الدرج فقط دون طباعة', desc: 'يفتح الدرج نقدياً دون استهلاك ورق الفواتير' },
              { id: 'save_only', label: '💾 حفظ الفاتورة فقط دون أي إجراء', desc: 'يحفظ الفاتورة في النظام فقط دون تشغيل الطابعة أو الدرج' }
            ].map(item => {
              const active = deviceAction === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    setDeviceAction(item.id);
                    localStorage.setItem('pos_device_default_action', item.id);
                  }}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${active ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <p className="text-sm font-black text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 block">ميزة العمل دون اتصال (Offline Mode)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'enabled', value: true, label: '🟢 تفعيل العمل دون اتصال (أوفلاين)', desc: 'يسمح للكاشير بمواصلة حفظ الفواتير محلياً في المتصفح والطباعة عند انقطاع الإنترنت، لتتم مزامنتها يدوياً لاحقاً.' },
              { id: 'disabled', value: false, label: '🔴 تعطيل العمل دون اتصال بالكامل', desc: 'يمنع المتصفح من حفظ أي فواتير محلياً ويشترط توفر اتصال شبكة نشط دائماً لإتمام مبيعات الكاشير.' }
            ].map(item => {
              const active = offlineEnabled === item.value;
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    setOfflineEnabled(item.value);
                    localStorage.setItem('enable_offline_mode', String(item.value));
                  }}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${active ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <p className="text-sm font-black text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
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