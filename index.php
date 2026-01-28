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
      .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .header-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.12); }
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
      .animate-marquee { display: flex; animation: scroll 30s linear infinite; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

      const Slider = () => {
        const [current, setCurrent] = useState(0);
        const slides = [
          { image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1600", title: "عالم من الأناقة الذكية", desc: "اكتشف أحدث صيحات التكنولوجيا" },
          { image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600", title: "تشكيلة الصيف الجديدة", desc: "أزياء عصرية تناسب الجميع" }
        ];
        useEffect(() => {
          const timer = setInterval(() => setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1)), 5000);
          return () => clearInterval(timer);
        }, [slides.length]);
        return (
          <div className="relative w-full h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
            {slides.map((slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
                <img src={slide.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-12 text-white">
                  <h2 className="text-4xl md:text-6xl font-black mb-4">{slide.title}</h2>
                  <p className="text-lg opacity-90">{slide.desc}</p>
                </div>
              </div>
            ))}
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
        };

        const filteredProducts = useMemo(() => {
          return products.filter(p => selectedCatId === 'all' || p.categoryId === selectedCatId);
        }, [products, selectedCatId]);

        if (isLoading) return <div className="h-screen flex items-center justify-center font-bold">جاري تحميل المتجر...</div>;

        return (
          <div className="min-h-screen">
            <header className="header-glass sticky top-0 z-50 p-4 border-b">
              <div className="container mx-auto flex justify-between items-center">
                <h1 onClick={() => navigateToCategory('all')} className="text-2xl font-black text-indigo-600 cursor-pointer">ELITE STORE</h1>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setView('cart')} className="bg-slate-900 text-white p-2 rounded-xl">🛒 {cart.length}</button>
                </div>
              </div>
              <div className="container mx-auto mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                 <button onClick={() => navigateToCategory('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>الكل</button>
                 {categories.map(cat => (
                   <button key={cat.id} onClick={() => navigateToCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${selectedCatId === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{cat.name}</button>
                 ))}
              </div>
            </header>

            <main className="container mx-auto p-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-3xl border p-4 cursor-pointer product-card">
                        <img src={p.images[0]} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                        <h3 className="font-bold mb-2">{p.name}</h3>
                        <p className="text-indigo-600 font-black">{p.price} ر.س</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'category-page' && (
                <div className="animate-fadeIn">
                  <h2 className="text-4xl font-black mb-8 text-slate-800">{categories.find(c => c.id === selectedCatId)?.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigateToProduct(p)} className="bg-white rounded-3xl border p-4 cursor-pointer product-card">
                        <img src={p.images[0]} className="w-full aspect-square object-cover rounded-2xl mb-4" />
                        <h3 className="font-bold mb-2">{p.name}</h3>
                        <p className="text-indigo-600 font-black">{p.price} ر.س</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'product-details' && selectedProduct && (
                <div className="animate-fadeIn max-w-4xl mx-auto bg-white p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row gap-8">
                  <img src={selectedProduct.images[0]} className="w-full md:w-1/2 aspect-square object-cover rounded-3xl" />
                  <div className="flex flex-col justify-center">
                    <h2 className="text-4xl font-black mb-4">{selectedProduct.name}</h2>
                    <p className="text-gray-500 mb-8">{selectedProduct.description}</p>
                    <span className="text-3xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</span>
                    <button className="bg-slate-900 text-white py-4 rounded-2xl font-bold">أضف للسلة 🛒</button>
                  </div>
                </div>
              )}
            </main>

            <footer className="bg-slate-900 text-white py-12 text-center mt-20">
              <p>&copy; {new Date().getFullYear()} متجر النخبة</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
