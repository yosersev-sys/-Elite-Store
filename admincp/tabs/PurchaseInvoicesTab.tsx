import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PurchaseInvoice, PurchaseInvoiceItem, Supplier, Product, User, Category } from '../../types';
import { ApiService } from '../../services/api';
import AdminProductForm from '../AdminProductForm';

interface PurchaseInvoicesTabProps {
  currentUser: User | null;
  suppliersData?: Supplier[];
  productsData?: Product[];
  categoriesData?: Category[];
  onRefreshData?: () => void;
}

type StatusFilter = 'all' | 'confirmed' | 'draft' | 'cancelled';

const PurchaseInvoicesTab: React.FC<PurchaseInvoicesTabProps> = ({
  currentUser,
  suppliersData = [],
  productsData = [],
  categoriesData = [],
  onRefreshData
}) => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(suppliersData);
  const [products, setProducts] = useState<Product[]>(productsData);
  const [categories, setCategories] = useState<Category[]>(categoriesData);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Invoice Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [discountAmountInput, setDiscountAmountInput] = useState('0');
  const [freightAmountInput, setFreightAmountInput] = useState('0');
  const [walletTypeInput, setWalletTypeInput] = useState<'drawer' | 'main_safe' | 'bank' | 'wallet'>('drawer');
  const [invoiceImageBase64, setInvoiceImageBase64] = useState<string>('');

  // Items for new invoice
  const [invoiceItems, setInvoiceItems] = useState<PurchaseInvoiceItem[]>([]);

  // Item Builder Inputs
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUnitObj, setSelectedUnitObj] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitCost, setItemUnitCost] = useState('0');
  const [itemNewSalePrice, setItemNewSalePrice] = useState('');
  const [itemUpdateStock, setItemUpdateStock] = useState(true);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Refs for Keyboard Navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);

  // Quick Add New Product Form state
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    categoryId: '',
    wholesalePrice: '',
    price: '',
    stockQuantity: '1',
    unit: 'piece',
    barcode: ''
  });
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);

  // Partial Payment State
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentWalletInput, setPaymentWalletInput] = useState<'drawer' | 'main_safe' | 'bank' | 'wallet'>('drawer');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');

  // Load Initial Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, supData, prodData, catData] = await Promise.all([
        ApiService.getPurchaseInvoices(),
        suppliersData.length > 0 ? Promise.resolve(suppliersData) : ApiService.getSuppliers(),
        productsData.length > 0 ? Promise.resolve(productsData) : ApiService.getProducts(),
        categoriesData.length > 0 ? Promise.resolve(categoriesData) : ApiService.getCategories()
      ]);
      setInvoices(invData);
      setSuppliers(supData || []);
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Failed loading purchase invoices data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard Shortcuts (F2 to focus search, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (isCreateModalOpen) {
          searchInputRef.current?.focus();
        } else {
          setIsCreateModalOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 150);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen]);

  // Arabic Normalization Helper
  const normalizeArabic = (text: any): string => {
    if (text === null || text === undefined) return '';
    return String(text)
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[أإآآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .trim();
  };

  // Product Search Suggestions with Scoring
  const searchSuggestions = useMemo(() => {
    const rawQ = itemSearchQuery.trim();
    if (!rawQ) return [];
    const normQ = normalizeArabic(rawQ);
    if (!normQ) return [];

    const suggestions: Array<{ product: Product; score: number }> = [];

    products.forEach(p => {
      const normName = normalizeArabic(p.name);
      const normBarcode = p.barcode ? normalizeArabic(String(p.barcode)) : '';

      const matchesBarcode = normBarcode && normBarcode.includes(normQ);
      const matchesName = normName && normName.includes(normQ);

      if (!matchesBarcode && !matchesName) {
        return;
      }

      let score = 0;
      if (normBarcode) {
        if (normBarcode === normQ) score += 10000;
        else if (normBarcode.startsWith(normQ)) score += 5000;
        else if (normBarcode.includes(normQ)) score += 2000;
      }

      if (normName) {
        if (normName === normQ) score += 3000;
        else if (normName.startsWith(normQ)) score += 2000;
        else {
          const words = normName.split(/\s+/);
          if (words.some(w => w.startsWith(normQ))) score += 1000;
          else if (normName.includes(normQ)) score += 500;
        }
      }

      if (score > 0) {
        suggestions.push({ product: p, score });
      }
    });

    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, 8).map(s => s.product);
  }, [products, itemSearchQuery]);

  // Deduplicated Product Units Helper
  const getProductAvailableUnits = (prod: Product | null) => {
    if (!prod) return [];
    const baseUnitName = prod.unit === 'piece' ? 'قطعة' : (prod.unit || 'قطعة');
    const baseUnit = {
      id: `unit_${prod.id}_base`,
      unitName: baseUnitName,
      conversionFactor: 1.00,
      salePrice: prod.price,
      purchasePrice: prod.wholesalePrice || 0,
      barcode: prod.barcode || '',
      isDefault: 1,
      isActive: 1
    };

    const activeUnits = (prod.units || []).filter(u => Number(u.isActive) !== 0);
    const combined: any[] = [baseUnit];
    activeUnits.forEach(u => {
      if (!combined.some(c => c.unitName.trim().toLowerCase() === u.unitName.trim().toLowerCase())) {
        combined.push(u);
      }
    });
    return combined;
  };

  // Selecting a Product from Search
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setItemSearchQuery(prod.name);

    const allUnits = getProductAvailableUnits(prod);
    
    setSelectedUnitObj(allUnits[0]);
    setItemUnitCost(String(allUnits[0].purchasePrice || prod.wholesalePrice || 0));
    setItemNewSalePrice(String(allUnits[0].salePrice || prod.price || 0));
    setItemQuantity('1');

    // Auto-focus quantity input for fast mouse-free flow
    setTimeout(() => quantityInputRef.current?.focus(), 100);
  };

  // Unit Dropdown Change
  const handleUnitChange = (unitName: string) => {
    if (!selectedProduct) return;
    const allUnits = getProductAvailableUnits(selectedProduct);

    const found = allUnits.find(u => u.unitName === unitName) || allUnits[0];
    setSelectedUnitObj(found);
    setItemUnitCost(String(found.purchasePrice || selectedProduct.wholesalePrice || 0));
    setItemNewSalePrice(String(found.salePrice || selectedProduct.price || 0));
  };

  // Add Item to Invoice Items (with Duplicate Merging)
  const handleAddItemToInvoice = () => {
    if (!selectedProduct) return alert('يرجى اختيار صنف أولاً.');
    const qty = parseFloat(itemQuantity);
    const cost = parseFloat(itemUnitCost);
    const newSale = parseFloat(itemNewSalePrice) || undefined;
    const factor = selectedUnitObj?.conversionFactor || 1.00;
    const uName = selectedUnitObj?.unitName || (selectedProduct.unit === 'piece' ? 'قطعة' : selectedProduct.unit || 'قطعة');

    if (isNaN(qty) || qty <= 0) return alert('يرجى إدخال كمية صحيحة أكبر من الصفر.');
    if (isNaN(cost) || cost < 0) return alert('يرجى إدخال سعر شراء صحيح.');

    const itemTotalCost = Math.round(qty * cost * 100) / 100;

    setInvoiceItems(prev => {
      // Check for duplicate product & unit
      const existingIdx = prev.findIndex(it => it.productId === selectedProduct.id && (it.unitName === uName || (!it.unitName && uName === 'قطعة')));
      if (existingIdx >= 0) {
        // Merge quantity into existing line
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + qty;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          unitCost: cost,
          newSalePrice: newSale,
          totalCost: Math.round(newQty * cost * 100) / 100
        };
        return updated;
      } else {
        // Add new line
        return [
          ...prev,
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            unitName: uName,
            barcode: selectedProduct.barcode || '',
            quantity: qty,
            unitCost: cost,
            totalCost: itemTotalCost,
            conversionFactor: factor,
            newSalePrice: newSale,
            lastCostPrice: selectedProduct.wholesalePrice || 0,
            updateStock: itemUpdateStock
          }
        ];
      }
    });

    // Reset Item Builder Inputs & Focus Back on Search Input
    setSelectedProduct(null);
    setSelectedUnitObj(null);
    setItemSearchQuery('');
    setItemQuantity('1');
    setItemUnitCost('0');
    setItemNewSalePrice('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // Inline Row Edits
  const handleUpdateItemRow = (index: number, field: 'quantity' | 'unitCost', value: string) => {
    const val = parseFloat(value) || 0;
    setInvoiceItems(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };
      if (field === 'quantity') row.quantity = Math.max(0.01, val);
      if (field === 'unitCost') row.unitCost = Math.max(0, val);
      row.totalCost = Math.round(row.quantity * row.unitCost * 100) / 100;
      updated[index] = row;
      return updated;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  // Invoice Footer Metrics Calculation
  const invoiceMetrics = useMemo(() => {
    const itemsRawTotal = invoiceItems.reduce((sum, it) => sum + (it.totalCost || 0), 0);
    const discount = parseFloat(discountAmountInput) || 0;
    const freight = parseFloat(freightAmountInput) || 0;
    const netTotal = Math.max(0, itemsRawTotal - discount + freight);

    const totalUniqueLines = invoiceItems.length;
    const totalPurchaseUnits = invoiceItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalBasePieces = invoiceItems.reduce((sum, it) => sum + ((it.quantity || 0) * (it.conversionFactor || 1)), 0);

    return {
      itemsRawTotal,
      discount,
      freight,
      netTotal: Math.round(netTotal * 100) / 100,
      totalUniqueLines,
      totalPurchaseUnits,
      totalBasePieces: Math.round(totalBasePieces * 100) / 100
    };
  }, [invoiceItems, discountAmountInput, freightAmountInput]);

  const computedRemainingDebt = useMemo(() => {
    const paid = parseFloat(paidAmountInput) || 0;
    return Math.max(0, invoiceMetrics.netTotal - paid);
  }, [invoiceMetrics.netTotal, paidAmountInput]);

  // Overall Stats Cards
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalAmountSum = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const paidAmountSum = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const remainingDebtSum = invoices.reduce((s, i) => s + (i.remainingAmount || 0), 0);
    return { totalCount, totalAmountSum, paidAmountSum, remainingDebtSum };
  }, [invoices]);

  // Filtered Invoices Table
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

  // Handle Full Product Form Submit from Purchase Invoice Page
  const handleProductFormSubmit = async (productData: Product) => {
    setIsSubmittingQuickAdd(true);
    try {
      const result = await ApiService.addProduct(productData);
      if (result.success || result.status === 'barcode_exists') {
        const addedProd: Product = (result.product || productData) as any;
        setProducts(prev => {
          const exists = prev.some(p => p.id === addedProd.id);
          return exists ? prev.map(p => p.id === addedProd.id ? addedProd : p) : [...prev, addedProd];
        });
        handleSelectProduct(addedProd);
        setIsQuickAddModalOpen(false);
        if (onRefreshData) onRefreshData();
        alert('تم إضافة المنتج الجديد للسيستم وتمريره للفاتورة بنجاح ✅');
      } else {
        alert(result.message || 'فشل إضافة المنتج.');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  // Submit New Purchase Invoice
  const handleSaveInvoice = async (status: 'draft' | 'confirmed') => {
    if (!selectedSupplierId) return alert('يرجى اختيار المورد أولاً.');
    if (invoiceItems.length === 0) return alert('يرجى إضافة صنف واحد على الأقل للفاتورة.');

    // Strict Validation
    for (const item of invoiceItems) {
      if (item.quantity <= 0) return alert(`الكمية غير صالحة للصنف: ${item.productName}`);
      if (item.unitCost <= 0) return alert(`سعر الشراء غير صالح للصنف: ${item.productName}`);
    }

    const paid = parseFloat(paidAmountInput) || 0;
    if (paid > invoiceMetrics.netTotal) {
      return alert('المبلغ المدفوع كاش لا يمكن أن يزيد عن صافي الفاتورة النهائي.');
    }

    setIsSaving(true);
    try {
      const payload: Partial<PurchaseInvoice> = {
        id: editingInvoiceId || undefined,
        supplierId: selectedSupplierId,
        invoiceNumber: invoiceNumberInput,
        notes: notesInput,
        status: status,
        totalAmount: invoiceMetrics.netTotal,
        paidAmount: paid,
        discountAmount: invoiceMetrics.discount,
        freightAmount: invoiceMetrics.freight,
        walletType: walletTypeInput as any,
        invoiceImage: invoiceImageBase64,
        items: invoiceItems
      };

      const result = editingInvoiceId
        ? await ApiService.updatePurchaseInvoice(payload)
        : await ApiService.addPurchaseInvoice(payload);

      if (result.success) {
        await loadData();
        if (onRefreshData) onRefreshData();
        setIsCreateModalOpen(false);
        resetInvoiceForm();
        alert(editingInvoiceId ? 'تم تعديل وتحديث فاتورة الشراء والحسابات بنجاح ✅' : (status === 'confirmed' ? 'تم اعتماد فاتورة الشراء وتحديث الحسابات والمخزون بنجاح ✅' : 'تم حفظ الفاتورة كمسودة 📝'));
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
    setEditingInvoiceId(null);
    setSelectedSupplierId('');
    setInvoiceNumberInput('');
    setNotesInput('');
    setPaidAmountInput('');
    setDiscountAmountInput('0');
    setFreightAmountInput('0');
    setWalletTypeInput('drawer');
    setInvoiceImageBase64('');
    setInvoiceItems([]);
    setSelectedProduct(null);
    setSelectedUnitObj(null);
    setItemSearchQuery('');
    setItemQuantity('1');
    setItemUnitCost('0');
    setItemNewSalePrice('');
  };

  const handleOpenEditInvoice = (inv: PurchaseInvoice) => {
    setEditingInvoiceId(inv.id);
    setSelectedSupplierId(inv.supplierId);
    setInvoiceNumberInput(inv.invoiceNumber || '');
    setNotesInput(inv.notes || '');
    setPaidAmountInput(inv.paidAmount ? String(inv.paidAmount) : '');
    setDiscountAmountInput(inv.discountAmount ? String(inv.discountAmount) : '0');
    setFreightAmountInput(inv.freightAmount ? String(inv.freightAmount) : '0');
    setWalletTypeInput(inv.walletType || 'drawer');
    setInvoiceImageBase64(inv.invoiceImagePath || '');
    setInvoiceItems((inv.items || []).map(it => ({
      productId: it.productId || '',
      productName: it.productName,
      unitName: it.unitName || 'قطعة',
      barcode: it.barcode || '',
      quantity: it.quantity,
      unitCost: it.unitCost,
      totalCost: it.totalCost,
      conversionFactor: it.conversionFactor || 1,
      newSalePrice: it.newSalePrice || undefined,
      lastCostPrice: it.lastCostPrice || undefined,
      updateStock: it.updateStock !== undefined ? Boolean(it.updateStock) : true
    })));
    setIsCreateModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.');
      const reader = new FileReader();
      reader.onloadend = () => setInvoiceImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
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
            onClick={() => { resetInvoiceForm(); setIsCreateModalOpen(true); setTimeout(() => searchInputRef.current?.focus(), 200); }}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span>＋</span> فاتورة شراء جديدة (F2)
          </button>
        </div>
      </section>

      {/* 2. Filter & Search Header */}
      <section className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button onClick={() => setStatusFilter('all')} className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>الكل ({invoices.length})</button>
          <button onClick={() => setStatusFilter('confirmed')} className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'confirmed' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>معتمدة ({invoices.filter(i => i.status === 'confirmed').length})</button>
          <button onClick={() => setStatusFilter('draft')} className={`px-5 py-2 rounded-xl font-black text-xs transition ${statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}>مسودة ({invoices.filter(i => i.status === 'draft').length})</button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none cursor-pointer">
            <option value="">جميع الموردين</option>
            {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="بحث برقم الفاتورة أو الصنف..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs outline-none font-bold pr-10" />
            <span className="absolute right-3.5 top-3 text-slate-300">🔍</span>
          </div>
        </div>
      </section>

      {/* 3. Invoices Table */}
      <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-black text-white text-sm">جدول فواتير الشراء المسجلة</h4>
          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">{filteredInvoices.length} فاتورة</span>
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
                        <button onClick={() => { setSelectedInvoice(inv); setIsViewModalOpen(true); }} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl font-bold text-[11px] transition cursor-pointer">معاينة 📄</button>
                        <button onClick={() => handleOpenEditInvoice(inv)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold text-[11px] transition cursor-pointer">تعديل ✏️</button>
                        {inv.status === 'confirmed' && inv.remainingAmount > 0 && (
                          <button onClick={() => { setSelectedInvoice(inv); setPaymentAmountInput(''); setIsPaymentModalOpen(true); }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-[11px] transition cursor-pointer">تسديد دفعة 💳</button>
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

      {/* 4. ERP-GRADE NEW PURCHASE INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => !isSaving && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl p-6 md:p-8 animate-slideUp overflow-hidden max-h-[95vh] flex flex-col justify-between">
            
            {isSaving && (
              <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-slate-800 text-sm">جاري الاعتماد وتوثيق الفاتورة وتحديث المخزن والأسعار...</p>
              </div>
            )}

            {/* Header */}
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {editingInvoiceId ? `تعديل فاتورة الشراء #${invoiceNumberInput || editingInvoiceId} ✏️` : 'فاتورة شراء جديدة 🧾'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">ادخل الأصناف بسرعة باستخدام الباركود أو لوحة المفاتيح (F2 للبحث)</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-bold flex items-center justify-center">✕</button>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-6 my-4 pr-1">
              
              {/* SECTION 1: Supplier & Basic Data */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">المورد المستلم منه (مطلوب)</label>
                  <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                    <option value="">اختر المورد...</option>
                    {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.companyName || 'فرد'})</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">رقم الفاتورة الورقية (اختياري)</label>
                  <input type="text" placeholder="مثال: INV-9821" value={invoiceNumberInput} onChange={e => setInvoiceNumberInput(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">صورة الفاتورة الورقية (اختياري)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs font-bold text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer" />
                </div>
              </div>

              {/* SECTION 2: POS-LIKE SMART ITEM BUILDER */}
              <div className="bg-slate-900 text-white p-5 rounded-[2rem] space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-emerald-400 text-xs uppercase tracking-wider">2. أصناف الفاتورة والبضائع (إدخال الكاشير الذكي)</h4>
                  <button onClick={() => setIsQuickAddModalOpen(true)} className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-[10px] rounded-xl transition cursor-pointer">➕ إضافة منتج جديد كلياً للسيستم</button>
                </div>

                {/* Smart Search Bar & Suggestions */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ابحث بالاسم أو امسح الباركود مباشرة (F2)</label>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="امسح الباركود بـ القارئ أو اكتب اسم الصنف هنا..."
                    value={itemSearchQuery}
                    onChange={e => {
                      setItemSearchQuery(e.target.value);
                      const exact = products.find(p => p.barcode && String(p.barcode) === e.target.value.trim());
                      if (exact) handleSelectProduct(exact);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && searchSuggestions.length > 0) {
                        e.preventDefault();
                        handleSelectProduct(searchSuggestions[0]);
                      }
                    }}
                    className="w-full px-5 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl font-black text-sm text-white outline-none focus:border-emerald-400 transition"
                  />

                  {/* Rich Product Search Dropdown */}
                  {itemSearchQuery.trim() && searchSuggestions.length > 0 && !selectedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {searchSuggestions.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-3 hover:bg-emerald-50 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img src={p.images?.[0] || '/assets/images/placeholder.png'} className="w-10 h-10 object-cover rounded-xl border border-slate-100" />
                            <div>
                              <p className="font-black text-xs text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold">الباركود: {p.barcode || 'بدون'} | رصيد المخزون: <span className="text-emerald-600 font-black">{p.stockQuantity || 0} قطعة</span></p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-emerald-600">آخر سعر شراء: {p.wholesalePrice || p.price || 0} ج.م</p>
                            <p className="text-[10px] text-slate-400 font-bold">سعر البيع الحالي: {p.price} ج.م</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Product Controls Grid */}
                {selectedProduct && (
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 grid grid-cols-1 md:grid-cols-6 gap-3 items-end animate-fadeIn">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-emerald-400 block mb-1">الصنف المختار</label>
                      <p className="font-black text-xs text-white truncate">{selectedProduct.name}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">وحدة الشراء</label>
                      <select
                        value={selectedUnitObj?.unitName || ''}
                        onChange={e => handleUnitChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-xs text-white outline-none cursor-pointer"
                      >
                        {getProductAvailableUnits(selectedProduct).map((u, i) => (
                          <option key={i} value={u.unitName}>{u.unitName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">الكمية المشتراه</label>
                      <input
                        ref={quantityInputRef}
                        type="number"
                        step="any"
                        value={itemQuantity}
                        onChange={e => setItemQuantity(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && costInputRef.current?.focus()}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-black text-xs text-center text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">سعر الشراء للوحدة (ج.م)</label>
                      <input
                        ref={costInputRef}
                        type="number"
                        step="any"
                        value={itemUnitCost}
                        onChange={e => setItemUnitCost(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddItemToInvoice()}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-black text-xs text-center text-emerald-400 outline-none"
                      />
                    </div>

                    <div>
                      <button
                        onClick={handleAddItemToInvoice}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-xs transition cursor-pointer shadow-lg"
                      >
                        إضافة للفاتورة ➕ (Enter)
                      </button>
                    </div>
                  </div>
                )}

                {/* Added Items Table with Inline Row Editing */}
                {invoiceItems.length > 0 && (
                  <div className="bg-white text-slate-900 rounded-2xl overflow-hidden border border-slate-200 mt-2">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-600 border-b">
                          <th className="p-3">اسم الصنف</th>
                          <th className="p-3">الوحدة</th>
                          <th className="p-3 text-center">الكمية M-Editable</th>
                          <th className="p-3 text-center">سعر الوحدة (ج.م)</th>
                          <th className="p-3">إجمالي السطر</th>
                          <th className="p-3 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-3 font-black text-slate-800">{item.productName}</td>
                            <td className="p-3 font-bold text-slate-500">{item.unitName || 'قطعة'}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="any"
                                value={item.quantity}
                                onChange={e => handleUpdateItemRow(idx, 'quantity', e.target.value)}
                                className="w-20 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-xs outline-none"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="any"
                                value={item.unitCost}
                                onChange={e => handleUpdateItemRow(idx, 'unitCost', e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-center font-black text-xs text-emerald-600 outline-none"
                              />
                            </td>
                            <td className="p-3 font-black text-emerald-600">{item.totalCost.toLocaleString()} ج.م</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleRemoveItemRow(idx)} className="text-rose-600 font-black hover:bg-rose-50 rounded-full w-6 h-6 inline-flex items-center justify-center">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* LIVE FOOTER METRICS SUMMARY BAR */}
                    <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4 font-black text-xs">
                      <div className="flex items-center gap-6">
                        <span>الأصناف الفريدة: <strong className="text-emerald-400">{invoiceMetrics.totalUniqueLines} صنف</strong></span>
                        <span>إجمالي وحدات الشراء: <strong className="text-emerald-400">{invoiceMetrics.totalPurchaseUnits} عبوة</strong></span>
                        <span>إجمالي القطع المضافة للمخزن: <strong className="text-amber-400">{invoiceMetrics.totalBasePieces} قطعة</strong></span>
                      </div>
                      <div className="text-sm">
                        مجموع أصناف الفاتورة: <strong className="text-emerald-400 text-base">{invoiceMetrics.itemsRawTotal.toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Discounts, Freight & Financial Settlement */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                <h4 className="font-black text-emerald-400 text-xs uppercase tracking-wider">3. الخصومات، مصاريف النقل، والتسوية المالية</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">خصم المورد على الفاتورة (ج.م)</label>
                    <input
                      type="number"
                      step="any"
                      value={discountAmountInput}
                      onChange={e => setDiscountAmountInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-black text-rose-400 text-center outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">مصاريف الشحن والنقل والفرغ (ج.م)</label>
                    <input
                      type="number"
                      step="any"
                      value={freightAmountInput}
                      onChange={e => setFreightAmountInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-black text-amber-400 text-center outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">المبلغ المدفوع كاش فور الاستلام</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={paidAmountInput}
                      onChange={e => setPaidAmountInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-black text-emerald-400 text-lg outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">محفظة/مصدر السداد الكاش</label>
                    <select
                      value={walletTypeInput}
                      onChange={e => setWalletTypeInput(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="drawer">🏧 درج الوردية الحالية</option>
                      <option value="main_safe">🏛️ الخزينة الرئيسية</option>
                      <option value="bank">🏦 حساب بنكي</option>
                      <option value="wallet">📱 محفظة إلكترونية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">الصافي النهائي للفاتورة:</span>
                    <span className="text-2xl font-black text-white">{invoiceMetrics.netTotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-300">المديونية المتبقية المضافة للمورد:</span>
                    <span className="text-2xl font-black text-rose-400">{computedRemainingDebt.toLocaleString()} ج.م</span>
                  </div>
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

      {/* 5. ADD NEW PRODUCT MODAL (Full Original Product Form) */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-slate-100 w-full max-w-5xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl p-3 sm:p-6 md:p-8 animate-slideUp max-h-[92vh] overflow-y-auto no-scrollbar my-auto">
            <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">➕</div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800">إضافة منتج جديد للسيستم</h3>
                  <p className="text-[10px] text-slate-400 font-bold">سيتم حفظ المنتج بالمخزن وإضافته فوراً لفاتورة الشراء الحالية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center font-black transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <AdminProductForm
              product={null}
              categories={categories}
              suppliers={suppliers}
              onCancel={() => setIsQuickAddModalOpen(false)}
              onRefreshData={onRefreshData}
              onSubmit={handleProductFormSubmit}
            />
          </div>
        </div>
      )}

      {/* 6. VIEW INVOICE MODAL */}
      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl p-6 md:p-8 animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="border-b pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">تفاصيل فاتورة الشراء #{selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-400 font-bold">المورد: {selectedInvoice.supplierName}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black rounded-full text-xs">{selectedInvoice.status}</span>
            </div>

            {selectedInvoice.invoiceImagePath && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                <img src={selectedInvoice.invoiceImagePath} alt="صورة الفاتورة" className="w-full max-h-72 object-contain bg-slate-900" />
              </div>
            )}

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div className="space-y-2 mb-6">
                <h4 className="font-black text-slate-700 text-xs">جدول الأصناف:</h4>
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b">
                      <th className="p-3">الصنف</th>
                      <th className="p-3">الكمية والوحدة</th>
                      <th className="p-3">سعر الوحدة</th>
                      <th className="p-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold">{it.productName}</td>
                        <td className="p-3 font-black">{it.quantity} {it.unitName || 'قطعة'}</td>
                        <td className="p-3">{it.unitCost} ج.م</td>
                        <td className="p-3 font-black text-emerald-600">{it.totalCost} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-6 text-xs font-bold">
              <div className="flex justify-between"><span>إجمالي الفاتورة:</span><span className="font-black text-slate-900">{selectedInvoice.totalAmount.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between text-emerald-600"><span>المدفوع كاش:</span><span className="font-black">{selectedInvoice.paidAmount.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between text-rose-600"><span>المتبقي الآجل:</span><span className="font-black">{selectedInvoice.remainingAmount.toLocaleString()} ج.م</span></div>
            </div>

            <button onClick={() => setIsViewModalOpen(false)} className="w-full py-3 bg-slate-900 text-white font-black rounded-2xl text-xs">إغلاق</button>
          </div>
        </div>
      )}

      {/* 7. PARTIAL PAYMENT MODAL */}
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
                <input type="number" step="any" value={paymentAmountInput} onChange={e => setPaymentAmountInput(e.target.value)} placeholder="أدخل المبلغ..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-lg outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">مصدر سداد المبلغ</label>
                <select value={paymentWalletInput} onChange={e => setPaymentWalletInput(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none">
                  <option value="drawer">🏧 درج الوردية الحالية</option>
                  <option value="main_safe">🏛️ الخزينة الرئيسية</option>
                  <option value="bank">🏦 حساب بنكي</option>
                  <option value="wallet">📱 محفظة إلكترونية</option>
                </select>
              </div>

              <button onClick={handleSavePayment} disabled={isSaving} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-lg">تأكيد تسديد الدفعة ✅</button>
              <button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseInvoicesTab;
