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
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes scrollBrands { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
      .animate-marquee { display: flex; width: 200%; animation: scrollBrands 30s linear infinite; }
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

      const BrandsMarquee = ({ brands }) => {
        if (!brands || brands.length === 0) return null;
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
        const [brands, setBrands] = useState([]);
        const [cart, setCart] = useState([]);
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '').replace(/--+/g, '-');

        const loadData = async () => {
          setIsLoading(true);
          try {
            const apiBase = 'api.php'; 
            const [pRes, cRes, bRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products`).then(r => r.json()),
              fetch(`${apiBase}?action=get_categories`).then(r => r.json()),
              fetch(`${apiBase}?action=get_brands`).then(r => r.json())
            ]);

            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
            setBrands(Array.isArray(bRes) ? bRes : []);
            
            const params = new URLSearchParams(window.location.search);
            const pSlug = params.get('p');
            const cSlug = params.get('cat');
            if (pSlug) {
              const product = pRes.find(p => p.seoSettings?.slug === pSlug || p.id === pSlug);
              if (product) { setSelectedProduct(product); setView('product-details'); }
            } else if (cSlug) {
              const category = cRes.find(c => slugify(c.name) === cSlug || c.id === cSlug);
              if (category) { setSelectedCatId(category.id); setView('category-page'); }
            }
          } catch (e) { console.error(e); }
          setIsLoading(false);
        };

        useEffect(() => { loadData(); }, []);

        const navigateToCategory = (catId) => {
          if (catId === 'all') { setSelectedCatId('all'); setView('store'); }
          else { setSelectedCatId(catId); setView('category-page'); }
        };

        const filteredProducts = useMemo(() => {
          return products.filter(p => selectedCatId === 'all' || p.categoryId === selectedCatId);
        }, [products, selectedCatId]);

        if (isLoading) return <div className="h-screen flex items-center justify-center font-black">جاري التحميل...</div>;

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass sticky top-0 z-50 border-b p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 onClick={() => navigateToCategory('all')} className="text-2xl font-black text-indigo-600 cursor-pointer">ELITE STORE</h1>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8 flex-grow">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <BrandsMarquee brands={brands} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => { setSelectedProduct(p); setView('product-details'); }} className="bg-white rounded-[2rem] border overflow-hidden product-card transition-all cursor-pointer shadow-sm">
                        <img src={p.images[0]} className="w-full aspect-square object-cover" />
                        <div className="p-5 font-black text-slate-800">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* باقي المشاهد (category-page, product-details) تظل كما هي ... */}
            </main>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
