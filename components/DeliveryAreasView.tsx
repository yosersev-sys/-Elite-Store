import React, { useState, useEffect, useMemo } from 'react';
import { View } from '../types';
import { ApiService } from '../services/api';

interface DeliveryAreasViewProps {
  onNavigate: (view: View) => void;
}

interface VillageData {
  name: string;
  center: string;
  status: string;
  fee: number;
  desc: string;
}

const DEFAULT_VILLAGES: VillageData[] = [
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

export const DeliveryAreasView: React.FC<DeliveryAreasViewProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [villages, setVillages] = useState<VillageData[]>(DEFAULT_VILLAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await ApiService.getStoreSettings();
        if (settings && settings.delivery_villages_json) {
          const parsed = JSON.parse(settings.delivery_villages_json);
          if (Array.isArray(parsed)) {
            setVillages(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load dynamic village list, using defaults', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const filteredVillages = useMemo(() => {
    return villages.filter(v => 
      v.name.includes(search) || 
      v.center.includes(search) || 
      v.desc.includes(search)
    );
  }, [search, villages]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 font-Cairo max-w-5xl space-y-8 animate-fadeIn">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <button onClick={() => onNavigate('store')} className="hover:text-emerald-600 transition-colors">الرئيسية</button>
          <span>/</span>
          <span className="text-slate-600">مناطق التوصيل</span>
        </nav>
        <button 
          onClick={() => onNavigate('store')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 font-black text-xs text-slate-600 hover:bg-slate-50 transition active:scale-95"
        >
          <span>⬅️ العودة للمتجر</span>
        </button>
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-l from-emerald-50 to-teal-50 p-8 md:p-12 rounded-[2.5rem] border border-emerald-100/50 text-right space-y-4 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-emerald-200 inline-block">تغطية الشحن والتوصيل</span>
        <h1 className="text-2xl md:text-4xl font-black text-slate-800 leading-tight">شحن وتوصيل منزلي فائق السرعة في فاقوس ومحافظة الشرقية</h1>
        <p className="text-slate-500 font-bold text-xs md:text-sm max-w-2xl leading-relaxed">
          نحن في سوق العصر ندرك أهمية الوقت والراحة، ولذلك أسسنا شبكة توصيل محلية مرنة وموثوقة تغطي مدينة فاقوس وكافة القرى والنجوع المجاورة لتصلك السلع الاستهلاكية والمنظفات طازجة وسليمة لباب منزلك.
        </p>
      </div>

      {/* Delivery details and features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <span className="text-2xl">⚡</span>
          <h3 className="text-sm font-black text-slate-800">سرعة قياسية</h3>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">توصيل فوري لمدينة فاقوس والقرى القريبة خلال ساعات معدودة من تأكيد الطلب.</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-black text-slate-800">أسعار توصيل رمزية</h3>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">رسوم شحن محلية تبدأ من 10 جنيهات فقط لفاقوس وتتراوح بين 15 إلى 25 جنيهاً للقرى.</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <span className="text-2xl">🔒</span>
          <h3 className="text-sm font-black text-slate-800">توصيل آمن للمنزل</h3>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">تغليف محكم ومحافظة كاملة على سلامة وجودة السلع والمنظفات حتى وصولها لباب بيتك.</p>
        </div>
      </div>

      {/* Search & Villages Table */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-800">🗺️ استعلم عن قريتك أو منطقتك</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1">اكتب اسم قريتك أو منطقتك لمعرفة توفر الخدمة ورسوم التوصيل المقررة</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text" 
              placeholder="ابحث عن قريتك (مثال: الديدامون، جهينة...)" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 focus:border-emerald-500 rounded-xl px-4 py-2.5 outline-none font-bold text-xs transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse font-bold">جاري تحميل أسعار التوصيل الحالية...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">القرية / المنطقة</th>
                  <th className="pb-3 font-bold text-center">المركز الجغرافي</th>
                  <th className="pb-3 font-bold text-center">حالة التوصيل</th>
                  <th className="pb-3 font-bold text-center">تكلفة التوصيل</th>
                  <th className="pb-3 font-bold text-left">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredVillages.length > 0 ? filteredVillages.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-black text-slate-800">📍 {v.name}</td>
                    <td className="py-3.5 font-bold text-slate-500 text-center">{v.center}</td>
                    <td className="py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[10px]">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-black text-emerald-600 text-center">{v.fee} ج.م</td>
                    <td className="py-3.5 font-bold text-slate-400 text-left max-w-xs truncate" title={v.desc}>{v.desc}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      😔 نعتذر، لم نجد قريتك في البحث الحالي. يرجى الاتصال بنا عبر واتساب للاستعلام يدوياً عن إمكانية الشحن لعنوانك.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA section */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-br-full pointer-events-none"></div>
        <div className="space-y-2 text-right">
          <h3 className="text-lg font-black">🛒 هل تبحث عن متجر توصيل لمنزلك في فاقوس والقرى؟</h3>
          <p className="text-[11px] text-slate-300 font-bold">ابدأ الآن بتسوق احتياجات بيتك من سوبر ماركت ومنظفات وسنوصلها لباب منزلك مباشرة بأعلى جودة.</p>
        </div>
        <button
          onClick={() => onNavigate('store')}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-lg transition"
        >
          🛍️ تصفح المنتجات واطلب الآن
        </button>
      </div>

    </div>
  );
};

export default DeliveryAreasView;
