
import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';

interface CategorySectionProps {
  categories: Category[];
  selectedCategoryId: string | 'all';
  onCategorySelect: (id: string | 'all') => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories, 
  selectedCategoryId, 
}) => {
  const getCategoryMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('خضروات')) return { icon: '🥦', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    if (n.includes('فواكه')) return { icon: '🍎', color: 'bg-red-50 text-red-600 border-red-100' };
    if (n.includes('ألبان')) return { icon: '🥛', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    if (n.includes('مخبوزات')) return { icon: '🥖', color: 'bg-orange-50 text-orange-600 border-orange-100' };
    return { icon: '📦', color: 'bg-slate-50 text-slate-600 border-slate-100' };
  };

  return (
    <section className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">تصفح حسب القسم</h2>
          <p className="text-slate-400 text-sm font-bold">اختر القسم الذي تريده للوصول السريع لمنتجاتك</p>
        </div>
        <Link 
          to="/"
          className="text-orange-500 font-black text-sm hover:underline"
        >
          عرض الكل
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Link 
          to="/"
          className={`cursor-pointer group p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${
            selectedCategoryId === 'all' 
            ? 'bg-orange-500 border-orange-500 text-white shadow-xl scale-105' 
            : 'bg-white border-orange-50 text-slate-500 hover:border-orange-200 shadow-sm'
          }`}
        >
          <span className={`text-3xl transition-transform group-hover:scale-110 ${selectedCategoryId === 'all' ? '' : 'grayscale opacity-50'}`}>🛍️</span>
          <span className="font-black text-sm">كل الأقسام</span>
        </Link>

        {categories.map((cat) => {
          const meta = getCategoryMeta(cat.name);
          const isSelected = selectedCategoryId === cat.id;
          return (
            <Link 
              key={cat.id}
              to={`/category/${cat.id}`}
              className={`cursor-pointer group p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${
                isSelected 
                ? 'bg-orange-500 border-orange-500 text-white shadow-xl scale-105' 
                : 'bg-white border-orange-50 text-slate-500 hover:border-orange-200 shadow-sm'
              }`}
            >
              <span className={`text-3xl transition-transform group-hover:scale-110`}>
                {meta.icon}
              </span>
              <span className="font-black text-sm line-clamp-1">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
