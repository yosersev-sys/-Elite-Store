<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | لوحة التحكم الكاملة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; scroll-behavior: smooth; overflow-x: hidden; }
      .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 40s linear infinite; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- المكونات الفرعية ---
      
      const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>{icon}</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">{title}</p>
            <p className="text-xl font-black text-slate-900">{value}</p>
          </div>
        </div>
      );

      // --- المكون الرئيسي ---
      const App = () => {
        const [view, setView] = useState('store'); // 'store' | 'admin' | 'cart' | 'details'
        const [adminTab, setAdminTab] = useState('stats'); // 'stats' | 'products' | 'categories' | 'orders'
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [cart, setCart] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [newCatName, setNewCatName] = useState('');

        // التحميل من API
        const loadData = async () => {
          try {
            const [pRes, cRes, oRes] = await Promise.all([
              fetch('api.php?action=get_products').then(r => r.json()),
              fetch('api.php?action=get_categories').then(r => r.json()),
              fetch('api.php?action=get_orders').then(r => r.json())
            ]);
            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
            setOrders(Array.isArray(oRes) ? oRes : []);
          } catch (e) { console.error("API Error:", e); }
        };

        useEffect(() => { loadData(); }, []);

        // تصفية المنتجات
        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        // عمليات الإدارة
        const deleteProduct = async (id) => {
          if (!confirm('هل أنت متأكد من حذف المنتج؟')) return;
          await fetch(`api.php?action=delete_product&id=${id}`, { method: 'DELETE' });
          loadData();
        };

        const addCategory = async (e) => {
          e.preventDefault();
          if (!newCatName) return;
          await fetch('api.php?action=add_category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'cat_' + Date.now(), name: newCatName })
          });
          setNewCatName('');
          loadData();
        };

        const deleteCategory = async (id) => {
          await fetch(`api.php?action=delete_category&id=${id}`, { method: 'DELETE' });
          loadData();
        };

        return (
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-2xl font-black text-indigo-600 cursor-pointer">
                    ELITE<span className="text-slate-900">STORE</span>
                  </h1>
                  <button onClick={() => setView('admin')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                    ⚙️ لوحة التحكم
                  </button>
                </div>
                
                <div className="hidden md:flex flex-grow max-w-md mx-8">
                  <input type="text" placeholder="ابحث عن منتج..." onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2.5 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setView('cart')} className="relative p-2 text-gray-600">
                    🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  {/* Hero Slider Simple */}
                  <div className="bg-slate-900 rounded-[3rem] h-[300px] mb-12 flex items-center px-12 text-white">
                    <div>
                      <h2 className="text-4xl font-black mb-4">عالم التكنولوجيا بين يديك</h2>
                      <p className="text-slate-400 max-w-md">أفضل المنتجات العالمية بضمان وكلاء معتمدين وتوصيل سريع لكافة مناطق المملكة.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-10">
                    <button onClick={() => setSelectedCatId('all')} className={`px-6 py-2 rounded-full font-bold text-sm ${selectedCatId === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>الكل</button>
                    {categories.map(c => <button key={c.id} onClick={() => setSelectedCatId(c.id)} className={`px-6 py-2 rounded-full font-bold text-sm ${selectedCatId === c.id ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{c.name}</button>)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition group">
                        <div className="aspect-square bg-gray-50 cursor-pointer" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-slate-800 mb-2 truncate">{p.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-black text-indigo-600">{p.price} ر.س</span>
                            <button onClick={() => setCart([...cart, p])} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn bg-white rounded-[2.5rem] shadow-xl overflow-hidden border">
                  {/* Sidebar الإدارة */}
                  <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 shrink-0">
                    <h3 className="text-xl font-black mb-10 text-indigo-400">الإدارة المركزية</h3>
                    <nav className="space-y-2">
                      <button onClick={() => setAdminTab('stats')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition ${adminTab === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📊 الإحصائيات</button>
                      <button onClick={() => setAdminTab('products')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition ${adminTab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📦 المنتجات</button>
                      <button onClick={() => setAdminTab('categories')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition ${adminTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>🏷️ التصنيفات</button>
                      <button onClick={() => setAdminTab('orders')} className={`w-full text-right px-4 py-3 rounded-xl font-bold text-sm transition ${adminTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📜 الطلبات</button>
                    </nav>
                  </aside>

                  {/* محتوى الإدارة */}
                  <main className="flex-grow p-8 bg-slate-50/50">
                    {adminTab === 'stats' && (
                      <div className="space-y-8 animate-fadeIn">
                        <h2 className="text-2xl font-black">نظرة عامة</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard title="إجمالي الإيرادات" value={`${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} ر.س`} icon="💰" color="bg-emerald-500" />
                          <StatCard title="الطلبات" value={orders.length} icon="📈" color="bg-blue-500" />
                          <StatCard title="المنتجات" value={products.length} icon="📦" color="bg-indigo-500" />
                          <StatCard title="التصنيفات" value={categories.length} icon="🏷️" color="bg-orange-500" />
                        </div>
                      </div>
                    )}

                    {adminTab === 'products' && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-black">إدارة المخزون</h2>
                          <button onClick={() => alert('لإضافة منتج كامل بالصور، يرجى استخدام تطبيق React المحلي أو رفع ملف AdminProductForm.tsx')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm">إضافة منتج جديد +</button>
                        </div>
                        <div className="bg-white rounded-3xl overflow-hidden border">
                          <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-black">
                              <tr>
                                <th className="p-4">المنتج</th>
                                <th className="p-4">السعر</th>
                                <th className="p-4">المخزون</th>
                                <th className="p-4 text-center">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map(p => (
                                <tr key={p.id} className="border-t hover:bg-slate-50 transition">
                                  <td className="p-4 flex items-center gap-3">
                                    <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                                    <span className="font-bold">{p.name}</span>
                                  </td>
                                  <td className="p-4 font-black text-indigo-600">{p.price} ر.س</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stockQuantity} قطعة</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg">حذف</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {adminTab === 'categories' && (
                      <div className="space-y-8 animate-fadeIn max-w-2xl">
                        <h2 className="text-2xl font-black">الأقسام والتصنيفات</h2>
                        <form onSubmit={addCategory} className="flex gap-4">
                          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-grow px-5 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                          <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black">إضافة</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center group">
                              <span className="font-bold">{cat.name}</span>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition">🗑️</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {adminTab === 'orders' && (
                      <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-2xl font-black">طلبات العملاء</h2>
                        <div className="bg-white rounded-3xl overflow-hidden border">
                          <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100 text-slate-500 font-black">
                              <tr>
                                <th className="p-4">رقم الطلب</th>
                                <th className="p-4">العميل</th>
                                <th className="p-4">الإجمالي</th>
                                <th className="p-4 text-center">الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map(o => (
                                <tr key={o.id} className="border-t">
                                  <td className="p-4 font-mono text-[10px] text-indigo-600 font-bold">{o.id}</td>
                                  <td className="p-4">
                                    <div className="font-bold">{o.customerName}</div>
                                    <div className="text-[10px] text-slate-400">{o.phone}</div>
                                  </td>
                                  <td className="p-4 font-black">{o.total} ر.س</td>
                                  <td className="p-4 text-center">
                                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">قيد المراجعة</span>
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold">لا توجد طلبات بعد.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </main>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-4xl mx-auto bg-white rounded-[4rem] p-10 shadow-2xl animate-fadeIn flex flex-col md:flex-row gap-12">
                   <div className="w-full md:w-1/2 aspect-square rounded-[3rem] overflow-hidden">
                      <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex flex-col justify-center space-y-6">
                      <h2 className="text-4xl font-black">{selectedProduct.name}</h2>
                      <p className="text-slate-500 leading-relaxed">{selectedProduct.description}</p>
                      <div className="text-4xl font-black text-indigo-600">{selectedProduct.price} ر.س</div>
                      <div className="flex gap-4">
                        <button onClick={() => { setCart([...cart, selectedProduct]); setView('cart'); }} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-600 transition">أضف للسلة</button>
                        <button onClick={() => setView('store')} className="px-10 py-5 border-2 rounded-3xl font-bold">عودة</button>
                      </div>
                   </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-xl animate-fadeIn space-y-8">
                  <h2 className="text-3xl font-black text-center">سلة التسوق</h2>
                  {cart.length === 0 ? <p className="text-center text-slate-400 py-10">سلتك خالية!</p> : (
                    <div className="space-y-4">
                      {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border">
                          <div className="flex items-center gap-4">
                            <img src={item.images[0]} className="w-12 h-12 rounded-lg object-cover" />
                            <span className="font-bold">{item.name}</span>
                          </div>
                          <span className="font-black text-indigo-600">{item.price} ر.س</span>
                        </div>
                      ))}
                      <div className="pt-6 border-t flex justify-between text-2xl font-black">
                        <span>الإجمالي:</span>
                        <span>{cart.reduce((s, i) => s + parseFloat(i.price), 0)} ر.س</span>
                      </div>
                      <button onClick={() => {alert('تم تأكيد الطلب بنجاح!'); setCart([]); setView('store');}} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl">تأكيد الشراء</button>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="py-12 text-center text-slate-400 font-bold border-t bg-white mt-12">
              <div className="text-xl font-black text-indigo-600 mb-4">ELITE STORE</div>
              <p className="text-sm opacity-50">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر النخبة</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
