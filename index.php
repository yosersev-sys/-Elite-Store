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

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; scroll-behavior: smooth; overflow-x: hidden; }
      .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .product-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

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
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [cart, setCart] = useState([]);
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [isLoading, setIsLoading] = useState(true);
        const [adminTab, setAdminTab] = useState('stats');

        const updateUrl = (params) => {
          const url = new URL(window.location.href);
          Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
          });
          window.history.pushState({}, '', url.toString());
        };

        const loadData = async () => {
          setIsLoading(true);
          try {
            const apiBase = 'api.php'; 
            const ts = Date.now();
            const [pRes, cRes, oRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products&t=${ts}`).then(r => r.json()),
              fetch(`${apiBase}?action=get_categories&t=${ts}`).then(r => r.json()),
              fetch(`${apiBase}?action=get_orders&t=${ts}`).then(r => r.json())
            ]);

            const allProducts = Array.isArray(pRes) ? pRes : [];
            setProducts(allProducts);
            setCategories(Array.isArray(cRes) ? cRes : []);
            setOrders(Array.isArray(oRes) ? oRes : []);

            // فحص الرابط عند التحميل
            const params = new URLSearchParams(window.location.search);
            const slug = params.get('p');
            const viewParam = params.get('v');

            if (slug) {
              const product = allProducts.find(p => p.seoSettings?.slug === slug);
              if (product) {
                setSelectedProduct(product);
                setView('product-details');
              }
            } else if (viewParam === 'admin') {
              setView('admin');
            }
          } catch (e) {
            console.error("Data fetch error:", e);
          } finally {
            setIsLoading(false);
          }
        };

        useEffect(() => {
          loadData();
          const savedCart = localStorage.getItem('elite_cart');
          if (savedCart) setCart(JSON.parse(savedCart));

          const handlePopState = () => {
             const params = new URLSearchParams(window.location.search);
             if (!params.get('p')) {
               setView('store');
               setSelectedProduct(null);
             }
          };
          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
        }, []);

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

        const navigateToProduct = (product) => {
          const slug = product.seoSettings?.slug || product.id;
          updateUrl({ p: slug, v: null });
          setSelectedProduct(product);
          setView('product-details');
          window.scrollTo(0, 0);
        };

        const navigateToStore = () => {
          updateUrl({ p: null, v: null });
          setView('store');
          setSelectedProduct(null);
        };

        const handleDeleteProduct = async (id) => {
          if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟')) return;
          try {
            const res = await fetch(`api.php?action=delete_product&id=${id}`, { method: 'DELETE' }).then(r => r.json());
            if (res.status === 'success') {
              setProducts(products.filter(p => p.id !== id));
              alert('تم الحذف بنجاح');
            } else {
              alert('خطأ في الحذف');
            }
          } catch (e) {
            alert('خطأ في الاتصال بالسيرفر');
          }
        };

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500">جاري جلب البيانات من Hostinger...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <h1 onClick={navigateToStore} className="text-2xl font-black text-indigo-600 cursor-pointer select-none">
                      ELITE<span className="text-slate-900">STORE</span>
                    </h1>
                  </div>
                  
                  <div className="flex-grow max-w-md hidden md:block">
                    <div className="relative">
                      <input type="text" placeholder="ماذا تريد أن تتسوق اليوم؟" onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2 bg-gray-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('cart')} className="relative p-2.5 bg-gray-50 rounded-xl hover:bg-indigo-50 transition">
                      🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">{cart.length}</span>
                    </button>
                    <button onClick={() => { setView('admin'); updateUrl({ v: 'admin', p: null }); }} className={`p-2.5 rounded-xl transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>⚙️ لوحة التحكم</button>
                  </div>
                </div>

                {view === 'store' && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => { setSelectedCatId('all'); setView('store'); }}
                      className={`whitespace-nowrap px-5 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'}`}
                    >
                      الكل
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCatId(cat.id); setView('store'); }}
                        className={`whitespace-nowrap px-5 py-1.5 rounded-full text-xs font-black transition ${selectedCatId === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <div className="bg-slate-900 rounded-[2.5rem] p-12 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                    <div className="relative z-10 text-center md:text-right">
                        <h2 className="text-3xl md:text-6xl font-black mb-4">نخبة المنتجات <br/> <span className="text-indigo-400">بين يديك</span></h2>
                        <p className="text-slate-400 max-w-sm text-sm font-bold mx-auto md:mx-0">اكتشف تشكيلة حصرية من الأجهزة والأزياء العالمية مع ضمان الجودة.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden product-card transition-all flex flex-col h-full shadow-sm hover:border-indigo-100 cursor-pointer">
                        <div className="aspect-square bg-gray-50 overflow-hidden relative group">
                          <img src={p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="text-[10px] font-black text-indigo-500 uppercase mb-2">
                             {categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                          </div>
                          <h3 className="font-black text-slate-800 text-base mb-4 line-clamp-2 h-12">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-xl font-black text-slate-900">{p.price} <small className="text-xs font-bold">ر.س</small></span>
                            <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-indigo-600 transition shadow-lg active:scale-95">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'product-details' && selectedProduct && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                  <button onClick={navigateToStore} className="mb-8 font-bold text-gray-500 flex items-center gap-2">
                     <span className="rotate-180">➜</span> العودة للمتجر
                  </button>
                  <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border flex flex-col md:flex-row gap-12">
                     <div className="w-full md:w-1/2 aspect-square rounded-[2rem] overflow-hidden border">
                        <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                     </div>
                     <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <h1 className="text-4xl font-black mb-4 text-slate-900">{selectedProduct.name}</h1>
                        <p className="text-slate-500 leading-relaxed mb-8">{selectedProduct.description}</p>
                        <div className="flex items-center justify-between">
                           <span className="text-4xl font-black text-indigo-600">{selectedProduct.price} <small className="text-lg">ر.س</small></span>
                           <button onClick={() => addToCart(selectedProduct)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition">أضف للسلة 🛒</button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="space-y-8 animate-fadeIn">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">لوحة التحكم الذكية</h2>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.location.href = 'add-product.php'} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:scale-105 transition">+ إضافة منتج جديد</button>
                      </div>
                   </div>

                   <div className="flex border-b border-slate-200 gap-8 mb-8">
                      <button onClick={() => setAdminTab('stats')} className={`pb-4 text-sm font-black transition relative ${adminTab === 'stats' ? 'text-indigo-600' : 'text-slate-400'}`}>الإحصائيات</button>
                      <button onClick={() => setAdminTab('products')} className={`pb-4 text-sm font-black transition relative ${adminTab === 'products' ? 'text-indigo-600' : 'text-slate-400'}`}>إدارة المنتجات</button>
                   </div>

                  {adminTab === 'stats' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                      <StatCard title="إجمالي الدخل" value={`${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} ر.س`} icon="💰" color="bg-emerald-500" />
                    </div>
                  ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                              <th className="px-8 py-6">المنتج</th>
                              <th className="px-8 py-6">السعر</th>
                              <th className="px-8 py-6 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {products.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                                <td className="px-8 py-5 flex items-center gap-4">
                                    <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                                    <span className="font-black text-slate-800 text-sm line-clamp-1">{p.name}</span>
                                </td>
                                <td className="px-8 py-5 font-black text-slate-900 text-sm">{p.price} ر.س</td>
                                <td className="px-8 py-5 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => window.location.href = `add-product.php?id=${p.id}`} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-indigo-600 hover:text-white transition">✎</button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition">🗑</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="py-12 text-center border-t mt-20 bg-white">
                <div className="mb-4">
                    <span className="text-xl font-black text-slate-800">ELITE<span className="text-indigo-600">STORE</span></span>
                </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} متجر النخبة | فخر الاستضافة على Hostinger</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
