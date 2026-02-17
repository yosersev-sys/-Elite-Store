
import React, { useState, useEffect, useMemo } from 'react';
import { Supplier } from '../../types';
import { ApiService } from '../../services/api';

interface SuppliersTabProps {
  isLoading: boolean;
  suppliersData?: Supplier[];
  onRefresh?: () => Promise<void> | void; // تحديث النوع ليدعم async
  initialFilter?: FilterStatus;
}

type FilterStatus = 'all' | 'debtors' | 'paid';

const SuppliersTab: React.FC<SuppliersTabProps> = ({ isLoading: globalLoading, suppliersData, onRefresh, initialFilter }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(suppliersData || []);
  const [localLoading, setLocalLoading] = useState(!suppliersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter || 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    address: '',
    notes: '',
    type: 'wholesale' as any,
    balance: '0',
    rating: 5,
    status: 'active' as any
  });

  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData);
      setLocalLoading(false);
    } else {
      fetchSuppliers();
    }
  }, [suppliersData]);

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

  const totals = useMemo(() => {
    return {
      totalDebts: suppliers.reduce((s, sup) => s + (sup.balance || 0), 0),
      activeCount: suppliers.filter(s => s.status === 'active').length,
      debtorsCount: suppliers.filter(s => s.balance > 0).length,
      paidCount: suppliers.filter(s => s.balance <= 0).length
    };
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || 
                           (s.companyName && s.companyName.toLowerCase().includes(q)) ||
                           s.phone.includes(q);
      
      let matchesStatus = true;
      if (filterStatus === 'debtors') matchesStatus = s.balance > 0;
      else if (filterStatus === 'paid') matchesStatus = s.balance <= 0;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, filterStatus]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ 
      name: '', phone: '', companyName: '', address: '', notes: '', 
      type: 'wholesale', balance: '0', rating: 5, status: 'active' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      phone: s.phone,
      companyName: s.companyName || '',
      address: s.address || '',
      notes: s.notes || '',
      type: s.type || 'wholesale',
      balance: s.balance?.toString() || '0',
      rating: s.rating || 5,
      status: s.status || 'active'
    });
    setIsModalOpen(true);
  };

  // تعديل منطق الحفظ ليكون متزامناً مع تحديث البيانات
  const handleSave = async () => {
    if (!formData.name || !formData.phone) return alert('الاسم ورقم الهاتف مطلوبان');
    
    setIsSaving(true); // تشغيل الـ Spinner
    try {
      const payload: Supplier = {
        ...formData,
        balance: parseFloat(formData.balance),
        id: editingSupplier ? editingSupplier.id : 'sup_' + Date.now(),
        createdAt: editingSupplier ? editingSupplier.createdAt : Date.now()
      } as any;

      const success = editingSupplier 
        ? await ApiService.updateSupplier(payload)
        : await ApiService.addSupplier(payload);

      if (success) {
        // الانتظار الفعلي لجلب البيانات الجديدة قبل إغلاق النافذة
        if (onRefresh) {
          await onRefresh(); 
        } else {
          await fetchSuppliers();
        }
        setIsModalOpen(false); // إغلاق فقط بعد اكتمال التحديث
      } else {
        alert('فشل حفظ بيانات المورد');
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false); // إطفاء الـ Spinner
    }
  };

  const handleQuickPayment = async () => {
    if (!activeSupplierForPayment || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغ صحيح');

    setIsSaving(true);
    try {
      const updatedSupplier = {
        ...activeSupplierForPayment,
        balance: activeSupplierForPayment.balance - amount
      };
      const success = await ApiService.updateSupplier(updatedSupplier);
      if (success) {
        if (onRefresh) await onRefresh();
        else await fetchSuppliers();
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد نهائياً؟')) return;
    try {
      const success = await ApiService.deleteSupplier(id);
      if (success) {
        if (onRefresh) await onRefresh();
        else await fetchSuppliers();
      }
    } catch (err) {
      alert('خطأ في عملية الحذف');
    }
  };

  const getTypeText = (t: string) => {
    const types: any = { wholesale: 'تاجر جملة', factory: 'مصنع', farm: 'مزرعة', importer: 'مستورد' };
    return types[t] || t;
  };

  if (localLoading || (globalLoading && suppliers.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 font-black">جاري مزامنة الموردين...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الديون للموردين</p>
            <p className="text-3xl font-black text-rose-600">{totals.totalDebts.toLocaleString()} <small className="text-xs">ج.م</small></p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الموردين النشطين</p>
            <p className="text-3xl font-black text-emerald-600">{totals.activeCount} <small className="text-xs">مورد</small></p>
         </div>
         <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إضافة مورد</p>
              <h4 className="font-black text-sm">توسيع شبكة فاقوس</h4>
            </div>
            <button onClick={openAddModal} className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl hover:bg-emerald-400 transition-all shadow-lg">＋</button>
         </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            الكل ({suppliers.length})
          </button>
          <button 
            onClick={() => setFilterStatus('debtors')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'debtors' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-rose-500'}`}
          >
            مديونية ({totals.debtorsCount})
          </button>
          <button 
            onClick={() => setFilterStatus('paid')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'paid' ? 'bg-emerald-50 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
          >
            خالص ({totals.paidCount})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الشركة..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold pr-12 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <span className="absolute right-4 top-2.5 text-slate-300 text-lg">🔍</span>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSuppliers.map(s => (
          <div key={s.id} className={`bg-white p-8 rounded-[3rem] border-2 transition-all group relative overflow-hidden ${s.balance > 0 ? 'border-rose-50 shadow-rose-100/20' : 'border-slate-50 shadow-sm'}`}>
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex flex-col items-center gap-3">
                 <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-inner transition-colors ${s.balance > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                   {s.type === 'farm' ? '🚜' : s.type === 'factory' ? '🏭' : '🚛'}
                 </div>
                 <div className="flex gap-0.5">
                   {[...Array(5)].map((_, i) => (
                     <span key={i} className={`text-[10px] ${i < (s.rating || 5) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                   ))}
                 </div>
              </div>

              <div className="flex-grow space-y-4">
                 <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-xl font-black text-slate-800">{s.name}</h4>
                       {s.balance > 0 && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
                    </div>
                    <p className="text-emerald-600 font-bold text-xs">{s.companyName || 'فرد / تاجر حر'} • {getTypeText(s.type)}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">رقم التواصل</p>
                      <p className="font-bold text-xs text-slate-700">{s.phone}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">المديونية</p>
                      <p className={`font-black text-sm ${s.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {s.balance > 0 ? `${s.balance.toLocaleString()} ج.م` : 'خالص ✅'}
                      </p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-row md:flex-col justify-center gap-2">
                 <button onClick={() => openEditModal(s)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="تعديل">✎</button>
                 <button 
                  onClick={() => { setActiveSupplierForPayment(s); setIsPaymentModalOpen(true); }}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" 
                  title="دفع مبلع"
                 >💸</button>
                 <button 
                  onClick={() => window.open(`https://wa.me/2${s.phone.replace(/\D/g, '')}`, '_blank')}
                  className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
                 >📱</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && activeSupplierForPayment && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden">
             
             {isSaving && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                 <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-emerald-600 font-black text-sm">جاري تحديث الحساب...</p>
               </div>
             )}

             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">تسجيل دفعة لـ {activeSupplierForPayment.name}</h3>
             <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-2xl text-center mb-6">
                   <p className="text-[10px] font-black text-rose-400 uppercase">المديونية الحالية</p>
                   <p className="text-2xl font-black text-rose-600">{activeSupplierForPayment.balance.toLocaleString()} ج.م</p>
                </div>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="أدخل المبلغ المدفوع..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none font-black text-center text-lg"
                  disabled={isSaving}
                />
                <button 
                  onClick={handleQuickPayment}
                  disabled={isSaving}
                  className={`w-full py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 ${isSaving ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}
                >
                  {isSaving ? 'جاري الاتصال...' : 'تأكيد دفع المبلغ ✅'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-12 animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* مؤشر التحميل الكامل والمزامن */}
            {isSaving && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[3000] flex flex-col items-center justify-center animate-fadeIn">
                <div className="relative mb-6">
                   <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
                   <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-2xl">🚛</div>
                </div>
                <h4 className="text-xl font-black text-slate-800">جاري الحفظ والمزامنة...</h4>
                <p className="text-slate-400 font-bold text-xs mt-2 animate-pulse">يتم الآن تحديث قاعدة البيانات وجلب القائمة الجديدة</p>
              </div>
            )}

            <h3 className="text-2xl font-black text-slate-800 mb-8 text-center">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">اسم المورد</label>
                  <input disabled={isSaving} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الجوال</label>
                  <input disabled={isSaving} type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold text-left" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">نوع المورد</label>
                  <select disabled={isSaving} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold">
                    <option value="wholesale">تاجر جملة</option>
                    <option value="factory">مصنع / علامة تجارية</option>
                    <option value="farm">مزرعة / إنتاج مباشر</option>
                    <option value="importer">مستورد</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">التقييم (1-5)</label>
                  <input disabled={isSaving} type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">المديونية الحالية (ج.م)</label>
                <input disabled={isSaving} type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-black text-rose-600" placeholder="0.00" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">اسم الشركة (اختياري)</label>
                <input disabled={isSaving} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">ملاحظات / عنوان</label>
                <textarea disabled={isSaving} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold min-h-[80px]" />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className={`flex-grow py-4 rounded-2xl font-black text-sm active:scale-95 shadow-xl transition-all flex items-center justify-center gap-3 ${isSaving ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-emerald-600 text-white hover:bg-slate-900'}`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    'حفظ بيانات المورد ✨'
                  )}
                </button>
                <button disabled={isSaving} onClick={() => setIsModalOpen(false)} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
