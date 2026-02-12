
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>فاقوس ستور | لوحة التحكم المتكاملة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- React & Libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8faf7; scroll-behavior: smooth; overflow-x: hidden; }
      .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .header-glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); }
      .admin-card { background: white; border-radius: 2.5rem; border: 1px solid #fdf4f0; box-shadow: 0 4px 25px rgba(0,0,0,0.03); transition: all 0.3s ease; }
      .admin-card:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      @media print { .no-print { display: none !important; } .print-only { display: block !important; } }
      .print-only { display: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // Invoice Form Component
      const InvoiceForm = ({ products, onSubmit, onCancel }) => {
        const [items, setItems] = useState([]);
        const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
        const [query, setQuery] = useState('');

        const filtered = useMemo(() => {
          if (!query) return [];
          return products.filter(p => p.name.includes(query) || (p.barcode && p.barcode.includes(query))).slice(0, 5);
        }, [products, query]);

        const addItem = (p) => {
          const exist = items.find(i => i.id === p.id);
          if (exist) setItems(items.map(i => i.id === p.id ? {...i, quantity: i.quantity + 1} : i));
          else setItems([...items, {...p, quantity: 1}]);
          setQuery('');
        };

        const total = items.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.15;

        return (
          <div className="animate-fadeIn space-y-8 pb-20">
            <div className="flex justify-between items-center">
               <h2 className="text-3xl font-black text-slate-800">إنشاء فاتورة جديدة لفاقوس ستور 🧾</h2>
               <button onClick={onCancel} className="text-slate-400 font-bold">إلغاء</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="admin-card p-8 space-y-4">
                  <h3 className="font-black text-orange-600">اختيار المنتجات</h3>
                  <div className="relative">
                    <input 
                      placeholder="ابحث بالاسم أو الباركود..." 
                      value={query} onChange={e => setQuery(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-orange-500 font-bold"
                    />
                    {query && filtered.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden mt-2">
                        {filtered.map(p => (
                          <div key={p.id} onClick={() => addItem(p)} className="p-4 hover:bg-orange-50 cursor-pointer flex justify-between items-center border-b">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-orange-600 font-black">{p.price} ر.س</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <table className="w-full text-right mt-6">
                    <thead><tr className="text-xs text-slate-400 font-black border-b"><th className="pb-2">المنتج</th><th className="pb-2">الكمية</th><th className="pb-2">السعر</th></tr></thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="py-4 font-bold">{item.name}</td>
                          <td className="py-4 font-bold">{item.quantity}</td>
                          <td className="py-4 font-black text-orange-600">{item.price * item.quantity} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-card p-8 space-y-4">
                  <h3 className="font-black text-blue-600">بيانات العميل</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="اسم العميل" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="px-6 py-3 bg-slate-50 rounded-xl outline-none" />
                    <input placeholder="رقم الجوال" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="px-6 py-3 bg-slate-50 rounded-xl outline-none" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="admin-card p-8 sticky top-24 space-y-6">
                  <h3 className="font-black border-b pb-4">ملخص الحساب</h3>
                  <div className="flex justify-between text-2xl font-black">
                    <span>الإجمالي (شامل الضريبة)</span>
                    <span className="text-orange-600">{total.toFixed(2)} ر.س</span>
                  </div>
                  <button 
                    onClick={() => onSubmit({ ...customer, total, items, id: 'INV-'+Date.now() })}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition"
                  >حفظ وطباعة الفاتورة</button>
                </div>
              </div>
            </div>
          </div>
        );
      };

      const App = () => {
        const [view, setView] = useState('store');
        const [adminTab, setAdminTab] = useState('products');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [lastOrder, setLastOrder] = useState(null);
        
        const [newCatName, setNewCatName] = useState('');
        const [searchQuery, setSearchQuery] = useState('');

        const loadData = async () => {
          setIsLoading(true);
          try {
            const ts = Date.now();
            const [pRes, cRes, oRes] = await Promise.all([
              fetch(`api.php?action=get_products&t=${ts}`).then(r => r.json()),
              fetch(`api.php?action=get_categories&t=${ts}`).then(r => r.json()),
              fetch(`api.php?action=get_orders&t=${ts}`).then(r => r.json())
            ]);
            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
            setOrders(Array.isArray(oRes) ? oRes : []);
          } catch (e) { console.error(e); }
          finally { setIsLoading(false); }
        };

        useEffect(() => { loadData(); }, []);

        const handleInvoiceSubmit = async (order) => {
          try {
            const res = await fetch('api.php?action=save_order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(order)
            }).then(r => r.json());
            if(res.status === 'success') {
              setLastOrder(order);
              setView('success');
              setOrders([order, ...orders]);
            }
          } catch(e) { alert('خطأ في الحفظ'); }
        };

        const filteredCategories = useMemo(() => {
          return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }, [categories, searchQuery]);

        const stats = useMemo(() => ({
          total: products.length,
          lowStock: products.filter(p => p.stockQuantity < 10).length,
          cats: categories.length
        }), [products, categories]);

        if (isLoading) return <div className="h-screen flex items-center justify-center text-orange-600 font-black animate-pulse">جاري التحميل...</div>;

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-orange-100 no-print">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <h1 onClick={() => setView('store')} className="text-2xl font-black text-orange-600 cursor-pointer flex items-center gap-2">
                  <span className="text-3xl">🛍️</span> فاقوس ستور
                </h1>
                <div className="flex gap-3">
                  <button onClick={() => setView('store')} className={`px-5 py-2 rounded-xl font-bold text-sm ${view === 'store' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>المتجر</button>
                  <button onClick={() => setView('admin')} className={`px-5 py-2 rounded-xl font-bold text-sm ${view === 'admin' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>لوحة التحكم</button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn grid grid-cols-2 md:grid-cols-5 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="admin-card overflow-hidden">
                      <img src={p.images[0]} className="w-full aspect-square object-cover" />
                      <div className="p-4"><h3 className="font-black text-sm">{p.name}</h3><p className="text-orange-600 font-black">{p.price} ر.س</p></div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'admin' && (
                <div className="animate-fadeIn space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-black text-slate-900">إدارة فاقوس ستور</h2>
                    <div className="flex gap-3">
                       <button onClick={() => setView('invoice')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black shadow-lg">🧾 إنشاء فاتورة</button>
                       <a href="add-product.php" className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg">+ إضافة منتج</a>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="admin-card p-6">📦 المنتجات: {stats.total}</div>
                    <div className="admin-card p-6">⚠️ نقص: {stats.lowStock}</div>
                    <div className="admin-card p-6">🏷️ الأقسام: {stats.cats}</div>
                  </div>

                  <div className="admin-card overflow-hidden">
                    <div className="p-4 bg-slate-50 flex gap-4 border-b">
                      <button onClick={() => setAdminTab('products')} className={`px-4 py-2 rounded-lg font-black ${adminTab === 'products' ? 'bg-orange-600 text-white' : ''}`}>المخزون</button>
                      <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-lg font-black ${adminTab === 'orders' ? 'bg-orange-600 text-white' : ''}`}>الطلبات</button>
                    </div>
                    {adminTab === 'products' ? (
                      <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b"><tr><th className="p-4">المنتج</th><th className="p-4">السعر</th><th className="p-4">المخزون</th></tr></thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50"><td className="p-4 font-bold">{p.name}</td><td className="p-4">{p.price} ر.س</td><td className="p-4">{p.stockQuantity} وحدة</td></tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b"><tr><th className="p-4">رقم الطلب</th><th className="p-4">العميل</th><th className="p-4">الإجمالي</th></tr></thead>
                        <tbody>
                          {orders.map(o => (
                            <tr key={o.id} className="border-b hover:bg-slate-50"><td className="p-4 font-mono">{o.id}</td><td className="p-4 font-bold">{o.customerName}</td><td className="p-4 text-orange-600 font-black">{o.total} ر.س</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {view === 'invoice' && <InvoiceForm products={products} onCancel={() => setView('admin')} onSubmit={handleInvoiceSubmit} />}

              {view === 'success' && lastOrder && (
                <div className="max-w-2xl mx-auto admin-card p-12 text-center space-y-6">
                   <div className="text-6xl">✅</div>
                   <h2 className="text-3xl font-black">تم إصدار الفاتورة بنجاح</h2>
                   <div className="bg-slate-50 p-6 rounded-2xl text-right">
                      <p>رقم الفاتورة: <b>{lastOrder.id}</b></p>
                      <p>العميل: <b>{lastOrder.customerName}</b></p>
                      <p>الإجمالي: <b className="text-orange-600">{lastOrder.total} ر.س</b></p>
                   </div>
                   <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black no-print">🖨️ طباعة الفاتورة</button>
                   <button onClick={() => setView('admin')} className="block w-full text-slate-400 font-bold no-print">العودة للوحة التحكم</button>
                </div>
              )}
            </main>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
