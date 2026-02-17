
import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, Product } from '../../types';
import { ApiService } from '../../services/api';

interface SuppliersTabProps {
  isLoading: boolean;
  suppliersData?: Supplier[];
  productsData?: Product[];
  onRefresh?: () => Promise<void> | void;
  initialFilter?: FilterStatus;
}

type FilterStatus = 'all' | 'debtors' | 'paid';

const SuppliersTab: React.FC<SuppliersTabProps> = ({ isLoading: globalLoading, suppliersData, productsData = [], onRefresh, initialFilter }) => {
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

  // كشف الحساب التاريخي
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<Supplier | null>(null);
  const [statementLogs, setStatementLogs] = useState<any[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', companyName: '', address: '', notes: '', type: 'wholesale' as any, balance: '0', rating: 5, status: 'active' as any
  });

  useEffect(() => {
    if (initialFilter) setFilterStatus(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (suppliersData) setSuppliers(suppliersData);
    else fetchSuppliers();
  }, [suppliersData]);

  const fetchSuppliers = async () => {
    setLocalLoading(true);
    try {
      const data = await ApiService.getSuppliers();
      setSuppliers(data || []);
    } finally { setLocalLoading(false); }
  };

  const openStatement = async (supplier: Supplier) => {
    setSelectedSupplierForStatement(supplier);
    setIsStatementModalOpen(true);
    setIsLoadingStatement(true);
    try {
      // 1. جلب السداد من قاعدة البيانات
      const payments = await ApiService.getSupplierPayments(supplier.id);
      const paymentLogs = payments.map(p => ({
        id: p.id, date: Number(p.createdAt), type: 'payment', label: 'سداد دفعة نقدية ✅', amount: Number(p.amount)
      }));

      // 2. استخراج التوريد من المنتجات
      const purchaseLogs: any[] = [];
      productsData.forEach(p => {
        if (p.batches) {
          p.batches.forEach(batch => {
            if (p.supplierId === supplier.id || batch.supplierId === supplier.id) {
              purchaseLogs.push({
                id: batch.id, date: Number(batch.createdAt), type: 'purchase', label: `توريد: ${p.name}`, amount: (batch.quantity || 0) * (batch.wholesalePrice || 0), qty: batch.quantity, price: batch.wholesalePrice
              });
            }
          });
        }
      });

      // دمج وترتيب
      const combined = [...paymentLogs, ...purchaseLogs].sort((a, b) => b.date - a.date);
      setStatementLogs(combined);
    } finally { setIsLoadingStatement(false); }
  };

  const handleQuickPayment = async () => {
    if (!activeSupplierForPayment || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغ صحيح');
    setIsSaving(true);
    try {
      const success = await ApiService.addSupplierPayment(activeSupplierForPayment.id, amount);
      if (success) {
        if (onRefresh) await onRefresh(); else await fetchSuppliers();
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
      }
    } finally { setIsSaving(false); }
  };

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || (s.companyName && s.companyName.toLowerCase().includes(q)) || s.phone.includes(q);
      let matchesStatus = true;
      if (filterStatus === 'debtors') matchesStatus = s.balance > 0;
      else if (filterStatus === 'paid') matchesStatus = s.balance <= 0;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, filterStatus]);

  const totals = useMemo(() => ({
    totalDebts: suppliers.reduce((s, sup) => s + (sup.balance || 0), 0),
    debtorsCount: suppliers.filter(s => s.balance > 0).length,
    activeCount: suppliers.filter(s => s.status === 'active').length
  }), [suppliers]);

  if (localLoading || (globalLoading && suppliers.length === 0)) {
    return <div className="py-32 text-center font-black text-slate-400 animate-pulse">جاري جلب بيانات الموردين...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي ديون الموردين</p>
            <p className="text-3xl font-black text-rose-600">{totals.totalDebts.toLocaleString()} <small className="text-xs">ج.م</small></p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">موردين مدينين</p>
            <p className="text-3xl font-black text-orange-600">{totals.debtorsCount}</p>
         </div>
         <button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }} className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between hover:bg-emerald-600 transition-all">
            <div className="text-right">
              <p className="text-[10px] font-black opacity-60 uppercase">إضافة مورد</p>
              <h4 className="font-black text-lg">مورد جديد للنظام</h4>
            </div>
            <span className="text-3xl">＋</span>
         </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button onClick={() => setFilterStatus('all')} className={`flex-grow px-6 py-2 rounded-xl font-black text-xs ${filterStatus === 'all' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>الكل</button>
          <button onClick={() => setFilterStatus('debtors')} className={`flex-grow px-6 py-2 rounded-xl font-black text-xs ${filterStatus === 'debtors' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>مديونية</button>
          <button onClick={() => setFilterStatus('paid')} className={`flex-grow px-6 py-2 rounded-xl font-black text-xs ${filterStatus === 'paid' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>خالص</button>
        </div>
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="بحث باسم المورد..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold" />
          <span className="absolute left-4 top-2.5 text-slate-300 text-xl">🔍</span>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSuppliers.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shrink-0 ${s.balance > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {s.type === 'farm' ? '🚜' : s.type === 'factory' ? '🏭' : '🚛'}
              </div>
              <div className="flex-grow space-y-3">
                 <div>
                    <h4 className="text-xl font-black text-slate-800">{s.name}</h4>
                    <p className="text-xs font-bold text-slate-400">{s.companyName || 'تاجر حر'} • {s.phone}</p>
                 </div>
                 <div className="flex items-center gap-4 border-t pt-4">
                    <div className="flex-grow">
                       <p className="text-[8px] font-black text-slate-300 uppercase">الرصيد المستحق</p>
                       <p className={`text-lg font-black ${s.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {s.balance > 0 ? `${s.balance.toLocaleString()} ج.م` : 'خالص ✅'}
                       </p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openStatement(s)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="كشف الحساب">📜</button>
                       <button onClick={() => { setActiveSupplierForPayment(s); setIsPaymentModalOpen(true); }} className="p-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="دفع سداد">💸</button>
                       <button onClick={() => window.open(`https://wa.me/2${s.phone.replace(/\D/g, '')}`, '_blank')} className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg">📱</button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statement Modal */}
      {isStatementModalOpen && selectedSupplierForStatement && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsStatementModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
            <div className="bg-indigo-600 p-8 text-white">
              <h3 className="text-2xl font-black mb-1">كشف حساب تاريخي</h3>
              <p className="text-indigo-100 font-bold text-sm">{selectedSupplierForStatement.name} - {selectedSupplierForStatement.balance.toLocaleString()} ج.م مديونية</p>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50">
               {isLoadingStatement ? (
                 <div className="py-20 text-center animate-pulse text-slate-400 font-bold">جاري تحليل العمليات التاريخية...</div>
               ) : statementLogs.length > 0 ? (
                 <div className="space-y-4">
                    {statementLogs.map((log, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-inner ${log.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               <span className="text-[8px] font-black">{new Date(log.date).toLocaleDateString('ar-EG', {month: 'short'})}</span>
                               <span className="text-sm font-black leading-none">{new Date(log.date).getDate()}</span>
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-sm">{log.label}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{log.qty ? `${log.qty} وحدة × ${log.price} ج.م` : 'عملية سداد مالي'}</p>
                            </div>
                         </div>
                         <div className="text-left">
                            <p className={`text-base font-black ${log.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {log.type === 'payment' ? '-' : '+'}{log.amount.toLocaleString()} ج.م
                            </p>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{log.type === 'payment' ? 'سداد' : 'مديونية'}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-32 text-center opacity-30 font-black">لا توجد عمليات مسجلة حالياً</div>
               )}
            </div>
            <div className="p-6 bg-white border-t"><button onClick={() => setIsStatementModalOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl">إغلاق</button></div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {isPaymentModalOpen && activeSupplierForPayment && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slideUp">
             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">تسجيل سداد لـ {activeSupplierForPayment.name}</h3>
             <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-2xl text-center mb-6">
                   <p className="text-[10px] font-black text-rose-400 uppercase">المديونية الحالية</p>
                   <p className="text-2xl font-black text-rose-600">{activeSupplierForPayment.balance.toLocaleString()} ج.م</p>
                </div>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="أدخل المبلغ المسدد..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none font-black text-center text-lg" disabled={isSaving} />
                <button onClick={handleQuickPayment} disabled={isSaving} className={`w-full py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 ${isSaving ? 'bg-slate-400' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}>{isSaving ? 'جاري الحفظ...' : 'تأكيد السداد الآن ✅'}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTab;
