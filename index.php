
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
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; scroll-behavior: smooth; overflow-x: hidden; }
      
      @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
      
      .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
      .animate-slideDown { animation: slideDown 0.8s ease-out forwards; }
      
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 35s linear infinite; }
      .animate-scroll:hover { animation-play-state: paused; }

      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- Slider Component ---
      const Slider = () => {
        const slides = [
          { id: 1, image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'عالم من الأناقة الذكية', sub: 'اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية' },
          { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف الجديدة', sub: 'أزياء عصرية تناسب جميع الأذواق والمناسبات' },
          { id: 3, image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1600', title: 'منزلك.. بلمسة عصرية', sub: 'عروض حصرية على مستلزمات المنزل الذكي' }
        ];
        const [current, setCurrent] = useState(0);
        const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
        useEffect(() => { const t = setInterval(next, 5000); return () => clearInterval(t); }, [next]);

        return (
          <div className="relative h-[380px] md:h-[500px] rounded-[3.5rem] overflow-hidden shadow-2xl mb-16 group">
            {slides.map((s, i) => (
              <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img src={s.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 md:px-24 text-white">
                  <h2 className={`text-4xl md:text-7xl font-black mb-4 ${i === current ? 'animate-slideDown' : ''}`}>{s.title}</h2>
                  <p className={`text-lg md:text-2xl opacity-90 max-w-2xl ${i === current ? 'animate-fadeIn' : ''}`}>{s.sub}</p>
                  <button className="mt-10 bg-indigo-600 hover:bg-indigo-700 w-fit px-10 py-4 rounded-full font-black text-lg transition shadow-xl transform hover:scale-105 active:scale-95">تسوق الآن</button>
                </div>
              </div>
            ))}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-10 bg-white' : 'w-2 bg-white/40'}`} />
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
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [wishlist, setWishlist] = useState([]);

        // الراوتر
        const navigate = useCallback((newView, params = {}) => {
            let path = '/';
            if (newView === 'details' && params.slug) path = `/product/${params.slug}`;
            else if (newView === 'category' && params.id) path = `/category/${params.id}`;
            else if (newView !== 'store') path = `/${newView}`;
            
            window.history.pushState({}, '', path);
            handleRouting();
        }, [products, categories]);

        const handleRouting = useCallback(() => {
            const path = window.location.pathname;
            const parts = path.split('/').filter(Boolean);

            if (parts.length === 0) {
                setView('store'); setSelectedCatId('all'); setSelectedProduct(null);
            } else if (parts[0] === 'product' && parts[1]) {
                const p = products.find(x => (x.seoSettings && x.seoSettings.slug === parts[1]) || String(x.id) === parts[1]);
                if (p) { setSelectedProduct(p); setView('details'); } else { setView('store'); }
            } else if (parts[0] === 'category' && parts[1]) {
                if (categories.some(c => c.id === parts[1])) { setSelectedCatId(parts[1]); setView('store'); } else { setView('store'); }
            } else {
                setView(parts[0] || 'store');
            }
        }, [products, categories]);

        useEffect(() => {
          const load = async () => {
            try {
              const [p, c] = await Promise.all([
                fetch('api.php?action=get_products').then(r => r.json()),
                fetch('api.php?action=get_categories').then(r => r.json())
              ]);
              setProducts(p);
              setCategories(c);
            } catch (e) { console.error(e); }
          };
          load();
          window.addEventListener('popstate', handleRouting);
          return () => window.removeEventListener('popstate', handleRouting);
        }, []);

        useEffect(() => {
            if (products.length > 0) handleRouting();
        }, [products, categories, handleRouting]);

        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100 py-4">
              <div className="container mx-auto px-4 flex items-center justify-between gap-6">
                <h1 onClick={() => navigate('store')} className="text-2xl font-black text-indigo-600 cursor-pointer">
                  ELITE<span className="text-slate-900">STORE</span>
                </h1>
                
                <div className="hidden md:block flex-grow max-w-md relative">
                  <input type="text" placeholder="ابحث عن منتجك..." onChange={e => setSearchQuery(e.target.value)} className="w-full pr-12 pl-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition text-sm font-bold" />
                  <span className="absolute right-4 top-3 text-gray-400">🔍</span>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => navigate('cart')} className="relative p-2 text-indigo-600 bg-indigo-50 rounded-xl">🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full font-black border-2 border-white">{cart.length}</span></button>
                  <button onClick={() => navigate('auth')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg hover:bg-indigo-600 transition active:scale-95">دخول</button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  
                  <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pt-16">
                    <h2 className="text-3xl font-black text-slate-800">{selectedCatId === 'all' ? 'كل المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}</h2>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate('store')} className={`px-5 py-2 rounded-full text-sm font-black transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>الكل</button>
                      {categories.map(c => <button key={c.id} onClick={() => navigate('category', {id: c.id})} className={`px-5 py-2 rounded-full text-sm font-black transition ${selectedCatId === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>{c.name}</button>)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow group flex flex-col h-full">
                        <div className="aspect-[4/3] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => navigate('details', { slug: (p.seoSettings && p.seoSettings.slug) || p.id })}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="font-black text-lg mb-3 truncate text-gray-800 cursor-pointer" onClick={() => navigate('details', { slug: (p.seoSettings && p.seoSettings.slug) || p.id })}>{p.name}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-grow">{p.description}</p>
                          <div className="flex justify-between items-center mt-auto">
                            <span className="text-xl font-black text-indigo-600">{p.price} <small className="text-xs">ر.س</small></span>
                            <button onClick={() => setCart([...cart, p])} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 active:scale-90 transition shadow-sm">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-5xl mx-auto bg-white rounded-[4rem] p-8 md:p-16 shadow-2xl border border-gray-50 animate-fadeIn flex flex-col md:flex-row gap-12 lg:gap-20">
                  <div className="w-full md:w-1/2 aspect-square rounded-[3rem] overflow-hidden shadow-lg border-8 border-gray-50">
                    <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center space-y-8">
                    <div>
                      <span className="bg-indigo-50 text-indigo-600 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">{categories.find(c => c.id === selectedProduct.categoryId)?.name}</span>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
                    </div>
                    <p className="text-gray-500 text-lg leading-relaxed font-medium">{selectedProduct.description}</p>
                    <div className="text-5xl font-black text-indigo-600">{selectedProduct.price} <small className="text-lg">ر.س</small></div>
                    <div className="flex gap-4">
                      <button onClick={() => {setCart([...cart, selectedProduct]); alert('تمت الإضافة للسلة');}} className="flex-grow bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition shadow-2xl active:scale-95">أضف للسلة</button>
                      <button onClick={() => navigate('store')} className="px-8 py-5 border-2 rounded-[2rem] text-gray-400 font-black hover:bg-gray-50 transition active:scale-95">عودة</button>
                    </div>
                  </div>
                </div>
              )}
              
              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[4rem] border border-gray-50 shadow-2xl animate-fadeIn space-y-8">
                  <h2 className="text-3xl font-black text-slate-900 text-center">سلة التسوق</h2>
                  {cart.length === 0 ? <div className="text-center py-10"><p className="text-gray-400 font-bold mb-6 text-xl">سلتك خالية تماماً!</p><button onClick={() => navigate('store')} className="text-indigo-600 font-black underline">ابدأ التسوق الآن</button></div> : (
                    <div className="space-y-6">
                      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                             <div className="flex items-center gap-4">
                               <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                               <div>
                                 <p className="font-black text-slate-800">{item.name}</p>
                                 <p className="text-xs text-gray-400 font-bold">{item.price} ر.س</p>
                               </div>
                             </div>
                             <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500 font-black text-xs hover:underline">حذف</button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 border-t flex justify-between items-center px-4">
                        <span className="text-xl font-black text-slate-400">الإجمالي:</span>
                        <span className="text-3xl font-black text-indigo-600">{cart.reduce((s, i) => s + i.price, 0)} ر.س</span>
                      </div>
                      <button onClick={() => {alert('شكراً لطلبك!'); setCart([]); navigate('store');}} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl mt-6 shadow-xl active:scale-95 transition">تأكيد الطلب</button>
                    </div>
                  )}
                </div>
              )}
            </main>

            <footer className="py-16 text-center text-gray-400 font-bold border-t bg-white mt-16">
                <div className="text-2xl font-black text-indigo-600 mb-6">ELITESTORE</div>
                <div className="text-xs opacity-40">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر النخبة</div>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
