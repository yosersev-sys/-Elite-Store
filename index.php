
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
      
      /* حركات السلايدر والعناصر */
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      
      .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
      .animate-slideDown { animation: slideDown 0.8s ease-out forwards; }
      
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      
      /* حركة التمرير اللانهائي للعلامات التجارية */
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(33.33%); }
      }
      .animate-scroll {
        animation: scroll 30s linear infinite;
      }
      .animate-scroll:hover {
        animation-play-state: paused;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- مكون السلايدر ---
      const Slider = () => {
        const slides = [
          { id: 1, image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'عالم من الأناقة الذكية', sub: 'اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية' },
          { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف الجديدة', sub: 'أزياء عصرية تناسب جميع الأذواق' },
          { id: 3, image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1600', title: 'منزلك.. بلمسة عصرية', sub: 'عروض حصرية على مستلزمات المنزل الذكي' }
        ];
        const [current, setCurrent] = useState(0);
        const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
        useEffect(() => { const t = setInterval(next, 5000); return () => clearInterval(t); }, [next]);

        return (
          <div className="relative h-[350px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl mb-12 group">
            {slides.map((s, i) => (
              <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img src={s.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 md:px-20 text-white">
                  <h2 className={`text-3xl md:text-6xl font-black mb-4 ${i === current ? 'animate-slideDown' : ''}`}>{s.title}</h2>
                  <p className={`text-sm md:text-xl opacity-90 max-w-xl ${i === current ? 'animate-fadeIn' : ''}`}>{s.sub}</p>
                  <button className="mt-8 bg-indigo-600 w-fit px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg">تسوق الآن</button>
                </div>
              </div>
            ))}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
              ))}
            </div>
          </div>
        );
      };

      // --- مكون العلامات التجارية ---
      const BrandsSection = () => {
        const brands = [
          { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
          { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
          { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
          { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
          { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
          { name: 'HP', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' }
        ];
        // تكرار الشعارات للحصول على تأثير التمرير اللانهائي
        const duplicated = [...brands, ...brands, ...brands];

        return (
          <section className="py-12 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm mb-12 overflow-hidden relative">
            <div className="text-center mb-8">
              <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-4 py-1 rounded-full">شركاء النجاح</span>
              <h2 className="text-xl font-black text-slate-800 mt-2">العلامات التجارية العالمية</h2>
            </div>
            <div className="relative flex overflow-hidden">
               <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
               <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
               <div className="flex animate-scroll whitespace-nowrap items-center py-4">
                {duplicated.map((b, i) => (
                  <div key={i} className="mx-10 w-28 h-12 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer flex items-center justify-center">
                    <img src={b.logo} alt={b.name} className="max-h-full object-contain" />
                  </div>
                ))}
               </div>
            </div>
          </section>
        );
      };

      const App = () => {
        const [view, setView] = useState('store');
        const [searchQuery, setSearchQuery] = useState('');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [cart, setCart] = useState([]);
        const [wishlist, setWishlist] = useState([]);
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [selectedProduct, setSelectedProduct] = useState(null);

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
                <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-xl md:text-2xl font-black text-indigo-600 cursor-pointer">
                  ELITE<span className="text-slate-900">STORE</span>
                </h1>
                <nav className="hidden lg:flex items-center gap-6 font-bold text-gray-600">
                  <button onClick={() => setView('store')} className="hover:text-indigo-600">الرئيسية</button>
                  <button onClick={() => setView('admin')} className="hover:text-indigo-600">الإدارة</button>
                </nav>
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('cart')} className="relative p-2 text-indigo-600">🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span></button>
                  <button onClick={() => setView('auth')} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md">دخول</button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <BrandsSection />
                  
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800">{selectedCatId === 'all' ? 'أحدث المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-[2rem] border overflow-hidden hover:shadow-xl transition group">
                        <div className="aspect-square bg-gray-50 overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold mb-2">{p.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-indigo-600">{p.price} ر.س</span>
                            <button onClick={() => setCart([...cart, p])} className="bg-slate-900 text-white p-2 rounded-xl active:scale-90 transition">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] border shadow-xl animate-fadeIn">
                  <h2 className="text-2xl font-black mb-6">سلة التسوق</h2>
                  {cart.length === 0 ? <p className="text-gray-400">السلة فارغة</p> : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b pb-2"><span>{item.name}</span><span className="font-bold">{item.price} ر.س</span></div>
                      ))}
                      <button onClick={() => {alert('تم الطلب'); setCart([]); setView('store');}} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-4">إتمام الشراء</button>
                    </div>
                  )}
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-4xl mx-auto bg-white rounded-[3.5rem] p-8 md:p-12 shadow-xl border animate-fadeIn flex flex-col md:flex-row gap-10">
                  <img src={selectedProduct.images[0]} className="w-full md:w-1/2 rounded-3xl aspect-square object-cover" />
                  <div className="flex flex-col justify-center">
                    <h2 className="text-4xl font-black mb-4">{selectedProduct.name}</h2>
                    <p className="text-gray-500 mb-6 text-lg">{selectedProduct.description}</p>
                    <div className="text-4xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</div>
                    <button onClick={() => {setCart([...cart, selectedProduct]); alert('أضيف للسلة');}} className="bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition">أضف للسلة</button>
                    <button onClick={() => setView('store')} className="mt-4 text-gray-400 font-bold">العودة للمتجر</button>
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
