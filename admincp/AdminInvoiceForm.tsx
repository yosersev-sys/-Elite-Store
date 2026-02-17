import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Order, CartItem } from '../types.ts';
import BarcodeScanner from '../components/BarcodeScanner.tsx';

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
    if (window.innerWidth > 768) searchInputRef.current?.focus();
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && String(p.barcode).includes(q))).slice(0, 10);
  }, [products, searchQuery]);

  const addItemToInvoice = (product: Product) => {
    if (product.stockQuantity <= 0) return alert('غير متوفر في المخزن!');
    setInvoiceItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const exactMatch = products.find(p => p.barcode === q);
    if (exactMatch) { addItemToInvoice(exactMatch); setSearchQuery(''); }
  }, [searchQuery, products]);

  const updateQuantity = (id: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const p = products.find(prod => prod.id === id);
        const n = Math.max(1, item.quantity + delta);
        if (p && n > p.stockQuantity) return item;
        return { ...item, quantity: n };
      }
      return item;
    }));
  };

  const handleFinalSubmit = () => {
    if (!isOnline) return alert('يرجى الاتصال بالإنترنت');
    if (invoiceItems.length === 0) return alert('أضف منتجات');
    if (!customerInfo.phone) return alert('أدخل رقم الهاتف');
    const order: Order = {
      id: 'INV-' + Date.now().toString().slice(-8),
      customerName: customerInfo.name, phone: customerInfo.phone, city: customerInfo.city, address: customerInfo.address || 'فرع',
      items: invoiceItems, subtotal: invoiceItems.reduce((s, i) => s + (i.price * i.quantity), 0),
      total: invoiceItems.reduce((s, i) => s + (i.price * i.quantity), 0),
      paymentMethod: customerInfo.paymentMethod, status: 'completed', createdAt: Date.now()
    };
    onSubmit(order);
  };

  return (
    <div className="w-full py-4 md:py-8 px-2 md:px-6 animate-fadeIn">
      {showScanner && <BarcodeScanner onScan={q => {setSearchQuery(q); setShowScanner(false);}} onClose={() => setShowScanner(false)} />}
      
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">كاشير سوق العصر</h2>
          <p className="text-emerald-600 font-black text-xs uppercase tracking-widest mt-1">نظام المبيعات الفورية الذكي</p>
        </div>
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="bg-white border-2 px-8 py-3 rounded-2xl font-black text-slate-400">إلغاء</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
             <div className="relative mb-8">
                <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." className="w-full px-8 py-6 bg-slate-50 rounded-3xl outline-none font-black text-xl border-2 border-transparent focus:border-emerald-500 shadow-inner" />
                <button onClick={() => setShowScanner(true)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-2xl">📷</button>
                {filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-3xl shadow-2xl z-50 overflow-hidden">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => {addItemToInvoice(p); setSearchQuery('');}} className="w-full p-5 flex justify-between items-center hover:bg-emerald-50 border-b">
                        <span className="font-black">{p.name}</span>
                        <span className="font-black text-emerald-600">{p.price} ج.م</span>
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400">
                    <tr><th className="p-6">المنتج</th><th className="p-6 text-center">الكمية</th><th className="p-6">السعر</th><th className="p-6">الإجمالي</th><th className="p-6"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoiceItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-6 font-black text-slate-700">{item.name}</td>
                        <td className="p-6">
                           <div className="flex items-center justify-center gap-3 bg-slate-100 p-1.5 rounded-xl w-fit mx-auto border">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black">-</button>
                              <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black">+</button>
                           </div>
                        </td>
                        <td className="p-6 font-bold text-slate-400">{item.price}</td>
                        <td className="p-6 font-black text-emerald-600">{(item.price * item.quantity).toFixed(2)} ج.م</td>
                        <td className="p-6"><button onClick={() => setInvoiceItems(prev => prev.filter(i => i.id !== item.id))} className="text-rose-500 font-black">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <section className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
              <h3 className="text-xl font-black text-slate-800 border-b pb-4">بيانات الفاتورة</h3>
              <div className="space-y-4">
                 <input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="اسم العميل" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" />
                 <input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-left" dir="ltr" />
                 <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'نقدي (تم الدفع)'})} className={`flex-grow py-3 rounded-xl font-black text-xs ${customerInfo.paymentMethod.includes('نقدي') ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>نقدي 💰</button>
                    <button onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'آجل (مديونية)'})} className={`flex-grow py-3 rounded-xl font-black text-xs ${customerInfo.paymentMethod.includes('آجل') ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>آجل ⏳</button>
                 </div>
              </div>
              <div className="pt-6 border-t space-y-4">
                 <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 font-black text-xs">الإجمالي النهائي:</span>
                    <span className="text-4xl font-black text-emerald-600">{invoiceItems.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)} ج.م</span>
                 </div>
                 <button onClick={handleFinalSubmit} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-emerald-600 transition-all shadow-2xl active:scale-95">حفظ وإصدار الفاتورة 🧾</button>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;