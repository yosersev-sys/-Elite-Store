import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types';
import { ApiService } from '../../services/api';

interface PaymentMethodsTabProps {
  onRefreshData?: () => void | Promise<void>;
}

const PaymentMethodsTab: React.FC<PaymentMethodsTabProps> = ({ onRefreshData }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // أرقام ومحافظ فودافون كاش / انستا باي
  const [paymentNumbers, setPaymentNumbers] = useState<any[]>([]);
  const [numberStats, setNumberStats] = useState<any[]>([]);
  const [newNumber, setNewNumber] = useState({
    type: 'vodafone' as 'vodafone' | 'instapay',
    label: '',
    value: ''
  });
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    type: 'digital' as 'cash' | 'digital',
    icon: '💳',
    sortOrder: 0
  });

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getPaymentMethods();
      setMethods(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      console.error('Failed to load payment methods', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNumbersAndStats = async () => {
    try {
      const settings = await ApiService.getStoreSettings();
      if (settings && settings.payment_numbers_json) {
        try {
          setPaymentNumbers(JSON.parse(settings.payment_numbers_json));
        } catch (e) {}
      }
      
      const stats = await ApiService.getPaymentNumbersStats();
      setNumberStats(stats || []);
    } catch (e) {
      console.error('Failed to load payment numbers or stats', e);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
    loadNumbersAndStats();
  }, []);

  const handleAddNumber = async () => {
    if (!newNumber.label.trim()) return alert('يرجى كتابة اسم الحساب');
    if (!newNumber.value.trim()) return alert('يرجى كتابة الرقم أو المعرف');

    if (paymentNumbers.some((n: any) => n.type === newNumber.type && n.value.trim().toLowerCase() === newNumber.value.trim().toLowerCase())) {
      return alert('هذا الرقم مضاف بالفعل');
    }

    const created = {
      id: 'num_' + Date.now().toString().slice(-6),
      type: newNumber.type,
      label: newNumber.label.trim(),
      value: newNumber.value.trim()
    };

    const updatedList = [...paymentNumbers, created];
    setPaymentNumbers(updatedList);

    try {
      await ApiService.updateStoreSettings({
        payment_numbers_json: JSON.stringify(updatedList)
      });
      alert('تم حفظ الرقم بنجاح ✨');
      setNewNumber({ type: 'vodafone', label: '', value: '' });
      loadNumbersAndStats();
    } catch (e) {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرقم؟')) return;

    const updatedList = paymentNumbers.filter((n: any) => n.id !== id);
    setPaymentNumbers(updatedList);

    try {
      await ApiService.updateStoreSettings({
        payment_numbers_json: JSON.stringify(updatedList)
      });
      alert('تم حذف الرقم بنجاح ✨');
      loadNumbersAndStats();
    } catch (e) {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const openAddModal = () => {
    setEditingMethod(null);
    setForm({
      name: '',
      type: 'digital',
      icon: '💳',
      sortOrder: methods.length
    });
    setShowFormModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm({
      name: method.name,
      type: method.type,
      icon: method.icon || '💳',
      sortOrder: method.sortOrder
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('يرجى إدخال اسم وسيلة الدفع');

    setIsSubmitting(true);
    try {
      if (editingMethod) {
        const result = await ApiService.updatePaymentMethod({
          id: editingMethod.id,
          name: form.name.trim(),
          type: form.type,
          icon: form.icon,
          sortOrder: Number(form.sortOrder),
          isActive: editingMethod.isActive
        });
        if (result.success) {
          alert('تم تعديل وسيلة الدفع بنجاح');
          setShowFormModal(false);
          loadPaymentMethods();
          if (onRefreshData) onRefreshData();
        } else {
          alert(result.message || 'فشل التعديل');
        }
      } else {
        const result = await ApiService.addPaymentMethod({
          id: 'pay_' + Date.now().toString().slice(-6),
          name: form.name.trim(),
          type: form.type,
          icon: form.icon,
          sortOrder: Number(form.sortOrder)
        } as any);
        if (result.success) {
          alert('تمت إضافة وسيلة الدفع بنجاح');
          setShowFormModal(false);
          loadPaymentMethods();
          if (onRefreshData) onRefreshData();
        } else {
          alert(result.message || 'فشلت إضافة وسيلة الدفع');
        }
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActiveStatus = async (method: PaymentMethod) => {
    try {
      const nextActive = method.isActive === 1 ? 0 : 1;
      const result = await ApiService.updatePaymentMethod({
        id: method.id,
        isActive: nextActive
      });
      if (result.success) {
        setMethods(prev => 
          prev.map(m => m.id === method.id ? { ...m, isActive: nextActive } : m)
        );
        if (onRefreshData) onRefreshData();
      } else {
        alert(result.message || 'فشل تغيير حالة التفعيل');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف وسيلة الدفع هذه؟');
    if (!confirmDelete) return;

    try {
      const result = await ApiService.deletePaymentMethod(id);
      if (result.success) {
        alert('تم حذف وسيلة الدفع بنجاح');
        loadPaymentMethods();
        if (onRefreshData) onRefreshData();
      } else {
        alert(result.message || 'فشل الحذف');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right">
      <div className="flex items-center justify-between flex-row-reverse mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800">وسائل الدفع</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">إضافة وإدارة وتعديل خيارات الدفع والسداد المتاحة للكاشير</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>➕</span> إضافة وسيلة دفع
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-xs">جاري تحميل وسائل الدفع...</p>
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[2rem] border border-slate-100 shadow-sm">
          <span className="text-5xl block mb-4">💳</span>
          <p className="text-slate-400 font-bold text-sm">لا يوجد وسائل دفع مضافة حالياً بالسيستم.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-[10px] md:text-xs font-black text-slate-400 border-b">
                <tr>
                  <th className="px-6 py-4">أيقونة</th>
                  <th className="px-6 py-4">الاسم</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4">الترتيب</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {methods.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-lg">{m.icon || '💰'}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-800 text-sm">{m.name}</p>
                        {m.isSystem === 1 && (
                          <span className="bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded mr-1">وسيلة نظام افتراضية</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${m.type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {m.type === 'cash' ? 'نقدي (كاش)' : 'رقمي / إلكتروني'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{m.sortOrder}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActiveStatus(m)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${m.isActive === 1 ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700'}`}
                      >
                        {m.isActive === 1 ? '✓ نشط ومفعل' : '✕ غير مفعل'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(m)}
                          className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-xl text-slate-400 transition"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        {m.isSystem !== 1 && (
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 p-2 rounded-xl text-slate-400 transition"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form for Add/Edit */}
      {showFormModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowFormModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp">
            <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">
              {editingMethod ? 'تعديل وسيلة الدفع' : 'إضافة وسيلة دفع جديدة'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 mr-1 block">اسم وسيلة الدفع</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: فودافون كاش، باي بال، فيزا"
                  className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl outline-none font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-1 block">أيقونة / إيموجي</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    placeholder="مثال: 📱"
                    className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl outline-none font-bold text-center text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-1 block">ترتيب العرض</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl outline-none font-bold text-center text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 mr-1 block">نوع المعاملة المالية</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'cash' })}
                    className={`py-2.5 rounded-lg font-black text-xs transition-all ${form.type === 'cash' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    💰 نقدي (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'digital' })}
                    className={`py-2.5 rounded-lg font-black text-xs transition-all ${form.type === 'digital' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    📱 دفع رقمي / بنكي
                  </button>
                </div>
                <p className="text-[8px] text-slate-400 font-bold block mt-1 text-center">
                  * وسائل الدفع النقدية تؤثر على نقدية الدرج ومطابقة الوردية، بينما الرقمية تُقيد كحركات حسابية فقط.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات 💾'}
                </button>
                <button
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* قسم إدارة أرقام فودافون كاش ومحافظ انستا باي */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 mt-10">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6 flex-row-reverse">
          <div className="text-right">
            <h3 className="text-xl font-black text-slate-800 flex items-center justify-end gap-2">
              <span>أرقام الحسابات والمحافظ (فودافون كاش & انستا باي)</span>
              <span>📱</span>
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1">إضافة وإدارة أرقام الاستقبال مع إحصائيات المبيعات لكل رقم خلال الشهر الجاري</p>
          </div>
        </div>

        {/* قائمة الأرقام المضافة حالياً مع الإحصائيات */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-[10px] md:text-xs font-black text-slate-400 border-b">
              <tr>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الاسم المستعار (الوصف)</th>
                <th className="px-6 py-4">الرقم / المعرّف</th>
                <th className="px-6 py-4 text-center">إجمالي المحصل (الشهر الجاري)</th>
                <th className="px-6 py-4 text-center">عدد المعاملات</th>
                <th className="px-6 py-4 text-left">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {paymentNumbers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    لا يوجد أرقام حسابات مضافة حالياً بالسيستم.
                  </td>
                </tr>
              ) : paymentNumbers.map((num: any) => {
                // Find stats for this number
                const stat = numberStats.find((s: any) => s.paymentMethodId === num.type && s.reference === num.value);
                const totalAmount = stat ? stat.totalAmount : 0;
                const usageCount = stat ? stat.usageCount : 0;

                return (
                  <tr key={num.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${num.type === 'vodafone' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {num.type === 'vodafone' ? '📱 فودافون كاش' : '💸 انستا باي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">{num.label}</td>
                    <td className="px-6 py-4 font-mono">{num.value}</td>
                    <td className="px-6 py-4 text-center font-black text-emerald-600">{totalAmount.toFixed(2)} ج.م</td>
                    <td className="px-6 py-4 text-center text-slate-500 font-mono">{usageCount}</td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleDeleteNumber(num.id)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-xl text-[10px] font-black transition"
                        title="حذف"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* نموذج إضافة رقم جديد */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
          <h5 className="text-xs font-black text-slate-700">➕ إضافة رقم أو حساب استقبال جديد:</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 mr-1 block text-right">نوع الحساب</label>
              <select
                value={newNumber.type}
                onChange={e => setNewNumber({ ...newNumber, type: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none font-bold text-xs"
              >
                <option value="vodafone">فودافون كاش</option>
                <option value="instapay">انستا باي</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 mr-1 block text-right">اسم الحساب / الوصف</label>
              <input
                type="text"
                placeholder="مثال: رقم الإدارة، محفظة المحل..."
                value={newNumber.label}
                onChange={e => setNewNumber({ ...newNumber, label: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 mr-1 block text-right">الرقم أو معرّف InstaPay</label>
              <input
                type="text"
                placeholder="010xxxxxxx أو name@instapay"
                value={newNumber.value}
                onChange={e => setNewNumber({ ...newNumber, value: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border rounded-xl outline-none font-bold text-xs text-left"
                dir="ltr"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddNumber}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-6 py-2.5 rounded-xl transition active:scale-95 shadow-sm"
          >
            أضف الرقم للسيستم ➕
          </button>
        </div>
      </section>
    </div>
  );
};

export default PaymentMethodsTab;
