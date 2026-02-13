
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem } from '../types';

interface AdminInvoiceFormProps {
  products: Product[];
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const AdminInvoiceForm: React.FC<AdminInvoiceFormProps> = ({ products, onSubmit, onCancel }) => {
  const [invoiceItems, setInvoiceItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: 'عميل نقدي',
    phone: '',
    city: 'فاقوس',
    address: '',
    paymentMethod: 'نقدي (تم الدفع)' // الحالة الافتراضية
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 6);
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
    
    const newOrder: Order = {
      id: 'INV-' + Date.now().toString().slice(-6),
      customerName: customerInfo.name,
      phone: customerInfo.phone || '00000000000',
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
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
      {/* معاينة الفاتورة قبل الحفظ */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowPreview(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 animate-slideUp overflow-hidden">
             <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl">🧾</div>
                <h3 className="text-2xl font-black text-slate-800">تأكيد العملية</h3>
                
                <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                   <div className="flex justify-between font-bold">
                      <span className="text-slate-400">نوع الفاتورة:</span>
                      <span className={customerInfo.paymentMethod.includes('آجل') ? 'text-orange-600' : 'text-emerald-600'}>{customerInfo.paymentMethod}</span>
                   </div>
                   <div className="flex justify-between text-2xl font-black">
                      <span className="text-slate-400">الإجمالي:</span>
                      <span className="text-emerald-600">{total.toFixed(2)} ج.م</span>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button onClick={handleFinalSubmit} className="flex-grow bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition active:scale-95">تأكيد وحفظ</button>
                   <button onClick={() => setShowPreview(false)} className="flex-grow bg-slate-100 text-slate-500 py-5 rounded-2xl font-black">رجوع</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900">نقطة البيع (POS)</h2>
          <p className="text-emerald-600 font-black text-xs uppercase mt-1">سوق العصر - إدارة المبيعات المباشرة</p>
        </div>
        <button onClick={onCancel} className="bg-white border-2 border-slate-100 px-8 py-3 rounded-2xl font-black text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">إلغاء العملية</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50">
            <div className="relative mb-10">
               <label className="text-[10px] font-black text-slate-400 uppercase mr-4 mb-2 block">ابحث أو امسح الباركود</label>
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="اسم المنتج أو كود الباركود..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full px-8 py-5 bg-slate-50 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-50/10 font-black text-lg border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner"
               />
               
               {searchQuery.trim() && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-slideUp">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { addItemToInvoice(p); setSearchQuery(''); }}
                        className="w-full px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b last:border-none"
                      >
                        <div className="flex items-center gap-5 text-right">
                           <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <p className="font-black text-slate-800 text-base">{p.name}</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase">السعر: {p.price} ج.م</p>
                           </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center font-black">+</span>
                      </button>
                    ))}
                  </div>
               )}
            </div>

            <div className="space-y-4">
               <h3 className="font-black text-slate-800 text-xl px-2">الأصناف المختارة</h3>
               <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                      <tr>
                        <th className="px-8 py-5">المنتج</th>
                        <th className="px-8 py-5">الكمية</th>
                        <th className="px-8 py-5">السعر</th>
                        <th className="px-8 py-5">الإجمالي</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoiceItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-8 py-4">
                            <p className="font-black text-slate-800 text-sm">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.barcode || 'بدون كود'}</p>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-2 py-1 w-fit">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-emerald-600 font-black">-</button>
                              <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-emerald-600 font-black">+</button>
                            </div>
                          </td>
                          <td className="px-8 py-4 font-bold text-slate-600">{item.price} ج.م</td>
                          <td className="px-8 py-4 font-black text-emerald-600">{(item.price * item.quantity).toFixed(2)} ج.م</td>
                          <td className="px-8 py-4 text-left">
                            <button onClick={() => removeItem(item.id)} className="p-2 text-rose-300 hover:text-rose-500 transition">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
              <h3 className="font-black text-slate-800 text-xl border-b pb-4 border-slate-50 text-center">تفاصيل الفاتورة</h3>
              
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">حالة الدفع</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl">
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'نقدي (تم الدفع)'})}
                         className={`py-3 rounded-xl font-black text-xs transition-all ${customerInfo.paymentMethod.includes('نقدي') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         💰 نقدي
                       </button>
                       <button 
                         type="button"
                         onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'آجل (مديونية)'})}
                         className={`py-3 rounded-xl font-black text-xs transition-all ${customerInfo.paymentMethod.includes('آجل') ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                       >
                         ⏳ آجل
                       </button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الجوال (للمتابعة)</label>
                    <input 
                      type="tel"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="01xxxxxxxxx"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center"
                    />
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex justify-between text-2xl font-black text-slate-900">
                       <span>الإجمالي</span>
                       <span className="text-emerald-600">{total.toFixed(2)} ج.م</span>
                    </div>
                 </div>

                 <button 
                   disabled={invoiceItems.length === 0}
                   onClick={() => setShowPreview(true)}
                   className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30"
                 >
                    حفظ العملية
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;
