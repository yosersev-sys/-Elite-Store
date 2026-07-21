import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseInvoice, PurchaseInvoiceItem, Supplier, Product, User } from '../../types';
import { ApiService } from '../../services/api';

interface PurchaseInvoicesTabProps {
  currentUser: User | null;
  suppliersData?: Supplier[];
  productsData?: Product[];
  onRefreshData?: () => void;
}

type StatusFilter = 'all' | 'confirmed' | 'draft' | 'cancelled';

const PurchaseInvoicesTab: React.FC<PurchaseInvoicesTabProps> = ({
  currentUser,
  suppliersData = [],
  productsData = [],
  onRefreshData
}) => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(suppliersData);
  const [products, setProducts] = useState<Product[]>(productsData);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Invoice Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [walletTypeInput, setWalletTypeInput] = useState<'drawer' | 'main_safe' | 'bank' | 'wallet'>('drawer');
  const [invoiceImageBase64, setInvoiceImageBase64] = useState<string>('');

  // Items for new invoice
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    updateStock: boolean;
  }>>([]);

  // Temp Item Input
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitCost, setItemUnitCost] = useState('0');
  const [itemUpdateStock, setItemUpdateStock] = useState(true);

  // Partial Payment State
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentWalletInput, setPaymentWalletInput] = useState<'drawer' | 'main_safe' | 'bank' | 'wallet'>('drawer');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, supData, prodData] = await Promise.all([
        ApiService.getPurchaseInvoices(),
        suppliersData.length > 0 ? Promise.resolve(suppliersData) : ApiService.getSuppliers(),
        productsData.length > 0 ? Promise.resolve(productsData) : ApiService.getProducts()
      ]);
      setInvoices(invData);
      setSuppliers(supData || []);
      setProducts(prodData || []);
    } catch (err) {
      console.error('Failed loading purchase invoices data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Grand Total of items in new invoice modal
  const computedInvoiceTotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [invoiceItems]);

  const computedRemainingDebt = useMemo(() => {
    const paid = parseFloat(paidAmountInput) || 0;
    return Math.max(0, computedInvoiceTotal - paid);
  }, [computedInvoiceTotal, paidAmountInput]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchSupplier = !supplierFilter || inv.supplierId === supplierFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.supplierName && inv.supplierName.toLowerCase().includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q)) ||
        (inv.items && inv.items.some(i => i.productName.toLowerCase().includes(q)));

      return matchStatus && matchSupplier && matchSearch;
    });
  }, [invoices, statusFilter, supplierFilter, searchQuery]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalAmountSum = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const paidAmountSum = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const remainingDebtSum = invoices.reduce((s, i) => s + (i.remainingAmount || 0), 0);
    return { totalCount, totalAmountSum, paidAmountSum, remainingDebtSum };
  }, [invoices]);

  // Handlers for Items
  const handleAddItem = () => {
    let name = customItemName.trim();
    let pId = selectedProductId;

    if (selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        name = prod.name;
      }
    }

    if (!name) return alert('يرجى اختيار منتج أو كتابة اسم الصنف.');
    const qty = parseFloat(itemQuantity);
    const cost = parseFloat(itemUnitCost);

    if (isNaN(qty) || qty <= 0) return alert('يرجى إدخال كمية صحيحة أكبر من الصفر.');
    if (isNaN(cost) || cost < 0) return alert('يرجى إدخال سعر قطعة صحيح.');

    const totalCost = roundNum(qty * cost);

    setInvoiceItems(prev => [
      ...prev,
      {
        productId: pId || undefined,
        productName: name,
        quantity: qty,
        unitCost: cost,
        totalCost: totalCost,
        updateStock: itemUpdateStock
      }
    ]);

    // Reset Item Input
    setSelectedProductId('');
    setCustomItemName('');
    setItemQuantity('1');
    setItemUnitCost('0');
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const roundNum = (n: number) => Math.round(n * 100) / 100;

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoiceImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New Purchase Invoice
  const handleSaveInvoice = async (status: 'draft' | 'confirmed') => {
    if (!selectedSupplierId) return alert('يرجى اختيار المورد أولاً.');
    if (invoiceItems.length === 0) return alert('يرجى إضافة صنف واحد على الأقل للفاتورة.');

    const paid = parseFloat(paidAmountInput) || 0;
    if (paid > computedInvoiceTotal) {
      return alert('المبلغ المدفوع كاش لا يمكن أن يزيد عن إجمالي الفاتورة.');
    }

    setIsSaving(true);
    try {
      const payload: Partial<PurchaseInvoice> = {
        supplierId: selectedSupplierId,
        invoiceNumber: invoiceNumberInput,
        notes: notesInput,
        status: status,
        totalAmount: computedInvoiceTotal,
        paidAmount: paid,
        walletType: walletTypeInput as any,
        invoiceImage: invoiceImageBase64,
        items: invoiceItems
      };

      const result = await ApiService.addPurchaseInvoice(payload);

      if (result.success) {
        await loadData();
        if (onRefreshData) onRefreshData();
        setIsCreateModalOpen(false);
        resetInvoiceForm();
        alert(status === 'confirmed' ? 'تم اعتماد فاتورة الشراء وتحديث الحسابات والمخزون بنجاح ✅' : 'تم حفظ الفاتورة كمسودة 📝');
      } else {
        alert(result.message || 'فشل حفظ الفاتورة.');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Partial Payment
  const handleSavePayment = async () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغ دفعة صحيح أكثر من الصفر.');
    if (amount > selectedInvoice.remainingAmount) {
      return alert(`المبلغ المدفوع يتجاوز المتبقي من الفاتورة (${selectedInvoice.remainingAmount} ج.م).`);
    }

    setIsSaving(true);
    try {
      const result = await ApiService.addInvoicePayment(
        selectedInvoice.id,
        amount,
        paymentWalletInput,
        paymentNotesInput
      );

      if (result.success) {
        await loadData();
        if (onRefreshData) onRefreshData();
        setIsPaymentModalOpen(false);
        setPaymentAmountInput('');
        setPaymentNotesInput('');
        alert('تم تسجيل الدفعة وتحديث مديونية المورد بنجاح ✅');
      } else {
        alert(result.message || 'فشل تسجيل الدفعة.');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetInvoiceForm = () => {
    setSelectedSupplierId('');
    setInvoiceNumberInput('');
    setNotesInput('');
    setPaidAmountInput('');
    setWalletTypeInput('drawer');
    setInvoiceImageBase64('');
    setInvoiceItems([]);
    setSelectedProductId('');
    setCustomItemName('');
    setItemQuantity('1');
    setItemUnitCost('0');
  };

  return (
    <div className="space-y-8 animate-fadeIn font-Cairo text-right" dir="rtl">
      
      {/* 1. Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الفواتير</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalCount} <small className="text-xs">فاتورة</small></p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold">🧾</div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي مشتريات البضاعة</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalAmountSum.toLocaleString()} <small className="text-xs">ج.م</small></p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">🛒</div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المسدد كاش</p>
            <p className="text-2xl font-black text-emerald-600">{stats.paidAmountSum.toLocaleString()} <small className="text-xs">ج.م</small></p>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-xl font-bold">💵</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">إجمالي المديونية الآجلة</p>
            <p className="text-2xl font-black text-rose-400">{stats.remainingDebtSum.toLocaleString()} <small className="text-xs text-slate-300">ج.م</small></p>
          </div>
          <button
            onClick={() => { resetInvoiceForm(); setIsCreateModalOpen(true); }}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span>＋</span> فاتورة شراء جديدة
          </button>
        </div>
      </section>

      {/* 2. Filter & Search Header */}
      <section className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Filter Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            الكل ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'confirmed' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            معتمدة ({invoices.filter(i => i.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}
          >
            مسودة ({invoices.filter(i => i.status === 'draft').length})
          </button>
        </div>

        {/* Supplier Dropdown Filter & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none cursor-pointer"
          >
            <option value="">جميع الموردين</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو الصنف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs outline-none font-bold pr-10"
            />
            <span className="absolute right-3.5 top-3 text-slate-300">🔍</span>
          </div>
        </div>

      </section>

      {/* 3. Invoices Table */}
      <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-black text-white text-sm">جدول فواتير الشراء المسجلة</h4>
          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
            {filteredInvoices.length} فاتورة
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 font-bold text-xs animate-pulse">جاري تحميل فواتير الشراء...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-black text-sm">لا توجد فواتير شراء مسجلة تطابق البحث.</div>
          ) : (
            <table className="w-full border-collapse text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase font-bold">
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">المورد</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الإجمالي</th>
                  <th className="p-4">المدفوع كاش</th>
                  <th className="p-4">المتبقي الآجل</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-black text-indigo-600">#{inv.invoiceNumber || inv.id}</td>
                    <td className="p-4 font-bold text-slate-800">{inv.supplierName || 'مورد غير معروف'}</td>
                    <td className="p-4 text-slate-500 font-bold">{new Date(inv.createdAt).toLocaleString('ar-EG')}</td>
                    <td className="p-4 font-black text-slate-900">{inv.totalAmount.toLocaleString()} ج.م</td>
                    <td className="p-4 font-bold text-emerald-600">{inv.paidAmount.toLocaleString()} ج.م</td>
                    <td className={`p-4 font-black ${inv.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {inv.remainingAmount > 0 ? `${inv.remainingAmount.toLocaleString()} ج.م` : 'خالص ✅'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-black text-[10px] ${
                        inv.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {inv.status === 'confirmed' ? 'معتمدة ✅' : inv.status === 'draft' ? 'مسودة 📝' : 'ملغاة ❌'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedInvoice(inv); setIsViewModalOpen(true); }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl font-bold text-[11px] transition cursor-pointer"
                        >
                          معاينة 📄
                        </button>
                        {inv.status === 'confirmed' && inv.remainingAmount > 0 && (
                          <button
                            onClick={() => { setSelectedInvoice(inv); setPaymentAmountInput(''); setIsPaymentModalOpen(true); }}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-[11px] transition cursor-pointer"
                          >
                            تسديد دفعة 💳
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 4. NEW PURCHASE INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-6 md:p-10 animate-slideUp overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {isSaving && (
              <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-slate-800 text-sm">جاري حفظ وتوثيق فاتورة الشراء وتحديث المخزون...</p>
              </div>
            )}

            <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">فاتورة شراء جديدة 🧾</h3>

            <div className="space-y-6">
              
              {/* SECTION 1: Supplier & Basic Data */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">1. بيانات الفاتورة والمورد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">المورد (مطلوب)</label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                    >
                      <option value="">اختر المورد...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.companyName || 'فرد'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">رقم الفاتورة الورقية (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: INV-9821"
                      value={invoiceNumberInput}
                      onChange={e => setInvoiceNumberInput(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">رفع صورة الفاتورة الورقية</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-xs font-bold text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer"
                    />
                  </div>
                </div>

                {invoiceImageBase64 && (
                  <div className="relative w-32 h-20 bg-slate-200 rounded-xl overflow-hidden border">
                    <img src={invoiceImageBase64} alt="معاينة الفاتورة" className="w-full h-full object-cover" />
                    <button onClick={() => setInvoiceImageBase64('')} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">✕</button>
                  </div>
                )}
              </div>

              {/* SECTION 2: Item Builder */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">2. أصناف الفاتورة والبضائع</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">اختر منتج من المخزن أو اكتب اسم صنف</label>
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        if (e.target.value) {
                          const p = products.find(prod => prod.id === e.target.value);
                          if (p) setItemUnitCost(String(p.costPrice || p.price || 0));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none mb-2"
                    >
                      <option value="">-- اختيار منتج من القائمة --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (المخزون الحالي: {p.stockQuantity || 0})</option>
                      ))}
                    </select>

                    {!selectedProductId && (
                      <input
                        type="text"
                        placeholder="أو اكتب اسم صنف جديد..."
                        value={customItemName}
                        onChange={e => setCustomItemName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">الكمية المشتراه</label>
                    <input
                      type="number"
                      step="any"
                      value={itemQuantity}
                      onChange={e => setItemQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs text-center outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">سعر القطعة (ج.م)</label>
                    <input
                      type="number"
                      step="any"
                      value={itemUnitCost}
                      onChange={e => setItemUnitCost(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs text-center outline-none"
                    />
                  </div>

                  <div>
                    <button
                      onClick={handleAddItem}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition cursor-pointer"
                    >
                      إضافة صنف ➕
                    </button>
                  </div>
                </div>

                {/* Items List Table */}
                {invoiceItems.length > 0 && (
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-3">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b font-bold text-slate-600">
                          <th className="p-3">اسم الصنف</th>
                          <th className="p-3">الكمية</th>
                          <th className="p-3">سعر الوحدة</th>
                          <th className="p-3">الإجمالي</th>
                          <th className="p-3 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-bold text-slate-800">{item.productName}</td>
                            <td className="p-3 font-black text-slate-900">{item.quantity}</td>
                            <td className="p-3 font-bold text-slate-600">{item.unitCost} ج.م</td>
                            <td className="p-3 font-black text-emerald-600">{item.totalCost} ج.م</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleRemoveItem(idx)} className="text-rose-600 font-bold">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 3: Financial Settlement */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                <h4 className="font-black text-emerald-400 text-xs uppercase tracking-wider">3. التسوية المالية ورصيد الفاتورة</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400">إجمالي الفاتورة</p>
                    <p className="text-2xl font-black text-white">{computedInvoiceTotal.toLocaleString()} ج.م</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">المبلغ المدفوع كاش فور الاستلام</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={paidAmountInput}
                      onChange={e => setPaidAmountInput(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-black text-emerald-400 text-lg outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">محفظة/مصدر السداد الكاش</label>
                    <select
                      value={walletTypeInput}
                      onChange={e => setWalletTypeInput(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="drawer">🏧 درج الوردية الحالية</option>
                      <option value="main_safe">🏛️ الخزينة الرئيسية</option>
                      <option value="bank">🏦 حساب بنكي</option>
                      <option value="wallet">📱 محفظة إلكترونية</option>
                    </select>
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-300">المديونية المتبقية المضافة للمورد:</span>
                  <span className="text-2xl font-black text-rose-400">{computedRemainingDebt.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleSaveInvoice('confirmed')}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  اعتماد الفاتورة وتحديث الحسابات والمخزن ✅
                </button>
                <button
                  onClick={() => handleSaveInvoice('draft')}
                  disabled={isSaving}
                  className="py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm transition cursor-pointer"
                >
                  حفظ كمسودة 📝
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW INVOICE MODAL */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl p-6 md:p-8 animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            
            <div className="border-b pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">تفاصيل فاتورة الشراء #{selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-400 font-bold">المورد: {selectedInvoice.supplierName}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black rounded-full text-xs">
                {selectedInvoice.status}
              </span>
            </div>

            {selectedInvoice.invoiceImagePath && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                <img src={selectedInvoice.invoiceImagePath} alt="صورة الفاتورة" className="w-full max-h-72 object-contain bg-slate-900" />
              </div>
            )}

            {/* Items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div className="space-y-2 mb-6">
                <h4 className="font-black text-slate-700 text-xs">جدول الأصناف:</h4>
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b">
                      <th className="p-3">الصنف</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">سعر القطعة</th>
                      <th className="p-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold">{it.productName}</td>
                        <td className="p-3 font-black">{it.quantity}</td>
                        <td className="p-3">{it.unitCost} ج.م</td>
                        <td className="p-3 font-black text-emerald-600">{it.totalCost} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-6 text-xs font-bold">
              <div className="flex justify-between">
                <span>إجمالي الفاتورة:</span>
                <span className="font-black text-slate-900">{selectedInvoice.totalAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>المدفوع كاش:</span>
                <span className="font-black">{selectedInvoice.paidAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>المتبقي الآجل:</span>
                <span className="font-black">{selectedInvoice.remainingAmount.toLocaleString()} ج.م</span>
              </div>
            </div>

            <button onClick={() => setIsViewModalOpen(false)} className="w-full py-3 bg-slate-900 text-white font-black rounded-2xl text-xs">إلغاء / إغلاق</button>
          </div>
        </div>
      )}

      {/* 6. PARTIAL PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-slideUp overflow-hidden">
            
            <h3 className="text-lg font-black text-slate-800 mb-4 text-center">تسديد دفعة للفاتورة #{selectedInvoice.invoiceNumber}</h3>

            <div className="space-y-4">
              <div className="bg-rose-50 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-rose-400">المتبقي الآجل</p>
                <p className="text-xl font-black text-rose-600">{selectedInvoice.remainingAmount.toLocaleString()} ج.م</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">مبلغ الدفعة المدفوعة (ج.م)</label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  placeholder="أدخل المبلغ..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-lg outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">مصدر سداد المبلغ</label>
                <select
                  value={paymentWalletInput}
                  onChange={e => setPaymentWalletInput(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none"
                >
                  <option value="drawer">🏧 درج الوردية الحالية</option>
                  <option value="main_safe">🏛️ الخزينة الرئيسية</option>
                  <option value="bank">🏦 حساب بنكي</option>
                  <option value="wallet">📱 محفظة إلكترونية</option>
                </select>
              </div>

              <button
                onClick={handleSavePayment}
                disabled={isSaving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-lg"
              >
                تأكيد تسديد الدفعة ✅
              </button>

              <button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseInvoicesTab;
