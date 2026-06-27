
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem, User } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { ApiService } from '../services/api';

interface AdminInvoiceFormProps {
  products: Product[];
  users: User[];
  orders: Order[];
  globalDeliveryFee: number;
  onSubmit: (order: Order) => Promise<void> | void;
  onCancel: () => void;
  initialCustomerName?: string;
  initialPhone?: string;
  order?: Order | null;
}

const AdminInvoiceForm: React.FC<AdminInvoiceFormProps> = ({ 
  products, users = [], orders = [], globalDeliveryFee, onSubmit, onCancel, initialCustomerName = 'عميل نقدي', initialPhone = '', order = null 
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

  const addItemToInvoice = (product: Product) => {
    if (!order && product.stockQuantity <= 0) {
      alert('عذراً، هذا المنتج غير متوفر في المخزن حالياً!');
      return;
    }
    
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const availableInStock = order 
           ? product.stockQuantity + (order.items.find(i => i.id === product.id)?.quantity || 0)
           : product.stockQuantity;

        if (existing.quantity >= availableInStock) {
          alert('وصلت للحد الأقصى المتاح في المخزن لهذا المنتج');
          return prev;
        }
        const step = existing.unit === 'kg' ? 0.1 : 1;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: Number((item.quantity + step).toFixed(3)) } : item
        );
      }
      return [...prev, { ...product, quantity: 1, discountType: 'fixed', discountValue: 0 }];
    });
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const exactMatch = products.find(p => p.barcode && String(p.barcode) === q);
    if (exactMatch) {
      addItemToInvoice(exactMatch);
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  const updateQuantity = (id: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0.001, Number((item.quantity + delta).toFixed(3)));
        
        const availableInStock = (order && product)
           ? product.stockQuantity + (order.items.find(i => i.id === id)?.quantity || 0)
           : (product?.stockQuantity || 0);

        if (product && newQty > availableInStock) {
          alert('الكمية المطلوبة غير متوفرة بالكامل في المخزن');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setDirectQuantity = (id: string, value: string) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;
    
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const availableInStock = (order && product)
           ? product.stockQuantity + (order.items.find(i => i.id === id)?.quantity || 0)
           : (product?.stockQuantity || 0);

        if (product && val > availableInStock) {
          alert('الكمية المدخلة تتجاوز المتاح بالمخزن');
          return item;
        }
        return { ...item, quantity: Number(val.toFixed(3)) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const getItemDiscountAmount = (item: CartItem) => {
    const val = item.discountValue || 0;
    if (item.discountType === 'percent') {
      return Number(((item.price * val) / 100).toFixed(2));
    }
    return val;
  };

  const setItemDiscountValue = (id: string, value: string) => {
    const val = parseFloat(value) || 0;
    if (val < 0) {
      alert('لا يمكن إدخال قيم سالبة للخصم');
      return;
    }
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
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

  const toggleItemDiscountType = (id: string) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
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

  const handleFinalSubmit = async () => {
    if (isSaving) return;
    if (invoiceItems.length === 0) return alert('يرجى إضافة منتجات للفاتورة');
    if (!customerInfo.phone) return alert('يرجى إدخال رقم الهاتف لمتابعة الطلب');
    if (isDeliveryEnabled && !customerInfo.address.trim()) return alert('يرجى إدخال عنوان التوصيل');
    if (order && order.status === 'completed' && !editReason.trim()) {
      return alert('يرجى إدخال سبب تعديل الخصومات/الفاتورة للمتابعة المحاسبية');
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
      
      const newOrder: Order = {
        id: orderId,
        customerName: customerInfo.name,
        phone: customerInfo.phone,
        city: customerInfo.city,
        address: isDeliveryEnabled ? customerInfo.address.trim() : 'استلام فرع (كاشير)',
        items: invoiceItems,
        subtotal: subtotalBeforeDiscount,
        total: total,
        paymentMethod: customerInfo.paymentMethod,
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
        editReason: (order && order.status === 'completed') ? editReason : undefined
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
    setSearchQuery(code);
    setShowScanner(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-2 md:px-4 animate-fadeIn">
      {showScanner && <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
      
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
                       <span className={customerInfo.paymentMethod.includes('آجل') ? 'text-orange-600' : 'text-emerald-600'}>{customerInfo.paymentMethod}</span>
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
                                <span className="text-slate-400 font-bold mr-2">| المتاح: {p.stockQuantity} {p.unit === 'piece' ? 'قطعة' : p.unit === 'kg' ? 'كجم' : 'جرام'}</span>
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
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                              <td className="px-4 md:px-8 py-3">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-800 text-[11px] md:text-sm leading-tight">{item.name}</span>
                                  <span className="text-[9px] text-slate-400 font-black text-right mt-0.5">المخزون المتبقي: {item.stockQuantity} {item.unit === 'piece' ? 'قطعة' : item.unit === 'kg' ? 'كجم' : 'جرام'}</span>
                                  {!isSaving && (
                                    <button onClick={() => removeItem(item.id)} className="text-[8px] text-rose-400 font-bold text-right mt-0.5 hover:text-rose-600">حذف ✕</button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 md:px-8 py-3">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                  <div className="flex items-center bg-slate-50 rounded-lg px-1 py-0.5 border border-slate-100">
                                    <button disabled={isSaving} onClick={() => updateQuantity(item.id, -(item.unit === 'kg' ? 0.1 : 1))} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm disabled:opacity-30">-</button>
                                    <input 
                                      disabled={isSaving}
                                      type="number"
                                      step={item.unit === 'kg' ? "0.001" : "1"}
                                      value={item.quantity}
                                      onChange={(e) => setDirectQuantity(item.id, e.target.value)}
                                      className="bg-transparent font-black text-[11px] md:text-xs w-14 text-center outline-none disabled:opacity-50"
                                    />
                                    <button disabled={isSaving} onClick={() => updateQuantity(item.id, (item.unit === 'kg' ? 0.1 : 1))} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm disabled:opacity-30">+</button>
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400">{item.unit === 'kg' ? 'كجم' : 'ق'}</span>
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
                                    onChange={(e) => setItemDiscountValue(item.id, e.target.value)}
                                    className="w-16 px-1.5 py-1 text-center bg-slate-50 border rounded-lg text-[10px] font-bold outline-none focus:border-emerald-500"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => toggleItemDiscountType(item.id)}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[9px] font-black text-slate-600 border"
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
                        })
                      )}
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

                 {/* خيار رسوم التوصيل - Toggle Switch */}
                 <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 transition-all">
                    <div>
                      <p className="font-black text-emerald-800 text-xs">خدمة توصيل للمنزل؟</p>
                      <p className="text-[9px] text-emerald-600 font-bold">سيتم إضافة {globalDeliveryFee} ج.م للفاتورة</p>
                    </div>
                    <button 
                      disabled={isSaving}
                      type="button"
                      onClick={() => setIsDeliveryEnabled(!isDeliveryEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDeliveryEnabled ? 'bg-emerald-600' : 'bg-slate-300'} disabled:opacity-50`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDeliveryEnabled ? 'right-7' : 'right-1'}`}></div>
                    </button>
                 </div>

                 {/* حقل العنوان - يظهر فقط عند تفعيل التوصيل */}
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

                  {/* خصم الفاتورة */}
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
                          }}
                          placeholder="0.00"
                          className="flex-grow px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none font-bold text-sm shadow-inner transition-all disabled:opacity-50"
                        />
                        <button 
                          type="button"
                          disabled={isSaving}
                          onClick={() => setInvoiceDiscountType(p => p === 'percent' ? 'fixed' : 'percent')}
                          className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 border"
                        >
                          {invoiceDiscountType === 'percent' ? '%' : 'ج.م'}
                        </button>
                     </div>
                  </div>

                 <div className="space-y-2">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">طريقة الدفع</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border">
                       <button 
                         disabled={isSaving}
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'نقدي (تم الدفع)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('نقدي') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'} disabled:opacity-30`}
                       >
                         <span>💰</span> نقدي
                       </button>
                       <button 
                         disabled={isSaving}
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'آجل (مديونية)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('آجل') ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'} disabled:opacity-30`}
                       >
                         <span>⏳</span> آجل
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
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;
