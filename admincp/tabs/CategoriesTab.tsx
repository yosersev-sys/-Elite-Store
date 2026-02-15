
import React, { useState } from 'react';
import { Category, Product } from '../../types';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, products, onAddCategory, onDeleteCategory }) => {
  const [newCatName, setNewCatName] = useState('');

  return (
    <div className="space-y-10">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-2xl">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><span>✨</span> إضافة قسم جديد</h3>
        <div className="flex gap-4">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="اسم القسم..." className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
          <button onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }} className="bg-emerald-600 text-white px-10 rounded-2xl font-black">إضافة</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
            <div>
              <p className="font-black text-slate-800 text-xl">{cat.name}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">يحتوي على {products.filter(p => p.categoryId === cat.id).length} صنف</p>
            </div>
            <button onClick={() => { if(confirm('حذف القسم؟')) onDeleteCategory(cat.id) }} className="opacity-0 group-hover:opacity-100 p-3 bg-rose-50 text-rose-500 rounded-2xl transition-opacity">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesTab;
