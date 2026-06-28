import React, { useState, useEffect } from 'react';
import { Expense } from '../../types';
import { ApiService } from '../../services/api';

const DEFAULT_CATEGORIES = [
  'رواتب',
  'إيجارات',
  'كهرباء ومياه',
  'صيانة',
  'تسويق وإعلانات',
  'نقل وشحن',
  'نثريات'
];

interface ExpensesTabProps {
  onRefreshData?: () => void;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ onRefreshData }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<number[]>([]);

  // الفلاتر
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');

  // نموذج إضافة مصروف جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [paymentSource, setPaymentSource] = useState<'drawer' | 'external'>('drawer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [attachment, setAttachment] = useState('');
  const [notes, setNotes] = useState('');

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getExpenses({
        month: filterMonth,
        year: filterYear,
        category: filterCategory,
        paymentSource: filterSource
      });
      setExpenses(data);
    } catch (e) {
      console.error('Failed to load expenses', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [filterMonth, filterYear, filterCategory, filterSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const finalCategory = category === 'other' ? customCategory.trim() : category;
    if (!finalCategory) {
      alert('يرجى كتابة اسم الفئة المخصصة');
      return;
    }

    setIsSaving(true);
    try {
      const res = await ApiService.addExpense({
        title: title.trim(),
        amount: parsedAmount,
        category: finalCategory,
        paymentSource,
        referenceNumber: referenceNumber.trim() || undefined,
        attachment: attachment.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.success) {
        alert('تم تسجيل المصروف بنجاح.');
        setShowAddModal(false);
        setTitle('');
        setAmount('');
        setCategory(DEFAULT_CATEGORIES[0]);
        setCustomCategory('');
        setPaymentSource('drawer');
        setReferenceNumber('');
        setAttachment('');
        setNotes('');
        loadExpenses();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل تسجيل المصروف');
      }
    } catch (e) {
      alert('حدث خطأ فني أثناء تسجيل المصروف');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelExpense = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا المصروف؟ سيتم أرشفته وإعادة المبلغ لدرج الوردية (إذا تم الصرف من الدرج).')) {
      return;
    }

    setCancellingIds(prev => [...prev, id]);
    try {
      const res = await ApiService.cancelExpense(id);
      if (res.success) {
        alert('تم إلغاء وأرشفة المصروف بنجاح.');
        loadExpenses();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message || 'فشل إلغاء المصروف');
      }
    } catch (e) {
      alert('حدث خطأ فني أثناء إلغاء المصروف');
    } finally {
      setCancellingIds(prev => prev.filter(x => x !== id));
    }
  };

  // إحصائيات التصفية الحالية (للمصروفات النشطة فقط)
  const activeExpenses = expenses.filter(e => e.status === 'active');
  const totalDrawerExpenses = activeExpenses
    .filter(e => e.paymentSource === 'drawer')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExternalExpenses = activeExpenses
    .filter(e => e.paymentSource === 'external')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalActiveExpenses = totalDrawerExpenses + totalExternalExpenses;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. لوحة الإحصائيات الفورية للمصروفات */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl border border-slate-800">
          <p className="text-[10px] text-slate-400 font-black uppercase mb-1">إجمالي المصروفات النشطة</p>
          <p className="text-3xl font-black text-emerald-400">{totalActiveExpenses.toFixed(2)} <span className="text-xs font-bold text-white">ج.م</span></p>
          <p className="text-[9px] text-slate-400 mt-2">القيم المعروضة بناءً على الفلاتر النشطة بالأسفل</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase mb-1">مصروفات نقدية (من الدرج)</p>
          <p className="text-3xl font-black text-rose-600">{totalDrawerExpenses.toFixed(2)} <span className="text-xs font-bold text-slate-500">ج.م</span></p>
          <p className="text-[9px] text-slate-400 mt-2">تم خصمها من نقدية ورديات الكاشير الجارية</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase mb-1">مصروفات خارجية (بنك/شخصي)</p>
          <p className="text-3xl font-black text-indigo-600">{totalExternalExpenses.toFixed(2)} <span className="text-xs font-bold text-slate-500">ج.م</span></p>
          <p className="text-[9px] text-slate-400 mt-2">مدفوعات مستقلة لا تؤثر على صندوق الكاشير</p>
        </div>
      </section>

      {/* 2. أدوات التصفية والبحث والمزامنة */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">إدارة القيود المالية والتكاليف</h3>
            <p className="text-slate-400 text-[10px] font-bold mt-1">تصفح وفلترة كشوف المصروفات وإرفاق المستندات الرسمية</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-black text-xs shadow-xl active:scale-95 transition-all"
          >
            💸 تسجيل مصروف جديد
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* فلتر الشهر */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 mr-2">الشهر</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl font-bold text-xs focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="0">كل الشهور</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2020, i).toLocaleString('ar-EG', { month: 'long' })}</option>
              ))}
            </select>
          </div>

          {/* فلتر السنة */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 mr-2">السنة</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl font-bold text-xs focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="0">كل السنين</option>
              {Array.from({ length: 5 }, (_, i) => {
                const yr = now.getFullYear() - 2 + i;
                return <option key={yr} value={yr}>{yr}</option>;
              })}
            </select>
          </div>

          {/* فلتر التصنيف */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 mr-2">الفئة</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl font-bold text-xs focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="">كل الفئات</option>
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* فلتر طريقة الدفع */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 mr-2">مصدر الدفع</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl font-bold text-xs focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="">كل مصادر الدفع</option>
              <option value="drawer">نقدي (من الدرج)</option>
              <option value="external">خارجي (بنكي/بطاقة)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. كشف وجدول المصروفات */}
      <section className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold text-xs">لا يوجد مصروفات مسجلة تطابق خيارات التصفية الحالية</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-black">
                  <th className="py-4 px-2">التاريخ</th>
                  <th className="py-4 px-2">البيان/العنوان</th>
                  <th className="py-4 px-2">الفئة</th>
                  <th className="py-4 px-2">طريقة الدفع</th>
                  <th className="py-4 px-2">المستند</th>
                  <th className="py-4 px-2">القيمة</th>
                  <th className="py-4 px-2">الحالة</th>
                  <th className="py-4 px-2 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((e) => {
                  const isCancelled = e.status === 'cancelled';
                  return (
                    <tr
                      key={e.id}
                      className={`text-slate-700 text-xs font-bold hover:bg-slate-50/50 transition-all ${isCancelled ? 'bg-slate-50/50 text-slate-400 line-through' : ''}`}
                    >
                      <td className="py-4 px-2 text-slate-400">{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                      <td className="py-4 px-2">
                        <span className="font-black text-slate-800">{e.title}</span>
                        {e.notes && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{e.notes}</p>}
                      </td>
                      <td className="py-4 px-2">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[9px] font-black">{e.category}</span>
                      </td>
                      <td className="py-4 px-2">
                        {e.paymentSource === 'drawer' ? (
                          <span className="text-rose-500">نقدي (الدرج #{e.shiftId})</span>
                        ) : (
                          <span className="text-indigo-500">خارجي</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-slate-500">
                        {e.referenceNumber ? (
                          <span className="font-bold text-[10px]">{e.referenceNumber}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-2 font-black">{e.amount.toFixed(2)} ج.م</td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${isCancelled ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isCancelled ? 'ملغى' : 'نشط'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        {!isCancelled ? (
                          <button
                            disabled={cancellingIds.includes(e.id)}
                            onClick={() => handleCancelExpense(e.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-black text-[9px] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1 mx-auto"
                          >
                            {cancellingIds.includes(e.id) ? (
                              <span className="w-2.5 h-2.5 border border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : null}
                            إلغاء ✕
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. مودال إضافة مصروف جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowAddModal(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-slideUp space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 text-center">💸 تسجيل بند مصروفات</h3>
            <p className="text-slate-400 text-xs font-bold text-center">
              يرجى ملء البيانات لتسجيل القيد المالي وخصمه من الحسابات
            </p>

            <div className="space-y-4">
              {/* بيان المصروف */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">البيان / عنوان المصروف</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء شهر يونيو، شراء ورق طباعة..."
                  className="w-full px-5 py-3.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs border border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* القيمة */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-2">القيمة (ج.م)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-black text-base border border-transparent"
                  />
                </div>

                {/* تصنيف المصروف */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-2">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-400 outline-none border border-transparent"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="other">تصنيف مخصص...</option>
                  </select>
                </div>
              </div>

              {/* حقل الفئة المخصصة - يظهر عند اختيار أخرى */}
              {category === 'other' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-500 mr-2">اسم التصنيف المخصص</label>
                  <input
                    required
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="اكتب فئة مخصصة جديدة..."
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs border border-transparent"
                  />
                </div>
              )}

              {/* طريقة دفع المصروف */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 mr-2">مصدر الدفع المالي</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setPaymentSource('drawer')}
                    className={`py-2.5 rounded-lg font-black text-[10px] transition-all ${paymentSource === 'drawer' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    💵 نقدي من الدرج
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSource('external')}
                    className={`py-2.5 rounded-lg font-black text-[10px] transition-all ${paymentSource === 'external' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    💳 خارجي (شخصي/بنكي)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* رقم المستند */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-2">رقم الفاتورة/المستند (اختياري)</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="رقم المستند الرسمي..."
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs border border-transparent"
                  />
                </div>

                {/* المرفق */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 mr-2">مسار/رابط المرفق (اختياري)</label>
                  <input
                    type="text"
                    value={attachment}
                    onChange={(e) => setAttachment(e.target.value)}
                    placeholder="صورة أو مستند للفاتورة..."
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs border border-transparent"
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">ملاحظات توضيحية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات تفصيلية حول هذا القيد المالي..."
                  className="w-full px-5 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-xs min-h-[70px] resize-none border border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                disabled={isSaving}
                type="submit"
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-xs active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ والخصم...' : 'حفظ وتسجيل المصروف'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSaving) {
                    setShowAddModal(false);
                  }
                }}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-xl font-black text-xs active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
