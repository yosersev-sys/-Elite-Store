import React, { useState, useEffect } from 'react';
import { Shift, DrawerTransaction, Order } from '../../types';
import { ApiService } from '../../services/api';
import { POSPrintService } from '../../services/posPrintService';

interface ShiftsTabProps {
  onRefreshData?: () => void;
}

const ShiftsTab: React.FC<ShiftsTabProps> = ({ onRefreshData }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // حوار فتح الوردية
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [shiftName, setShiftName] = useState('');

  // حوار حركة الخزينة (إيداع/سحب)
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txReason, setTxReason] = useState('');

  // حوار إغلاق الوردية
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // حوار تفاصيل الوردية القديمة
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<{
    shift: Shift;
    transactions: DrawerTransaction[];
    orders: Order[];
    auditLogs: any[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modalTab, setModalTab] = useState<'financial' | 'products' | 'invoices' | 'logs'>('financial');

  // ملخص الوردية المغلقة للطباعة والتسليم
  const [closedShiftSummary, setClosedShiftSummary] = useState<{
    shift: Shift;
    transactions: DrawerTransaction[];
    orders: Order[];
    auditLogs: any[];
  } | null>(null);

  const loadShiftsData = async () => {
    setIsLoading(true);
    try {
      const active = await ApiService.getActiveShift();
      setActiveShift(active);

      const all = await ApiService.getShifts();
      setShifts(all);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShiftsData();

    const initialAction = localStorage.getItem('shifts_tab_initial_action');
    if (initialAction === 'close') {
      localStorage.removeItem('shifts_tab_initial_action');
      setShowCloseModal(true);
    }
  }, []);

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      alert('يرجى إدخال اسم الوردية أولاً');
      return;
    }
    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) {
      alert('يرجى إدخال مبلغ صحيح غير سالب');
      return;
    }

    setIsSaving(true);
    try {
      const res = await ApiService.openShift(cash, shiftName.trim());
      if (res.success) {
        alert('تم فتح الوردية بنجاح.');
        setShowOpenModal(false);
        setStartingCash('');
        setShiftName('');
        loadShiftsData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل فتح الوردية');
      }
    } catch (e) {
      alert('حدث خطأ فني أثناء فتح الوردية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ حركة صحيح أكبر من الصفر');
      return;
    }
    if (!txReason.trim()) {
      alert('يرجى كتابة سبب الحركة');
      return;
    }

    setIsSaving(true);
    try {
      const res = await ApiService.addDrawerTransaction(txType, amount, txReason.trim());
      if (res.success) {
        alert('تم تسجيل حركة الخزينة بنجاح.');
        setShowTxModal(false);
        setTxAmount('');
        setTxReason('');
        loadShiftsData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشلت الحركة');
      }
    } catch (e) {
      alert('حدث خطأ فني أثناء إضافة الحركة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCash);
    if (isNaN(actual) || actual < 0) {
      alert('يرجى إدخال مبلغ نقدية فعلية صحيح');
      return;
    }

    // حساب فرق الجرد
    const expected = (activeShift?.currentCashBalance || 0);
    const difference = actual - expected;

    if (difference !== 0 && !discrepancyReason.trim()) {
      alert('يوجد فارق جرد (عجز أو زيادة). يجب كتابة سبب الفارق لإتمام إغلاق الوردية.');
      return;
    }

    setIsSaving(true);
    try {
      const shiftIdToFetch = activeShift?.id;
      const res = await ApiService.closeShift(actual, discrepancyReason.trim(), closeNotes.trim());
      if (res.success) {
        let closedDetails = null;
        if (shiftIdToFetch) {
          try {
            closedDetails = await ApiService.getShiftDetails(shiftIdToFetch);
          } catch (detailsErr) {
            console.error('Failed to load closed shift details for printing summary', detailsErr);
          }
        }

        alert('تم إغلاق الوردية بنجاح وتجميد التقرير المالي.');
        setShowCloseModal(false);
        setActualCash('');
        setDiscrepancyReason('');
        setCloseNotes('');
        
        if (closedDetails) {
          setClosedShiftSummary(closedDetails);
        }

        loadShiftsData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل إغلاق الوردية');
      }
    } catch (e) {
      alert('حدث خطأ فني أثناء إغلاق الوردية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewShiftDetails = async (shiftId: number) => {
    setIsLoadingDetails(true);
    try {
      const details = await ApiService.getShiftDetails(shiftId);
      setSelectedShiftDetails(details);
      setModalTab('financial');
    } catch (e) {
      alert('فشل جلب تفاصيل الوردية');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const parseSnapshot = (data: string | undefined) => {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. الوردية النشطة الحالية */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
        {activeShift && activeShift.id ? (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6 mb-6">
              <div>
                <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase">وردية مفتوحة نشطة 🟢</span>
                <h3 className="text-2xl font-black text-slate-800 mt-2">رقم الوردية: #{activeShift.id} {activeShift.shiftName ? ` - (${activeShift.shiftName})` : ''}</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  بدأت في: {new Date(activeShift.startTime).toLocaleString('ar-EG')} بواسطة {activeShift.openedByName || 'أدمن'}
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setTxType('deposit');
                    setShowTxModal(true);
                  }}
                  className="flex-grow md:flex-initial bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-3 rounded-xl font-black text-xs active:scale-95 transition-all"
                >
                  ➕ إيداع نقدية
                </button>
                <button
                  onClick={() => {
                    setTxType('withdrawal');
                    setShowTxModal(true);
                  }}
                  className="flex-grow md:flex-initial bg-amber-50 hover:bg-amber-100 text-amber-600 px-5 py-3 rounded-xl font-black text-xs active:scale-95 transition-all"
                >
                  ➖ سحب نقدية
                </button>
                <button
                  onClick={() => handleViewShiftDetails(activeShift.id)}
                  className="flex-grow md:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-black text-xs active:scale-95 transition-all"
                >
                  📊 إحصائيات الوردية
                </button>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex-grow md:flex-initial bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all"
                >
                  🔒 إغلاق الوردية
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                <p className="text-slate-400 text-[10px] font-black uppercase mb-1">نقدية البداية</p>
                <p className="text-2xl font-black text-slate-800">{Number(activeShift.startingCash).toFixed(2)} <span className="text-xs font-bold">ج.م</span></p>
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/30">
                <p className="text-emerald-600 text-[10px] font-black uppercase mb-1">الرصيد الفعلي المتوقع</p>
                <p className="text-2xl font-black text-emerald-600">{Number(activeShift.currentCashBalance).toFixed(2)} <span className="text-xs font-bold">ج.م</span></p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                <p className="text-slate-400 text-[10px] font-black uppercase mb-1">المدخلات (الإيداعات)</p>
                <p className="text-xl font-black text-indigo-600">نشطة بالدرج</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                <p className="text-slate-400 text-[10px] font-black uppercase mb-1">تنبيه الدرج</p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">الرصيد الحالي يحسب المبيعات النقدية والحركات اليدوية فورياً.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto">🔒</div>
            <h3 className="text-2xl font-black text-slate-800">لا توجد وردية مفتوحة حالياً</h3>
            <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto leading-relaxed">
              يرجى فتح وردية جديدة وتحديد رصيد نقدية الدرج لبدء استقبال فواتير المبيعات.
            </p>
            <button
              onClick={() => setShowOpenModal(true)}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              🚀 فتح وردية عمل جديدة
            </button>
          </div>
        )}
      </section>

      {/* 2. أرشيف وسجل الورديات السابقة */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">أرشيف الورديات السابقة</h3>
          <p className="text-slate-400 text-[10px] font-bold mt-1">تاريخ ومحاضر جرد الخزائن السابقة والتقارير المالية المغلقة</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">لا يوجد ورديات مغلقة مسجلة مسبقاً</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-black">
                  <th className="py-4 px-2">الوردية</th>
                  <th className="py-4 px-2">الحالة</th>
                  <th className="py-4 px-2">تاريخ البدء</th>
                  <th className="py-4 px-2">نقدية البداية</th>
                  <th className="py-4 px-2">الرصيد الفعلي</th>
                  <th className="py-4 px-2">العجز/الزيادة</th>
                  <th className="py-4 px-2">المدير</th>
                  <th className="py-4 px-2">التقرير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shifts.map((s) => (
                  <tr key={s.id} className="text-slate-700 text-xs font-bold hover:bg-slate-50/50 transition">
                    <td className="py-4 px-2 font-black">#{s.id} {s.shiftName ? `(${s.shiftName})` : ''}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${s.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {s.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-400">{new Date(s.startTime).toLocaleString('ar-EG')}</td>
                    <td className="py-4 px-2">{Number(s.startingCash).toFixed(2)} ج.م</td>
                    <td className="py-4 px-2">{s.status === 'open' ? 'نشط بالدرج' : `${Number(s.actualCash).toFixed(2)} ج.م`}</td>
                    <td className="py-4 px-2">
                      {s.status === 'open' ? (
                        <span className="text-slate-400">-</span>
                      ) : s.difference === 0 ? (
                        <span className="text-emerald-600">متطابق</span>
                      ) : s.difference > 0 ? (
                        <span className="text-indigo-600">+{Number(s.difference).toFixed(2)} ج.م</span>
                      ) : (
                        <span className="text-rose-600">{Number(s.difference).toFixed(2)} ج.م</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-slate-500">{s.openedByName}</td>
                    <td className="py-4 px-2">
                      <button
                        onClick={() => handleViewShiftDetails(s.id)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3.5 py-2 rounded-lg font-black text-[10px] transition-all"
                      >
                        عرض 🔍
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. مودال حركة نقدية درج (سحب/إيداع) */}
      {showTxModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTxModal(false)}></div>
          <form onSubmit={handleAddTx} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp space-y-4">
            <h3 className="text-2xl font-black text-slate-800 text-center">
              {txType === 'deposit' ? 'إيداع نقدية بالدرج 📥' : 'سحب نقدية من الدرج 📤'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 mr-2">القيمة (ج.م)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-black text-lg text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 mr-2">السبب / البيان</label>
                <input
                  required
                  type="text"
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  placeholder="مثال: شراء أقلام، باقي نقدية البداية..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                disabled={isSaving}
                type="submit"
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'تسجيل الحركة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTxModal(false);
                  setTxAmount('');
                  setTxReason('');
                }}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. مودال إغلاق الوردية وجرد النقدية */}
      {showCloseModal && activeShift && activeShift.id && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCloseModal(false)}></div>
          <form onSubmit={handleCloseShiftSubmit} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-slideUp space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 text-center">🔒 جرد وإغلاق الوردية</h3>
            <p className="text-slate-400 text-xs font-bold text-center">
              يرجى عد النقدية الفعلية الموجودة في الدرج ومطابقتها
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between">
                <span>رصيد البداية:</span>
                <span>{Number(activeShift.startingCash).toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>النقدية المتوقعة بالدرج (الرصيد الدفتري):</span>
                <span>{Number(activeShift.currentCashBalance).toFixed(2)} ج.م</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 mr-2">النقدية الفعلية بالدرج (ج.م)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-black text-2xl text-center text-emerald-600"
                />
              </div>

              {/* إذا كان هناك فرق، يتم عرض حقل التبرير وتلوينه */}
              {actualCash !== '' && parseFloat(actualCash) !== Number(activeShift.currentCashBalance) && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700">
                    ⚠️ يوجد فرق جرد بقيمة: {(parseFloat(actualCash) - Number(activeShift.currentCashBalance)).toFixed(2)} ج.م
                  </div>
                  <label className="text-sm font-bold text-slate-500 mr-2">سبب فرق الجرد (مطلوب)</label>
                  <input
                    required
                    type="text"
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="اكتب سبب العجز أو الزيادة هنا..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 font-bold text-xs"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 mr-2">ملاحظات عامة إضافية</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="أي ملاحظات حول الوردية..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-xs min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                disabled={isSaving}
                type="submit"
                className="flex-grow bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'جاري الإغلاق...' : 'تأكيد وإغلاق الوردية'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseModal(false);
                  setActualCash('');
                  setDiscrepancyReason('');
                  setCloseNotes('');
                }}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. مودال تفاصيل الوردية القديمة وملخص التجميد المالي */}
      {selectedShiftDetails && (() => {
        const completedOrders = selectedShiftDetails.orders.filter(o => o.status === 'completed');
        const cancelledOrders = selectedShiftDetails.orders.filter(o => o.status === 'cancelled');
        const netProfit = completedOrders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => {
            const wholesale = item.actualWholesalePrice ?? item.wholesalePrice ?? 0;
            return itemSum + (item.price - wholesale) * item.quantity;
          }, 0);
        }, 0);
        const totalItemsSold = completedOrders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        const snap = parseSnapshot(selectedShiftDetails.shift.snapshotData);
        // في حال كانت الوردية مفتوحة، نقوم بحساب الأرقام بشكل فوري من الطلبات الحالية
        const cashSalesVal = snap ? snap.cashSales : selectedShiftDetails.orders.reduce((sum, o) => {
          if (o.status === 'completed' && (o.paymentMethod.includes('نقدي') || o.paymentMethod.includes('عند الاستلام'))) {
            return sum + o.total;
          }
          return sum;
        }, 0);
        const cashReturnsVal = snap ? snap.cashReturns : selectedShiftDetails.orders.reduce((sum, o) => {
          if (o.status === 'cancelled' && (o.paymentMethod.includes('نقدي') || o.paymentMethod.includes('عند الاستلام'))) {
            return sum + o.total;
          }
          return sum;
        }, 0);
        const cardSalesVal = snap ? snap.cardSales : selectedShiftDetails.orders.reduce((sum, o) => {
          if (o.status === 'completed' && !o.paymentMethod.includes('نقدي') && !o.paymentMethod.includes('عند الاستلام') && !o.paymentMethod.includes('آجل')) {
            return sum + o.total;
          }
          return sum;
        }, 0);
        const debtSalesVal = snap ? snap.debtSales : selectedShiftDetails.orders.reduce((sum, o) => {
          if (o.status === 'completed' && o.paymentMethod.includes('آجل')) {
            return sum + o.total;
          }
          return sum;
        }, 0);
        const depVal = snap ? snap.totalDeposits : selectedShiftDetails.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const witVal = snap ? snap.totalWithdrawals : selectedShiftDetails.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        const ledgerCashVal = snap ? (snap.ledgerCashPayments || 0) : (selectedShiftDetails.shift.ledgerCashPayments || 0);

        const handlePrintDetails = () => {
          POSPrintService.printShift(selectedShiftDetails);
        };

        const productStats: Record<string, { name: string; quantity: number; unit: string; totalSales: number; totalProfit: number }> = {};
        completedOrders.forEach(order => {
          order.items.forEach(item => {
            const key = item.id;
            const qty = item.quantity;
            const wholesale = item.actualWholesalePrice ?? item.wholesalePrice ?? 0;
            const profit = (item.price - wholesale) * qty;
            const sales = item.price * qty;
            if (!productStats[key]) {
              productStats[key] = {
                name: item.name,
                quantity: 0,
                unit: item.unit,
                totalSales: 0,
                totalProfit: 0
              };
            }
            productStats[key].quantity += qty;
            productStats[key].totalSales += sales;
            productStats[key].totalProfit += profit;
          });
        });
        const productStatsList = Object.values(productStats).sort((a, b) => b.quantity - a.quantity);

        return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedShiftDetails(null)}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 animate-slideUp max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span>تفاصيل الوردية #{selectedShiftDetails.shift.id} {selectedShiftDetails.shift.shiftName ? ` - (${selectedShiftDetails.shift.shiftName})` : ''}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${selectedShiftDetails.shift.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {selectedShiftDetails.shift.status === 'open' ? 'مفتوحة نشطة 🟢' : 'مغلقة'}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">
                    المحاسب المسؤول: {selectedShiftDetails.shift.openedByName}
                  </p>
                </div>
                <button onClick={() => setSelectedShiftDetails(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              {/* أزرار التبويبات داخل المودال */}
              <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setModalTab('financial')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${modalTab === 'financial' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  📊 الملخص المالي
                </button>
                <button
                  onClick={() => setModalTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${modalTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  📦 المنتجات المباعة ({productStatsList.length})
                </button>
                <button
                  onClick={() => setModalTab('invoices')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${modalTab === 'invoices' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  🧾 قائمة الفواتير ({selectedShiftDetails.orders.length})
                </button>
                <button
                  onClick={() => setModalTab('logs')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${modalTab === 'logs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  ⏳ سجل الدرج والتدقيق
                </button>
              </div>

              {/* محتويات تفاصيل الوردية */}
              <div className="space-y-6 flex-grow overflow-y-auto no-scrollbar">
                {modalTab === 'financial' && (
                  <div className="space-y-6">
                    {/* ملخص مالي نهائي */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-5 rounded-2xl border">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">رصيد البداية</p>
                        <p className="text-base font-black text-slate-800">{selectedShiftDetails.shift.startingCash.toFixed(2)} ج.م</p>
                      </div>
                      {/* قراءة بيانات الـ Snapshot */}
                      {(() => {
                        const snap = parseSnapshot(selectedShiftDetails.shift.snapshotData);
                        // في حال كانت الوردية مفتوحة، نقوم بحساب الأرقام بشكل فوري من الطلبات الحالية
                        const cashSalesVal = snap ? snap.cashSales : selectedShiftDetails.orders.reduce((sum, o) => {
                          if (o.status === 'completed' && (o.paymentMethod.includes('نقدي') || o.paymentMethod.includes('عند الاستلام'))) {
                            return sum + o.total;
                          }
                          return sum;
                        }, 0);
                        const cashReturnsVal = snap ? snap.cashReturns : selectedShiftDetails.orders.reduce((sum, o) => {
                          if (o.status === 'cancelled' && (o.paymentMethod.includes('نقدي') || o.paymentMethod.includes('عند الاستلام'))) {
                            return sum + o.total;
                          }
                          return sum;
                        }, 0);
                        const cardSalesVal = snap ? snap.cardSales : selectedShiftDetails.orders.reduce((sum, o) => {
                          if (o.status === 'completed' && !o.paymentMethod.includes('نقدي') && !o.paymentMethod.includes('عند الاستلام') && !o.paymentMethod.includes('آجل')) {
                            return sum + o.total;
                          }
                          return sum;
                        }, 0);
                        const debtSalesVal = snap ? snap.debtSales : selectedShiftDetails.orders.reduce((sum, o) => {
                          if (o.status === 'completed' && o.paymentMethod.includes('آجل')) {
                            return sum + o.total;
                          }
                          return sum;
                        }, 0);
                        const depVal = snap ? snap.totalDeposits : selectedShiftDetails.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
                        const witVal = snap ? snap.totalWithdrawals : selectedShiftDetails.transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

                        return (
                          <>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">المبيعات النقدية</p>
                              <p className="text-base font-black text-emerald-600">{cashSalesVal.toFixed(2)} ج.م</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">المرتجع النقدي</p>
                              <p className="text-base font-black text-rose-500">{cashReturnsVal.toFixed(2)} ج.م</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">المبيعات البنكية</p>
                              <p className="text-base font-black text-indigo-600">{cardSalesVal.toFixed(2)} ج.م</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">المبيعات الآجلة</p>
                              <p className="text-base font-black text-amber-600">{debtSalesVal.toFixed(2)} ج.م</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي الإيداعات</p>
                              <p className="text-base font-black text-emerald-600">{depVal.toFixed(2)} ج.م</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي السحوبات</p>
                              <p className="text-base font-black text-rose-600">{witVal.toFixed(2)} ج.م</p>
                            </div>
                          </>
                        );
                      })()}
                      <div className="bg-slate-50 p-5 rounded-2xl border">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">الرصيد المتوقع بالدرج</p>
                        <p className="text-base font-black text-slate-800">{selectedShiftDetails.shift.expectedCash.toFixed(2)} ج.م</p>
                      </div>
                      <div className="bg-slate-900 text-white p-5 rounded-2xl border">
                        <p className="text-[10px] text-slate-300 font-bold mb-1">{selectedShiftDetails.shift.status === 'open' ? 'الرصيد الفعلي المتوقع' : 'الرصيد الفعلي (المجرود)'}</p>
                        <p className="text-base font-black text-emerald-400">{(selectedShiftDetails.shift.status === 'open' ? selectedShiftDetails.shift.currentCashBalance : selectedShiftDetails.shift.actualCash).toFixed(2)} ج.م</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-emerald-500 text-white p-5 rounded-2xl border border-emerald-600 shadow-md">
                        <p className="text-[10px] text-emerald-100 font-bold mb-1">صافي أرباح الوردية</p>
                        <p className="text-xl font-black">{netProfit.toFixed(2)} ج.م</p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">عدد الفواتير الصادرة</p>
                        <p className="text-xl font-black text-slate-800">{completedOrders.length} فواتير</p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي الوحدات المباعة</p>
                        <p className="text-xl font-black text-slate-800">{totalItemsSold} وحدة</p>
                      </div>
                    </div>

                    {/* المساعد المالي للوردية */}
                    <div className="p-6 bg-[#f8fafc] border border-slate-200/80 rounded-[2rem] space-y-3 text-right">
                      <h5 className="text-xs font-black text-slate-800 flex items-center justify-start gap-1.5">
                        <span>💡 الدليل الإرشادي المالي للوردية:</span>
                      </h5>
                      <div className="text-[11px] font-bold text-slate-500 space-y-2 leading-relaxed">
                        <p>
                          💵 <strong>معادلة نقدية الدرج المفترضة:</strong><br />
                          رصيد البداية ({selectedShiftDetails.shift.startingCash.toFixed(2)} ج.م) 
                          {" + "} مبيعات نقدية ({cashSalesVal.toFixed(2)} ج.م) 
                          {" - "} مرتجع نقدي ({cashReturnsVal.toFixed(2)} ج.م) 
                          {" + "} تحصيل ديون نقدية ({ledgerCashVal.toFixed(2)} ج.م)
                          {" + "} إيداعات ({depVal.toFixed(2)} ج.م) 
                          {" - "} سحوبات ({witVal.toFixed(2)} ج.م) 
                          {" = "} <span className="text-emerald-600 font-black">{(selectedShiftDetails.shift.startingCash + cashSalesVal - cashReturnsVal + ledgerCashVal + depVal - witVal).toFixed(2)} ج.م</span>.
                        </p>
                        <p className="text-[10px] text-slate-400">
                          * تنبيه: المبيعات البنكية/الرقمية ({cardSalesVal.toFixed(2)} ج.م) والمبيعات الآجلة ({debtSalesVal.toFixed(2)} ج.م) لا تدخل في حساب نقدية الدرج الفعلية لأنها حركات غير نقدية.
                        </p>
                      </div>
                    </div>

                    {/* عجز / زيادة */}
                    {selectedShiftDetails.shift.status === 'closed' && selectedShiftDetails.shift.difference !== 0 && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 flex justify-between">
                        <span>فرق الجرد: {selectedShiftDetails.shift.difference.toFixed(2)} ج.م</span>
                        <span>سبب الفرق: {selectedShiftDetails.shift.discrepancyReason}</span>
                      </div>
                    )}
                  </div>
                )}

                {modalTab === 'products' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm text-slate-700">المنتجات المباعة خلال هذه الوردية</h4>
                    {productStatsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs">لا يوجد منتجات مباعة في هذه الوردية بعد</div>
                    ) : (
                      <div className="overflow-x-auto no-scrollbar border rounded-2xl max-h-[350px]">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b bg-slate-50 text-slate-500 text-[10px] font-black">
                              <th className="py-3 px-4">اسم المنتج</th>
                              <th className="py-3 px-4 text-center">الكمية المباعة</th>
                              <th className="py-3 px-4">إجمالي المبيعات</th>
                              <th className="py-3 px-4 text-emerald-600">صافي الربح</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {productStatsList.map((p, idx) => (
                              <tr key={idx} className="text-slate-700 text-xs font-bold hover:bg-slate-50/30 transition">
                                <td className="py-3 px-4 font-black">{p.name}</td>
                                <td className="py-3 px-4 text-center">{p.quantity} {p.unit === 'piece' ? 'قطعة' : p.unit === 'kg' ? 'كجم' : 'جرام'}</td>
                                <td className="py-3 px-4">{p.totalSales.toFixed(2)} ج.م</td>
                                <td className={`py-3 px-4 ${p.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {p.totalProfit >= 0 ? '+' : ''}{p.totalProfit.toFixed(2)} ج.م
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {modalTab === 'invoices' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm text-slate-700">سجل الفواتير الصادرة بالوردية</h4>
                    {selectedShiftDetails.orders.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs">لا يوجد فواتير صادرة في هذه الوردية بعد</div>
                    ) : (
                      <div className="overflow-x-auto no-scrollbar border rounded-2xl max-h-[350px]">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b bg-slate-50 text-slate-500 text-[10px] font-black">
                              <th className="py-3 px-4">رقم الفاتورة</th>
                              <th className="py-3 px-4">العميل</th>
                              <th className="py-3 px-4">طريقة الدفع</th>
                              <th className="py-3 px-4">الوقت</th>
                              <th className="py-3 px-4">المبلغ</th>
                              <th className="py-3 px-4 text-center">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {selectedShiftDetails.orders.map((o) => (
                              <tr key={o.id} className="text-slate-700 text-xs font-bold hover:bg-slate-50/30 transition">
                                <td className="py-3 px-4 font-black text-indigo-600">{o.id}</td>
                                <td className="py-3 px-4">{o.customerName || 'عميل نقدي'}</td>
                                <td className="py-3 px-4">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px]">{o.paymentMethod}</span>
                                </td>
                                <td className="py-3 px-4 text-slate-400">{new Date(o.createdAt).toLocaleTimeString('ar-EG')}</td>
                                <td className="py-3 px-4 font-black">{o.total.toFixed(2)} ج.م</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : o.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {o.status === 'completed' ? 'مكتمل' : o.status === 'cancelled' ? 'مرتجع/ملغى' : 'معلق'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {modalTab === 'logs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* العمود الأول: الحركات والمرتجع */}
                    <div className="space-y-6">
                      {/* حركات الخزينة اليدوية */}
                      <div className="space-y-3">
                        <h4 className="font-black text-sm text-slate-700">حركات الإيداع والسحب اليدوية</h4>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 no-scrollbar">
                          {selectedShiftDetails.transactions.filter(t => t.type !== 'withdrawal_refund').length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-400 py-4 text-center">لا يوجد حركات نقدية يدوية في هذه الوردية</p>
                          ) : (
                            selectedShiftDetails.transactions.filter(t => t.type !== 'withdrawal_refund').map((t) => (
                              <div key={t.id} className="p-3 bg-slate-50 rounded-xl border text-[10px] font-bold flex justify-between items-center">
                                <div>
                                  <span className={`px-2 py-0.5 rounded text-[8px] ${t.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {t.type === 'deposit' ? 'إيداع' : 'سحب'}
                                  </span>
                                  <span className="text-slate-500 mr-2">{t.reason}</span>
                                </div>
                                <span className="font-black">{t.amount.toFixed(2)} ج.م</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* مرتجع مبيعات الفواتير */}
                      <div className="space-y-3">
                        <h4 className="font-black text-sm text-slate-700">مرتجع مبيعات الفواتير</h4>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 no-scrollbar">
                          {selectedShiftDetails.transactions.filter(t => t.type === 'withdrawal_refund').length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-400 py-4 text-center">لا يوجد مرتجعات نقدية في هذه الوردية</p>
                          ) : (
                            selectedShiftDetails.transactions.filter(t => t.type === 'withdrawal_refund').map((t) => (
                              <div key={t.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-[10px] font-bold flex justify-between items-center">
                                <div>
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-rose-100 text-rose-700">مرتجع نقدي</span>
                                  <span className="text-slate-500 mr-2">{t.reason}</span>
                                </div>
                                <span className="font-black text-rose-600">-{t.amount.toFixed(2)} ج.م</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* سجل التدقيق للوردية */}
                    <div className="space-y-3">
                      <h4 className="font-black text-sm text-slate-700">سجل تدقيق الوردية (Audit Log)</h4>
                      <div className="max-h-[420px] overflow-y-auto space-y-2 no-scrollbar">
                        {selectedShiftDetails.auditLogs.map((log) => (
                          <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border text-[10px] font-bold text-slate-500">
                            <div className="flex justify-between mb-1">
                              <span className="text-indigo-600 font-black">{log.action}</span>
                              <span className="text-[8px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString('ar-EG')}</span>
                            </div>
                            <p className="text-slate-700">{log.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrintDetails}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-emerald-100 transition-all text-center flex items-center justify-center gap-2 font-Cairo"
                >
                  <span>🖨️ طباعة الوردية (حراري)</span>
                </button>
                <button
                  onClick={() => setSelectedShiftDetails(null)}
                  className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm active:scale-95 transition-all font-Cairo"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* تقرير الوردية للطباعة الحرارية بمقاس 80 مم من الأرشيف */}
            <div id="thermal-shift-history-report" className="hidden">
              <div className="text-center font-bold" style={{ fontSize: '13pt' }}>سوق العصر - فاقوس</div>
              <div className="text-center font-bold" style={{ fontSize: '10pt', marginTop: '1mm' }}>تقرير ملخص الوردية الأرشيفية</div>
              <div className="divider"></div>
              
              <div className="flex-between">
                <span>رقم الوردية:</span>
                <span className="font-bold">#{selectedShiftDetails.shift.id}</span>
              </div>
              <div className="flex-between">
                <span>اسم الوردية:</span>
                <span className="font-bold">{selectedShiftDetails.shift.shiftName || 'غير محدد'}</span>
              </div>
              <div className="flex-between">
                <span>المحاسب المسؤول:</span>
                <span className="font-bold">{selectedShiftDetails.shift.openedByName || 'أدمن'}</span>
              </div>
              {selectedShiftDetails.shift.closedByName && (
                <div className="flex-between">
                  <span>أغلق بواسطة:</span>
                  <span className="font-bold">{selectedShiftDetails.shift.closedByName}</span>
                </div>
              )}
              <div className="flex-between">
                <span>الحالة:</span>
                <span className="font-bold">{selectedShiftDetails.shift.status === 'open' ? 'مفتوحة نشطة' : 'مغلقة'}</span>
              </div>
              <div className="flex-between">
                <span>تاريخ البدء:</span>
                <span>{new Date(selectedShiftDetails.shift.startTime).toLocaleString('ar-EG')}</span>
              </div>
              {selectedShiftDetails.shift.endTime && (
                <div className="flex-between">
                  <span>تاريخ الإغلاق:</span>
                  <span>{new Date(selectedShiftDetails.shift.endTime).toLocaleString('ar-EG')}</span>
                </div>
              )}
              
              <div className="divider"></div>
              <div className="text-center font-bold" style={{ fontSize: '10pt', margin: '2mm 0 1mm' }}>الملخص المالي للمبيعات</div>
              <div className="divider"></div>
              
              <div className="flex-between">
                <span>عدد الفواتير الصادرة:</span>
                <span>{selectedShiftDetails.orders.length} فاتورة</span>
              </div>
              <div className="flex-between">
                <span>إجمالي المبيعات النقدية:</span>
                <span>{cashSalesVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between">
                <span>المرتجع النقدي:</span>
                <span>{cashReturnsVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between">
                <span>المبيعات البنكية:</span>
                <span>{cardSalesVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between">
                <span>المبيعات الآجلة:</span>
                <span>{debtSalesVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between font-bold" style={{ fontSize: '11pt', marginTop: '1mm' }}>
                <span>صافي أرباح الوردية:</span>
                <span>{netProfit.toLocaleString()} ج.م</span>
              </div>
              
              <div className="divider"></div>
              <div className="text-center font-bold" style={{ fontSize: '10pt', margin: '2mm 0 1mm' }}>تفاصيل حركة الخزينة (الدرج)</div>
              <div className="divider"></div>
              
              <div className="flex-between">
                <span>نقدية البداية (رصيد الدرج):</span>
                <span>{selectedShiftDetails.shift.startingCash.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between text-emerald-600">
                <span>المبيعات النقدية (+):</span>
                <span>{cashSalesVal.toLocaleString()} ج.m</span>
              </div>
              <div className="flex-between text-rose-500">
                <span>المرتجع النقدي (-):</span>
                <span>{cashReturnsVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between text-emerald-600">
                <span>تحصيلات ديون نقدية (+):</span>
                <span>{ledgerCashVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between text-emerald-600">
                <span>إجمالي الإيداعات (+):</span>
                <span>{depVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between text-rose-600">
                <span>إجمالي السحوبات (-):</span>
                <span>{witVal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between font-bold" style={{ marginTop: '1mm' }}>
                <span>النقدية المتوقعة بالدرج:</span>
                <span>{selectedShiftDetails.shift.expectedCash.toLocaleString()} ج.م</span>
              </div>
              <div className="flex-between font-bold" style={{ fontSize: '11pt' }}>
                <span>الرصيد الفعلي (المجرود):</span>
                <span>{(selectedShiftDetails.shift.status === 'open' ? selectedShiftDetails.shift.currentCashBalance : selectedShiftDetails.shift.actualCash).toLocaleString()} ج.م</span>
              </div>
              {selectedShiftDetails.shift.difference !== 0 && (
                <div className="flex-between font-bold text-rose-600">
                  <span>فرق الجرد (عجز/زيادة):</span>
                  <span>{selectedShiftDetails.shift.difference.toLocaleString()} ج.م</span>
                </div>
              )}
              
              <div className="divider"></div>
              <p className="text-center" style={{ fontSize: '8pt' }}>طُبع بواسطة نظام سوق العصر للمبيعات</p>
            </div>
          </div>
        );
      })()}

      {/* 6. مودال فتح وردية جديدة */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowOpenModal(false)}></div>
          <form onSubmit={handleOpenShiftSubmit} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp space-y-6">
            <div className="text-center space-y-2">
              <span className="text-5xl">🚀</span>
              <h3 className="text-2xl font-black text-slate-800">فتح وردية عمل جديدة</h3>
              <p className="text-slate-400 font-bold text-xs leading-relaxed">
                يرجى إدخال مبلغ نقدية بداية الوردية الموجود في الدرج لبدء استقبال فواتير المبيعات.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">اسم الوردية <span className="text-rose-500">*</span> (مثال: وردية الصباح)</label>
              <input
                required
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="وردية الصباح، الوردية الأولى..."
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-sm text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">نقدية بداية الوردية (الدرج)</label>
              <input
                required
                type="number"
                step="any"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-black text-lg text-center"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={isSaving}
                type="submit"
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50 transition-all"
              >
                {isSaving ? 'جاري فتح الوردية...' : 'تأكيد وفتح الوردية'}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setShowOpenModal(false);
                  setStartingCash('');
                }}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال طباعة ملخص الوردية المغلقة */}
      {closedShiftSummary && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 no-print bg-slate-900/60 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 animate-slideUp overflow-hidden max-h-[90vh] flex flex-col justify-between">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-shift-area, .print-shift-area * {
                  visibility: visible !important;
                }
                .print-shift-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 80mm !important;
                  padding: 4mm !important;
                  font-family: 'Courier New', Courier, monospace !important;
                  direction: rtl !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            
            <div className="overflow-y-auto no-scrollbar flex-grow pr-2 pb-6 print-shift-area">
              {/* ترويسة التقرير للطباعة */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                <h2 className="text-xl font-black text-slate-800">تقرير تسليم خزينة الوردية</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">سوق العصر - فاقوس</p>
                <div className="mt-2 text-sm font-black text-slate-900 bg-slate-100 py-1.5 px-3 rounded-xl inline-block">
                  رقم الوردية: #{closedShiftSummary.shift.id}
                </div>
              </div>

              {/* البيانات العامة */}
              <div className="space-y-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الوردية:</span>
                  <span className="text-rose-600 font-black">مغلقة 🔒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المحاسب المسؤول:</span>
                  <span className="font-black">{closedShiftSummary.shift.openedByName || 'أدمن'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">أغلق بواسطة:</span>
                  <span className="font-black">{closedShiftSummary.shift.closedByName || 'أدمن'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">وقت البدء:</span>
                  <span className="ltr text-right">{new Date(closedShiftSummary.shift.startTime).toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">وقت الإغلاق:</span>
                  <span className="ltr text-right">{closedShiftSummary.shift.endTime ? new Date(closedShiftSummary.shift.endTime).toLocaleString('ar-EG') : '-'}</span>
                </div>
              </div>

              {/* أرقام الخزينة والجرد */}
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2 text-xs font-bold text-slate-700 mb-4">
                <div className="flex justify-between">
                  <span>نقدية بداية الوردية (الافتتاح):</span>
                  <span className="font-black text-slate-800">{Number(closedShiftSummary.shift.startingCash).toFixed(2)} ج.م</span>
                </div>
                {(() => {
                  const snap = parseSnapshot(closedShiftSummary.shift.snapshotData) || {
                    cashSales: 0,
                    cashReturns: 0,
                    cardSales: 0,
                    debtSales: 0,
                    totalDeposits: 0,
                    totalWithdrawals: 0,
                    ledgerCashPayments: 0,
                    ordersCount: 0,
                    returnsCount: 0
                  };
                  const cashSalesVal = Number(snap.cashSales || 0);
                  const cashReturnsVal = Number(snap.cashReturns || 0);
                  const depVal = Number(snap.totalDeposits || 0);
                  const witVal = Number(snap.totalWithdrawals || 0);
                  const ledgerCashVal = Number(snap.ledgerCashPayments || 0);
                  
                  return (
                    <>
                      <div className="flex justify-between text-emerald-600">
                        <span>المبيعات النقدية (+):</span>
                        <span>{cashSalesVal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>المرتجع النقدي (-):</span>
                        <span>{cashReturnsVal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>تحصيلات ديون نقدية (+):</span>
                        <span>{ledgerCashVal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>إجمالي الإيداعات (+):</span>
                        <span>{depVal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>إجمالي السحوبات (-):</span>
                        <span>{witVal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800">
                        <span>النقدية المتوقعة بالدرج (الرصيد الدفتري):</span>
                        <span className="font-black">{Number(closedShiftSummary.shift.expectedCash).toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-indigo-600 border-t border-slate-200 pt-1">
                        <span>النقدية الفعلية (المجرود والمسلم):</span>
                        <span className="font-black">{Number(closedShiftSummary.shift.actualCash).toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
                        <span>فرق الجرد (عجز/زيادة):</span>
                        <span className={closedShiftSummary.shift.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {closedShiftSummary.shift.difference > 0 ? '+' : ''}{Number(closedShiftSummary.shift.difference).toFixed(2)} ج.م
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* سبب فرق الجرد والملاحظات */}
              {closedShiftSummary.shift.difference !== 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 mb-4">
                  <span className="block font-black mb-1">سبب فرق الجرد:</span>
                  <span>{closedShiftSummary.shift.discrepancyReason || 'غير محدد'}</span>
                </div>
              )}

              {closedShiftSummary.shift.notes && (
                <div className="p-3 bg-slate-50 border rounded-xl text-xs font-bold text-slate-600 mb-4">
                  <span className="block font-black mb-1">ملاحظات الوردية:</span>
                  <p className="whitespace-pre-line">{closedShiftSummary.shift.notes}</p>
                </div>
              )}

              {/* التواقيع */}
              <div className="mt-8 grid grid-cols-2 gap-4 text-center text-[10px] font-bold text-slate-400 pt-4 border-t border-dashed border-slate-300">
                <div>
                  <span className="block mb-6">توقيع مسؤول الوردية</span>
                  <span className="block border-t border-slate-200 pt-2 max-w-[100px] mx-auto text-slate-600">________________</span>
                </div>
                <div>
                  <span className="block mb-6">توقيع المستلم (المدير)</span>
                  <span className="block border-t border-slate-200 pt-2 max-w-[100px] mx-auto text-slate-600">________________</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100 no-print">
              <button
                onClick={() => window.print()}
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-emerald-100 transition-all"
              >
                🖨️ طباعة تقرير الوردية
              </button>
              <button
                onClick={() => setClosedShiftSummary(null)}
                className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftsTab;
