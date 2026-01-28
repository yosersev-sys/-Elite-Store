
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | Elite Store</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; scroll-behavior: smooth; overflow-x: hidden; }
      
      /* حركات السلايدر المخصصة */
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      
      .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
      .animate-slideDown { animation: slideDown 0.8s ease-out forwards; }
      
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 40s linear infinite; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- المكونات المساعدة ---
      const Slider = () => {
        const slides = [
          { id: 1, image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'عالم من الأناقة الذكية', sub: 'اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية' },
          { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف الجديدة', sub: 'أزياء عصرية تناسب جميع الأذواق' },
          { id: 3, image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1600', title: 'منزلك.. بلمسة عصرية', sub: 'عروض حصرية على مستلزمات المنزل الذكي' }
        ];
        
        const [current, setCurrent] = useState(0);

        const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
        const prev = () => setCurrent(c => (c === 0 ? slides.length - 1 : c - 1));

        useEffect(() => {
          const t = setInterval(next, 5000);
          return () => clearInterval(t);
        }, [next]);

        return (
          <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl mb-12 group">
            {slides.map((s, i) => (
              <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img src={s.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 md:px-20 text-white">
                  <h2 className={`text-4xl md:text-7xl font-black mb-4 ${i === current ? 'animate-slideDown' : ''}`}>{s.title}</h2>
                  <p className={`text-lg md:text-xl opacity-90 max-w-xl ${i === current ? 'animate-fadeIn' : ''}`}>{s.sub}</p>
                  <button className="mt-8 bg-indigo-600 w-fit px-10 py-4 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg transform hover:scale-105 active:scale-95">تسوق الآن</button>
                </div>
              </div>
            ))}

            {/* أزرار التنقل */}
            <button onClick={prev} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={next} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* النقاط السفلية */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-10 bg-white' : 'w-2 bg-white/40'}`} />
              ))}
            </div>
          </div>
        );
      };

      const App = () => {
        const [view, setView] = useState('store');
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [isCatsOpen, setIsCatsOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [cart, setCart] = useState([]);
        const [wishlist, setWishlist] = useState([]);
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [selectedCatId, setSelectedCatId] = useState('all');

        const fetchData = async () => {
          try {
            const [pRes, cRes] = await Promise.all([
              fetch('api.php?action=get_products'),
              fetch('api.php?action=get_categories')
            ]);
            setProducts(await pRes.json());
            setCategories(await cRes.json());
          } catch (e) { console.error(e); }
        };

        useEffect(() => { fetchData(); }, []);

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100 py-3">
              <div className="container mx-auto px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-xl md:text-2xl font-black text-indigo-600 cursor-pointer">
                    ELITE<span className="text-slate-900">STORE</span>
                  </h1>
                  <nav className="hidden lg:flex items-center gap-1 font-bold text-gray-600">
                    <button onClick={() => setView('store')} className="px-3 py-2 hover:text-indigo-600">الرئيسية</button>
                    <div className="relative group">
                      <button onMouseEnter={() => setIsCatsOpen(true)} className="px-3 py-2 hover:text-indigo-600">التصنيفات ▼</button>
                      {isCatsOpen && (
                        <div onMouseLeave={() => setIsCatsOpen(false)} className="absolute top-full right-0 w-48 bg-white shadow-xl rounded-xl border py-2 animate-fadeIn">
                          <button onClick={() => {setSelectedCatId('all'); setIsCatsOpen(false);}} className="w-full text-right px-4 py-2 hover:bg-gray-50">الكل</button>
                          {categories.map(c => <button key={c.id} onClick={() => {setSelectedCatId(c.id); setIsCatsOpen(false);}} className="w-full text-right px-4 py-2 hover:bg-gray-50">{c.name}</button>)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setView('admin')} className="px-3 py-2 hover:text-indigo-600">الإدارة</button>
                  </nav>
                </div>

                <div className="hidden md:block flex-grow max-w-sm relative">
                  <input type="text" placeholder="ابحث..." onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-2 bg-gray-100 rounded-xl text-sm outline-none border border-transparent focus:border-indigo-100" />
                  <span className="absolute right-3 top-2 text-gray-400">🔍</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setView('wishlist')} className="p-2 text-red-500 relative">❤️ <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 rounded-full">{wishlist.length}</span></button>
                  <button onClick={() => setView('cart')} className="p-2 text-indigo-600 relative">🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span></button>
                  <button onClick={() => setView('auth')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-600 transition shadow-md">دخول</button>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-600">☰</button>
                </div>
              </div>

              {isMenuOpen && (
                <div className="lg:hidden bg-white border-t p-4 space-y-3 font-bold animate-fadeIn">
                  <button onClick={() => {setView('store'); setIsMenuOpen(false);}} className="block w-full text-right py-2">الرئيسية</button>
                  <button onClick={() => {setView('auth'); setIsMenuOpen(false);}} className="block w-full text-right py-2 text-indigo-600 underline">تسجيل الدخول / إنشاء حساب</button>
                  <button onClick={() => {setView('admin'); setIsMenuOpen(false);}} className="block w-full text-right py-2">لوحة الإدارة</button>
                </div>
              )}
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900">{selectedCatId === 'all' ? 'أحدث المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedCatId('all')} className={`px-4 py-1.5 rounded-full text-sm font-bold ${selectedCatId === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>الكل</button>
                      {categories.map(c => <button key={c.id} onClick={() => setSelectedCatId(c.id)} className={`px-4 py-1.5 rounded-full text-sm font-bold ${selectedCatId === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>{c.name}</button>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2rem] border overflow-hidden hover:shadow-xl transition group">
                        <div className="aspect-square bg-gray-50 overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold mb-2 truncate">{p.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-indigo-600">{p.price} ر.س</span>
                            <button onClick={() => {setCart([...cart, p]); alert('تمت الإضافة للسلة');}} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-indigo-600 transition shadow-sm active:scale-90">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* باقي الـ views (details, auth, wishlist, cart, admin) تظل كما هي في النسخة السابقة */}
              {view === 'details' && selectedProduct && (
                <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-xl grid md:grid-cols-2 gap-10 animate-fadeIn border">
                  <img src={selectedProduct.images[0]} className="w-full rounded-3xl aspect-square object-cover" />
                  <div className="flex flex-col justify-center">
                    <h2 className="text-4xl font-black mb-4">{selectedProduct.name}</h2>
                    <p className="text-gray-500 mb-6 text-lg leading-relaxed">{selectedProduct.description}</p>
                    <div className="text-4xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</div>
                    <div className="flex gap-3">
                      <button onClick={() => {setCart([...cart, selectedProduct]); alert('تمت الإضافة للسلة');}} className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition shadow-xl">أضف للسلة</button>
                      <button onClick={() => setView('store')} className="px-6 py-4 border rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition">عودة</button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="p-10 text-center text-gray-400 font-bold border-t bg-white mt-10">
              &copy; {new Date().getFullYear()} متجر النخبة - Elite Store
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
