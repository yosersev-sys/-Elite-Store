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
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      /* Infinite Scroll Marquee */
      @keyframes scrollBrands {
        0% { transform: translateX(0); }
        100% { transform: translateX(50%); }
      }
      .animate-marquee {
        display: flex;
        width: 200%;
        animation: scrollBrands 30s linear infinite;
      }
      .pause-on-hover:hover { animation-play-state: paused; }
      
      .header-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.12); }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

      // --- Slider Component ---
      const Slider = () => {
        const [current, setCurrent] = useState(0);
        const slides = [
          { image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1600", title: "عالم من الأناقة الذكية", desc: "اكتشف أحدث صيحات التكنولوجيا بأسعار حصرية" },
          { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600", title: "تشكيلة الصيف الجديدة", desc: "أزياء عصرية تناسب ذوقك الرفيع" }
        ];
        useEffect(() => {
          const timer = setInterval(() => setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1)), 5000);
          return () => clearInterval(timer);
        }, [slides.length]);
        return (
          <div className="relative w-full h-[350px] md:h-[500px] rounded-[3rem] overflow-hidden mb-8 shadow-2xl animate-fadeIn">
            {slides.map((slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
                <img src={slide.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12 text-white">
                  <h2 className="text-4xl md:text-6xl font-black mb-4">{slide.title}</h2>
                  <p className="text-lg opacity-90 font-bold">{slide.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );
      };

      // --- Brands Marquee Component ---
      const BrandsMarquee = () => {
        const brands = [
          { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
          { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
          { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
          { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
          { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
          { name: 'HP', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' }
        ];
        return (
          <div className="py-12 overflow-hidden bg-white/50 border-y border-slate-100 mb-12 relative group">
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10">شركاء النجاح</div>
            <div className="animate-marquee pause-on-hover flex items-center gap-20">
              {[...brands, ...brands, ...brands].map((brand, i) => (
                <div key={i} className="flex-shrink-0 w-32 h-12 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition duration-500">
                  <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        );
      };

      const App = () => {
        const [view, setView] = useState('store');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [cart, setCart] = useState([]);
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '').replace(/--+/g, '-');

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
            const [pRes, cRes, oRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products`).then(r => r.json()),
              fetch(`${apiBase}?action=get_categories`).then(r => r.json()),
              fetch(`${apiBase}?action=get_orders`).then(r => r.json())
            ]);

            const allProducts = Array.isArray(pRes) ? pRes : [];
            const allCats = Array.isArray(cRes) ? cRes : [];
            setProducts(allProducts);
            setCategories(allCats);
            setOrders(Array.isArray(oRes) ? oRes : []);

            const params = new URLSearchParams(window.location.search);
            const pSlug = params.get('p');
            const cSlug = params.get('cat');

            if (pSlug) {
              const product = allProducts.find(p => p.seoSettings?.slug === pSlug || p.id === pSlug);
              if (product) { setSelectedProduct(product); setView('product-details'); }
            } else if (cSlug) {
              const category = allCats.find(c => slugify(c.name) === cSlug || c.id === cSlug);
              if (category) { setSelectedCatId(category.id); setView('category-page'); }
            }
          } catch (e) { console.error(e); }
          setIsLoading(false);
        };

        useEffect(() => { loadData(); }, []);

        const navigateToCategory = (catId) => {
          if (catId === 'all') {
            updateUrl({ cat: null, p: null }); setView('store'); setSelectedCatId('all');
          } else {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
              updateUrl({ cat: slugify(cat.name), p: null });
              setSelectedCatId(catId); setView('category-page');
            }
          }
        };

        const navigateToProduct = (p) => {
          updateUrl({ p: p.seoSettings?.slug || p.id, cat: null });
          setSelectedProduct(p); setView('product-details');
          window.scrollTo(0, 0);
        };

        const filteredProducts = useMemo(() => {
          return products.filter(p => selectedCatId === 'all' || p.categoryId === selectedCatId);
        }, [products, selectedCatId]);

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-500">تحميل عالم النخبة...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass sticky top-0 z-50 border-b border-slate-100">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 onClick={() => navigateToCategory('all')} className="text-2xl font-black text-indigo-600 cursor-pointer tracking-tighter">
                  ELITE<span className="text-slate-900">STORE</span>
                </h1>
                <div className="flex gap-3 items-center">
                  <button onClick={() => setView('cart')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black">السلة ({cart.length})</button>
                  <button onClick={() => window.location.href='index.php?v=admin'} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black">الإدارة</button>
                </div>
              </div>
              <div className="container mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                 <button onClick={() => navigateToCategory('all')} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>الكل</button>
                 {categories.map(cat => (
                   <button key={cat.id} onClick={() => navigateToCategory(cat.id)} className={`px-5 py-1.5 rounded-full text-[10px] font-black transition ${selectedCatId === cat.id ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>{cat.name}</button>
                 ))}
              </div>
            </header>

            <main className="container mx-auto px-4 py-8 flex-grow">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <BrandsMarquee />
                  
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black text-slate-800">وصل حديثاً</h2>
                     <div className="h-[2px] bg-slate-100 flex-grow mx-6 rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden product-card transition-all cursor-pointer shadow-sm">
                        <div className="aspect-square bg-slate-50 overflow-hidden">
                          <img src={p.images[0]} className="w-full h-full object-cover hover:scale-110 transition duration-700" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-black text-slate-800 text-sm mb-2 line-clamp-1">{p.name}</h3>
                          <p className="text-indigo-600 font-black text-lg">{p.price} <small className="text-[10px]">ر.س</small></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'category-page' && (
                <div className="animate-fadeIn">
                  <h2 className="text-4xl font-black mb-10 text-slate-800">{categories.find(c => c.id === selectedCatId)?.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-[2rem] border p-4 cursor-pointer product-card">
                        <img src={p.images[0]} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                        <h3 className="font-black mb-2">{p.name}</h3>
                        <p className="text-indigo-600 font-black">{p.price} ر.س</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'product-details' && selectedProduct && (
                <div className="animate-fadeIn max-w-5xl mx-auto bg-white p-6 md:p-12 rounded-[3.5rem] shadow-2xl border flex flex-col md:flex-row gap-12">
                  <div className="w-full md:w-1/2 aspect-square rounded-[2.5rem] overflow-hidden border">
                    <img src={selectedProduct.images[0]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center space-y-6">
                    <h2 className="text-4xl font-black text-slate-900">{selectedProduct.name}</h2>
                    <p className="text-slate-500 leading-relaxed font-bold">{selectedProduct.description}</p>
                    <div className="pt-6 border-t flex items-center justify-between">
                       <span className="text-4xl font-black text-indigo-600">{selectedProduct.price} <small className="text-lg">ر.س</small></span>
                       <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-600 transition">أضف للسلة</button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="bg-slate-900 text-white py-12 text-center mt-20">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">&copy; {new Date().getFullYear()} متجر النخبة | جميع الحقوق محفوظة</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
