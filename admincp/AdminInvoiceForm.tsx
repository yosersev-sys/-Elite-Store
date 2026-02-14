import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem } from '../types';

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.innerWidth > 768) {
      searchInputRef.current?.focus();
    }
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 8);
  }, [products, searchQuery]);

  const addItemToInvoice = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert('عذراً، هذا المنتج غير متوفر في المخزن حالياً!');
      return;
    }
    
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
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
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return; 

    const exactMatch = products.find(p => p.barcode && p.barcode === trimmedQuery);
    if (exactMatch) {
      addItemToInvoice(exactMatch);
      setSearchQuery(''); 
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  }, [searchQuery, products]);

  const updateQuantity = (id: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(1, item.quantity + delta);
        if (product && newQty > product.stockQuantity) {
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
    if (!customerInfo.phone) return alert('يرجى إدخل رقم الهاتف لمتابعة الطلب');
    
    const newOrder: Order = {
      id: 'INV-' + Date.now().toString().slice(-6),
      customerName: customerInfo.name,
      phone: customerInfo.phone,
      city: customerInfo.city,
      address: customerInfo.address || 'استلام فرع',
      items: invoiceItems,
      subtotal,
      total,
      paymentMethod: customerInfo.paymentMethod,
      status: 'completed',
      createdAt: Date.now()
    };

    onSubmit(newOrder);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-2 md:px-4 animate-fadeIn">
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">هل تريد الإلغاء؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">سيتم مسح جميع الأصناف المضافة للفاتورة الحالية.</p>
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-rose-600 transition shadow-lg active:scale-95"
              >
                نعم، إلغاء
              </button>
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition active:scale-95"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white rounded-t-[2rem] md:rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 animate-slideUp overflow-hidden">
             <div className="p-6 md:p-8 text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">🧾</div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">تأكيد الطلب</h3>
                
                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl space-y-2 md:space-y-3">
                   <div className="flex justify-between font-bold text-xs md:text-sm">
                      <span className="text-slate-400">العميل:</span>
                      <span className="text-slate-800 truncate max-w-[150px]">{customerInfo.name}</span>
                   </div>
                   <div className="flex justify-between font-bold text-xs md:text-sm">
                      <span className="text-slate-400">طريقة الدفع:</span>
                      <span className={customerInfo.paymentMethod.includes('آجل') ? 'text-orange-600' : 'text-emerald-600'}>{customerInfo.paymentMethod}</span>
                   </div>
                   <div className="flex justify-between text-xl md:text-2xl font-black pt-2 border-t border-slate-200">
                      <span className="text-slate-400">الإجمالي:</span>
                      <span className="text-emerald-600">{total.toFixed(2)} ج.م</span>
                   </div>
                </div>

                <div className="flex gap-2 md:gap-3">
                   <button onClick={handleFinalSubmit} className="flex-grow bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95 text-sm md:text-base">تأكيد الطلب</button>
                   <button onClick={() => setShowPreview(false)} className="flex-grow bg-slate-100 text-slate-500 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-sm md:text-base">رجوع</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 md:mb-10 px-2">
        <div>
          <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight">إنشاء طلب سريع</h2>
          <p className="text-emerald-600 font-black text-[8px] md:text-[10px] uppercase mt-0.5 tracking-widest">سوق العصر - نظام الكاشير</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowCancelConfirm(true)} 
          className="bg-white border-2 border-slate-100 px-4 py-1.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition text-[10px] md:text-xs"
        >
          إلغاء
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        <div className="lg:col-span-8 space-y-4 md:space-y-8">
          <div className="bg-white p-4 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50">
            <div className="relative mb-6 md:mb-10">
               <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-2 md:mr-4 mb-1.5 block tracking-widest">البحث عن منتج (اسم أو باركود)</label>
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="ابحث هنا..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full px-4 md:px-8 py-3.5 md:py-5 bg-slate-50 rounded-xl md:rounded-3xl outline-none focus:ring-4 focus:ring-emerald-50/20 font-black text-sm md:text-lg border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner"
               />
               
               {searchQuery.trim() && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 md:mt-4 bg-white border border-slate-100 rounded-[1rem] md:rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-slideUp">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { addItemToInvoice(p); setSearchQuery(''); }}
                        className="w-full px-4 md:px-8 py-3 md:py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b last:border-none"
                      >
                        <div className="flex items-center gap-3 md:gap-5 text-right overflow-hidden">
                           <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                           </div>
                           <div className="truncate">
                              <p className="font-black text-slate-800 text-[11px] md:text-base truncate">{p.name}</p>
                              <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase">السعر: {p.price} ج.م</p>
                           </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-600 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black shadow-sm text-sm shrink-0">+</span>
                      </button>
                    ))}
                  </div>
               )}
            </div>

            <div className="space-y-3">
               <h3 className="font-black text-slate-800 text-sm md:text-xl px-2 flex items-center justify-between">
                 <span>الأصناف ({invoiceItems.length})</span>
                 {invoiceItems.length > 0 && (
                   <button onClick={() => setInvoiceItems([])} className="text-[10px] text-rose-500 font-black hover:underline">مسح السلة</button>
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
                          <td colSpan={4} className="px-4 py-12 text-center text-slate-300 font-bold text-xs">لا يوجد أصناف حالياً</td>
                        </tr>
                      ) : (
                        invoiceItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                            <td className="px-4 md:px-8 py-3">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 text-[11px] md:text-sm leading-tight">{item.name}</span>
                                <button onClick={() => removeItem(item.id)} className="text-[8px] text-rose-400 font-bold text-right mt-0.5 hover:text-rose-600 md:opacity-0 group-hover:opacity-100 transition-opacity">حذف ✕</button>
                              </div>
                            </td>
                            <td className="px-4 md:px-8 py-3">
                              <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 rounded-lg px-1 py-0.5 w-fit border border-slate-100">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm transition-colors">-</button>
                                <span className="font-black text-[11px] md:text-xs w-5 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-md text-emerald-600 font-black text-sm shadow-sm transition-colors">+</button>
                              </div>
                            </td>
                            <td className="px-4 md:px-8 py-3 font-bold text-slate-500 text-[11px] md:text-sm whitespace-nowrap">{item.price} <small className="text-[8px]">ج.م</small></td>
                            <td className="px-4 md:px-8 py-3 text-left">
                               <span className="font-black text-emerald-600 text-[11px] md:text-sm whitespace-nowrap">{(item.price * item.quantity).toFixed(1)} <small className="text-[8px]">ج.م</small></span>
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

        <div className="lg:col-span-4 space-y-4 md:space-y-8 pb-10">
           <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-50 space-y-6">
              <h3 className="font-black text-slate-800 text-sm md:text-xl border-b pb-4 border-slate-50 text-center uppercase tracking-tighter">بيانات العميل والدفع</h3>
              
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
                    <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase mr-1 tracking-widest">نوع الدفع</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl md:rounded-2xl border">
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'نقدي (تم الدفع)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('نقدي') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         <span>💰</span>
                         <span>نقدي</span>
                       </button>
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'آجل (مديونية)'})}
                         className={`py-2.5 md:py-3.5 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-1.5 ${customerInfo.paymentMethod.includes('آجل') ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         <span>⏳</span>
                         <span>آجل</span>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-baseline">
                       <span className="text-slate-400 font-black text-[10px] md:text-xs">المجموع</span>
                       <span className="text-slate-600 font-bold text-sm md:text-lg">{total.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center text-lg md:text-3xl font-black text-slate-900 pt-1">
                       <span className="text-slate-400 text-sm md:text-base">الإجمالي</span>
                       <span className="text-emerald-600">{total.toFixed(2)} <small className="text-[10px] md:text-sm">ج.م</small></span>
                    </div>
                 </div>

                 <button 
                   disabled={invoiceItems.length === 0}
                   onClick={() => setShowPreview(true)}
                   className="w-full bg-slate-900 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-sm md:text-xl shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale"
                 >
                    حفظ الطلب الفوري
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;