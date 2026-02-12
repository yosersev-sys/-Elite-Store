
import React, { useState, useMemo } from 'react';
import { Product, Order, CartItem } from '../types';

interface AdminInvoiceFormProps {
  products: Product[];
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const AdminInvoiceForm: React.FC<AdminInvoiceFormProps> = ({ products, onSubmit, onCancel }) => {
  const [invoiceItems, setInvoiceItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    city: 'القاهرة',
    address: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchQuery))
    ).slice(0, 5);
  }, [products, searchQuery]);

  const addItemToInvoice = (product: Product) => {
    const existing = invoiceItems.find(item => item.id === product.id);
    if (existing) {
      setInvoiceItems(prev => prev.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setInvoiceItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
    setSearchQuery('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
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

  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) return alert('يرجى إضافة منتجات للفاتورة');
    if (!customerInfo.name || !customerInfo.phone) return alert('يرجى إكمال بيانات العميل');

    const newOrder: Order = {
      id: 'INV-' + Date.now().toString().slice(-6),
      customerName: customerInfo.name,
      phone: customerInfo.phone,
      city: customerInfo.city,
      address: customerInfo.address,
      items: invoiceItems,
      subtotal,
      total,
      paymentMethod: 'نظام الإدارة',
      status: 'completed',
      createdAt: Date.now()
    };

    onSubmit(newOrder);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">إنشاء فاتورة يدوية</h2>
          <p className="text-slate-500 font-bold text-sm">إصدار مبيعات مباشرة للعملاء</p>
        </div>
        <button onClick={onCancel} className="bg-white border px-6 py-2 rounded-xl font-bold text-slate-500">إلغاء</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form and Product Selection */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Product Search and Selection */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="p-2 bg-green-50 text-green-600 rounded-lg">🛒</span>
                اختيار المنتجات
            </h3>
            
            <div className="relative mb-6">
                <input 
                    type="text" 
                    placeholder="ابحث عن منتج بالاسم أو الباركود..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
                {searchQuery && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {filteredProducts.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => addItemToInvoice(p)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-green-50 transition border-b last:border-none"
                            >
                                <div className="flex items-center gap-3 text-right">
                                    <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                                    <div>
                                        <p className="font-bold text-sm">{p.name}</p>
                                        <p className="text-[10px] text-slate-400">السعر: {p.price} ج.م | المخزون: {p.stockQuantity}</p>
                                    </div>
                                </div>
                                <span className="text-green-600 font-black">+</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="text-[10px] font-black text-slate-400 uppercase border-b">
                        <tr>
                            <th className="pb-4">المنتج</th>
                            <th className="pb-4">الكمية</th>
                            <th className="pb-4">السعر</th>
                            <th className="pb-4">الإجمالي</th>
                            <th className="pb-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoiceItems.map(item => (
                            <tr key={item.id}>
                                <td className="py-4">
                                    <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">-</button>
                                        <span className="font-bold text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">+</button>
                                    </div>
                                </td>
                                <td className="py-4 font-bold text-sm">{item.price} ج.م</td>
                                <td className="py-4 font-black text-green-600 text-sm">{(item.price * item.quantity).toFixed(2)} ج.م</td>
                                <td className="py-4 text-left">
                                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition">🗑</button>
                                </td>
                            </tr>
                        ))}
                        {invoiceItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold italic">لا توجد منتجات مضافة حالياً</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">👤</span>
                بيانات العميل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase">اسم العميل</label>
                    <input 
                        value={customerInfo.name}
                        onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="أدخل اسم العميل"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase">رقم الجوال</label>
                    <input 
                        value={customerInfo.phone}
                        onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="01xxxxxxxxx"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-left"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase">العنوان بالتفصيل</label>
                    <textarea 
                        value={customerInfo.address}
                        onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                        placeholder="الحي، الشارع، ملاحظات إضافية"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none h-24"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
            <h3 className="font-black text-slate-800 mb-8 pb-4 border-b">ملخص الفاتورة</h3>
            
            <div className="space-y-4 mb-10 text-sm">
                <div className="flex justify-between text-slate-500 font-bold">
                    <span>المجموع الفرعي</span>
                    <span>{subtotal.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold">
                    <span>ضريبة القيمة المضافة (15%)</span>
                    <span>{tax.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-xl font-black text-slate-900 pt-6 border-t">
                    <span>الإجمالي النهائي</span>
                    <span className="text-green-600">{total.toFixed(2)} ج.م</span>
                </div>
            </div>

            <button 
                onClick={handleCreateInvoice}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-green-600 transition shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
                💾 حفظ الفاتورة وتوليد PDF
            </button>
            <button 
                onClick={onCancel}
                className="w-full mt-4 text-slate-400 py-3 rounded-2xl font-black hover:bg-slate-50 transition text-xs tracking-widest uppercase"
            >
                إلغاء العملية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceForm;
