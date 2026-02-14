import React from 'react';
import { Category } from '../types';

interface CategorySectionProps {
  categories: Category[];
  selectedCategoryId: string | 'all';
  onCategorySelect: (id: string | 'all') => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories, 
  selectedCategoryId, 
  onCategorySelect 
}) => {
  const getCategoryMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('سوبر ماركت')) return { icon: '🛒', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200' };
    if (n.includes('خضروات')) return { icon: '🥦', color: 'from-green-400 to-green-600', shadow: 'shadow-green-200' };
    if (n.includes('فواكه')) return { icon: '🍎', color: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-200' };
    if (n.includes('ألبان')) return { icon: '🥛', color: 'from-sky-400 to-sky-600', shadow: 'shadow-sky-200' };
    if (n.includes('مخبوزات')) return { icon: '🥖', color: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-200' };
    if (n.includes('لحوم')) return { icon: '🥩', color: 'from-red-500 to-red-700', shadow: 'shadow-red-200' };
    return { icon: '📦', color: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-200' };
  };

  return (
    <section className="space-y-6 md:space-y-10 animate-fadeIn">
      <div className="flex items-end justify-between px-2 md:px-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-6 md:h-8 bg-emerald-500 rounded-full"></span>
            <h2 className="text-xl md:text-3xl font-black text-slate-800">أقسام المتجر</h2>
          </div>
          <p className="text-slate-400 text-[10px] md:text-sm font-bold tracking-wide mr-4">اختر ما تبحث عنه للوصول السريع</p>
        </div>
        <button 
          onClick={() => onCategorySelect('all')}
          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
        >
          عرض الكل 🏁
        </button>
      </div>

      {/* Container with horizontal scroll on mobile and grid on desktop */}
      <div className="relative group">
        {/* Subtle scroll indicators for mobile */}
        <div className="md:hidden absolute -left-2 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="md:hidden absolute -right-2 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 px-2 md:px-0 no-scrollbar scroll-smooth snap-x">
          
          {/* "All" Category Card */}
          <div 
            onClick={() => onCategorySelect('all')}
            className={`snap-center shrink-0 w-28 md:w-auto cursor-pointer group/card p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-3 text-center ${
              selectedCategoryId === 'all' 
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-200 scale-105 ring-4 ring-emerald-50' 
              : 'bg-white border-white text-slate-500 hover:border-emerald-100 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl transition-all duration-500 ${
              selectedCategoryId === 'all' ? 'bg-white/20 rotate-12 scale-110' : 'bg-slate-50 group-hover/card:bg-emerald-50 group-hover/card:rotate-6'
            }`}>
              🏠
            </div>
            <span className="font-black text-[10px] md:text-sm tracking-tight">الرئيسية</span>
          </div>

          {/* Category Cards */}
          {categories.map((cat) => {
            const meta = getCategoryMeta(cat.name);
            const isSelected = selectedCategoryId === cat.id;
            return (
              <div 
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`snap-center shrink-0 w-28 md:w-auto cursor-pointer group/card p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-3 text-center ${
                  isSelected 
                  ? `bg-emerald-600 border-emerald-500 text-white shadow-xl ${meta.shadow} scale-105 ring-4 ring-emerald-50` 
                  : 'bg-white border-white text-slate-500 hover:border-emerald-100 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl transition-all duration-500 ${
                  isSelected 
                  ? 'bg-white/20 rotate-12 scale-110' 
                  : `bg-slate-50 group-hover/card:scale-110 group-hover/card:rotate-6`
                }`}>
                  {meta.icon}
                </div>
                <span className="font-black text-[10px] md:text-sm tracking-tight line-clamp-1">{cat.name}</span>
                
                {/* Active Indicator Dot */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default CategorySection;