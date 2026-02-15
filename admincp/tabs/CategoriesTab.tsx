
import React, { useState, useMemo, useRef } from 'react';
import { Category, Product } from '../../types';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, products, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    isActive: true
  });

  // ترتيب الأقسام بناءً على sortOrder قبل الفلترة
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return sortedCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sortedCategories, searchTerm]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', image: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ 
      name: cat.name, 
      image: cat.image || '', 
      isActive: cat.isActive !== false 
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) return alert('يرجى إدخال اسم القسم');
    
    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: formData.name,
        image: formData.image,
        isActive: formData.isActive
      });
    } else {
      onAddCategory({
        id: 'cat_' + Date.now(),
        name: formData.name,
        image: formData.image,
        isActive: formData.isActive,
        sortOrder: categories.length + 1
      });
    }
    setIsModalOpen(false);
  };

  const getProductCount = (catId: string) => {
    return products.filter(p => p.categoryId === catId).length;
  };

  // --- منطق السحب والإفلات ---
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === index) return;
    setDragOverItemIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    // إعادة ترتيب القائمة
    const newItems = [...filteredCategories];
    const [draggedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    // تحديث الترتيب (sortOrder) لجميع الأقسام المتأثرة
    newItems.forEach((item, idx) => {
      const newSortOrder = idx + 1;
      if (item.sortOrder !== newSortOrder) {
        onUpdateCategory({ ...item, sortOrder: newSortOrder });
      }
    });

    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* رأس الصفحة مع الإحصائيات والبحث */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex gap-8">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الأقسام</p>
             <p className="text-2xl font-black text-slate-800">{categories.length}</p>
           </div>
           <div className="w-px h-10 bg-slate-100 self-center"></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">أقسام نشطة</p>
             <p className="text-2xl font-black text-emerald-600">{categories.filter(c => c.isActive !== false).length}</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="ابحث عن قسم..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none font-bold pr-12"
            />
            <span className="absolute right-4 top-3.5 text-slate-300">🔍</span>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform whitespace-nowrap"
          >
            + إضافة قسم جديد
          </button>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
        <span className="text-xl">↕️</span>
        <p className="text-emerald-700 text-xs font-bold">يمكنك إعادة ترتيب الأقسام بسحب البطاقات وإفلاتها في المكان المطلوب.</p>
      </div>

      {/* شبكة الأقسام مع دعم السحب */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((cat, index) => (
          <div 
            key={cat.id} 
            draggable={!searchTerm} // تعطيل السحب عند البحث لتجنب تضارب الترتيب
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => { setDraggedItemIndex(null); setDragOverItemIndex(null); }}
            className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 group overflow-hidden relative cursor-move ${
              draggedItemIndex === index ? 'opacity-40 scale-95 border-emerald-500' : 
              dragOverItemIndex === index ? 'border-dashed border-emerald-400 scale-105' : 'border-slate-100 shadow-sm hover:shadow-xl'
            }`}
          >
            <div className="relative aspect-video bg-slate-50 overflow-hidden">
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
              )}
              
              {/* أيقونة مقبض السحب */}
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-slate-400 text-xs">⠿</span>
              </div>

              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${cat.isActive !== false ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {cat.isActive !== false ? 'نشط ●' : 'مخفي ○'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-xl font-black text-slate-800 mb-1">{cat.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold mb-6">يحتوي على {getProductCount(cat.id)} صنف متاح</p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(cat)}
                  className="flex-grow bg-slate-900 text-white py-2.5 rounded-xl font-black text-xs hover:bg-indigo-600 transition-colors"
                >
                  تعديل ✎
                </button>
                <button 
                  onClick={() => { if(confirm('حذف القسم؟ سيتم تحويل منتجاته لقسم "عام"')) onDeleteCategory(cat.id) }}
                  className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal الإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-slideUp overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                {editingCategory ? '📝' : '✨'}
              </div>
              <h3 className="text-2xl font-black text-slate-800">{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">سوق العصر - تنظيم المحتوى</p>
            </div>

            <div className="space-y-6">
              {/* صورة القسم */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">أيقونة/صورة القسم</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-all overflow-hidden"
                >
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-2xl text-slate-300">+</span>
                      <span className="text-[10px] font-black text-slate-400">اختر صورة</span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              {/* اسم القسم */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم القسم بالكامل</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: الخضروات الورقية"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
                />
              </div>

              {/* حالة النشاط */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                 <div>
                   <p className="font-black text-slate-700 text-sm">تفعيل القسم</p>
                   <p className="text-[9px] text-slate-400 font-bold">ظهور القسم للمستخدمين في المتجر</p>
                 </div>
                 <button 
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'right-7' : 'right-1'}`}></div>
                 </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSave}
                  className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إنشاء القسم الآن'}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredCategories.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
           <p className="text-slate-300 font-black italic">لا توجد أقسام مطابقة لبحثك..</p>
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
