import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, SupplierPayment } from '../../types';
import { ApiService } from '../../services/api';

interface SuppliersTabProps {
  isLoading: boolean;
  suppliersData?: Supplier[];
  onRefresh?: () => void;
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
  const [paymentSource, setPaymentSource] = useState<'drawer' | 'external'>('drawer');
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false); // حالة نافذة زيادة المديونية
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [debtAmount, setDebtAmount] = useState(''); // مبلغ المديونية الجديدة
  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<Supplier | null>(null);
  const [activeSupplierForDebt, setActiveSupplierForDebt] = useState<Supplier | null>(null);
  const [activeSupplierForHistory, setActiveSupplierForHistory] = useState<Supplier | null>(null);

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
    if (isSaving) return;
    setEditingSupplier(null);
    setFormData({ 
      name: '', phone: '', companyName: '', address: '', notes: '', 
      type: 'wholesale', balance: '0', rating: 5, status: 'active' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    if (isSaving) return;
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

  const handleSave = async () => {
    if (isSaving) return;
    if (!formData.name || !formData.phone) return alert('الاسم ورقم الموبايل مطلوبان');
    
    setIsSaving(true);
    try {
      const payload: Supplier = {
        ...formData,
        balance: parseFloat(formData.balance),
        id: editingSupplier ? editingSupplier.id : 'sup_' + Date.now(),
        createdAt: editingSupplier ? editingSupplier.createdAt : Date.now(),
        paymentHistory: editingSupplier ? editingSupplier.paymentHistory : []
      } as any;

      const success = editingSupplier 
        ? await ApiService.updateSupplier(payload)
        : await ApiService.addSupplier(payload);

      if (success) {
        if (onRefresh) await onRefresh();
        else await fetchSuppliers();
        setIsModalOpen(false);
      } else {
        alert('فشل حفظ بيانات المورد، حاول مرة أخرى');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPayment = async () => {
    if (isSaving) return;
    if (!activeSupplierForPayment || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغ صحيح أكثر من الصفر');

    setIsSaving(true);
    try {
      // 1. إذا كان الدفع من درج الوردية الحالية، نخصمه كحركة سحب نقدي
      if (paymentSource === 'drawer') {
        const drawerRes = await ApiService.addDrawerTransaction(
          'withdrawal',
          amount,
          `سداد مديونية للمورد: ${activeSupplierForPayment.name}`
        );

        if (!drawerRes.success) {
          alert(drawerRes.message || 'فشل سحب المبلغ من درج الخزينة بالوردية الحالية');
          setIsSaving(false);
          return;
        }
      }

      // 2. تسجيل حركة السداد في حساب المورد
      const sourceLabel = paymentSource === 'drawer' ? 'خصم من درج الوردية' : 'دفع من خارج الدرج';
      const newPayment: SupplierPayment = {
        amount: -amount, // سداد (ينقص المديونية)
        date: Date.now(),
        notes: `سداد دفعة نقدية (${sourceLabel})`,
        paymentSource: paymentSource
      };
      
      const updatedSupplier = {
        ...activeSupplierForPayment,
        balance: activeSupplierForPayment.balance - amount,
        paymentHistory: [...(activeSupplierForPayment.paymentHistory || []), newPayment]
      };
      
      const response = await fetch(`api.php?action=update_supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSupplier)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        if (onRefresh) await onRefresh();
        else await fetchSuppliers();
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentSource('drawer');
      } else {
        alert(`فشل تسجيل الدفعة: ${result.message}\n${result.debug || ''}`);
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIncreaseDebt = async () => {
    if (isSaving) return;
    if (!activeSupplierForDebt || !debtAmount) return;
    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغ صحيح');

    setIsSaving(true);
    try {
      const newEntry: SupplierPayment = {
        amount: amount, // زيادة (يضيف للمديونية)
        date: Date.now(),
        notes: 'استلام بضاعة آجل'
      };
      
      const updatedSupplier = {
        ...activeSupplierForDebt,
        balance: activeSupplierForDebt.balance + amount,
        paymentHistory: [...(activeSupplierForDebt.paymentHistory || []), newEntry]
      };
      
      const response = await fetch(`api.php?action=update_supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSupplier)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        if (onRefresh) await onRefresh();
        else await fetchSuppliers();
        setIsDebtModalOpen(false);
        setDebtAmount('');
      } else {
        alert(`فشل زيادة المديونية: ${result.message}\n${result.debug || ''}`);
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeText = (t: string) => {
    const types: any = { wholesale: 'تاجر جملة', factory: 'مصنع', farm: 'مزرعة', importer: 'مستورد' };
    return types[t] || t;
  };

  if (localLoading || (globalLoading && suppliers.length === 0)) {
    return <div className="p-20 text-center animate-pulse text-slate-400 font-black">جاري تحميل شبكة الموردين...</div>;
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
            <button disabled={isSaving} onClick={openAddModal} className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">＋</button>
         </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button 
            disabled={isSaving}
            onClick={() => setFilterStatus('all')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            الكل ({suppliers.length})
          </button>
          <button 
            disabled={isSaving}
            onClick={() => setFilterStatus('debtors')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'debtors' ? 'bg-rose-50 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-rose-500'}`}
          >
            مديونية ({totals.debtorsCount})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            disabled={isSaving}
            type="text" 
            placeholder="بحث بالاسم أو الشركة..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold pr-12 focus:ring-2 focus:ring-emerald-500/20"
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
                 <button disabled={isSaving} onClick={() => openEditModal(s)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="تعديل">✎</button>
                 
                 <button 
                  disabled={isSaving}
                  onClick={() => { if(!isSaving) { setActiveSupplierForDebt(s); setIsDebtModalOpen(true); } }}
                  className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
                  title="زيادة مديونية"
                 >➕</button>

                  <button 
                   disabled={isSaving}
                   onClick={() => { if(!isSaving) { setActiveSupplierForPayment(s); setPaymentSource('drawer'); setPaymentAmount(''); setIsPaymentModalOpen(true); } }}
                   className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" 
                   title="دفع مبلغ (سداد)"
                  >💸</button>

                 <button 
                  disabled={isSaving}
                  onClick={() => { setActiveSupplierForHistory(s); setIsHistoryModalOpen(true); }}
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" 
                  title="سجل العمليات"
                 >🕒</button>
                 
                 <button 
                  disabled={isSaving}
                  onClick={() => window.open(`https://wa.me/2${s.phone.replace(/\D/g, '')}`, '_blank')}
                  className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
                 >📱</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && activeSupplierForHistory && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden max-h-[80vh] flex flex-col">
             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">سجل عمليات {activeSupplierForHistory.name}</h3>
             <div className="flex-grow overflow-y-auto no-scrollbar space-y-3">
                {(!activeSupplierForHistory.paymentHistory || activeSupplierForHistory.paymentHistory.length === 0) ? (
                   <div className="text-center py-20 text-slate-300 font-bold italic">لا توجد حركات مالية مسجلة بعد.</div>
                ) : (
                   activeSupplierForHistory.paymentHistory.slice().reverse().map((pay, i) => (
                      <div key={i} className={`p-4 rounded-2xl flex justify-between items-center border ${pay.amount < 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                         <div>
                            <p className={`font-black text-lg ${pay.amount < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {Math.abs(pay.amount).toLocaleString()} ج.م
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(pay.date).toLocaleString('ar-EG')}</p>
                            {pay.notes && <p className="text-[9px] text-slate-500 mt-1 font-bold">{pay.notes}</p>}
                         </div>
                         <div className={`px-3 py-1 rounded-xl text-[10px] font-black ${pay.amount < 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {pay.amount < 0 ? 'سداد ✅' : 'مديونية ➕'}
                         </div>
                      </div>
                   ))
                )}
             </div>
             <button onClick={() => setIsHistoryModalOpen(false)} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm">إغلاق النافذة</button>
          </div>
        </div>
      )}

      {/* Debt Increase Modal (New) */}
      {isDebtModalOpen && activeSupplierForDebt && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSaving && setIsDebtModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden">
             {isSaving && (
               <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                 <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="font-black text-slate-800 text-sm">جاري تحديث المديونية...</p>
               </div>
             )}

             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">إضافة مديونية لـ {activeSupplierForDebt.name}</h3>
             <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center mb-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase">الرصيد الحالي</p>
                   <p className="text-2xl font-black text-slate-800">{activeSupplierForDebt.balance.toLocaleString()} ج.م</p>
                </div>
                <input 
                  disabled={isSaving}
                  type="number" 
                  value={debtAmount}
                  onChange={e => setDebtAmount(e.target.value)}
                  placeholder="أدخل مبلغ المديونية الجديدة..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-rose-500 outline-none font-black text-center text-lg shadow-inner transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleIncreaseDebt}
                  disabled={isSaving || !debtAmount}
                  className={`w-full text-white py-5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 ${isSaving ? 'bg-slate-400' : 'bg-rose-600 hover:bg-slate-900'}`}
                >
                   <span>تأكيد الإضافة للحساب ➕</span>
                </button>
                {!isSaving && (
                  <button onClick={() => setIsDebtModalOpen(false)} className="w-full text-slate-400 font-bold text-xs py-2 hover:text-slate-600">إلغاء</button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && activeSupplierForPayment && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSaving && setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden">
             {isSaving && (
               <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                 <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="font-black text-slate-800 text-sm">جاري تسجيل الدفعة وتحديث الحساب...</p>
               </div>
             )}

             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">تسجيل سداد لـ {activeSupplierForPayment.name}</h3>
             <div className="space-y-4 text-right" dir="rtl">
                <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">المديونية الحالية</p>
                   <p className="text-2xl font-black text-rose-600 mt-1">{activeSupplierForPayment.balance.toLocaleString()} ج.م</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 mr-2 block">المبلغ المدفوع (ج.م)</label>
                  <input 
                    disabled={isSaving}
                    type="number" 
                    step="any"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="أدخل المبلغ المدفوع..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none font-black text-center text-xl shadow-inner transition-all disabled:opacity-50"
                  />
                </div>

                {/* مصدر سداد المبلغ */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-600 mr-2 block">مصدر دفع وسداد المبلغ:</label>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    <label 
                      onClick={() => !isSaving && setPaymentSource('drawer')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        paymentSource === 'drawer' 
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏧</span>
                        <div className="text-right">
                          <p className="font-black text-xs">خصم من درج الوردية الحالية</p>
                          <p className="text-[10px] font-bold text-slate-400">سحب المبلغ من رصيد الخزينة بالوردية</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="paymentSource" 
                        checked={paymentSource === 'drawer'} 
                        onChange={() => setPaymentSource('drawer')}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label 
                      onClick={() => !isSaving && setPaymentSource('external')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        paymentSource === 'external' 
                          ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💳</span>
                        <div className="text-right">
                          <p className="font-black text-xs">دفع من خارج درج النقدية</p>
                          <p className="text-[10px] font-bold text-slate-400">تسجيل سداد دون تأثير على رصيد الخزينة</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="paymentSource" 
                        checked={paymentSource === 'external'} 
                        onChange={() => setPaymentSource('external')}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleQuickPayment}
                  disabled={isSaving || !paymentAmount}
                  className={`w-full text-white py-5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 mt-4 cursor-pointer ${isSaving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-emerald-600'}`}
                >
                   <span>تأكيد سداد المبلغ ✅</span>
                </button>
                {!isSaving && (
                  <button onClick={() => setIsPaymentModalOpen(false)} className="w-full text-slate-400 font-bold text-xs py-2 hover:text-slate-600 cursor-pointer">إلغاء</button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSaving && setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-12 animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            {isSaving && (
               <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                 <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="font-black text-slate-800 text-lg">جاري حفظ بيانات المورد...</p>
               </div>
            )}

            <h3 className="text-2xl font-black text-slate-800 mb-8 text-center">{editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">اسم المورد</label>
                  <input disabled={isSaving} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-emerald-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الموبايل</label>
                  <input disabled={isSaving} type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold text-left shadow-inner" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">نوع المورد</label>
                  <select disabled={isSaving} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold shadow-inner">
                    <option value="wholesale">تاجر جملة</option>
                    <option value="factory">مصنع / علامة تجارية</option>
                    <option value="farm">مزرعة / إنتاج مباشر</option>
                    <option value="importer">مستورد</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">التقييم (1-5)</label>
                  <input disabled={isSaving} type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold shadow-inner" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">المديونية الحالية (ج.م)</label>
                <input disabled={isSaving} type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-black text-rose-600 shadow-inner" placeholder="0.00" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">اسم الشركة (اختياري)</label>
                <input disabled={isSaving} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold shadow-inner" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">ملاحظات / عنوان</label>
                <textarea disabled={isSaving} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none font-bold min-h-[80px] shadow-inner" />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className={`flex-grow text-white py-5 rounded-2xl font-black text-sm active:scale-95 shadow-xl flex items-center justify-center gap-3 transition-all ${isSaving ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-slate-900 shadow-emerald-500/20'}`}
                >
                   <span>حفظ بيانات المورد ✨</span>
                </button>
                {!isSaving && (
                  <button onClick={() => setIsModalOpen(false)} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors">إلغاء</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;