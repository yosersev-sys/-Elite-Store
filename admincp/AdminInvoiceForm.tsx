
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem, User, Category } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { ApiService } from '../services/api';

interface AdminInvoiceFormProps {
  products: Product[];
  users: User[];
  orders: Order[];
  categories?: Category[];
  currentUser?: User | null;
  globalDeliveryFee: number;
  onSubmit: (order: Order) => Promise<void> | void;
  onCancel: () => void;
  onRefreshData?: () => void;
  initialCustomerName?: string;
  initialPhone?: string;
  order?: Order | null;
}

const AdminInvoiceForm: React.FC<AdminInvoiceFormProps> = ({ 
  products, users = [], orders = [], categories = [], currentUser = null, globalDeliveryFee, onSubmit, onCancel, onRefreshData, initialCustomerName = 'عميل نقدي', initialPhone = '', order = null 
}) => {
  const [invoiceItems, setInvoiceItems] = useState<CartItem[]>([]);
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: initialCustomerName,
    phone: initialPhone,
    city: 'فاقوس',
    address: '',
    paymentMethod: 'نقدي (تم الدفع)',
    status: 'completed'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);

  // New discount states
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [editReason, setEditReason] = useState<string>('');

  const [invoiceTimeline, setInvoiceTimeline] = useState<{ id: string; time: number; text: string; type: 'info' | 'warn' | 'success' | 'danger' }[]>([
    { id: 'init', time: Date.now(), text: 'بدء إنشاء فاتورة جديدة', type: 'info' }
  ]);

  const addTimelineEvent = (text: string, type: 'info' | 'warn' | 'success' | 'danger' = 'info') => {
    setInvoiceTimeline(prev => {
      const list = [...prev, { id: Math.random().toString(), time: Date.now(), text, type }];
      if (list.length > 25) return list.slice(list.length - 25);
      return list;
    });
  };

  // Payment methods and split payments states
  const [dbPaymentMethods, setDbPaymentMethods] = useState<any[]>([]);
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [isFullDebt, setIsFullDebt] = useState<boolean>(false);
  const [selectedSingleMethod, setSelectedSingleMethod] = useState<string>('cash');
  const [singleReference, setSingleReference] = useState<string>('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentReferences, setPaymentReferences] = useState<Record<string, string>>({});
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default due date is 7 days from now
    return d.toISOString().split('T')[0];
  });

  // Out of stock & barcode quick add states
  const [storeSettings, setStoreSettings] = useState({ out_of_stock_policy: 'prevent', negative_stock_limit: '0' });
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    categoryId: '',
    wholesalePrice: '',
    price: '',
    stockQuantity: '0',
    unit: 'piece'
  });
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [insufficientStockProduct, setInsufficientStockProduct] = useState<{ product: Product; requestedQty: number } | null>(null);

  useEffect(() => {
    ApiService.getStoreSettings()
      .then(s => {
        if (s) {
          setStoreSettings(prev => ({ ...prev, ...s }));
        }
      })
      .catch(err => console.error("Failed to load settings in AdminInvoiceForm", err));
  }, []);

  useEffect(() => {
    ApiService.getPaymentMethods()
      .then(methods => {
        if (methods && methods.length > 0) {
          setDbPaymentMethods(methods.filter(m => m.isActive));
        } else {
          setDbPaymentMethods([
            { id: 'cash', name: 'نقدي', type: 'cash', icon: '💰', isSystem: 1, isActive: 1, sortOrder: 0, createdAt: 0 },
            { id: 'vodafone', name: 'فودافون كاش', type: 'digital', icon: '📱', isSystem: 1, isActive: 1, sortOrder: 1, createdAt: 0 },
            { id: 'instapay', name: 'انستا باي', type: 'digital', icon: '💸', isSystem: 1, isActive: 1, sortOrder: 2, createdAt: 0 },
            { id: 'visa', name: 'فيزا / بطاقة بنكية', type: 'digital', icon: '💳', isSystem: 1, isActive: 1, sortOrder: 3, createdAt: 0 }
          ]);
        }
      })
      .catch(err => {
        console.error(err);
        setDbPaymentMethods([
          { id: 'cash', name: 'نقدي', type: 'cash', icon: '💰', isSystem: 1, isActive: 1, sortOrder: 0, createdAt: 0 },
          { id: 'vodafone', name: 'فودافون كاش', type: 'digital', icon: '📱', isSystem: 1, isActive: 1, sortOrder: 1, createdAt: 0 },
          { id: 'instapay', name: 'انستا باي', type: 'digital', icon: '💸', isSystem: 1, isActive: 1, sortOrder: 2, createdAt: 0 },
          { id: 'visa', name: 'فيزا / بطاقة بنكية', type: 'digital', icon: '💳', isSystem: 1, isActive: 1, sortOrder: 3, createdAt: 0 }
        ]);
      });
  }, []);

  const normalizePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 11 && cleaned.startsWith('20')) {
      return cleaned.slice(2);
    }
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      return '0' + cleaned;
    }
    return cleaned;
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return new Date(timestamp).toLocaleDateString('ar-EG');
  };

  const getUserStats = (userPhone: string) => {
    const normPhone = normalizePhone(userPhone);
    const userOrders = orders.filter(o => normalizePhone(o.phone) === normPhone && o.status === 'completed');
    const count = userOrders.length;
    const lastOrder = count > 0 ? Math.max(...userOrders.map(o => o.createdAt)) : null;
    return { count, lastOrder };
  };

  const matchedUsers = useMemo(() => {
    const q = customerInfo.phone.trim();
    if (!q) return [];
    const normQ = normalizePhone(q);
    if (normQ.length < 6) return [];
    
    const filtered = users.filter(u => {
      const normU = normalizePhone(u.phone);
      return normU.includes(normQ) || (u.name && u.name.toLowerCase().includes(q.toLowerCase()));
    });

    return filtered.sort((a, b) => {
      const normA = normalizePhone(a.phone);
      const normB = normalizePhone(b.phone);
      const aStarts = normA.startsWith(normQ) ? 1 : 0;
      const bStarts = normB.startsWith(normQ) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      return a.name.localeCompare(b.name, 'ar');
    }).slice(0, 5);
  }, [users, customerInfo.phone]);

  const duplicateWarning = useMemo(() => {
    const q = customerInfo.phone.trim();
    if (!q) return false;
    const normQ = normalizePhone(q);
    const matched = users.filter(u => normalizePhone(u.phone) === normQ);
    return matched.length > 1;
  }, [users, customerInfo.phone]);

  // تحميل بيانات الطلب في حال وجوده (وضع التعديل)
  useEffect(() => {
    if (order) {
      setInvoiceItems(order.items || []);
      const isDeliv = order.address && order.address !== 'استلام فرع (كاشير)';
      setIsDeliveryEnabled(!!isDeliv);
      setCustomerInfo({
        name: order.customerName || 'عميل',
        phone: order.phone || '',
        city: order.city || 'فاقوس',
        address: isDeliv ? order.address : '',
        paymentMethod: order.paymentMethod || 'نقدي (تم الدفع)',
        status: order.status || 'completed'
      });
      setInvoiceDiscountValue(order.discountValue || 0);
      setInvoiceDiscountType(order.discountType || 'fixed');

      // Load payments details from order
      if (order.payments && order.payments.length > 0) {
        if (order.payments.length === 1) {
          setIsSplitPayment(false);
          setIsFullDebt(false);
          setSelectedSingleMethod(order.payments[0].method);
          setSingleReference(order.payments[0].reference || '');
        } else {
          setIsSplitPayment(true);
          setIsFullDebt(false);
          const amts: Record<string, string> = {};
          const refs: Record<string, string> = {};
          order.payments.forEach(p => {
            amts[p.method] = String(p.amount);
            refs[p.method] = p.reference || '';
          });
          setPaymentAmounts(amts);
          setPaymentReferences(refs);
        }
      } else {
        // No payments means it's fully unpaid (outstanding debt)
        setIsSplitPayment(false);
        setIsFullDebt(true);
      }
    }
  }, [order]);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    if (window.innerWidth > 768) {
      searchInputRef.current?.focus();
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && String(p.barcode).includes(q))
    ).slice(0, 8);
  }, [products, searchQuery]);

  const triggerQuickAdd = (barcode: string) => {
    const isUserAdmin = currentUser?.role === 'admin';
    const hasAddProductsPerm = currentUser?.permissions?.includes('add_products');
    
    if (!isUserAdmin && !hasAddProductsPerm) {
      alert("عذراً، هذا الباركود غير مسجل وليس لديك صلاحية إضافة أصناف جديدة.");
      setSearchQuery('');
      return;
    }

    setUnregisteredBarcode(barcode);
    setQuickAddForm({
      name: '',
      categoryId: categories[0]?.id || '',
      wholesalePrice: '',
      price: '',
      stockQuantity: '1',
      unit: 'piece'
    });
    setSearchQuery('');
  };

  const findUnitByBarcode = (q: string) => {
    for (const p of products) {
      if (p.barcode && String(p.barcode) === q) {
        return { product: p, unit: null };
      }
      if (p.units) {
        for (const u of p.units) {
          if (u.barcode && String(u.barcode) === q) {
            return { product: p, unit: u };
          }
        }
      }
    }
    return null;
  };

  const addItemToInvoice = (product: Product, selectedUnit: any = null, bypassStockCheck = false) => {
    const unitName = selectedUnit ? selectedUnit.unitName : (product.unit || 'قطعة');
    const conversionFactor = selectedUnit ? selectedUnit.conversionFactor : 1.00;
    const salePrice = selectedUnit ? selectedUnit.salePrice : product.price;
    const purchasePrice = selectedUnit ? selectedUnit.purchasePrice : product.wholesalePrice;
    const unitId = selectedUnit ? selectedUnit.id : `unit_${product.id}_base`;

    const existing = invoiceItems.find(item => item.id === product.id && item.selectedUnitId === unitId);
    const step = product.unit === 'kg' ? 0.1 : 1;
    const requestedQty = existing ? Number((existing.quantity + step).toFixed(3)) : 1;
    
    const totalRequiredBase = invoiceItems.reduce((acc, item) => {
      if (item.id === product.id) {
        const factor = item.conversionFactor || 1.00;
        if (item.selectedUnitId === unitId) {
          return acc + (requestedQty * factor);
        }
        return acc + (item.quantity * factor);
      }
      return acc;
    }, existing ? 0 : (requestedQty * conversionFactor));

    const availableInStock = order 
       ? product.stockQuantity + (order.items.reduce((acc, i) => i.id === product.id ? acc + (i.quantity * (i.conversionFactor || 1.00)) : acc, 0))
       : product.stockQuantity;

    if (!bypassStockCheck && totalRequiredBase > availableInStock) {
      setInsufficientStockProduct({ product, requestedQty: Number((totalRequiredBase / conversionFactor).toFixed(3)) });
      return;
    }
    
    setInvoiceItems(prev => {
      const ex = prev.find(item => item.id === product.id && item.selectedUnitId === unitId);
      if (ex) {
        addTimelineEvent(`تعديل كمية ${product.name} إلى ${requestedQty} ${unitName}`, 'info');
        return prev.map(item => 
          (item.id === product.id && item.selectedUnitId === unitId) ? { ...item, quantity: requestedQty } : item
        );
      }
      
      const newCartItem: CartItem = {
        ...product,
        price: salePrice,
        wholesalePrice: purchasePrice,
        unit: unitName,
        quantity: 1,
        discountType: 'fixed',
        discountValue: 0,
        selectedUnitId: unitId,
        selectedUnitName: unitName,
        conversionFactor: conversionFactor,
        salePrice: salePrice,
        purchasePrice: purchasePrice
      };
      addTimelineEvent(`إضافة صنف: ${product.name} (${unitName}) ➕`, 'success');
      return [...prev, newCartItem];
    });
  };

  const updateQuantity = (id: string, selectedUnitId: string, delta: number, bypassStockCheck = false) => {
    const item = invoiceItems.find(x => x.id === id && x.selectedUnitId === selectedUnitId);
    if (!item) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    const conversionFactor = item.conversionFactor || 1.00;
    const newQty = Math.max(0.001, Number((item.quantity + delta).toFixed(3)));
    
    const totalRequiredBase = invoiceItems.reduce((acc, x) => {
      if (x.id === id) {
        const factor = x.conversionFactor || 1.00;
        if (x.selectedUnitId === selectedUnitId) {
          return acc + (newQty * factor);
        }
        return acc + (x.quantity * factor);
      }
      return acc;
    }, 0);

    const availableInStock = order
       ? product.stockQuantity + (order.items.reduce((acc, i) => i.id === id ? acc + (i.quantity * (i.conversionFactor || 1.00)) : acc, 0))
       : product.stockQuantity;

    if (!bypassStockCheck && totalRequiredBase > availableInStock) {
      setInsufficientStockProduct({ product, requestedQty: Number((totalRequiredBase / conversionFactor).toFixed(3)) });
      return;
    }

    addTimelineEvent(`تعديل كمية ${item.name} إلى ${newQty} ${item.unit} ✏️`, 'info');
    setInvoiceItems(prev => prev.map(x => (x.id === id && x.selectedUnitId === selectedUnitId) ? { ...x, quantity: newQty } : x));
  };

  const setDirectQuantity = (id: string, selectedUnitId: string, value: string, bypassStockCheck = false) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;
    
    const item = invoiceItems.find(x => x.id === id && x.selectedUnitId === selectedUnitId);
    if (!item) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    const conversionFactor = item.conversionFactor || 1.00;
    const newQty = Number(val.toFixed(3));
    
    const totalRequiredBase = invoiceItems.reduce((acc, x) => {
      if (x.id === id) {
        const factor = x.conversionFactor || 1.00;
        if (x.selectedUnitId === selectedUnitId) {
          return acc + (newQty * factor);
        }
        return acc + (x.quantity * factor);
      }
      return acc;
    }, 0);

    const availableInStock = order
       ? product.stockQuantity + (order.items.reduce((acc, i) => i.id === id ? acc + (i.quantity * (i.conversionFactor || 1.00)) : acc, 0))
       : product.stockQuantity;

    if (!bypassStockCheck && totalRequiredBase > availableInStock) {
      setInsufficientStockProduct({ product, requestedQty: Number((totalRequiredBase / conversionFactor).toFixed(3)) });
      return;
    }

    addTimelineEvent(`تعديل كمية ${item.name} إلى ${newQty} ${item.unit} ✏️`, 'info');
    setInvoiceItems(prev => prev.map(x => (x.id === id && x.selectedUnitId === selectedUnitId) ? { ...x, quantity: newQty } : x));
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const match = findUnitByBarcode(q);
    if (match) {
      addItemToInvoice(match.product, match.unit);
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  const handleBarcodeSearchOrTriggerNotFound = () => {
    const q = searchQuery.trim();
    if (!q) return;

    const match = findUnitByBarcode(q);
    if (match) {
      addItemToInvoice(match.product, match.unit);
      setSearchQuery('');
    } else {
      triggerQuickAdd(q);
    }
  };

  const removeItem = (id: string, selectedUnitId: string) => {
    const item = invoiceItems.find(x => x.id === id && x.selectedUnitId === selectedUnitId);
    if (item) {
      addTimelineEvent(`حذف صنف: ${item.name} 🗑️`, 'danger');
    }
    setInvoiceItems(prev => prev.filter(item => !(item.id === id && item.selectedUnitId === selectedUnitId)));
  };

  const getItemDiscountAmount = (item: CartItem) => {
    const val = item.discountValue || 0;
    if (item.discountType === 'percent') {
      return Number(((item.price * val) / 100).toFixed(2));
    }
    return val;
  };

  const setItemDiscountValue = (id: string, selectedUnitId: string, value: string) => {
    const val = parseFloat(value) || 0;
    if (val < 0) {
      alert('لا يمكن إدخال قيم سالبة للخصم');
      return;
    }
    const item = invoiceItems.find(x => x.id === id && x.selectedUnitId === selectedUnitId);
    if (item) {
      addTimelineEvent(`تعديل خصم ${item.name} إلى ${val} ${item.discountType === 'percent' ? '%' : 'ج.م'} 🏷️`, 'warn');
    }
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id && item.selectedUnitId === selectedUnitId) {
        const discAmt = item.discountType === 'percent' ? (item.price * val / 100) : val;
        if (discAmt > item.price) {
          alert('لا يمكن أن يتجاوز خصم الصنف سعر الصنف نفسه');
          return item;
        }
        return { ...item, discountValue: val };
      }
      return item;
    }));
  };

  const toggleItemDiscountType = (id: string, selectedUnitId: string) => {
    const item = invoiceItems.find(x => x.id === id && x.selectedUnitId === selectedUnitId);
    if (item) {
      const nextType = item.discountType === 'percent' ? 'fixed' : 'percent';
      addTimelineEvent(`تغيير نوع خصم ${item.name} إلى: ${nextType === 'percent' ? 'نسبة' : 'قيمة ثابتة'} 🏷️`, 'warn');
    }
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id && item.selectedUnitId === selectedUnitId) {
        const nextType = item.discountType === 'percent' ? 'fixed' : 'percent';
        const val = item.discountValue || 0;
        const discAmt = nextType === 'percent' ? (item.price * val / 100) : val;
        if (discAmt > item.price) {
          alert('الخصم بالنوع الجديد يتجاوز سعر الصنف، سيتم تصفير الخصم');
          return { ...item, discountType: nextType, discountValue: 0 };
        }
        return { ...item, discountType: nextType };
      }
      return item;
    }));
  };

  const subtotalBeforeDiscount = useMemo(() => 
    invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [invoiceItems]);

  const totalItemDiscounts = useMemo(() => 
    invoiceItems.reduce((sum, item) => sum + (getItemDiscountAmount(item) * item.quantity), 0)
  , [invoiceItems]);

  const subtotalAfterItemDiscounts = subtotalBeforeDiscount - totalItemDiscounts;

  const invoiceDiscount = useMemo(() => {
    if (invoiceDiscountType === 'percent') {
      return Number(((subtotalAfterItemDiscounts * invoiceDiscountValue) / 100).toFixed(2));
    }
    return invoiceDiscountValue;
  }, [subtotalAfterItemDiscounts, invoiceDiscountValue, invoiceDiscountType]);

  const subtotal = subtotalBeforeDiscount; // backward compatibility for state reference
  const deliveryFee = isDeliveryEnabled ? globalDeliveryFee : 0;
  const total = Math.max(0, Number((subtotalAfterItemDiscounts - invoiceDiscount + deliveryFee).toFixed(2)));

  const sumOfPayments = useMemo(() => {
    if (isSplitPayment) {
      return dbPaymentMethods.reduce((sum, m) => sum + (parseFloat(paymentAmounts[m.id] || '0') || 0), 0);
    }
    return isFullDebt ? 0 : total;
  }, [isSplitPayment, isFullDebt, paymentAmounts, dbPaymentMethods, total]);

  const outstanding = useMemo(() => {
    return Math.max(0, Number((total - sumOfPayments).toFixed(2)));
  }, [total, sumOfPayments]);

  const paymentMethodSummary = useMemo(() => {
    if (isSplitPayment) {
      const parts = dbPaymentMethods
        .filter(m => (parseFloat(paymentAmounts[m.id] || '0') || 0) > 0)
        .map(m => m.name);
      let s = parts.join(' + ');
      if (outstanding > 0) {
        s += ' + آجل';
      }
      return s || 'دفع مشترك';
    } else if (isFullDebt) {
      return 'آجل بالكامل';
    } else {
      const activeMethod = dbPaymentMethods.find(m => m.id === selectedSingleMethod);
      let s = activeMethod?.name || 'نقدي';
      if (outstanding > 0) {
        s += ' + آجل';
      }
      return s;
    }
  }, [isSplitPayment, isFullDebt, selectedSingleMethod, paymentAmounts, dbPaymentMethods, outstanding]);

  // مساعد المبيعات الذكي - احتساب التحليلات محلياً لحماية الأداء وسرعة الكاشير
  const assistantData = useMemo(() => {
    // 1. تحليل العميل (Customer Analysis)
    const selectedUser = users.find(u => normalizePhone(u.phone) === normalizePhone(customerInfo.phone));
    let customerType: 'new' | 'regular' | 'vip' | 'debtor' = 'new';
    let customerTotalPurchases = 0;
    let customerOrdersCount = 0;
    let customerLastOrder: number | null = null;
    let customerAOV = 0;
    let customerDebt = 0;

    if (selectedUser) {
      customerDebt = selectedUser.balance || 0;
      const userOrders = orders.filter(o => normalizePhone(o.phone) === normalizePhone(selectedUser.phone) && o.status === 'completed');
      customerOrdersCount = userOrders.length;
      customerTotalPurchases = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      customerLastOrder = customerOrdersCount > 0 ? Math.max(...userOrders.map(o => o.createdAt)) : null;
      customerAOV = customerOrdersCount > 0 ? (customerTotalPurchases / customerOrdersCount) : 0;

      if (customerDebt > 0) {
        customerType = 'debtor';
      } else if (customerTotalPurchases > 5000 || customerOrdersCount > 15) {
        customerType = 'vip';
      } else if (customerOrdersCount > 3) {
        customerType = 'regular';
      }
    }

    // 2. مساعد الربحية (Profitability Assistant)
    let totalCost = 0;
    invoiceItems.forEach(item => {
      totalCost += (item.wholesalePrice || 0) * item.quantity;
    });
    const expectedProfit = Math.max(0, total - totalCost);
    const profitMargin = total > 0 ? ((expectedProfit / total) * 100) : 0;

    // 3. التنبيهات والتحذيرات الذكية (Smart Alerts)
    const alerts: { text: string; type: 'info' | 'warn' | 'danger' }[] = [];

    // تنبيه مديونية بلا عميل
    if (outstanding > 0 && (!selectedUser || customerInfo.name === 'عميل نقدي')) {
      alerts.push({ text: 'يوجد متبقي بالآجل ولكن العميل المختار هو عميل نقدي افتراضي. يرجى اختيار عميل مسجل لتسجيل الدين.', type: 'danger' });
    }

    // تنبيه عدم تطابق المدفوعات مع إجمالي الفاتورة
    if ((isSplitPayment || isFullDebt) && sumOfPayments > total) {
      alerts.push({ text: 'إجمالي مبالغ الدفع المشترك يتجاوز القيمة الإجمالية الصافية للفاتورة.', type: 'danger' });
    }

    // تنبيه مديونية سابقة للعميل
    if (selectedUser && customerDebt > 0) {
      alerts.push({ text: `العميل لديه مديونية سابقة مستحقة بقيمة ${customerDebt.toFixed(2)} ج.م.`, type: 'warn' });
    }

    // تنبيه البيع بأقل من التكلفة وتجاوز الخصم ونواقص المخزون
    let hasBelowCost = false;
    let hasHighDiscount = false;
    let hasOutOfStock = false;
    let hasBelowReorder = false;

    invoiceItems.forEach(item => {
      const cost = item.wholesalePrice || 0;
      if (item.price < cost) {
        hasBelowCost = true;
      }
      
      const discAmt = getItemDiscountAmount(item);
      if (discAmt > item.price * 0.15) {
        hasHighDiscount = true;
      }

      const prod = products.find(p => p.id === item.id);
      if (prod) {
        const factor = item.conversionFactor || 1;
        const requestedBase = item.quantity * factor;
        if (requestedBase > prod.stockQuantity) {
          hasOutOfStock = true;
        }
        
        const remainingStock = prod.stockQuantity - requestedBase;
        if (remainingStock <= (prod.reorderLevel || 5)) {
          hasBelowReorder = true;
        }
      }
    });

    if (invoiceDiscount > subtotalBeforeDiscount * 0.15) {
      alerts.push({ text: 'خصم الفاتورة الإجمالي يتجاوز الحد المسموح به (15%) للعمليات العادية.', type: 'warn' });
    }

    if (hasBelowCost) {
      alerts.push({ text: 'يوجد منتجات مضافة بسعر بيع أقل من سعر تكلفة الشراء!', type: 'danger' });
    }
    if (hasHighDiscount) {
      alerts.push({ text: 'تم تطبيق خصم مرتفع (أكثر من 15%) على أحد الأصناف بالسلة.', type: 'warn' });
    }
    if (hasOutOfStock) {
      alerts.push({ text: 'الكمية المطلوبة لبعض المنتجات تتجاوز الرصيد المتوفر بالمستودع.', type: 'warn' });
    }
    if (hasBelowReorder) {
      alerts.push({ text: 'بعض المنتجات سينخفض مخزونها ليكون أقل من حد إعادة الطلب بعد حفظ الفاتورة.', type: 'info' });
    }

    // 4. الاقتراحات الذكية (Smart Suggestions)
    const suggestions: string[] = [];

    // اقتراح تسجيل عميل للفاتورة الكبيرة
    if (total > 500 && (!selectedUser || customerInfo.name === 'عميل نقدي')) {
      suggestions.push('قيمة الفاتورة مرتفعة. يُقترح تسجيل رقم هاتف العميل لربط نقاط الولاء وحفظ حقه.');
    }

    // اقتراح ترقية العبوة (الأوفر للعميل)
    invoiceItems.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod && prod.units) {
        prod.units.forEach(u => {
          if (u.isActive === 1 && u.conversionFactor > 1) {
            if (item.quantity >= u.conversionFactor * 0.8 && item.selectedUnitId === `unit_${item.id}_base`) {
              suggestions.push(`العميل يشتري كمية كبيرة من [${item.name}]، يُقترح ترقيتها للعبوة الأوفر [${u.unitName}] (تحتوي على ${u.conversionFactor} قطع بسعر ${u.salePrice} ج.م)`);
            }
          }
        });
      }
    });

    // اقتراح منتجات مكملة (Cross-Sell)
    const activeCategories = new Set(invoiceItems.map(item => item.categoryId));
    const currentItemIds = new Set(invoiceItems.map(item => item.id));
    const crossSells: string[] = [];
    
    products.forEach(p => {
      if (activeCategories.has(p.categoryId) && !currentItemIds.has(p.id) && p.stockQuantity > 0 && crossSells.length < 2) {
        crossSells.push(p.name);
      }
    });

    crossSells.forEach(name => {
      suggestions.push(`هل ترغب في اقتراح [${name}] للعميل؟ صنف شائع ومرتبط بالسلة.`);
    });

    // اقتراح الدفع بالآجل
    if (outstanding > 0 && !isFullDebt && !isSplitPayment) {
      suggestions.push('يوجد مبلغ متبقي غير مسدد. يُقترح تفعيل خيار الدفع المشترك أو تحويلها كفاتورة آجل بالكامل.');
    }

    // 5. مؤشر صحة الفاتورة (Invoice Health)
    let healthStatus: 'excellent' | 'review' | 'danger' = 'excellent';
    let healthLabel = 'ممتازة';
    let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';

    const hasDangerAlert = alerts.some(a => a.type === 'danger');
    const hasWarnAlert = alerts.some(a => a.type === 'warn');

    if (hasDangerAlert) {
      healthStatus = 'danger';
      healthLabel = 'توجد مشكلة حرجة';
      healthColor = 'text-rose-600 bg-rose-50 border-rose-100';
    } else if (hasWarnAlert || invoiceDiscountValue > 0 || outstanding > 0) {
      healthStatus = 'review';
      healthLabel = 'تحتاج مراجعة';
      healthColor = 'text-amber-600 bg-amber-50 border-amber-100';
    }

    return {
      selectedUser,
      customerType,
      customerTotalPurchases,
      customerOrdersCount,
      customerLastOrder,
      customerAOV,
      customerDebt,
      totalCost,
      expectedProfit,
      profitMargin,
      alerts,
      suggestions,
      healthStatus,
      healthLabel,
      healthColor
    };
  }, [invoiceItems, customerInfo, total, orders, users, products, outstanding, isSplitPayment, isFullDebt, sumOfPayments, invoiceDiscountValue]);

  const handleFinalSubmit = async () => {
    if (isSaving) return;
    if (invoiceItems.length === 0) return alert('يرجى إضافة منتجات للفاتورة');
    if (!customerInfo.phone) return alert('يرجى إدخال رقم الهاتف لمتابعة الطلب');
    if (isDeliveryEnabled && !customerInfo.address.trim()) return alert('يرجى إدخال عنوان التوصيل');
    if (order && order.status === 'completed' && !editReason.trim()) {
      return alert('يرجى إدخال سبب تعديل الخصومات/الفاتورة للمتابعة المحاسبية');
    }

    // Front-end validations for payments
    if (sumOfPayments > total + 0.01) {
      return alert('خطأ: إجمالي المبالغ المدخلة يتجاوز إجمالي الفاتورة!');
    }

    if (outstanding > 0) {
      const normPhone = normalizePhone(customerInfo.phone);
      if (!customerInfo.name || customerInfo.name === 'عميل نقدي' || !normPhone) {
        return alert('يرجى تحديد عميل حقيقي (اسم ورقم هاتف) لتسجيل المديونية المتبقية عليه بقيمة ' + outstanding + ' ج.م');
      }
      if (!dueDate) {
        return alert('يرجى تحديد تاريخ استحقاق الدين');
      }
    }

    if (isSplitPayment) {
      for (const m of dbPaymentMethods) {
        const amt = parseFloat(paymentAmounts[m.id] || '0') || 0;
        if (amt > 0 && m.type === 'digital' && !paymentReferences[m.id]?.trim()) {
          const confirmNoRef = window.confirm(`تنبيه: لم تقم بإدخال رقم مرجع لعملية الدفع الرقمي (${m.name}). هل تريد المتابعة بدون مرجع؟`);
          if (!confirmNoRef) return;
        }
      }
    } else {
      const activeMethod = dbPaymentMethods.find(m => m.id === selectedSingleMethod);
      if (activeMethod && activeMethod.type === 'digital' && !singleReference.trim() && !isFullDebt) {
        const confirmNoRef = window.confirm(`تنبيه: لم تقم بإدخال رقم مرجع لعملية الدفع الرقمي (${activeMethod.name}). هل تريد المتابعة بدون مرجع؟`);
        if (!confirmNoRef) return;
      }
    }

    // Frontend validations
    try {
      invoiceItems.forEach(item => {
        const discAmt = getItemDiscountAmount(item);
        if ((item.discountValue || 0) < 0 || item.price < 0 || item.quantity < 0) {
          throw new Error('لا يمكن استخدام قيم سالبة في الحسابات');
        }
        if (discAmt > item.price) {
          throw new Error(`خصم الصنف ${item.name} يتجاوز سعره الأصلي`);
        }
      });
      if (invoiceDiscountValue < 0) {
        throw new Error('خصم الفاتورة لا يمكن أن يكون سالباً');
      }
      if (invoiceDiscount > subtotalAfterItemDiscounts) {
        throw new Error('خصم الفاتورة الإجمالي يتجاوز صافي الفاتورة قبل خصمها');
      }
    } catch (err: any) {
      alert(err.message);
      return;
    }
    
    setIsSaving(true);
    try {
      const normPhone = normalizePhone(customerInfo.phone);
      const existingUser = users.find(u => normalizePhone(u.phone) === normPhone);
      if (existingUser && existingUser.name !== customerInfo.name) {
        const newNameTrimmed = customerInfo.name.trim();
        if (newNameTrimmed.length >= 3) {
          const updateName = window.confirm(`تنبيه: رقم الهاتف هذا مسجل باسم "${existingUser.name}". هل تريد تحديث الاسم المسجل في النظام ليكون "${newNameTrimmed}"؟`);
          if (updateName) {
            try {
              await ApiService.adminUpdateUser({
                id: existingUser.id,
                name: newNameTrimmed,
                phone: existingUser.phone,
                role: existingUser.role
              });
            } catch (err) {
              console.error("Failed to update customer name profile", err);
            }
          }
        }
      }

      const orderId = order ? order.id : 'INV-' + Date.now().toString().slice(-8);
      
      const paymentsToSend = isSplitPayment
        ? dbPaymentMethods.map(m => ({
            method: m.id,
            amount: parseFloat(paymentAmounts[m.id] || '0') || 0,
            reference: paymentReferences[m.id] || ''
          })).filter(p => p.amount > 0)
        : isFullDebt
          ? []
          : [{
              method: selectedSingleMethod,
              amount: total,
              reference: singleReference
            }];

      const newOrder: Order = {
        id: orderId,
        customerName: customerInfo.name,
        phone: customerInfo.phone,
        city: customerInfo.city,
        address: isDeliveryEnabled ? customerInfo.address.trim() : 'استلام فرع (كاشير)',
        items: invoiceItems,
        subtotal: subtotalBeforeDiscount,
        total: total,
        paymentMethod: paymentMethodSummary,
        status: customerInfo.status as any,
        createdAt: order ? order.createdAt : Date.now(),
        discount: invoiceDiscount,
        discountType: invoiceDiscountType,
        discountValue: invoiceDiscountValue,
        deliveryFee: deliveryFee,
        totalItemDiscounts: totalItemDiscounts,
        subtotalBeforeDiscount: subtotalBeforeDiscount,
        finalTotal: total,
        discountsMetadata: order ? order.discountsMetadata : undefined,
        editReason: (order && order.status === 'completed') ? editReason : undefined,
        outstandingAmount: outstanding,
        payments: paymentsToSend,
        dueDate: outstanding > 0 ? new Date(dueDate).getTime() : undefined
      } as any;

      await onSubmit(newOrder);
    } catch (err) {
      console.error("Save error:", err);
      alert('حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScanResult = (code: string) => {
    setShowScanner(false);
    const q = code.trim();
    if (!q) return;
    const exactMatch = products.find(p => p.barcode && String(p.barcode) === q);
    if (exactMatch) {
      addItemToInvoice(exactMatch);
    } else {
      triggerQuickAdd(q);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unregisteredBarcode) return;
    
    const finalPrice = parseFloat(quickAddForm.price);
    const finalWholesale = parseFloat(quickAddForm.wholesalePrice) || 0;
    const finalStock = parseFloat(quickAddForm.stockQuantity) || 0;

    if (!quickAddForm.name.trim()) return alert('يرجى إدخال اسم المنتج');
    if (!quickAddForm.categoryId) return alert('يرجى اختيار القسم');
    if (isNaN(finalPrice) || finalPrice <= 0) return alert('يرجى إدخال سعر بيع صحيح');

    setIsSubmittingQuickAdd(true);
    try {
      const payload = {
        id: 'prod_' + Date.now().toString().slice(-8),
        name: quickAddForm.name.trim(),
        description: quickAddForm.name.trim(),
        price: finalPrice,
        wholesalePrice: finalWholesale,
        categoryId: quickAddForm.categoryId,
        stockQuantity: finalStock,
        unit: quickAddForm.unit,
        barcode: unregisteredBarcode,
        images: ['/assets/images/placeholder.png']
      };

      const result = await ApiService.addProduct(payload as any);
      
      if (result && result.status === 'barcode_exists') {
        alert('تنبيه: قام كاشير آخر بإضافة هذا المنتج للتو. تم استيراد بياناته وإضافته للفاتورة.');
        const existingProd = result.product;
        if (existingProd) {
          addItemToInvoice(existingProd, true);
        }
        if (onRefreshData) onRefreshData();
        setUnregisteredBarcode(null);
        setTimeout(() => searchInputRef.current?.focus(), 200);
      } else if (result && result.success) {
        if (onRefreshData) onRefreshData();
        const addedProduct: Product = {
          ...payload,
          batches: [],
          createdAt: Date.now()
        } as any;
        
        setInvoiceItems(prev => [...prev, { ...addedProduct, quantity: 1, discountType: 'fixed', discountValue: 0 }]);
        setUnregisteredBarcode(null);
        setTimeout(() => searchInputRef.current?.focus(), 200);
      } else {
        alert(result?.message || 'فشلت إضافة المنتج');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-2 md:px-4 animate-fadeIn">
      {showScanner && <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
      
      {unregisteredBarcode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => !isSubmittingQuickAdd && setUnregisteredBarcode(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-slideUp max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">الباركود غير مسجل!</h3>
            <p className="text-slate-500 font-bold text-xs mb-6 text-center font-Cairo">
              الباركود <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-mono text-sm">{unregisteredBarcode}</code> غير موجود بالسيستم. هل تود إضافته سريعاً؟
            </p>
            <form onSubmit={handleQuickAddSubmit} className="space-y-4 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">الباركود (للقراءة فقط)</label>
                  <input readOnly value={unregisteredBarcode} className="w-full px-5 py-3 bg-slate-100 rounded-xl outline-none font-mono text-sm text-slate-500 text-center" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">اسم المنتج</label>
                  <input required value={quickAddForm.name} onChange={e => setQuickAddForm({...quickAddForm, name: e.target.value})} placeholder="مثال: جهينة حليب 1 لتر" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">القسم</label>
                  <select required value={quickAddForm.categoryId} onChange={e => setQuickAddForm({...quickAddForm, categoryId: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm">
                    <option value="">-- اختر القسم --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">وحدة البيع</label>
                  <select value={quickAddForm.unit} onChange={e => setQuickAddForm({...quickAddForm, unit: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm">
                    <option value="piece">قطعة</option>
                    <option value="carton">كرتونة</option>
                    <option value="box">علبة</option>
                    <option value="bottle">زجاجة</option>
                    <option value="kg">كجم (كيلو جرام)</option>
                    <option value="gram">جرام</option>
                    <option value="liter">لتر</option>
                    <option value="meter">متر</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">سعر الشراء (التكلفة)</label>
                  <input type="number" step="any" required value={quickAddForm.wholesalePrice} onChange={e => setQuickAddForm({...quickAddForm, wholesalePrice: e.target.value})} placeholder="0.00" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">سعر البيع</label>
                  <input type="number" step="any" required value={quickAddForm.price} onChange={e => setQuickAddForm({...quickAddForm, price: e.target.value})} placeholder="0.00" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 mr-2">الكمية الابتدائية بالمخزن</label>
                  <input type="number" step="any" required value={quickAddForm.stockQuantity} onChange={e => setQuickAddForm({...quickAddForm, stockQuantity: e.target.value})} placeholder="1" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm text-center" />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button disabled={isSubmittingQuickAdd} type="submit" className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50 font-Cairo">
                  {isSubmittingQuickAdd ? 'جاري الحفظ...' : 'حفظ المنتج وإضافته للسلة 💾'}
                </button>
                <button disabled={isSubmittingQuickAdd} type="button" onClick={() => setUnregisteredBarcode(null)} className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95 font-Cairo">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {insufficientStockProduct && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setInsufficientStockProduct(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📦</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 font-Cairo">عجز المخزون!</h3>
            <p className="text-slate-500 font-bold text-sm mb-6 font-Cairo">
              المنتج: <span className="text-slate-800 font-black">{insufficientStockProduct.product.name}</span><br />
              الكمية المطلوبة: <span className="text-indigo-600 font-black">{insufficientStockProduct.requestedQty}</span> | المتاح حالياً: <span className="text-rose-500 font-black">{(() => {
                const availableInStock = order 
                   ? insufficientStockProduct.product.stockQuantity + (order.items.find(i => i.id === insufficientStockProduct.product.id)?.quantity || 0)
                   : insufficientStockProduct.product.stockQuantity;
                return availableInStock;
              })()}</span>
            </p>

            {/* عرض السياسات المتاحة */}
            {(() => {
              const availableInStock = order 
                 ? insufficientStockProduct.product.stockQuantity + (order.items.find(i => i.id === insufficientStockProduct.product.id)?.quantity || 0)
                 : insufficientStockProduct.product.stockQuantity;

              const isUserAdmin = currentUser?.role === 'admin';
              const hasSellWithoutStockPerm = currentUser?.permissions?.includes('sell_without_stock');
              const hasOverridePerm = currentUser?.permissions?.includes('override_stock_policy');
              
              const policy = storeSettings.out_of_stock_policy;
              const negativeLimit = parseFloat(storeSettings.negative_stock_limit) || 0;
              const newNegativeStock = availableInStock - insufficientStockProduct.requestedQty;

              let canBypass = false;
              let message = '';

              if (policy === 'prevent') {
                message = 'سياسة المتجر الحالية تمنع البيع بدون مخزون نهائياً.';
              } else if (policy === 'admin_only') {
                if (isUserAdmin || hasSellWithoutStockPerm || hasOverridePerm) {
                  canBypass = true;
                  message = 'سياسة المتجر تمنع البيع للموظفين، ولكن بصفتك مسؤولاً/مديراً يمكنك تجاوز هذا المنع.';
                } else {
                  message = 'سياسة المتجر تتطلب صلاحيات مدير/مسؤول لتجاوز العجز.';
                }
              } else if (policy === 'allow_any') {
                canBypass = true;
                message = 'سياسة المتجر تسمح للجميع بالبيع في أي حال.';
              } else if (policy === 'allow_negative') {
                if (Math.abs(newNegativeStock) <= negativeLimit) {
                  canBypass = true;
                  message = `مسموح بالبيع بالسالب حتى حد (${negativeLimit}). العجز الحالي سيصل إلى (${Math.abs(newNegativeStock).toFixed(3)}).`;
                } else {
                  if (isUserAdmin || hasOverridePerm) {
                    canBypass = true;
                    message = `العجز (${Math.abs(newNegativeStock).toFixed(3)}) يتجاوز حد السالب المسموح به (${negativeLimit}). ولكن بصفتك مسؤولاً يمكنك تجاوز المنع.`;
                  } else {
                    message = `العجز (${Math.abs(newNegativeStock).toFixed(3)}) يتجاوز حد السالب المسموح به للبيع (${negativeLimit}).`;
                  }
                }
              }

              return (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-600 text-right font-Cairo">
                    ℹ️ {message}
                  </div>
                  <div className="flex gap-3">
                    {canBypass ? (
                      <button 
                        onClick={() => {
                          const isExisting = invoiceItems.some(x => x.id === insufficientStockProduct.product.id);
                          if (isExisting) {
                            setInvoiceItems(prev => prev.map(x => x.id === insufficientStockProduct.product.id ? { ...x, quantity: insufficientStockProduct.requestedQty } : x));
                          } else {
                            setInvoiceItems(prev => [...prev, { ...insufficientStockProduct.product, quantity: insufficientStockProduct.requestedQty, discountType: 'fixed', discountValue: 0 }]);
                          }
                          setInsufficientStockProduct(null);
                          setTimeout(() => searchInputRef.current?.focus(), 200);
                        }} 
                        className="flex-grow bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-emerald-100 font-Cairo"
                      >
                        إتمام وإضافة للسلة 🛒
                      </button>
                    ) : null}
                    <button 
                      onClick={() => setInsufficientStockProduct(null)} 
                      className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95 font-Cairo"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => !isSaving && setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{order ? 'تجاهل التعديلات؟' : 'إلغاء الفاتورة؟'}</h3>
            <p className="text-slate-500 font-bold text-sm mb-8">سيتم مسح جميع الأصناف التي قمت بإضافتها حالياً.</p>
            <div className="flex gap-3">
              <button disabled={isSaving} onClick={onCancel} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg">نعم، {order ? 'خروج' : 'إلغاء'}</button>
              <button disabled={isSaving} onClick={() => setShowCancelConfirm(false)} className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSaving && setShowPreview(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
             <div className="p-6 md:p-10 text-center space-y-4 md:space-y-6 overflow-y-auto no-scrollbar flex-grow">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">🧾</div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{order ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</h3>
                
                {!isOnline && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-xs font-bold animate-pulse">
                    ⚠️ وضع الكاشير (أوفلاين): سيتم حفظ الفاتورة محلياً وخصم الكمية من المخازن مؤقتاً، ورفعها للسيرفر فور عودة الاتصال.
                  </div>
                )}

                 <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl space-y-2 md:space-y-3">
                    <div className="flex justify-between font-bold text-xs md:text-sm">
                       <span className="text-slate-400">العميل:</span>
                       <span className="text-slate-800 truncate max-w-[150px]">{customerInfo.name}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs md:text-sm">
                       <span className="text-slate-400">الدفع:</span>
                       <span className={paymentMethodSummary.includes('آجل') ? 'text-orange-600' : 'text-emerald-600'}>{paymentMethodSummary}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs md:text-sm">
                       <span className="text-slate-400">الحالة:</span>
                       <span className={customerInfo.status === 'pending' ? 'text-amber-500 font-black' : customerInfo.status === 'cancelled' ? 'text-rose-500 font-black' : 'text-emerald-600 font-black'}>
                         {customerInfo.status === 'pending' ? '⏳ معلق بانتظار التأكيد' : customerInfo.status === 'cancelled' ? '✕ ملغاة' : '✓ مكتمل'}
                       </span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200 text-xs font-bold text-slate-500 space-y-1.5 text-right">
                       <div className="flex justify-between">
                          <span>المجموع قبل الخصم:</span>
                          <span className="text-slate-800">{subtotalBeforeDiscount.toFixed(2)} ج.م</span>
                       </div>
                       {totalItemDiscounts > 0 && (
                          <div className="flex justify-between text-rose-600">
                             <span>خصومات المنتجات:</span>
                             <span>-{totalItemDiscounts.toFixed(2)} ج.م</span>
                          </div>
                       )}
                       {invoiceDiscount > 0 && (
                          <div className="flex justify-between text-rose-600">
                             <span>خصم الفاتورة:</span>
                             <span>-{invoiceDiscount.toFixed(2)} ج.م</span>
                          </div>
                       )}
                       {isDeliveryEnabled && (
                          <div className="flex justify-between text-emerald-600">
                             <span>رسوم التوصيل:</span>
                             <span>+{globalDeliveryFee.toFixed(2)} ج.م</span>
                          </div>
                       )}
                       <div className="flex justify-between text-xl md:text-2xl font-black pt-2 border-t border-dashed text-slate-800">
                          <span>الإجمالي الصافي:</span>
                          <span className="text-emerald-600">{total.toFixed(2)} <small className="text-[10px]">ج.م</small></span>
                       </div>
                    </div>
                 </div>

                 {order && order.status === 'completed' && (
                   <div className="space-y-1.5 text-right bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                      <label className="text-[10px] font-black text-rose-800 uppercase mr-1 block">سبب تعديل الخصومات / الفاتورة (مطلوب للتدقيق)</label>
                      <input 
                        required
                        type="text"
                        value={editReason}
                        onChange={e => setEditReason(e.target.value)}
                        placeholder="مثال: تصحيح أسعار، خصم إضافي متفق عليه..."
                        className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl outline-none text-xs font-bold focus:border-rose-500 transition-colors"
                      />
                   </div>
                 )}

                <div className="flex flex-col gap-3 pt-2">
                   <button 
                    disabled={isSaving}
                    onClick={handleFinalSubmit} 
                    className={`w-full py-4 md:py-5 rounded-2xl font-black shadow-xl active:scale-95 text-base text-white transition-all ${isSaving ? 'bg-slate-400 shadow-none' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'} disabled:opacity-50 flex items-center justify-center gap-3`}
                   >
                     {isSaving ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         <span>جاري الحفظ...</span>
                       </>
                     ) : (
                       isOnline ? (order ? 'تحديث الفاتورة الآن' : 'إتمام وحفظ الفاتورة') : 'حفظ الفاتورة محلياً (أوفلاين)'
                     )}
                   </button>
                   {!isSaving && (
                     <button onClick={() => setShowPreview(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors">
                       تعديل البيانات
                     </button>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 md:mb-10 px-2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight">{order ? 'تعديل فاتورة' : 'كاشير سوق العصر'}</h2>
            <p className="text-emerald-600 font-black text-[8px] md:text-[10px] uppercase mt-0.5 tracking-widest">{order ? `رقم الطلب: #${order.id}` : 'إدارة المبيعات الفورية'}</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse'}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="text-[10px] font-black">{isOnline ? 'متصل' : 'أوفلاين'}</span>
          </div>
        </div>
        <button type="button" onClick={() => !isSaving && setShowCancelConfirm(true)} className="bg-white border-2 border-slate-100 px-4 py-1.5 md:px-8 md:py-3 rounded-xl font-black text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition text-[10px] md:text-xs">إلغاء</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        <div className="lg:col-span-8 space-y-4 md:space-y-8">
          <div className="bg-white p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50">
            <div className="relative mb-6 md:mb-10">
               <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-2 md:mr-4 mb-1.5 block tracking-widest">البحث عن منتج (اسم أو باركود)</label>
               <div className="relative group">
                 <input 
                   ref={searchInputRef}
                   disabled={isSaving}
                   type="text" 
                   placeholder="ابحث هنا..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       handleBarcodeSearchOrTriggerNotFound();
                     }
                   }}
                   className="w-full px-4 md:px-8 py-3.5 md:py-5 pr-12 md:pr-16 bg-slate-50 rounded-xl md:rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-black text-sm md:text-lg border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner disabled:opacity-50"
                 />
                 <button 
                  disabled={isSaving}
                  onClick={() => setShowScanner(true)}
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50"
                 >
                   <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </button>
               </div>
               
               {searchQuery.trim() && filteredProducts.length > 0 && !isSaving && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-slideUp">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { addItemToInvoice(p); setSearchQuery(''); }}
                        className="w-full px-4 md:px-8 py-3 md:py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b last:border-none"
                      >
                        <div className="flex items-center gap-3 text-right">
                           <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <p className="font-black text-slate-800 text-[11px] md:text-base">{p.name}</p>
                              <p className="text-[8px] md:text-[10px] font-black text-emerald-600">
                                {p.price} ج.م
                                <span className="text-slate-400 font-bold mr-2">| المتاح: {p.stockQuantity} {p.unit === 'piece' ? 'قطعة' : p.unit === 'kg' ? 'كجم' : p.unit === 'gram' ? 'جرام' : p.unit === 'carton' ? 'كرتونة' : p.unit === 'box' ? 'علبة' : p.unit === 'bottle' ? 'زجاجة' : p.unit === 'liter' ? 'لتر' : p.unit === 'meter' ? 'متر' : 'قطعة'}</span>
                              </p>
                           </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">+</span>
                      </button>
                    ))}
                  </div>
               )}
            </div>

            <div className="space-y-3">
               <h3 className="font-black text-slate-800 text-sm md:text-xl px-2 flex items-center justify-between">
                 <span>الأصناف ({invoiceItems.length})</span>
                 {invoiceItems.length > 0 && !isSaving && (
                   <button onClick={() => setInvoiceItems([])} className="text-[10px] text-rose-500 font-black hover:underline">مسح الكل</button>
                 )}
               </h3>
               
               <div className="overflow-x-auto border border-slate-50 rounded-xl md:rounded-[2rem] no-scrollbar">
                  <table className="w-full text-right min-w-[400px]">
                    <thead className="bg-slate-50 text-[8px] md:text-[10px] font-black text-slate-400 uppercase border-b">
                      <tr>
                        <th className="px-4 md:px-8 py-3 md:py-5">المنتج</th>
                        <th className="px-4 md:px-8 py-3 md:py-5">الكمية / الوزن</th>
                        <th className="px-4 md:px-8 py-3 md:py-5">السعر</th>
                        <th className="px-4 md:px-8 py-3 md:py-5">الخصم</th>
                        <th className="px-4 md:px-8 py-3 md:py-5 text-left">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-300 font-bold text-xs">سلة الفاتورة فارغة..</td>
                        </tr>
                      ) : (
                        invoiceItems.map(item => {
                          const itemDisc = getItemDiscountAmount(item);
                          const itemRowTotal = (item.price - itemDisc) * item.quantity;
                          const product = products.find(p => p.id === item.id);
                          
                          const originalQtyBase = order ? (order.items.reduce((acc, i) => i.id === item.id ? acc + (i.quantity * (i.conversionFactor || 1.00)) : acc, 0)) : 0;
                          const availableInStockBase = (product ? product.stockQuantity : item.stockQuantity) + originalQtyBase;
                          
                          const otherCartQtyBase = invoiceItems.reduce((acc, x) => {
                            if (x.id === item.id && x.selectedUnitId !== item.selectedUnitId) {
                              return acc + (x.quantity * (x.conversionFactor || 1.00));
                            }
                            return acc;
                          }, 0);

                          const remainingStockBase = Math.max(0, availableInStockBase - otherCartQtyBase - (item.quantity * (item.conversionFactor || 1.00)));
                          const remainingStock = Math.floor(remainingStockBase / (item.conversionFactor || 1.00));

                          return (
                            <tr key={`${item.id}_${item.selectedUnitId || 'base'}`} className="hover:bg-slate-50/50 transition group">
                              <td className="px-4 md:px-8 py-3">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-800 text-[11px] md:text-sm leading-tight">
                                    {item.name} {item.selectedUnitName ? `(${item.selectedUnitName})` : ''}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-black text-right mt-0.5">المخزون المتبقي للعبوة: {remainingStock} {item.unit || 'قطعة'}</span>
                                  {!isSaving && (
                                    <button onClick={() => removeItem(item.id, item.selectedUnitId || `unit_${item.id}_base`)} className="text-[8px] text-rose-400 font-bold text-right mt-0.5 hover:text-rose-600 font-Cairo">حذف ✕</button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                  <div className="flex items-center bg-slate-50 rounded-lg px-1 py-0.5 border border-slate-100">
                                    <button disabled={isSaving} onClick={() => {
                                      updateQuantity(item.id, item.selectedUnitId || `unit_${item.id}_base`, -(item.unit === 'kg' ? 0.1 : 1));
                                      addTimelineEvent(`تقليل كمية: ${item.name}`, 'info');
                                    }} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm disabled:opacity-30">-</button>
                                    <input 
                                      disabled={isSaving}
                                      type="number"
                                      step={item.unit === 'kg' ? "0.001" : "1"}
                                      value={item.quantity}
                                      onChange={(e) => {
                                        setDirectQuantity(item.id, item.selectedUnitId || `unit_${item.id}_base`, e.target.value);
                                        addTimelineEvent(`تعديل كمية ${item.name} إلى ${e.target.value}`, 'info');
                                      }}
                                      className="bg-transparent font-black text-[11px] md:text-xs w-14 text-center outline-none disabled:opacity-50"
                                    />
                                    <button disabled={isSaving} onClick={() => {
                                      updateQuantity(item.id, item.selectedUnitId || `unit_${item.id}_base`, (item.unit === 'kg' ? 0.1 : 1));
                                      addTimelineEvent(`زيادة كمية: ${item.name}`, 'info');
                                    }} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm disabled:opacity-30">+</button>
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400">{item.unit || 'قطعة'}</span>
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3 font-bold text-slate-500 text-[11px] md:text-sm">{item.price}</td>
                              <td className="px-4 md:px-8 py-3">
                                <div className="flex items-center gap-1">
                                  <input 
                                    disabled={isSaving}
                                    type="number"
                                    min="0"
                                    value={item.discountValue || ''}
                                    onChange={(e) => {
                                      setItemDiscountValue(item.id, item.selectedUnitId || `unit_${item.id}_base`, e.target.value);
                                      addTimelineEvent(`تعديل خصم ${item.name} إلى ${e.target.value}`, 'info');
                                    }}
                                    className="w-16 px-1.5 py-1 text-center bg-slate-50 border rounded-lg text-[10px] font-bold outline-none focus:border-emerald-500"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => {
                                      toggleItemDiscountType(item.id, item.selectedUnitId || `unit_${item.id}_base`);
                                      addTimelineEvent(`تبديل نوع خصم ${item.name}`, 'info');
                                    }}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[9px] font-black text-slate-600 border font-Cairo"
                                  >
                                    {item.discountType === 'percent' ? '%' : 'ج.م'}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3 text-left">
                                 <span className="font-black text-emerald-600 text-[11px] md:text-sm">{itemRowTotal.toFixed(2)} ج.م</span>
                              </td>
                            </tr>
                          );
                        }))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 md:space-y-8">
           <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50 space-y-6">
              <h3 className="font-black text-slate-800 text-sm md:text-xl border-b pb-4 border-slate-50 text-center uppercase tracking-tighter">بيانات العميل والشحن</h3>
              
              <div className="space-y-4 md:space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">اسم العميل</label>
                    <input 
                      disabled={isSaving}
                      type="text"
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm shadow-inner transition-all disabled:opacity-50"
                    />
                 </div>

                 <div className="space-y-1.5 relative">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">رقم الموبايل</label>
                    <input 
                      disabled={isSaving}
                      type="tel"
                      value={customerInfo.phone}
                      onChange={e => {
                        setCustomerInfo({...customerInfo, phone: e.target.value});
                        setShowPhoneSuggestions(true);
                      }}
                      onFocus={() => setShowPhoneSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowPhoneSuggestions(false), 200);
                      }}
                      placeholder="01xxxxxxxxx"
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl md:rounded-2xl outline-none font-bold text-center text-sm shadow-inner transition-all disabled:opacity-50"
                      dir="ltr"
                    />
                    
                    {showPhoneSuggestions && matchedUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideUp max-h-60 overflow-y-auto no-scrollbar text-right">
                        {matchedUsers.map(u => {
                          const stats = getUserStats(u.phone);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setCustomerInfo({
                                  ...customerInfo,
                                  name: u.name,
                                  phone: u.phone
                                });
                                addTimelineEvent(`تحديد العميل: ${u.name} 👤`, 'info');
                                setShowPhoneSuggestions(false);
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b last:border-none text-right font-bold"
                            >
                              <div className="text-right">
                                <p className="text-xs text-slate-800 font-black">{u.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5" dir="ltr">{u.phone}</p>
                              </div>
                              <div className="text-left font-bold">
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black font-Cairo">
                                  {stats.count} طلبات
                                </span>
                                {stats.lastOrder && (
                                  <span className="text-[8px] text-slate-400 block mt-1">
                                    آخر تعامل: {formatTimeAgo(stats.lastOrder)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {duplicateWarning && (
                      <p className="text-[9px] text-amber-600 font-bold mt-1 text-center font-Cairo">
                        ⚠️ تنبيه: يوجد أكثر من عميل مسجل بنفس هذا الرقم في النظام.
                      </p>
                    )}
                 </div>

                 <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 transition-all">
                    <div>
                      <p className="font-black text-emerald-800 text-xs">خدمة توصيل للمنزل؟</p>
                      <p className="text-[9px] text-emerald-600 font-bold">سيتم إضافة {globalDeliveryFee} ج.م للفاتورة</p>
                    </div>
                    <button 
                      disabled={isSaving}
                      type="button"
                      onClick={() => {
                        const nextState = !isDeliveryEnabled;
                        setIsDeliveryEnabled(nextState);
                        addTimelineEvent(nextState ? 'تفعيل خدمة التوصيل للمنزل 🚚' : 'إلغاء خدمة التوصيل', 'info');
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDeliveryEnabled ? 'bg-emerald-600' : 'bg-slate-300'} disabled:opacity-50`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDeliveryEnabled ? 'right-7' : 'right-1'}`}></div>
                    </button>
                 </div>

                 {isDeliveryEnabled && (
                    <div className="space-y-1.5 animate-slideUp">
                       <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">عنوان التوصيل بالتفصيل</label>
                       <textarea 
                         disabled={isSaving}
                         value={customerInfo.address}
                         onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                         placeholder="الحي، الشارع، أو علامة مميزة..."
                         className="w-full px-4 md:px-6 py-3 md:py-4 bg-white border-2 border-emerald-100 rounded-xl md:rounded-2xl outline-none font-bold text-sm shadow-sm transition-all focus:border-emerald-500 min-h-[80px] resize-none disabled:opacity-50"
                       />
                    </div>
                 )}

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-wide">طريقة الدفع والسداد</label>
                      <button 
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          const nextState = !isSplitPayment;
                          setIsSplitPayment(nextState);
                          setIsFullDebt(false);
                          setPaymentAmounts({});
                          setPaymentReferences({});
                          setSingleReference('');
                          addTimelineEvent(nextState ? 'تفعيل الدفع المشترك (المجزأ) 🔀' : 'إلغاء الدفع المشترك', 'info');
                        }}
                        className={`text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${isSplitPayment ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      >
                        🔀 دفع مجزأ (مشترك)
                      </button>
                    </div>

                    {!isSplitPayment && (
                      <div className="flex items-center justify-between bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <div className="text-right">
                          <p className="font-black text-amber-800 text-[10px]">شراء بالآجل (مديونية بالكامل)</p>
                          <p className="text-[8px] text-amber-600 font-bold">تسجيل إجمالي الفاتورة كدين على العميل</p>
                        </div>
                        <button 
                          disabled={isSaving}
                          type="button"
                          onClick={() => {
                            const nextState = !isFullDebt;
                            setIsFullDebt(nextState);
                            setSingleReference('');
                            addTimelineEvent(nextState ? 'تحويل الفاتورة للآجل بالكامل ⏳' : 'إلغاء البيع بالآجل', 'warn');
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isFullDebt ? 'bg-amber-600' : 'bg-slate-300'} disabled:opacity-50`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isFullDebt ? 'right-5' : 'right-0.5'}`}></div>
                        </button>
                      </div>
                    )}

                    {!isSplitPayment && !isFullDebt && (
                      <div className="grid grid-cols-2 gap-2">
                        {dbPaymentMethods.map(m => {
                          const isSelected = selectedSingleMethod === m.id;
                          let themeClass = 'hover:bg-slate-100 text-slate-500 border-slate-200';
                          if (isSelected) {
                            if (m.id === 'cash') themeClass = 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100 shadow-md';
                            else if (m.id === 'vodafone') themeClass = 'bg-rose-600 border-rose-600 text-white shadow-rose-100 shadow-md';
                            else if (m.id === 'instapay') themeClass = 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100 shadow-md';
                            else if (m.id === 'visa') themeClass = 'bg-cyan-600 border-cyan-600 text-white shadow-cyan-100 shadow-md';
                            else themeClass = 'bg-slate-800 border-slate-800 text-white shadow-slate-100 shadow-md';
                          }
                          return (
                            <button
                              key={m.id}
                              disabled={isSaving}
                              type="button"
                              onClick={() => {
                                setSelectedSingleMethod(m.id);
                                setSingleReference('');
                                addTimelineEvent(`تغيير الدفع لـ: ${m.name} 💳`, 'info');
                              }}
                              className={`py-3 rounded-xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${themeClass}`}
                            >
                              <span className="text-lg">{m.icon || '💰'}</span>
                              <span>{m.name}</span>
                              <span className={`text-[8px] font-medium opacity-80 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                {m.type === 'cash' ? 'تضاف للدرج النقدي' : 'مزامنة رقمية'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!isSplitPayment && !isFullDebt && dbPaymentMethods.find(m => m.id === selectedSingleMethod)?.type === 'digital' && (
                      <div className="space-y-1.5 animate-slideDown text-right">
                        <label className="text-[9px] font-black text-slate-400 mr-1 block">رقم مرجع المعاملة / التحويل (اختياري)</label>
                        <input 
                          disabled={isSaving}
                          type="text"
                          value={singleReference}
                          onChange={e => setSingleReference(e.target.value)}
                          placeholder="أدخل رقم العملية أو كود المرجع للتأكيد..."
                          className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-xs"
                        />
                      </div>
                    )}

                    {isSplitPayment && (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase text-center mb-1">توزيع مبالغ الدفع المشترك</p>
                        {dbPaymentMethods.map(m => (
                          <div key={m.id} className="space-y-2 border-b border-slate-200/50 pb-2.5 last:border-none last:pb-0">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-black text-slate-700 text-xs flex items-center gap-1.5">
                                <span>{m.icon || '💰'}</span>
                                {m.name}
                              </span>
                              <div className="relative w-36">
                                <input 
                                  disabled={isSaving}
                                  type="number"
                                  placeholder="0.00"
                                  value={paymentAmounts[m.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setPaymentAmounts(prev => ({ ...prev, [m.id]: val }));
                                  }}
                                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-left font-black text-xs outline-none focus:border-indigo-500"
                                />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">ج.م</span>
                              </div>
                            </div>
                            {(parseFloat(paymentAmounts[m.id] || '0') || 0) > 0 && m.type === 'digital' && (
                              <div className="flex justify-end animate-slideDown">
                                <input 
                                  disabled={isSaving}
                                  type="text"
                                  placeholder={`رقم المرجع لعملية ${m.name}...`}
                                  value={paymentReferences[m.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setPaymentReferences(prev => ({ ...prev, [m.id]: val }));
                                  }}
                                  className="w-48 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-[10px] outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(isSplitPayment || isFullDebt) && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-bold text-slate-600 text-right">
                        <div className="flex justify-between">
                          <span>إجمالي الفاتورة:</span>
                          <span className="text-slate-800">{total.toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between text-indigo-600">
                          <span>مجموع المبالغ المسددة:</span>
                          <span>{sumOfPayments.toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black">
                          <span>المتبقي كمديونية (آجل):</span>
                          <span className={outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                            {outstanding.toFixed(2)} ج.م
                          </span>
                        </div>
                        {sumOfPayments > total && (
                          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black text-center animate-pulse">
                            ⚠️ تنبيه: المجموع يتجاوز قيمة الفاتورة!
                          </div>
                        )}
                      </div>
                    )}

                    {outstanding > 0 && (
                      <div className="space-y-1.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-100 animate-slideDown text-right">
                        <label className="text-[10px] font-black text-amber-800 mr-1 tracking-wide block">تاريخ استحقاق الدين (سداد المديونية)</label>
                        <input 
                          disabled={isSaving}
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-amber-200 focus:border-amber-500 rounded-xl outline-none font-bold text-xs text-center"
                        />
                        <p className="text-[8px] text-amber-600 font-bold block mt-1">تنبيه: سيتم تسجيل {outstanding.toFixed(2)} ج.م في ذمة العميل، ويجب تحديد عميل حقيقي بالأعلى.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 border-t border-slate-50 pt-4">
                     <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest block">خصم إضافي للفاتورة</label>
                     <div className="flex items-center gap-2">
                        <input 
                          disabled={isSaving}
                          type="number"
                          min="0"
                          value={invoiceDiscountValue || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val < 0) {
                              alert('لا يمكن إدخال قيم سالبة للخصم');
                              return;
                            }
                            setInvoiceDiscountValue(val);
                            addTimelineEvent(`تغيير الخصم الإضافي للفاتورة إلى ${val}`, 'warn');
                          }}
                          placeholder="0.00"
                          className="flex-grow px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none font-bold text-sm shadow-inner transition-all disabled:opacity-50"
                        />
                        <button 
                          type="button"
                          disabled={isSaving}
                          onClick={() => {
                            const nextType = invoiceDiscountType === 'percent' ? 'fixed' : 'percent';
                            setInvoiceDiscountType(nextType);
                            addTimelineEvent(`تغيير نوع خصم الفاتورة إلى: ${nextType === 'percent' ? 'نسبة' : 'قيمة ثابتة'}`, 'warn');
                          }}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 border"
                        >
                          {invoiceDiscountType === 'percent' ? '%' : 'ج.م'}
                        </button>
                     </div>
                  </div>

                  {order && (
                    <div className="space-y-2 animate-fadeIn">
                       <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">حالة الطلب</label>
                       <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border">
                          <button 
                            disabled={isSaving || order.status === 'completed'}
                            type="button"
                            onClick={() => setCustomerInfo({...customerInfo, status: 'pending'})}
                            className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.status === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'} disabled:opacity-30`}
                            title={order.status === 'completed' ? "لا يمكن إعادة الفاتورة المكتملة إلى حالة معلق" : "تعليق الطلب"}
                          >
                            <span>⏳</span> معلق
                          </button>
                          <button 
                            disabled={isSaving}
                            type="button"
                            onClick={() => setCustomerInfo({...customerInfo, status: 'completed'})}
                            className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.status === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'} disabled:opacity-30`}
                          >
                            <span>✓</span> مكتمل
                          </button>
                       </div>
                       {order.status === 'completed' && (
                         <p className="text-[9px] text-slate-400 font-bold text-center mt-1">
                           ⚠️ لا يمكن تحويل الفاتورة المكتملة إلى معلقة محاسبياً.
                         </p>
                       )}
                    </div>
                  )}

                 <div className="space-y-2.5 pt-4 border-t border-slate-100 text-[10px] md:text-xs font-bold text-slate-500 text-right">
                    <div className="flex justify-between">
                       <span>المجموع قبل الخصم:</span>
                       <span className="text-slate-800 font-Cairo">{subtotalBeforeDiscount.toFixed(2)} ج.م</span>
                    </div>
                    {totalItemDiscounts > 0 && (
                      <div className="flex justify-between text-rose-600">
                         <span>خصومات المنتجات:</span>
                         <span className="font-Cairo font-black">-{totalItemDiscounts.toFixed(2)} ج.م</span>
                      </div>
                    )}
                    {invoiceDiscount > 0 && (
                      <div className="flex justify-between text-rose-600">
                         <span>خصم الفاتورة:</span>
                         <span className="font-Cairo font-black">-{invoiceDiscount.toFixed(2)} ج.م</span>
                      </div>
                    )}
                    {isDeliveryEnabled && (
                      <div className="flex justify-between text-emerald-600">
                         <span>رسوم التوصيل:</span>
                         <span className="font-Cairo">+{globalDeliveryFee.toFixed(2)} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline text-lg md:text-3xl font-black text-slate-900 pt-2 border-t border-dashed">
                       <span className="text-slate-400 text-sm md:text-base">الإجمالي النهائي:</span>
                       <span className="text-emerald-600 font-Cairo">{total.toFixed(2)} ج.م</span>
                    </div>
                 </div>

                 <button 
                   disabled={invoiceItems.length === 0 || isSaving}
                   onClick={() => setShowPreview(true)}
                   className={`w-full text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-sm md:text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-40 bg-slate-900 hover:bg-emerald-600`}
                 >
                    {order ? 'تحديث الفاتورة 🔄' : (isOnline ? 'حفظ الطلب الفوري' : 'حفظ الفاتورة محلياً (أوفلاين)')}
                 </button>
              </div>
           </div>

           {/* مساعد المبيعات الذكي - AI Sales Assistant Panel */}
           <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 space-y-6 text-right animate-slideUp">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm md:text-base">مساعد المبيعات الذكي</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">AI Sales Assistant</p>
                  </div>
                </div>
                {/* Invoice Health Indicator */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${assistantData.healthColor}`}>
                  {assistantData.healthLabel}
                </div>
              </div>

              {/* 1. Customer Summary */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-700 text-xs flex items-center gap-1.5 border-b pb-1.5 border-slate-200/50">
                  <span>👤</span> تحليل العميل
                </h4>
                {assistantData.selectedUser ? (
                  <div className="space-y-2 text-[11px] font-bold text-slate-500">
                    <div className="flex justify-between">
                      <span>الاسم:</span>
                      <span className="text-slate-800 font-black">{assistantData.selectedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تصنيف العميل:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        assistantData.customerType === 'vip' ? 'bg-amber-100 text-amber-700' :
                        assistantData.customerType === 'regular' ? 'bg-indigo-100 text-indigo-700' :
                        assistantData.customerType === 'debtor' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {assistantData.customerType === 'vip' ? 'عميل مميز (VIP) 🌟' :
                         assistantData.customerType === 'regular' ? 'عميل دائم 🤝' :
                         assistantData.customerType === 'debtor' ? 'عميل متعثر (مديونية) ⚠️' :
                         'عميل جديد 🌱'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي المشتريات:</span>
                      <span className="text-slate-800 font-Cairo font-black">{assistantData.customerTotalPurchases.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الطلبات السابقة:</span>
                      <span className="text-slate-800 font-Cairo font-black">{assistantData.customerOrdersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط الفاتورة (AOV):</span>
                      <span className="text-slate-800 font-Cairo font-black">{assistantData.customerAOV.toFixed(2)} ج.م</span>
                    </div>
                    {assistantData.customerLastOrder && (
                      <div className="flex justify-between">
                        <span>آخر عملية شراء:</span>
                        <span className="text-slate-800 font-Cairo font-black">{formatTimeAgo(assistantData.customerLastOrder)}</span>
                      </div>
                    )}
                    {assistantData.customerDebt > 0 && (
                      <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-dashed border-rose-200">
                        <span>مديونية معلقة:</span>
                        <span>{assistantData.customerDebt.toFixed(2)} ج.م</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold">لم يتم تحديد عميل مسجل (البيع لعميل نقدي افتراضي)</p>
                    <p className="text-[8.5px] text-indigo-500 font-black">💡 يُقترح ربط الفاتورة برقم هاتف لحفظ مبيعات ونقاط العميل.</p>
                  </div>
                )}
              </div>

              {/* 2. Profitability (Manager Only) */}
              {currentUser?.role === 'admin' && (
                <div className="space-y-3 bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100/50">
                  <h4 className="font-black text-indigo-700 text-xs flex items-center gap-1.5 border-b pb-1.5 border-indigo-100">
                    <span>📈</span> مساعد الربحية والتحليل المالي
                  </h4>
                  <div className="space-y-2 text-[11px] font-bold text-slate-500">
                    <div className="flex justify-between">
                      <span>تكلفة الأصناف الإجمالية:</span>
                      <span className="text-slate-800 font-Cairo font-black">{assistantData.totalCost.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-black">
                      <span>الربح الإجمالي المتوقع:</span>
                      <span className="font-Cairo font-black">{assistantData.expectedProfit.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>هامش الربح (%):</span>
                      <span className="text-indigo-600 font-Cairo font-black">{assistantData.profitMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Alerts */}
              {assistantData.alerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-700 text-xs flex items-center gap-1.5 mr-1">
                    <span>⚠️</span> التنبيهات والتحذيرات ({assistantData.alerts.length})
                  </h4>
                  <div className="space-y-2">
                    {assistantData.alerts.map((alert, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border text-[10px] font-bold leading-relaxed flex gap-2 items-start ${
                          alert.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                          alert.type === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-sky-50 border-sky-100 text-sky-700'
                        }`}
                      >
                        <span className="text-[12px] shrink-0">{alert.type === 'danger' ? '🚫' : alert.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
                        <span>{alert.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Suggestions */}
              {assistantData.suggestions.length > 0 && (
                <div className="space-y-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/50">
                  <h4 className="font-black text-emerald-700 text-xs flex items-center gap-1.5 border-b pb-1.5 border-emerald-100">
                    <span>💡</span> مقترحات ذكية (Cross-Sell & Hints)
                  </h4>
                  <div className="space-y-2">
                    {assistantData.suggestions.map((sug, i) => (
                      <div key={i} className="text-[10px] font-bold text-slate-600 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-500 shrink-0">✨</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Live Timeline */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="font-black text-slate-400 text-[10px] flex items-center justify-between uppercase tracking-wider">
                  <span>سجل حركات الفاتورة اللحظي (Audit Trail)</span>
                  <button 
                    type="button" 
                    onClick={() => setInvoiceTimeline([{ id: 'init', time: Date.now(), text: 'بدء إنشاء فاتورة جديدة', type: 'info' }])}
                    className="text-[9px] font-black text-rose-500 hover:bg-rose-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    تصفير السجل
                  </button>
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 no-scrollbar text-right text-[9px] font-bold">
                  {invoiceTimeline.slice().reverse().map((evt) => (
                    <div key={evt.id} className="flex justify-between items-center text-slate-400 gap-2">
                      <span className={`text-[8.5px] truncate ${
                        evt.type === 'success' ? 'text-emerald-600' :
                        evt.type === 'danger' ? 'text-rose-500' :
                        evt.type === 'warn' ? 'text-amber-600' :
                        'text-slate-600'
                      }`}>
                        {evt.text}
                      </span>
                      <span className="font-mono text-[8px] opacity-70 shrink-0">
                        {new Date(evt.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;
