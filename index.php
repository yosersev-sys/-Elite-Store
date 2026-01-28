
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | منصة التسوق الذكية</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- React & Libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

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
      .product-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useRef } = React;

      // مكون بطاقة الإحصائيات
      const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 transition hover:shadow-md">
          <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>{icon}</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
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
        const [isLoading, setIsLoading] = useState(true);
        const [lastOrder, setLastOrder] = useState(null);

        // جلب البيانات من api.php
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
          } catch (e) {
            console.error("خطأ في جلب البيانات:", e);
          } finally {
            setIsLoading(false);
          }
        };

        useEffect(() => {
          loadData();
          const savedCart = localStorage.getItem('elite_cart');
          if (savedCart) setCart(JSON.parse(savedCart));
        }, []);

        useEffect(() => {
          localStorage.setItem('elite_cart', JSON.stringify(cart));
        }, [cart]);

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        const addToCart = (product) => {
          if (product.stockQuantity <= 0) return alert('عذراً، المنتج نفذ من المخزون');
          setCart([...cart, { ...product, quantity: 1 }]);
          alert('تمت الإضافة للسلة');
        };

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
          if (!confirm('حذف هذا القسم قد يؤثر على المنتجات المرتبطة به. هل أنت متأكد؟')) return;
          await fetch(`api.php?action=delete_category&id=${id}`, { method: 'DELETE' });
          loadData();
        };

        const handleCheckout = async (e) => {
          e.preventDefault();
          const orderId = 'ORD-' + Date.now();
          const total = cart.reduce((s, i) => s + i.price, 0);
          
          const orderData = {
            id: orderId,
            customerName: e.target.customerName.value,
            phone: e.target.phone.value,
            city: e.target.city.value,
            address: e.target.address.value,
            items: cart,
            total: total,
            paymentMethod: 'COD'
          };

          const res = await fetch('api.php?action=save_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          }).then(r => r.json());

          if (res.status === 'success') {
            setLastOrder(orderData);
            setCart([]);
            setView('success');
            loadData();
          }
        };

        const downloadInvoice = () => {
          const element = document.getElementById('invoice-content');
          html2pdf().from(element).save(`invoice-${lastOrder.id}.pdf`);
        };

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500">جاري تحميل المتجر...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            {/* Header مع شريط الأقسام */}
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-2xl font-black text-indigo-600 cursor-pointer select-none">
                      ELITE<span className="text-slate-900">STORE</span>
                    </h1>
                    <button onClick={() => setView('admin')} className="hidden sm:block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition">
                      لوحة الإدارة
                    </button>
                  </div>
                  
                  <div className="flex-grow max-w-md hidden md:block">
                    <div className="relative">
                      <input type="text" placeholder="ابحث عن منتجك المفضل..." onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2 bg-gray-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                      <span className="absolute left-4 top-2 opacity-30">🔍</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('cart')} className="relative p-2.5 bg-gray-50 rounded-xl hover:bg-indigo-50 transition">
                      🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">{cart.length}</span>
                    </button>
                    <button onClick={() => setView('admin')} className="sm:hidden p-2.5 bg-slate-900 text-white rounded-xl">⚙️</button>
                  </div>
                </div>

                {/* شريط الأقسام الديناميكي */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => { setSelectedCatId('all'); setView('store'); }}
                    className={`whitespace-nowrap px-5 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'}`}
                  >
                    الكل
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCatId(cat.id); setView('store'); }}
                      className={`whitespace-nowrap px-5 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'}`}
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
                      <button onClick={() => document.getElementById('products-grid').scrollIntoView()} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition shadow-xl shadow-indigo-900/20">تسوق الآن</button>
                    </div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>
                  </div>

                  <div id="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden product-card transition-all group flex flex-col h-full">
                        <div className="aspect-square bg-gray-50 cursor-pointer overflow-hidden relative" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                          <div className="absolute top-4 left-4">
                             <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</span>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-sm md:text-base mb-3 line-clamp-1">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-lg md:text-xl font-black text-indigo-600">{p.price} <small className="text-[10px] font-bold">ر.س</small></span>
                            <button onClick={() => addToCart(p)} className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-600 transition shadow-lg active:scale-90">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-32 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-slate-400 font-bold text-xl">لا توجد منتجات حالياً في هذا القسم.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-6xl mx-auto bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl animate-fadeIn flex flex-col md:flex-row gap-16 items-center border border-gray-50">
                   <div className="w-full md:w-1/2 aspect-square rounded-[3rem] overflow-hidden bg-gray-50 shadow-inner">
                      <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex flex-col justify-center space-y-10 flex-grow w-full md:w-1/2">
                      <div className="space-y-4">
                        <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">{categories.find(c => c.id === selectedProduct.categoryId)?.name}</span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
                        <p className="text-slate-500 leading-relaxed font-bold text-lg">{selectedProduct.description}</p>
                      </div>
                      <div className="text-6xl font-black text-indigo-600">{selectedProduct.price} <small className="text-xl font-bold">ر.س</small></div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => { addToCart(selectedProduct); setView('cart'); }} className="flex-grow bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-600 transition shadow-2xl active:scale-95">أضف للسلة الآن</button>
                        <button onClick={() => setView('store')} className="px-12 py-6 border-2 border-gray-100 rounded-3xl font-black text-slate-500 hover:bg-gray-50 transition">العودة للمتجر</button>
                      </div>
                   </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                  <aside className="w-full lg:w-72 bg-slate-900 text-white p-10 shrink-0">
                    <h3 className="text-2xl font-black mb-12 text-indigo-400 tracking-tighter">الإدارة المركزية</h3>
                    <nav className="space-y-4">
                      {['stats', 'products', 'categories', 'orders'].map(tab => (
                        <button key={tab} onClick={() => setAdminTab(tab)} className={`w-full text-right px-6 py-4 rounded-2xl font-black text-xs transition uppercase tracking-widest ${adminTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}>
                          {tab === 'stats' ? 'الإحصائيات' : tab === 'products' ? 'المنتجات' : tab === 'categories' ? 'التصنيفات' : 'الطلبات'}
                        </button>
                      ))}
                    </nav>
                  </aside>

                  <main className="flex-grow p-10 bg-slate-50/50">
                    {adminTab === 'stats' && (
                      <div className="space-y-12 animate-fadeIn">
                        <h2 className="text-3xl font-black text-slate-800">الأداء العام للمتجر</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                          <StatCard title="إجمالي المبيعات" value={`${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} ر.س`} icon="💰" color="bg-emerald-500" />
                          <StatCard title="عدد الطلبات" value={orders.length} icon="📈" color="bg-blue-500" />
                          <StatCard title="المنتجات" value={products.length} icon="📦" color="bg-indigo-500" />
                          <StatCard title="الأقسام" value={categories.length} icon="🏷️" color="bg-orange-500" />
                        </div>
                      </div>
                    )}

                    {adminTab === 'products' && (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-black text-slate-800">إدارة المخزون</h2>
                          <button onClick={() => window.location.href = 'add-product.php'} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition">+ إضافة منتج جديد</button>
                        </div>
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                              <tr>
                                <th className="p-6">المنتج</th>
                                <th className="p-6">السعر</th>
                                <th className="p-6">الكمية</th>
                                <th className="p-6 text-center">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-6 flex items-center gap-4">
                                    <img src={p.images[0]} className="w-14 h-14 rounded-xl object-cover border bg-gray-50" />
                                    <span className="font-black text-slate-800">{p.name}</span>
                                  </td>
                                  <td className="p-6 font-black text-indigo-600">{p.price} ر.س</td>
                                  <td className="p-6 font-bold">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${p.stockQuantity <= 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>{p.stockQuantity} قطعة</span>
                                  </td>
                                  <td className="p-6 text-center">
                                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 px-5 py-2 rounded-xl font-black transition">حذف</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {adminTab === 'categories' && (
                      <div className="space-y-10 max-w-2xl animate-fadeIn">
                        <h2 className="text-3xl font-black text-slate-800">إدارة التصنيفات</h2>
                        <form onSubmit={addCategory} className="flex gap-4">
                          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-grow px-8 py-4 rounded-2xl border-none bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                          <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition active:scale-95">إضافة</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categories.map(cat => (
                            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition">
                              <span className="font-black text-slate-700">{cat.name}</span>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg">🗑️</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {adminTab === 'orders' && (
                      <div className="space-y-8 animate-fadeIn">
                        <h2 className="text-3xl font-black text-slate-800">طلبات العملاء</h2>
                        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest">
                              <tr>
                                <th className="p-6">رقم الطلب</th>
                                <th className="p-6">العميل</th>
                                <th className="p-6">الإجمالي</th>
                                <th className="p-6 text-center">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {orders.map(o => (
                                <tr key={o.id} className="hover:bg-slate-50 transition">
                                  <td className="p-6 font-mono text-indigo-600 font-bold tracking-tighter">{o.id}</td>
                                  <td className="p-6">
                                    <div className="font-black">{o.customerName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">{o.phone}</div>
                                  </td>
                                  <td className="p-6 font-black text-slate-800">{o.total} ر.س</td>
                                  <td className="p-6 text-center">
                                    <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase">جديد</span>
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && <tr><td colSpan="4" className="p-32 text-center text-slate-300 font-bold text-xl tracking-widest">لا توجد طلبات واردة حالياً.</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </main>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-4xl mx-auto bg-white p-10 md:p-20 rounded-[4rem] shadow-2xl animate-fadeIn space-y-12 border border-gray-50">
                  <h2 className="text-4xl font-black text-center text-slate-900 tracking-tighter">سلة التسوق</h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-24 space-y-8">
                      <div className="text-7xl">🛒</div>
                      <p className="text-slate-400 font-black text-2xl">سلتك خالية حالياً!</p>
                      <button onClick={() => setView('store')} className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition">ابدأ التسوق الآن</button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="space-y-6">
                        {cart.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2.5rem] border border-gray-100 group transition hover:bg-white hover:shadow-xl">
                            <div className="flex items-center gap-6">
                              <img src={item.images[0]} className="w-20 h-20 rounded-[1.5rem] object-cover border bg-white shadow-sm" />
                              <span className="font-black text-slate-800 text-lg">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-10">
                              <span className="font-black text-indigo-600 text-xl">{item.price} ر.س</span>
                              <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition font-black text-2xl">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* نموذج إتمام الطلب */}
                      <form onSubmit={handleCheckout} className="space-y-8 pt-10 border-t border-gray-100">
                        <h3 className="text-2xl font-black text-slate-800">بيانات التوصيل</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input required name="customerName" placeholder="الاسم الكامل" className="w-full px-8 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border-none" />
                          <input required name="phone" placeholder="رقم الجوال" className="w-full px-8 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border-none" />
                          <select required name="city" className="w-full px-8 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border-none appearance-none">
                            <option value="">اختر المدينة</option>
                            <option value="الرياض">الرياض</option>
                            <option value="جدة">جدة</option>
                            <option value="الدمام">الدمام</option>
                          </select>
                          <input required name="address" placeholder="العنوان التفصيلي" className="w-full px-8 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border-none" />
                        </div>
                        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
                          <div className="text-center md:text-right">
                            <p className="text-slate-400 font-black text-xs mb-1 uppercase tracking-widest">إجمالي الفاتورة النهائية</p>
                            <span className="text-5xl font-black text-slate-900">{cart.reduce((s, i) => s + i.price, 0).toLocaleString()} <small className="text-sm font-bold">ر.س</small></span>
                          </div>
                          <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-16 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transition active:scale-95 transform">إتمام الطلب الآن</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {view === 'success' && lastOrder && (
                <div className="max-w-3xl mx-auto animate-fadeIn space-y-8 pb-20">
                  <div className="bg-emerald-500 text-white p-12 rounded-[3.5rem] text-center shadow-2xl shadow-emerald-100 space-y-4">
                    <div className="text-7xl mb-4">✅</div>
                    <h2 className="text-4xl font-black">تهانينا! تم استلام طلبك</h2>
                    <p className="font-bold opacity-80">رقم الطلب الخاص بك هو {lastOrder.id}</p>
                  </div>

                  <div id="invoice-content" className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-50 space-y-10">
                    <div className="flex justify-between items-center border-b pb-8">
                      <h3 className="text-2xl font-black text-indigo-600 uppercase">ELITE<span className="text-slate-900">STORE</span></h3>
                      <div className="text-right">
                        <p className="font-black text-slate-400 text-[10px] uppercase">تاريخ الطلب</p>
                        <p className="font-bold text-slate-800">{new Date().toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-800">تفاصيل المشتريات:</h4>
                      <div className="space-y-3">
                        {lastOrder.items.map((item, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-dotted">
                            <span className="font-bold text-slate-600">{item.name}</span>
                            <span className="font-black text-slate-900">{item.price} ر.س</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-6">
                        <span className="text-2xl font-black text-slate-900">الإجمالي الكلي:</span>
                        <span className="text-3xl font-black text-indigo-600">{lastOrder.total.toLocaleString()} ر.س</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase">بيانات العميل</p>
                       <p className="font-bold text-slate-800">{lastOrder.customerName} - {lastOrder.phone}</p>
                       <p className="text-xs text-slate-500 font-bold">{lastOrder.city}, {lastOrder.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={downloadInvoice} className="flex-grow bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition">تحميل الفاتورة PDF</button>
                    <button onClick={() => setView('store')} className="flex-grow bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-700 transition">العودة للمتجر</button>
                  </div>
                </div>
              )}
            </main>

            <footer className="py-20 text-center border-t bg-white mt-20 relative overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-3xl font-black text-indigo-600 mb-8 tracking-tighter">ELITE<span className="text-slate-900">STORE</span></div>
                <div className="flex justify-center gap-10 mb-10 text-slate-400 text-sm font-bold">
                   <a href="#" className="hover:text-indigo-600 transition">الرئيسية</a>
                   <a href="#" className="hover:text-indigo-600 transition">عن المتجر</a>
                   <a href="#" className="hover:text-indigo-600 transition">سياسة الخصوصية</a>
                   <a href="#" className="hover:text-indigo-600 transition">اتصل بنا</a>
                </div>
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر النخبة الذكي</p>
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-100 to-transparent"></div>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
