
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

interface AdminInvoiceFormProps {
  products: Product[];
  onSubmit: (order: Order) => void;
  onCancel: () => void;
  initialCustomerName?: string;
  initialPhone?: string;
}

const AdminInvoiceForm: React.FC<AdminInvoiceFormProps> = ({ 
  products, onSubmit, onCancel, initialCustomerName = 'عميل نقدي', initialPhone = '' 
}) => {
  const [invoiceItems, setInvoiceItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: initialCustomerName,
    phone: initialPhone,
    city: 'فاقوس',
    address: '',
    paymentMethod: 'نقدي (تم الدفع)'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 8);
  }, [products, searchQuery]);

  const addItemToInvoice = (product: Product) => {
    if (isOnline && product.stockQuantity <= 0) {
      alert('عذراً، هذا المنتج غير متوفر في المخزن حالياً!');
      return;
    }
    
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (isOnline && existing.quantity >= product.stockQuantity) {
          alert('وصلت للحد الأقصى المتاح في المخزن لهذا المنتج');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const exactMatch = products.find(p => p.barcode === q);
    if (exactMatch) {
      addItemToInvoice(exactMatch);
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  const updateQuantity = (id: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(1, item.quantity + delta);
        if (isOnline && product && newQty > product.stockQuantity) {
          alert('الكمية المطلوبة غير متوفرة بالكامل في المخزن');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => 
    invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [invoiceItems]);

  const total = subtotal;

  const handleFinalSubmit = () => {
    if (invoiceItems.length === 0) return alert('يرجى إضافة منتجات للفاتورة');
    if (!customerInfo.phone) return alert('يرجى إدخال رقم الهاتف لمتابعة الطلب');
    
    const orderId = (isOnline ? 'INV-' : 'OFF-') + Date.now().toString().slice(-8);
    
    const newOrder: Order = {
      id: orderId,
      customerName: customerInfo.name,
      phone: customerInfo.phone,
      city: customerInfo.city,
      address: customerInfo.address || 'استلام فرع (كاشير)',
      items: invoiceItems,
      subtotal,
      total,
      paymentMethod: customerInfo.paymentMethod,
      status: 'completed',
      createdAt: Date.now()
    };

    onSubmit(newOrder);
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
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">إلغاء الفاتورة؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8">سيتم مسح جميع الأصناف التي قمت بإضافتها حالياً.</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg">نعم، إلغاء</button>
              <button onClick={() => setShowCancelConfirm(false)} className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
             <div className="p-6 md:p-10 text-center space-y-4 md:space-y-6 overflow-y-auto no-scrollbar flex-grow">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">🧾</div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">حفظ الفاتورة</h3>
                
                {!isOnline && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl text-orange-800 text-xs font-bold animate-pulse">
                    ⚠️ أنت الآن في وضع الأوفلاين. سيتم حفظ الفاتورة في "قائمة الانتظار" وإرسالها بمجرد عودة الإنترنت.
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
                   <div className="flex justify-between text-xl md:text-2xl font-black pt-4 mt-2 border-t border-slate-200">
                      <span className="text-slate-400">الإجمالي:</span>
                      <span className="text-emerald-600">{total.toFixed(2)} <small className="text-[10px]">ج.م</small></span>
                   </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                   <button 
                    onClick={handleFinalSubmit} 
                    className={`w-full py-4 md:py-5 rounded-2xl font-black shadow-xl active:scale-95 text-base text-white transition-all ${isOnline ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-orange-600 shadow-orange-100 hover:bg-orange-700'}`}
                   >
                     {isOnline ? 'إتمام وحفظ الفاتورة' : 'حفظ محلياً (أوفلاين)'}
                   </button>
                   <button onClick={() => setShowPreview(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors">
                     تعديل البيانات
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 md:mb-10 px-2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight">كاشير سوق العصر</h2>
            <p className="text-emerald-600 font-black text-[8px] md:text-[10px] uppercase mt-0.5 tracking-widest">إدارة المبيعات الفورية</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-100 text-orange-600 animate-pulse'}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span className="text-[10px] font-black">{isOnline ? 'متصل' : 'أوفلاين'}</span>
          </div>
        </div>
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="bg-white border-2 border-slate-100 px-4 py-1.5 md:px-8 md:py-3 rounded-xl font-black text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition text-[10px] md:text-xs">إلغاء</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        <div className="lg:col-span-8 space-y-4 md:space-y-8">
          <div className="bg-white p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50">
            <div className="relative mb-6 md:mb-10">
               <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-2 md:mr-4 mb-1.5 block tracking-widest">البحث عن منتج (اسم أو باركود)</label>
               <div className="relative group">
                 <input 
                   ref={searchInputRef}
                   type="text" 
                   placeholder="ابحث هنا..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full px-4 md:px-8 py-3.5 md:py-5 pr-12 md:pr-16 bg-slate-50 rounded-xl md:rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-black text-sm md:text-lg border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner"
                 />
                 <button 
                  onClick={() => setShowScanner(true)}
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-lg hover:bg-slate-900 transition-all"
                 >
                   <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </button>
               </div>
               
               {searchQuery.trim() && filteredProducts.length > 0 && (
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
                              <p className="text-[8px] md:text-[10px] font-black text-emerald-600">{p.price} ج.م</p>
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
                 {invoiceItems.length > 0 && (
                   <button onClick={() => setInvoiceItems([])} className="text-[10px] text-rose-500 font-black hover:underline">مسح الكل</button>
                 )}
               </h3>
               
               <div className="overflow-x-auto border border-slate-50 rounded-xl md:rounded-[2rem] no-scrollbar">
                  <table className="w-full text-right min-w-[400px]">
                    <thead className="bg-slate-50 text-[8px] md:text-[10px] font-black text-slate-400 uppercase border-b">
                      <tr>
                        <th className="px-4 md:px-8 py-3 md:py-5">المنتج</th>
                        <th className="px-4 md:px-8 py-3 md:py-5">الكمية</th>
                        <th className="px-4 md:px-8 py-3 md:py-5">السعر</th>
                        <th className="px-4 md:px-8 py-3 md:py-5 text-left">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-slate-300 font-bold text-xs">سلة الفاتورة فارغة..</td>
                        </tr>
                      ) : (
                        invoiceItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                            <td className="px-4 md:px-8 py-3">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 text-[11px] md:text-sm leading-tight">{item.name}</span>
                                <button onClick={() => removeItem(item.id)} className="text-[8px] text-rose-400 font-bold text-right mt-0.5 hover:text-rose-600">حذف ✕</button>
                              </div>
                            </td>
                            <td className="px-4 md:px-8 py-3">
                              <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 rounded-lg px-1 py-0.5 w-fit border border-slate-100">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm">-</button>
                                <span className="font-black text-[11px] md:text-xs w-5 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm">+</button>
                              </div>
                            </td>
                            <td className="px-4 md:px-8 py-3 font-bold text-slate-500 text-[11px] md:text-sm">{item.price}</td>
                            <td className="px-4 md:px-8 py-3 text-left">
                               <span className="font-black text-emerald-600 text-[11px] md:text-sm">{(item.price * item.quantity).toFixed(1)} ج.م</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 md:space-y-8">
           <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50 space-y-6">
              <h3 className="font-black text-slate-800 text-sm md:text-xl border-b pb-4 border-slate-50 text-center uppercase tracking-tighter">بيانات العميل</h3>
              
              <div className="space-y-4 md:space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">اسم العميل</label>
                    <input 
                      type="text"
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm shadow-inner transition-all"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">رقم الموبايل</label>
                    <input 
                      type="tel"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="01xxxxxxxxx"
                      className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl md:rounded-2xl outline-none font-bold text-center text-sm shadow-inner transition-all"
                      dir="ltr"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">طريقة الدفع</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border">
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'نقدي (تم الدفع)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('نقدي') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         <span>💰</span> نقدي
                       </button>
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'آجل (مديونية)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('آجل') ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         <span>⏳</span> آجل
                       </button>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-baseline text-lg md:text-3xl font-black text-slate-900 pt-1">
                       <span className="text-slate-400 text-sm md:text-base">الإجمالي:</span>
                       <span className="text-emerald-600">{total.toFixed(2)} ج.م</span>
                    </div>
                 </div>

                 <button 
                   disabled={invoiceItems.length === 0}
                   onClick={() => setShowPreview(true)}
                   className={`w-full text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-sm md:text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-40 ${isOnline ? 'bg-slate-900 hover:bg-emerald-600' : 'bg-orange-600 hover:bg-orange-700'}`}
                 >
                    {isOnline ? 'حفظ الطلب الفوري' : 'حفظ الفاتورة (أوفلاين)'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;
