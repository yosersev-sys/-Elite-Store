
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>اسواق فاقوس | خضروات وفواكه طازجة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- React & Libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8faf7; scroll-behavior: smooth; overflow-x: hidden; }
      
      /* Animations */
      .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      
      .header-glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px -12px rgba(34, 197, 94, 0.15); }
      
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
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop",
            title: "خضروات فاقوس الطازجة",
            desc: "من مزارعنا مباشرة إلى مائدتكم بجودة نضمنها"
          },
          {
            image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1600&auto=format&fit=crop",
            title: "فواكه موسمية فاخرة",
            desc: "أفضل أنواع الفاكهة الغنية بالفيتامينات والطاقة"
          },
          {
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1600&auto=format&fit=crop",
            title: "توفير اسواق فاقوس",
            desc: "عروض حصرية على كافة المستلزمات اليومية"
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
          <div className="relative w-full h-[400px] md:h-[550px] rounded-[3.5rem] overflow-hidden mb-12 shadow-2xl group animate-fadeIn">
            {slides.map((slide, index) => (
              <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/70 via-green-900/10 to-transparent z-10"></div>
                <img src={slide.image} className="w-full h-full object-cover" alt={slide.title} />
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 md:p-20 text-white">
                  <h2 className="text-4xl md:text-7xl font-black mb-4 animate-slideUp tracking-tighter">{slide.title}</h2>
                  <p className="text-lg md:text-xl text-green-50 max-w-lg mb-8 font-bold opacity-90">{slide.desc}</p>
                  <button className="bg-green-600 hover:bg-white hover:text-green-600 text-white px-10 py-4 rounded-2xl font-black w-fit transition-all shadow-xl">ابدأ التسوق</button>
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
          "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Almarai_logo.svg/1200px-Almarai_logo.svg.png",
          "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Nestle_text_logo.svg/1200px-Nestle_text_logo.svg.png",
          "https://logos-world.net/wp-content/uploads/2021/08/Danone-Logo.png",
          "https://www.arla.com/siteassets/arla-global/brands/puck/puck-logo.png?width=250&height=250&mode=crop",
          "https://upload.wikimedia.org/wikipedia/commons/e/e0/KDD_logo.png",
          "https://www.sadia.com.sa/wp-content/themes/sadia/images/logo.png"
        ];
        return (
          <div className="py-10 overflow-hidden bg-white/80 border-y border-green-50 mb-16 relative">
            <div className="animate-marquee pause-on-hover flex items-center gap-20">
              {[...brands, ...brands].map((logo, i) => (
                <img key={i} src={logo} className="h-8 md:h-12 w-32 object-contain opacity-60 hover:opacity-100 transition cursor-pointer" />
              ))}
            </div>
          </div>
        );
      };

      const App = () => {
        const [view, setView] = useState('store');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [cart, setCart] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [isLoading, setIsLoading] = useState(true);

        const updateUrl = (params) => {
          const url = new URL(window.location.href);
          Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
          });
          window.history.pushState({}, '', url.toString());
          window.dispatchEvent(new PopStateEvent('popstate'));
        };

        const loadData = async () => {
          setIsLoading(true);
          try {
            const apiBase = 'api.php'; 
            const ts = Date.now();
            const [pRes, cRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products&t=${ts}`).then(r => r.json()),
              fetch(`${apiBase}?action=get_categories&t=${ts}`).then(r => r.json())
            ]);

            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
          } catch (e) {
            console.error("Data fetch error:", e);
          } finally {
            setIsLoading(false);
          }
        };

        useEffect(() => {
          loadData();
          const savedCart = localStorage.getItem('fresh_cart');
          if (savedCart) setCart(JSON.parse(savedCart));
        }, []);

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        const addToCart = (product) => {
          const newCart = [...cart, { ...product, quantity: 1 }];
          setCart(newCart);
          localStorage.setItem('fresh_cart', JSON.stringify(newCart));
          alert('تمت إضافة ' + product.name + ' بنجاح');
        };

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4 text-green-600">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black">جاري تحضير طلبات اسواق فاقوس...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-green-100">
              <div className="container mx-auto px-4 pt-4 pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h1 onClick={() => setView('store')} className="text-2xl font-black text-green-600 cursor-pointer select-none tracking-tighter flex items-center gap-2">
                    <span className="text-3xl">🧺</span>
                    <span>اسواق <span className="text-slate-900">فاقوس</span></span>
                  </h1>
                  
                  <div className="flex-grow max-w-md hidden md:block">
                    <input type="text" placeholder="ماذا تريد أن تتسوق من فاقوس اليوم؟" onChange={e => setSearchQuery(e.target.value)} className="w-full px-5 py-2.5 bg-green-50/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setView('cart')} className="relative p-2.5 bg-slate-900 text-white rounded-xl hover:bg-green-600 transition shadow-lg">
                      🛒 <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">{cart.length}</span>
                    </button>
                    <button onClick={() => updateUrl({ v: 'admin'})} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition font-black text-xs">⚙️ الإدارة</button>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => setSelectedCatId('all')} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCatId === 'all' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-green-50'}`}>الكل</button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCatId(cat.id)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition ${selectedCatId === cat.id ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-green-50'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <BrandsMarquee />
                  <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter">محاصيل اليوم من مزارع فاقوس</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2.5rem] border border-green-50 overflow-hidden product-card transition-all flex flex-col h-full shadow-sm group">
                        <div className="aspect-square bg-[#fcfdfe] overflow-hidden relative">
                          <img src={p.images && p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                          <div className="absolute top-3 right-3 bg-green-600 text-white text-[9px] font-black px-2 py-1 rounded-lg">طازج</div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 text-lg mb-2 line-clamp-1 tracking-tighter">{p.name}</h3>
                          <p className="text-gray-400 text-xs font-bold mb-4 line-clamp-2">{p.description}</p>
                          <div className="mt-auto flex justify-between items-center border-t border-green-50 pt-4">
                            <span className="text-xl font-black text-green-700">{p.price} <small className="text-[10px] font-bold">ر.س</small></span>
                            <button onClick={() => addToCart(p)} className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-green-600 transition shadow-lg">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="animate-fadeIn max-w-4xl mx-auto py-12">
                   <h2 className="text-4xl font-black mb-10 tracking-tighter">سلة تسوق فاقوس</h2>
                   {cart.length === 0 ? (
                      <div className="bg-white p-20 rounded-[3rem] text-center border shadow-sm">
                         <p className="text-gray-400 font-bold mb-6 text-xl">السلة فارغة، خيرات فاقوس بانتظارك!</p>
                         <button onClick={() => setView('store')} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl">تصفح السوق</button>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {cart.map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[2rem] border flex items-center gap-6 group hover:shadow-lg transition">
                               <img src={item.images[0]} className="w-20 h-20 rounded-2xl object-cover border" />
                               <div className="flex-grow">
                                  <h3 className="font-black text-slate-800 text-xl tracking-tighter">{item.name}</h3>
                                  <p className="text-green-600 font-black">{item.price} ر.س</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className="font-black text-gray-400">الكمية: {item.quantity}</span>
                                  <button onClick={() => {
                                      const newCart = cart.filter((_, i) => i !== idx);
                                      setCart(newCart);
                                      localStorage.setItem('fresh_cart', JSON.stringify(newCart));
                                  }} className="text-rose-500 font-black">إزالة</button>
                               </div>
                            </div>
                         ))}
                         <div className="bg-white p-10 rounded-[3rem] border mt-10 shadow-sm flex justify-between items-center">
                            <div>
                               <p className="text-gray-400 font-bold uppercase text-xs">إجمالي فاتورة فاقوس</p>
                               <p className="text-4xl font-black text-green-600">{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)} ر.س</p>
                            </div>
                            <button onClick={() => alert('سيتم توجيهك لصفحة الدفع الآمن')} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-green-600 transition">تأكيد الطلب</button>
                         </div>
                      </div>
                   )}
                </div>
              )}
            </main>

            <footer className="py-20 text-center bg-green-900 text-white mt-20">
              <h2 className="text-2xl font-black mb-4">اسواق <span className="text-green-400">فاقوس</span></h2>
              <p className="text-green-300/50 text-[10px] font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} من مزارعنا إليكم مباشرة</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
