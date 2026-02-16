
import React from 'react';

const AboutSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 border-t border-slate-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-40 translate-x-1/4 translate-y-1/4"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-emerald-200">من نحن</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">سوق العصر.. مستقبل التسوق في <span className="text-emerald-600">فاقوس</span></h2>
          <p className="text-slate-500 font-bold text-sm md:text-lg leading-relaxed">نحن لسنا مجرد متجر إلكتروني، بل نحن شركاؤكم في توفير حياة أسهل وأجود لكل بيت في مدينة فاقوس العريقة.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Vision */}
          <div className="group bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 hover:-translate-y-2 transition-all duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500 shadow-inner">👁️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter">رؤيتنا</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              أن نكون المنصة الأولى والرائدة في محافظة الشرقية التي تجمع بين التكنولوجيا الحديثة وبين طزاجة وجودة المنتجات الريفية، لنصبح الخيار الأول لكل أسرة تبحث عن التميز والراحة.
            </p>
          </div>

          {/* Goals */}
          <div className="group bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/20 text-white hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="w-20 h-20 bg-white/10 text-emerald-400 rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500 backdrop-blur-md">🎯</div>
            <h3 className="text-2xl font-black mb-4 tracking-tighter">أهدافنا</h3>
            <ul className="space-y-3 text-slate-300 font-bold text-sm">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span> تحويل عملية التسوق اليومي إلى تجربة ممتعة وبسيطة.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span> دعم الموردين والمزارعين المحليين في فاقوس.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✔</span> ضمان أسرع نظام توصيل في المدينة بأقل التكاليف.
              </li>
            </ul>
          </div>

          {/* Values */}
          <div className="group bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 hover:-translate-y-2 transition-all duration-500">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-inner">💎</div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter">قيمنا</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-100">الأمانة</span>
              <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-100">الجودة المطلقة</span>
              <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-100">السرعة</span>
              <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-100">خدمة العميل أولاً</span>
            </div>
            <p className="mt-6 text-slate-500 font-bold text-sm leading-relaxed italic">
              "نحن نؤمن أن الثقة هي العملة الحقيقية في تجارتنا، لذا نضع معايير صارمة لكل منتج يصل ليدك."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
