
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
      body { background-color: #fcfdfe; scroll-behavior: smooth; overflow-x: hidden; }
      
      /* Animations */
      .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      
      .header-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.12); }
      
      /* Marquee Animation */
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
      .animate-marquee { display: flex; animation: scroll 30s linear infinite; }
      .pause-on-hover:hover { animation-play-state: paused; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- Slider Component ---
      const Slider = () => {
        const slides = [
          {
            image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1600&auto=format&fit=crop",
            title: "عالم من الأناقة الذكية",
            desc: "اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية"
          },
          {
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
            title: "تشكيلة الصيف الجديدة",
            desc: "أزياء عصرية تناسب جميع الأذواق والمناسبات"
          },
          {
            image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=1600&auto=format&fit=crop",
            title: "منزلك.. بلمسة عصرية",
            desc: "عروض حصرية على مستلزمات المنزل الذكي"
          }
        ];
        const [current, setCurrent] = useState(0);

        useEffect(() => {
          const timer = setInterval(() => {
            setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
          }, 5000);
          return () => clearInterval(timer);
        }, [slides.length]);

        return (
          <div className="relative w-full h-[400px] md:h-[550px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl group animate-fadeIn">
            {slides.map((slide, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10"></div>
                <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 md:p-20 text-white">
                  <h2 className="text-4xl md:text-7xl font-black mb-4 animate-slideUp">{slide.title}</h2>
                  <p className="text-lg md:text-xl text-slate-200 max-w-lg mb-8 font-bold opacity-90">{slide.desc}</p>
                  <button className="bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white px-10 py-4 rounded-2xl font-black w-fit transition-all shadow-xl">تسوق الآن</button>
                </div>
              </div>
            ))}
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {slides.map((_, i) => (
                <div key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${i === current ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}></div>
              ))}
            </div>
          </div>
        );
      };

      // --- Brands Marquee ---
      const BrandsMarquee = () => {
        const brands = [
          "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
          "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
          "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg",
          "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
          "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
          "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg"
        ];
        return (
          <div className="py-10 overflow-hidden bg-white/50 border-y border-slate-100 mb-16 relative">
            <div className="animate-marquee pause-on-hover flex items-center gap-20">
              {[...brands, ...brands].map((logo, i) => (
                <img key={i} src={logo} className="h-8 md:h-12 w-32 object-contain grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition cursor-pointer" />
              ))}
            </div>
          </div>
        );
      };

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
        const [newCatName, setNewCatName] = useState('');

        const updateUrl = (params) => {
          const url = new URL(window.location.href);
          Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
          });
          window.history.pushState({}, '', url.toString());
          window.dispatchEvent(new PopStateEvent('popstate'));
        };

        const syncStateWithUrl = useCallback((allProducts, allCategories) => {
          const params = new URLSearchParams(window.location.search);
          const slug = params.get('p');
          const viewParam = params.get('v');
          const catName = params.get('category');

          if (slug) {
            const product = allProducts.find(p => p.seoSettings?.slug === slug || p.id === slug);
            if (product) {
              setSelectedProduct(product);
              setView('product-details');
              return;
            }
          }
          
          if (catName) {
            const cat = allCategories.find(c => c.name === catName);
            if (cat) {
              setSelectedCatId(cat.id);
              setView('category-page');
              return;
            }
          }

          if (viewParam === 'admin') setView('admin');
          else if (viewParam === 'cart') setView('cart');
          else {
            setView('store');
            setSelectedProduct(null);
            setSelectedCatId('all');
          }
        }, []);

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
            const allCats = Array.isArray(cRes) ? cRes : [];
            setProducts(allProducts);
            setCategories(allCats);
            setOrders(Array.isArray(oRes) ? oRes : []);

            syncStateWithUrl(allProducts, allCats);
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
             syncStateWithUrl(products, categories);
          };
          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
        }, [products.length, categories.length, syncStateWithUrl]);

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        const activeCategory = useMemo(() => {
          return categories.find(c => c.id === selectedCatId);
        }, [categories, selectedCatId]);

        const addToCart = (product) => {
          if (product.stockQuantity <= 0) return alert('عذراً، المنتج نفذ من المخزون');
          setCart([...cart, { ...product, quantity: 1 }]);
          alert('تمت الإضافة للسلة');
        };

        const navigateToCategory = (id) => {
          if (id === 'all') {
            updateUrl({ category: null, p: null, v: null });
          } else {
            const cat = categories.find(c => c.id === id);
            if (cat) updateUrl({ category: cat.name, p: null, v: null });
          }
        };

        const navigateToProduct = (product) => {
          const slug = product.seoSettings?.slug || product.id;
          updateUrl({ p: slug, v: null, category: null });
        };

        const navigateToStore = () => {
          updateUrl({ p: null, v: null, category: null });
        };

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500">تحميل عالم النخبة...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h1 onClick={navigateToStore} className="text-2xl font-black text-indigo-600 cursor-pointer select-none tracking-tighter">
                    ELITE<span className="text-slate-900">STORE</span>
                  </h1>
                  
                  <div className="flex-grow max-w-md hidden md:block">
                    <input type="text" placeholder="ابحث عن الجودة..." onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2.5 bg-gray-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('cart')} className="relative p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition">
                      🛒 <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">{cart.length}</span>
                    </button>
                    <button onClick={() => updateUrl({ v: 'admin', p: null, category: null })} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition">⚙️ الإدارة</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => navigateToCategory('all')} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCatId === 'all' && view === 'store' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'}`}>الرئيسية</button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => navigateToCategory(cat.id)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCatId === cat.id && view === 'category-page' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <BrandsMarquee />
                  <h2 className="text-3xl font-black text-slate-800 mb-8">منتجاتنا الحصرية</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden product-card transition-all flex flex-col h-full shadow-sm cursor-pointer group">
                        <div className="aspect-square bg-slate-50 overflow-hidden relative">
                          <img src={p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</span>
                          <h3 className="font-black text-slate-800 text-base mb-4 line-clamp-1">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-xl font-black text-slate-900">{p.price} <small className="text-xs font-bold">ر.س</small></span>
                            <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-indigo-600 transition shadow-lg">🛒</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'category-page' && activeCategory ? (
                <div className="animate-fadeIn">
                   <div className="bg-slate-900 rounded-[3rem] p-12 text-white mb-16 relative overflow-hidden">
                      <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">
                         قسم {activeCategory.name}
                      </h2>
                      <p className="text-slate-400 font-bold text-xl">اكتشف أفضل المختارات في هذا القسم.</p>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden product-card transition-all flex flex-col h-full shadow-sm cursor-pointer group">
                        <div className="aspect-square bg-slate-50 overflow-hidden relative">
                          <img src={p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-base mb-4 line-clamp-1">{p.name}</h3>
                          <div className="mt-auto flex justify-between items-center">
                            <span className="text-xl font-black text-slate-900">{p.price} <small className="text-xs font-bold">ر.س</small></span>
                            <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-indigo-600 transition shadow-lg">🛒</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : view === 'category-page' && (
                <div className="text-center py-20">
                  <p className="text-slate-400 font-bold">لا يوجد قسم بهذا الاسم حالياً.</p>
                  <button onClick={navigateToStore} className="mt-4 bg-indigo-600 text-white px-8 py-2 rounded-xl">الرجوع للرئيسية</button>
                </div>
              )}
            </main>

            <footer className="py-20 text-center bg-slate-900 text-white mt-20">
              <h2 className="text-2xl font-black mb-4">ELITE<span className="text-indigo-500">STORE</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
