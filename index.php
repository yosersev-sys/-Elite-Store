
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
      .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

      const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>{icon}</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">{title}</p>
            <p className="text-xl font-black text-slate-900">{value}</p>
          </div>
        </div>
      );

      const App = () => {
        const [view, setView] = useState('store');
        const [adminTab, setAdminTab] = useState('stats');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [cart, setCart] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [newCatName, setNewCatName] = useState('');

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

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

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
            {/* Header مع الأقسام */}
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-2xl font-black text-indigo-600 cursor-pointer select-none">
                      ELITE<span className="text-slate-900">STORE</span>
                    </h1>
                    <button onClick={() => setView('admin')} className={`hidden sm:block px-4 py-1.5 rounded-xl text-[10px] font-black transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                      لوحة الإدارة
                    </button>
                  </div>
                  
                  <div className="flex-grow max-w-md hidden md:block">
                    <div className="relative">
                      <input type="text" placeholder="ابحث عن منتج..." onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2 bg-gray-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                      <span className="absolute left-4 top-2 opacity-30">🔍</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('cart')} className="relative p-2 bg-gray-50 rounded-xl hover:bg-indigo-50 transition">
                      🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">{cart.length}</span>
                    </button>
                    <button onClick={() => setView('admin')} className="sm:hidden p-2 bg-slate-900 text-white rounded-xl">⚙️</button>
                  </div>
                </div>

                {/* شريط الأقسام داخل الهيدر */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => { setSelectedCatId('all'); setView('store'); }}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'}`}
                  >
                    الكل
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCatId(cat.id); setView('store'); }}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  {/* Hero Section */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 mb-12 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">متجرك الفاخر <br/> لكل ما هو <span className="text-indigo-400">جديد</span></h2>
                      <p className="text-slate-400 max-w-sm text-sm font-bold">تصفح تشكيلتنا المختارة بعناية من أفضل العلامات التجارية العالمية بضمان كامل.</p>
                    </div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
                  </div>

                  {/* شبكة المنتجات */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full">
                        <div className="aspect-square bg-gray-50 cursor-pointer overflow-hidden" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                        </div>
                        <div className="p-4 md:p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-sm md:text-base mb-2 line-clamp-1">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-base md:text-lg font-black text-indigo-600">{p.price} <small className="text-[10px] font-bold">ر.س</small></span>
                            <button onClick={() => setCart([...cart, p])} className="bg-slate-900 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl hover:bg-indigo-600 transition shadow-lg active:scale-90">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                        <p className="text-slate-400 font-bold">لا توجد منتجات حالياً في هذا القسم.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                  <aside className="w-full lg:w-64 bg-slate-900 text-white p-8 shrink-0">
                    <h3 className="text-xl font-black mb-10 text-indigo-400 tracking-tighter">الإدارة المركزية</h3>
                    <nav className="space-y-3">
                      <button onClick={() => setAdminTab('stats')} className={`w-full text-right px-5 py-4 rounded-2xl font-black text-xs transition ${adminTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>الإحصائيات</button>
                      <button onClick={() => setAdminTab('products')} className={`w-full text-right px-5 py-4 rounded-2xl font-black text-xs transition ${adminTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>المنتجات</button>
                      <button onClick={() => setAdminTab('categories')} className={`w-full text-right px-5 py-4 rounded-2xl font-black text-xs transition ${adminTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>التصنيفات</button>
                      <button onClick={() => setAdminTab('orders')} className={`w-full text-right px-5 py-4 rounded-2xl font-black text-xs transition ${adminTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'}`}>الطلبات</button>
                    </nav>
                  </aside>

                  <main className="flex-grow p-8 bg-slate-50/30">
                    {adminTab === 'stats' && (
                      <div className="space-y-10">
                        <h2 className="text-2xl font-black text-slate-800">الأداء العام</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                          <StatCard title="إجمالي المبيعات" value={`${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} ر.س`} icon="💰" color="bg-emerald-500" />
                          <StatCard title="عدد الطلبات" value={orders.length} icon="📈" color="bg-blue-500" />
                          <StatCard title="المنتجات" value={products.length} icon="📦" color="bg-indigo-500" />
                          <StatCard title="الأقسام" value={categories.length} icon="🏷️" color="bg-orange-500" />
                        </div>
                      </div>
                    )}

                    {adminTab === 'products' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-black text-slate-800">المخزون</h2>
                          <button onClick={() => window.location.href = 'add-product.php'} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-100">+ إضافة منتج</button>
                        </div>
                        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-400 font-black">
                              <tr>
                                <th className="p-5">المنتج</th>
                                <th className="p-5">السعر</th>
                                <th className="p-5">الكمية</th>
                                <th className="p-5 text-center">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                  <td className="p-5 flex items-center gap-4">
                                    <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                                    <span className="font-black text-slate-800">{p.name}</span>
                                  </td>
                                  <td className="p-5 font-black text-indigo-600">{p.price} ر.س</td>
                                  <td className="p-5 font-bold">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] ${p.stockQuantity <= 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>{p.stockQuantity} قطعة</span>
                                  </td>
                                  <td className="p-5 text-center">
                                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl font-bold transition">حذف</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {adminTab === 'categories' && (
                      <div className="space-y-8 max-w-2xl">
                        <h2 className="text-2xl font-black text-slate-800">إدارة الأقسام</h2>
                        <form onSubmit={addCategory} className="flex gap-4">
                          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="مثال: هواتف ذكية..." className="flex-grow px-6 py-3.5 rounded-2xl border-none bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                          <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 transition active:scale-95">إضافة</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition">
                              <span className="font-black text-slate-700">{cat.name}</span>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg">🗑️</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {adminTab === 'orders' && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-800">طلبات العملاء</h2>
                        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-400 font-black">
                              <tr>
                                <th className="p-5">رقم الطلب</th>
                                <th className="p-5">العميل</th>
                                <th className="p-5">الإجمالي</th>
                                <th className="p-5 text-center">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {orders.map(o => (
                                <tr key={o.id} className="hover:bg-slate-50 transition">
                                  <td className="p-5 font-mono text-indigo-600 font-bold">{o.id}</td>
                                  <td className="p-5">
                                    <div className="font-black">{o.customerName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{o.phone}</div>
                                  </td>
                                  <td className="p-5 font-black text-slate-800">{o.total} ر.س</td>
                                  <td className="p-5 text-center">
                                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">قيد الانتظار</span>
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-bold">لا توجد طلبات واردة حالياً.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </main>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-5xl mx-auto bg-white rounded-[3.5rem] p-8 md:p-12 shadow-2xl animate-fadeIn flex flex-col md:flex-row gap-12 border border-gray-50">
                   <div className="w-full md:w-1/2 aspect-square rounded-[3rem] overflow-hidden bg-gray-50">
                      <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex flex-col justify-center space-y-8 flex-grow">
                      <div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">{selectedProduct.name}</h2>
                        <p className="text-slate-500 leading-relaxed font-bold">{selectedProduct.description}</p>
                      </div>
                      <div className="text-5xl font-black text-indigo-600">{selectedProduct.price} <small className="text-lg font-bold">ر.س</small></div>
                      <div className="flex gap-4">
                        <button onClick={() => { setCart([...cart, selectedProduct]); setView('cart'); }} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-600 transition shadow-xl active:scale-95">أضف للسلة</button>
                        <button onClick={() => setView('store')} className="px-10 py-5 border-2 border-gray-100 rounded-3xl font-black text-slate-500 hover:bg-gray-50 transition">عودة</button>
                      </div>
                   </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-10 md:p-16 rounded-[3.5rem] shadow-2xl animate-fadeIn space-y-10 border border-gray-50">
                  <h2 className="text-3xl font-black text-center text-slate-900">سلة التسوق</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-slate-400 font-black mb-8 text-xl">سلتك خالية حالياً!</p>
                      <button onClick={() => setView('store')} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black shadow-lg">ابدأ التسوق</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {cart.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-[2rem] border border-gray-50 group transition">
                            <div className="flex items-center gap-5">
                              <img src={item.images[0]} className="w-16 h-16 rounded-2xl object-cover border bg-white" />
                              <span className="font-black text-slate-800">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="font-black text-indigo-600">{item.price} ر.س</span>
                              <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition font-black text-xl">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-8 border-t border-gray-100 flex justify-between items-end">
                        <div>
                          <p className="text-slate-400 font-bold text-xs mb-1 uppercase tracking-widest">إجمالي الفاتورة</p>
                          <span className="text-4xl font-black text-slate-900">{cart.reduce((s, i) => s + parseFloat(i.price), 0).toFixed(2)} <small className="text-sm font-bold">ر.س</small></span>
                        </div>
                        <button onClick={() => {alert('تم تأكيد الطلب بنجاح! شكراً لاختيارك متجر النخبة.'); setCart([]); setView('store');}} className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 transition active:scale-95">إتمام الشراء</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="py-16 text-center border-t bg-white mt-20">
              <div className="container mx-auto px-4">
                <div className="text-2xl font-black text-indigo-600 mb-6 tracking-tighter">ELITE<span className="text-slate-900">STORE</span></div>
                <div className="flex justify-center gap-6 mb-8 text-slate-400 text-sm font-bold">
                   <a href="#" className="hover:text-indigo-600 transition">الرئيسية</a>
                   <a href="#" className="hover:text-indigo-600 transition">عن المتجر</a>
                   <a href="#" className="hover:text-indigo-600 transition">سياسة الخصوصية</a>
                   <a href="#" className="hover:text-indigo-600 transition">اتصل بنا</a>
                </div>
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر النخبة</p>
              </div>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
