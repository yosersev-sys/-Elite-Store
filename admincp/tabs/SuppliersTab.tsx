
import React, { useState, useEffect, useMemo } from 'react';
import { Supplier } from '../../types';
import { ApiService } from '../../services/api';

interface SuppliersTabProps {
  isLoading: boolean;
}

const SuppliersTab: React.FC<SuppliersTabProps> = ({ isLoading: globalLoading }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLocalLoading(true);
    try {
      const data = await ApiService.getSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.companyName && s.companyName.toLowerCase().includes(q)) ||
      s.phone.includes(q)
    );
  }, [suppliers, searchTerm]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', companyName: '', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      phone: s.phone,
      companyName: s.companyName || '',
      address: s.address || '',
      notes: s.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) return alert('الاسم ورقم الهاتف مطلوبان');
    
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        id: editingSupplier ? editingSupplier.id : 'sup_' + Date.now(),
        createdAt: editingSupplier ? editingSupplier.createdAt : Date.now()
      };

      const success = editingSupplier 
        ? await ApiService.updateSupplier(payload)
        : await ApiService.addSupplier(payload);

      if (success) {
        await fetchSuppliers();
        setIsModalOpen(false);
      } else {
        alert('فشل حفظ بيانات المورد');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد نهائياً؟')) return;
    try {
      const success = await ApiService.deleteSupplier(id);
      if (success) fetchSuppliers();
    } catch (err) {
      alert('خطأ في عملية الحذف');
    }
  };

  if (localLoading || (globalLoading && suppliers.length === 0)) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white rounded-[3rem] shadow-xl p-8 space-y-6">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse"></div>
                 <div className="space-y-2">
                   <div className="w-48 h-4 bg-slate-100 rounded-lg animate-pulse"></div>
                   <div className="w-32 h-3 bg-slate-50 rounded-lg animate-pulse"></div>
                 </div>
               </div>
               <div className="w-24 h-8 bg-slate-50 rounded-xl animate-pulse"></div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex gap-10">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الموردين</p>
             <p className="text-3xl font-black text-slate-800">{suppliers.length}</p>
           </div>
           <div className="w-px h-12 bg-slate-100 self-center"></div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">شركات التوريد</p>
             <p className="text-3xl font-black text-emerald-600">{suppliers.filter(s => s.companyName).length}</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="بحث باسم المورد أو الشركة..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none font-bold pr-12 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
            <span className="absolute right-4 top-4 text-slate-300">🔍</span>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 transition-all active:scale-95 whitespace-nowrap"
          >
            + مورد جديد
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                {s.companyName ? '🏢' : '👤'}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(s)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">✎</button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">🗑</button>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
               <div>
                 <h4 className="text-xl font-black text-slate-800 leading-tight">{s.name}</h4>
                 {s.companyName && <p className="text-emerald-600 font-bold text-xs mt-1">{s.companyName}</p>}
               </div>
               
               <div className="pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="text-xs">📞</span>
                    <span className="font-bold text-sm tracking-widest">{s.phone}</span>
                  </div>
                  {s.address && (
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="text-xs">📍</span>
                      <span className="font-bold text-[10px] truncate">{s.address}</span>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={() => window.open(`https://wa.me/2${s.phone.replace(/\D/g, '')}`, '_blank')}
              className="w-full mt-8 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm"
            >
              مراسلة واتساب 📱
            </button>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
           <div className="text-6xl mb-6 opacity-10">🚛</div>
           <p className="text-slate-300 font-black italic text-xl">لا يوجد موردين مسجلين بهذا الاسم</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-12 animate-slideUp overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                {editingSupplier ? '📝' : '🚛'}
              </div>
              <h3 className="text-2xl font-black text-slate-800">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">إدارة شبكة التوريد لفاقوس</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المسؤول</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold transition-all shadow-inner"
                  placeholder="مثال: م. أحمد كمال"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم الجوال</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-left shadow-inner"
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم الشركة</label>
                  <input 
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold shadow-inner"
                    placeholder="اختياري"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">العنوان / الملاحظات</label>
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold shadow-inner min-h-[80px]"
                  placeholder="عنوان المخزن أو المورد..."
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex-grow bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات الآن ✨'}
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
