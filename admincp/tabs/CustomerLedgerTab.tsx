import React, { useState, useEffect, useMemo } from 'react';
import { User, Order, CustomerLedgerEntry } from '../../types';
import { ApiService } from '../../services/api';

interface CustomerLedgerTabProps {
  users: User[];
  orders: Order[];
  onRefreshData?: () => void;
}

type FilterStatus = 'all' | 'debtors';

const CustomerLedgerTab: React.FC<CustomerLedgerTabProps> = ({ users = [], orders = [], onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // بيانات كشف حساب العميل الحالي
  const [ledgerHistory, setLedgerHistory] = useState<CustomerLedgerEntry[]>([]);
  const [creditOrders, setCreditOrders] = useState<Order[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // نوافذ منبثقة
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  
  // نموذج التحصيل
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدي');
  const [collectNotes, setCollectNotes] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  // نموذج التسوية
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // جلب كشف الحساب عند اختيار عميل
  const fetchLedgerData = async (userId: string) => {
    setIsLoadingLedger(true);
    try {
      const data = await ApiService.getCustomerLedger(userId);
      if (data) {
        setLedgerHistory(data.ledger || []);
        setCreditOrders(data.creditOrders || []);
      }
    } catch (err) {
      console.error('Error fetching customer ledger', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchLedgerData(selectedUser.id);
    } else {
      setLedgerHistory([]);
      setCreditOrders([]);
    }
  }, [selectedUser]);

  // إحصائيات الديون العامة للعملاء الحاليين
  const totals = useMemo(() => {
    const activeDebtors = users.filter(u => (u.balance || 0) > 0);
    const totalDebts = users.reduce((sum, u) => sum + (u.balance || 0), 0);
    
    // حساب المبيعات الآجلة الإجمالية، المرتجعات، والتحصيلات من الحركات
    // نظراً لأنها قد تكون ضخمة، نقوم بحسابها من البيانات المسلحة
    return {
      totalDebts,
      debtorsCount: activeDebtors.length,
      allCount: users.length
    };
  }, [users]);

  // تقرير أعمار الديون (Aging Report)
  const agingReport = useMemo(() => {
    let bracket0_30 = 0;
    let bracket31_60 = 0;
    let bracket61_90 = 0;
    let bracket90Plus = 0;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    orders.forEach(order => {
      // فقط الفواتير الآجلة المكتملة وغير المسددة بالكامل
      if (order.status === 'completed' && order.paymentMethod.includes('آجل') && order.paymentStatus !== 'paid') {
        const orderAgeDays = Math.floor((now - Number(order.createdAt)) / oneDayMs);
        
        // حساب القيمة المتبقية من الفاتورة الآجلة
        // في هذا النظام، متبقي الفاتورة = total (سيتم تخفيضها بالكامل أو جزئياً)
        // ولكن للتوزيع الدقيق، سنستخدم القيمة الإجمالية كمؤشر، 
        // أو إذا كان هناك دفعات مربوطة بالفاتورة، نقوم بخصمها.
        // لنقوم بحساب المتبقي تقريبياً بناءً على حالة الدفع:
        // إذا كان paymentStatus = unpaid، فالمتبقي هو كامل المبلغ.
        // وإذا كان partially_paid، سنفترض بقاء نصف القيمة كمحاكاة عامة للتقارير لحين مطابقة السجل
        let remaining = Number(order.total || 0);
        if (order.paymentStatus === 'partially_paid') {
          remaining = remaining * 0.5; // تقدير النصف
        }

        if (orderAgeDays <= 30) {
          bracket0_30 += remaining;
        } else if (orderAgeDays <= 60) {
          bracket31_60 += remaining;
        } else if (orderAgeDays <= 90) {
          bracket61_90 += remaining;
        } else {
          bracket90Plus += remaining;
        }
      }
    });

    return {
      bracket0_30,
      bracket31_60,
      bracket61_90,
      bracket90Plus,
      total: bracket0_30 + bracket31_60 + bracket61_90 + bracket90Plus
    };
  }, [orders]);

  // إحصائيات كشف الحساب للعميل المحدد
  const selectedUserStats = useMemo(() => {
    if (!selectedUser) return { credit: 0, paid: 0, returned: 0, balance: 0 };
    
    let credit = 0;
    let paid = 0;
    let returned = 0;
    
    ledgerHistory.forEach(h => {
      if (h.type === 'SALE_ON_CREDIT') credit += Number(h.amount);
      else if (h.type === 'PAYMENT') paid += Math.abs(Number(h.amount));
      else if (h.type === 'RETURN') returned += Math.abs(Number(h.amount));
    });

    return {
      credit,
      paid,
      returned,
      balance: selectedUser.balance || 0
    };
  }, [selectedUser, ledgerHistory]);

  // فلترة قائمة العملاء
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(q) || u.phone.includes(q);
      const matchesStatus = filterStatus === 'all' || (u.balance || 0) > 0;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, filterStatus]);

  // تحصيل دفعة مديونية
  const handleCollectSubmit = async () => {
    if (!selectedUser) return;
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) return alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');

    setIsSaving(true);
    try {
      const res = await ApiService.collectCustomerPayment({
        userId: selectedUser.id,
        amount,
        type: 'PAYMENT',
        paymentMethod,
        notes: collectNotes || (selectedInvoice ? `سداد للفاتورة #${selectedInvoice.id}` : 'سداد مديونية عامة'),
        orderId: selectedInvoice?.id
      });

      if (res.success) {
        alert('تم تحصيل الدفعة بنجاح وتحديث كشف الحساب والدرج! ✨');
        setIsCollectModalOpen(false);
        setCollectAmount('');
        setCollectNotes('');
        setSelectedInvoice(null);
        
        // تحديث البيانات
        if (onRefreshData) onRefreshData();
        // إعادة تحميل كشف حساب العميل الحالي لتحديث القائمة
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser({ ...updatedUser });
        } else {
          fetchLedgerData(selectedUser.id);
        }
      } else {
        alert(res.message || 'فشل عملية التحصيل');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  // تسوية حسابية (Admins Only)
  const handleAdjustmentSubmit = async () => {
    if (!selectedUser) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) return alert('يرجى إدخال قيمة صحيحة للتسوية');
    if (!adjustNotes.trim()) return alert('يجب تحديد سبب التسوية الحسابية');

    setIsSaving(true);
    try {
      const res = await ApiService.collectCustomerPayment({
        userId: selectedUser.id,
        amount,
        type: 'ADJUSTMENT',
        paymentMethod: 'تسوية رصيد',
        notes: adjustNotes
      });

      if (res.success) {
        alert('تم تطبيق التسوية الحسابية وتسجيل الحدث بنجاح! ⚙️');
        setIsAdjustmentModalOpen(false);
        setAdjustAmount('');
        setAdjustNotes('');
        
        if (onRefreshData) onRefreshData();
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser({ ...updatedUser });
        } else {
          fetchLedgerData(selectedUser.id);
        }
      } else {
        alert(res.message || 'فشلت التسوية');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  const openCollectModal = (invoice: Order | null = null) => {
    setSelectedInvoice(invoice);
    if (invoice) {
      // حساب المتبقي للفاتورة
      const invoicePaid = ledgerHistory
        .filter(h => h.orderId === invoice.id && h.type === 'PAYMENT')
        .reduce((sum, h) => sum + Math.abs(h.amount), 0);
      const remaining = Math.max(0, invoice.total - invoicePaid);
      setCollectAmount(remaining.toString());
    } else {
      setCollectAmount((selectedUser?.balance || 0).toString());
    }
    setPaymentMethod('نقدي');
    setCollectNotes('');
    setIsCollectModalOpen(true);
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مسدد بالكامل ✓';
      case 'partially_paid': return 'مسدد جزئياً ⏳';
      case 'unpaid':
      default:
        return 'غير مسدد ✕';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'partially_paid': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'unpaid':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      
      {/* 1. لوحة المؤشرات والإحصائيات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المديونيات القائمة</p>
           <p className="text-3xl font-black text-rose-600">{totals.totalDebts.toLocaleString()} <small className="text-xs">ج.م</small></p>
           <p className="text-slate-400 text-xs font-bold mt-2">موزعة على {totals.debtorsCount} عميل مدين</p>
        </div>
        
        {/* تقرير أعمار الديون (Aging Box) */}
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl lg:col-span-2 flex flex-col justify-between">
           <div>
              <h4 className="font-black text-sm text-slate-400 mb-4 tracking-wider">تقرير أعمار الديون الحالية (Aging Report)</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-emerald-400">0–30 يوم</p>
                    <p className="text-sm font-black mt-1">{agingReport.bracket0_30.toLocaleString()} <span className="text-[8px]">ج.م</span></p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-amber-400">31–60 يوم</p>
                    <p className="text-sm font-black mt-1">{agingReport.bracket31_60.toLocaleString()} <span className="text-[8px]">ج.م</span></p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-orange-400">61–90 يوم</p>
                    <p className="text-sm font-black mt-1">{agingReport.bracket61_90.toLocaleString()} <span className="text-[8px]">ج.م</span></p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                    <p className="text-[9px] font-black text-rose-400">فوق 90 يوم ⚠️</p>
                    <p className="text-sm font-black mt-1 text-rose-500">{agingReport.bracket90Plus.toLocaleString()} <span className="text-[8px]">ج.م</span></p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. شريط البحث والتصفية */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            جميع العملاء ({totals.allCount})
          </button>
          <button 
            onClick={() => setFilterStatus('debtors')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${filterStatus === 'debtors' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-rose-400 hover:text-rose-500'}`}
          >
            عليهم مديونية ({totals.debtorsCount})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث باسم العميل أو رقم الموبايل..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm outline-none font-bold pr-12 focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="absolute right-4 top-2.5 text-slate-300 text-lg">🔍</span>
        </div>
      </div>

      {/* 3. نافذة العرض المنقسمة (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* قائمة العملاء الجانبية */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
           <h4 className="font-black text-slate-800 text-sm border-b pb-3 mb-2">قائمة العملاء</h4>
           {filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-slate-300 font-bold italic">لا يوجد نتائج للبحث...</div>
           ) : (
             filteredUsers.map(u => (
               <button 
                 key={u.id}
                 onClick={() => setSelectedUser(u)}
                 className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${selectedUser?.id === u.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
               >
                 <div>
                   <p className="font-black text-sm text-slate-800">{u.name}</p>
                   <p className="text-[10px] text-slate-400 font-black tracking-wide mt-0.5">{u.phone}</p>
                 </div>
                 <div className="text-left shrink-0">
                    <p className={`font-black text-sm ${(u.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {u.balance ? `${Number(u.balance).toFixed(2)} ج.م` : 'خالص ✅'}
                    </p>
                 </div>
               </button>
             ))
           )}
        </div>

        {/* تفاصيل كشف الحساب والعمليات */}
        <div className="lg:col-span-8 space-y-6">
           {selectedUser ? (
             <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-6 md:p-10 space-y-8">
                
                {/* رأس تفاصيل العميل المختار */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6 border-slate-100">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">{selectedUser.name}</h3>
                      <p className="text-slate-400 text-xs font-black tracking-wide mt-1">📱 رقم الهاتف: {selectedUser.phone}</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => openCollectModal(null)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black text-xs shadow-lg shadow-emerald-100 transition-all flex items-center gap-1.5"
                      >
                         <span>💸</span> تحصيل دفعة
                      </button>
                      <button 
                        onClick={() => setIsAdjustmentModalOpen(true)} 
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-1.5"
                      >
                         <span>⚙️</span> تسوية رصيد
                      </button>
                   </div>
                </div>

                {/* كروت ملخص العميل المختار */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                      <p className="text-[8px] font-black text-slate-400 mb-1">الرصيد القائم</p>
                      <p className={`text-base font-black ${selectedUserStats.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{selectedUserStats.balance.toLocaleString()} ج.م</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                      <p className="text-[8px] font-black text-slate-400 mb-1">إجمالي المبيعات</p>
                      <p className="text-base font-black text-slate-800">{selectedUserStats.credit.toLocaleString()} ج.م</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                      <p className="text-[8px] font-black text-slate-400 mb-1">إجمالي المحصل</p>
                      <p className="text-base font-black text-emerald-600">{selectedUserStats.paid.toLocaleString()} ج.م</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                      <p className="text-[8px] font-black text-slate-400 mb-1">إجمالي المرتجعات</p>
                      <p className="text-base font-black text-orange-600">{selectedUserStats.returned.toLocaleString()} ج.م</p>
                   </div>
                </div>

                {/* تبويب جدول الفواتير غير المسددة */}
                <div className="space-y-4">
                   <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <span>الفواتير الآجلة غير المسددة</span>
                      <span className="text-slate-300 font-bold text-xs">({creditOrders.filter(o => o.paymentStatus !== 'paid').length})</span>
                   </h4>
                   <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 border-b text-slate-400 font-black">
                          <tr>
                            <th className="px-6 py-4">رقم الفاتورة</th>
                            <th className="px-6 py-4">التاريخ</th>
                            <th className="px-6 py-4">الإجمالي</th>
                            <th className="px-6 py-4">حالة الدفع</th>
                            <th className="px-6 py-4 text-center">التحصيل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-bold text-slate-700">
                          {creditOrders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-300 italic">لا توجد فواتير آجلة مسجلة للعميل.</td>
                            </tr>
                          ) : (
                            creditOrders.map(o => (
                              <tr key={o.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-black">#{o.id}</td>
                                <td className="px-6 py-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-6 py-4">{o.total.toFixed(2)} ج.م</td>
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 rounded-full text-[9px] border font-black ${getPaymentStatusColor(o.paymentStatus || 'unpaid')}`}>
                                      {getPaymentStatusText(o.paymentStatus || 'unpaid')}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   {o.paymentStatus !== 'paid' && (
                                     <button onClick={() => openCollectModal(o)} className="text-[10px] bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm transition-colors">
                                        سداد الفاتورة 💸
                                     </button>
                                   )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                   </div>
                </div>

                {/* كشف الحساب التاريخي التفصيلي */}
                <div className="space-y-4 pt-4 border-t border-slate-50">
                   <h4 className="font-black text-slate-800 text-base">سجل الحركة المحاسبية (Ledger History)</h4>
                   
                   {isLoadingLedger ? (
                      <div className="text-center py-10 animate-pulse text-slate-400 font-bold">جاري تحميل حركات الحساب...</div>
                   ) : ledgerHistory.length === 0 ? (
                      <div className="p-10 border border-dashed rounded-3xl text-center text-slate-300 italic font-bold">لا توجد حركات مسجلة بكشف حساب العميل بعد.</div>
                   ) : (
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        {ledgerHistory.map(item => {
                          const isDebit = item.amount > 0;
                          return (
                            <div key={item.id} className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row justify-between gap-4 ${isDebit ? 'bg-rose-50/20 border-rose-100' : 'bg-emerald-50/20 border-emerald-100'}`}>
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <span className={`px-3 py-1 rounded-xl text-[9px] font-black border uppercase ${isDebit ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                        {item.type === 'SALE_ON_CREDIT' ? 'فاتورة بيع آجل ➕' : item.type === 'PAYMENT' ? 'سداد مديونية ✅' : item.type === 'RETURN' ? 'مرتجع بضاعة 🔄' : 'تسوية حسابية ⚙️'}
                                     </span>
                                     <span className="text-[10px] text-slate-400 font-black">{new Date(item.createdAt).toLocaleString('ar-EG')}</span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-700">{item.notes || 'لا يوجد ملاحظات'}</p>
                                  <div className="flex gap-4 text-[10px] text-slate-400 font-black">
                                     {item.orderId && <span>رقم الفاتورة: #{item.orderId}</span>}
                                     {item.paymentMethod && <span>طريقة الدفع: {item.paymentMethod}</span>}
                                     <span>بواسطة: {item.createdByName || 'المشرف'}</span>
                                  </div>
                               </div>
                               <div className="text-left md:self-center shrink-0">
                                  <p className={`text-xl font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                                     {isDebit ? '+' : ''}{item.amount.toFixed(2)} ج.م
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-black mt-1">الرصيد بعد الحركة: <span className="text-slate-800 font-black">{item.balanceAfter.toFixed(2)} ج.م</span></p>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                   )}
                </div>

             </div>
           ) : (
             <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-20 text-center space-y-4">
                <span className="text-6xl block">⏳</span>
                <h4 className="font-black text-slate-700 text-xl">كشف حساب العميل والمديونيات</h4>
                <p className="text-slate-400 text-xs font-bold max-w-sm mx-auto leading-relaxed">يرجى اختيار عميل من القائمة الجانبية لعرض فواتيره غير المسددة وسجل الحركات المحاسبية بالكامل، وتحصيل المديونية منه كلياً أو جزئياً.</p>
             </div>
           )}
        </div>

      </div>

      {/* 4. نافذة تحصيل الديون المنبثقة */}
      {isCollectModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsCollectModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden">
             {isSaving && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-black text-slate-800 text-sm">جاري تسجيل الدفعة وتحديث الرصيد...</p>
                </div>
             )}

             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">تحصيل مديونية من {selectedUser.name}</h3>
             
             <div className="space-y-4">
                {selectedInvoice && (
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-center text-xs font-bold text-indigo-800">
                     ربط التحصيل بالفاتورة: #{selectedInvoice.id} (قيمة الفاتورة: {selectedInvoice.total} ج.م)
                  </div>
                )}
                
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                   <p className="text-[10px] font-black text-rose-400 uppercase mb-1">إجمالي المديونية الحالية</p>
                   <p className="text-2xl font-black text-rose-600">{selectedUser.balance ? Number(selectedUser.balance).toFixed(2) : '0.00'} ج.م</p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 mr-2 block">القيمة المراد دفعها (سداد)</label>
                   <input 
                     disabled={isSaving}
                     type="number" 
                     value={collectAmount}
                     onChange={e => setCollectAmount(e.target.value)}
                     placeholder="أدخل مبلغ السداد..."
                     className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none font-black text-center text-lg shadow-inner"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 mr-2 block">طريقة الدفع</label>
                   <select 
                     value={paymentMethod} 
                     onChange={e => setPaymentMethod(e.target.value)} 
                     className="w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none font-black text-slate-700"
                   >
                      <option value="نقدي">💰 نقدي (كاش)</option>
                      <option value="بطاقة">💳 بطاقة بنكية</option>
                      <option value="تحويل بنكي">🏦 تحويل بنكي / محفظة إلكترونية</option>
                   </select>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 mr-2 block">ملاحظات (اختياري)</label>
                   <textarea 
                     value={collectNotes} 
                     onChange={e => setCollectNotes(e.target.value)} 
                     placeholder="كتابة ملاحظات التحصيل..."
                     className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs min-h-[60px] resize-none"
                   />
                </div>

                <div className="flex gap-2 pt-2">
                   <button 
                     onClick={handleCollectSubmit}
                     disabled={isSaving || !collectAmount}
                     className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-xl shadow-emerald-100 transition-all"
                   >
                      تأكيد السداد والتحصيل
                   </button>
                   <button 
                     onClick={() => setIsCollectModalOpen(false)}
                     className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm"
                   >
                      إلغاء
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 5. نافذة تسوية الرصيد الحسابي */}
      {isAdjustmentModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsAdjustmentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden">
             {isSaving && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-black text-slate-800 text-sm">جاري تسجيل التسوية الحسابية...</p>
                </div>
             )}

             <h3 className="text-xl font-black text-slate-800 mb-6 text-center">تسوية حسابية للعميل: {selectedUser.name}</h3>
             
             <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الرصيد المتراكم الحالي</p>
                   <p className="text-2xl font-black text-slate-800">{selectedUser.balance ? Number(selectedUser.balance).toFixed(2) : '0.00'} ج.م</p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 mr-2 block">قيمة التسوية الحسابية</label>
                   <input 
                     disabled={isSaving}
                     type="number" 
                     value={adjustAmount}
                     onChange={e => setAdjustAmount(e.target.value)}
                     placeholder="موجب لزيادة الديون / سالب لخصمها..."
                     className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 outline-none font-black text-center text-lg shadow-inner"
                   />
                   <p className="text-[8px] text-slate-400 font-bold text-center mt-1">مثال: أدخل 100 لزيادة الدين، أو -100 لخصم وتخفيض الدين</p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-rose-500 mr-2 block">سبب التسوية الحسابية (إلزامي) ⚠️</label>
                   <textarea 
                     value={adjustNotes} 
                     onChange={e => setAdjustNotes(e.target.value)} 
                     placeholder="اكتب سبب التسوية الحسابية بالتفصيل..."
                     className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs min-h-[80px] resize-none"
                   />
                </div>

                <div className="flex gap-2 pt-2">
                   <button 
                     onClick={handleAdjustmentSubmit}
                     disabled={isSaving || !adjustAmount || !adjustNotes.trim()}
                     className="flex-grow bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-xl transition-all"
                   >
                      تأكيد وحفظ التسوية ⚙️
                   </button>
                   <button 
                     onClick={() => setIsAdjustmentModalOpen(false)}
                     className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm"
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

export default CustomerLedgerTab;
