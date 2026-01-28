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
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .product-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

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
        const [isLoading, setIsLoading] = useState(true);
        const [lastOrder, setLastOrder] = useState(null);

        // وظيفة جلب البيانات - تم تصحيح المسار ليكون نسبياً ومستقراً
        const loadData = async () => {
          try {
            // المسار النسبي لملف api.php في نفس المجلد
            const apiBase = 'api.php'; 

            const [pRes, cRes, oRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products`).then(r => r.ok ? r.json() : []),
              fetch(`${apiBase}?action=get_categories`).then(r => r.ok ? r.json() : []),
              fetch(`${apiBase}?action=get_orders`).then(r => r.ok ? r.json() : [])
            ]);

            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
            setOrders(Array.isArray(oRes) ? oRes : []);
          } catch (e) {
            console.error("خطأ في جلب البيانات من api.php:", e);
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

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500">جاري تحميل المتجر...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            {/* الهيدر مع الأقسام من قاعدة البيانات */}
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

                {/* شريط الأقسام الديناميكي (يعمل من قاعدة البيانات) */}
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
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  {/* Hero */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 mb-12 text-white relative overflow-hidden">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">متجرك الفاخر <br/> لكل ما هو <span className="text-indigo-400">جديد</span></h2>
                    <p className="text-slate-400 max-w-sm text-sm font-bold">تصفح تشكيلتنا المختارة بعناية من أفضل العلامات التجارية العالمية.</p>
                  </div>

                  {/* Grid */}
                  <div id="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden product-card transition-all flex flex-col h-full shadow-sm">
                        <div className="aspect-square bg-gray-50 cursor-pointer overflow-hidden relative" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-sm mb-3 line-clamp-1">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-lg font-black text-indigo-600">{p.price} <small className="text-[10px]">ر.س</small></span>
                            <button onClick={() => addToCart(p)} className="bg-slate-900 text-white w-9 h-9 flex items-center justify-center rounded-xl hover:bg-indigo-600 transition">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl animate-fadeIn">
                  <h2 className="text-2xl font-black mb-8 text-slate-800">لوحة الإحصائيات</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="إجمالي المبيعات" value={`${orders.reduce((s, o) => s + o.total, 0)} ر.س`} icon="💰" color="bg-emerald-500" />
                    <StatCard title="الطلبات" value={orders.length} icon="📈" color="bg-blue-500" />
                    <StatCard title="المنتجات" value={products.length} icon="📦" color="bg-indigo-500" />
                  </div>
                  <div className="mt-12">
                    <button onClick={() => window.location.href = 'add-product.php'} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm">+ إضافة منتج جديد</button>
                  </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl animate-fadeIn text-center">
                  <h2 className="text-2xl font-black mb-6">سلة التسوق</h2>
                  {cart.length === 0 ? (
                    <p className="text-slate-400 font-bold">السلة فارغة حالياً</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="font-bold">{item.name}</span>
                          <span className="font-black text-indigo-600">{item.price} ر.س</span>
                        </div>
                      ))}
                      <button onClick={() => setView('store')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black mt-8">إتمام الطلب (قريباً)</button>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="py-10 text-center border-t mt-20 text-slate-300 text-xs font-black">
              &copy; {new Date().getFullYear()} متجر النخبة | جميع الحقوق محفوظة
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
