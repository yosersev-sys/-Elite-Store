
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
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .header-glass {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      /* حركة شريط الماركات */
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 40s linear infinite; }
      .pause:hover { animation-play-state: paused; }

      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- المكونات الفرعية (تم نقلها من ملفات React الأصلية) ---

      const Slider = () => {
        const [current, setCurrent] = useState(0);
        const slides = [
          { id: 1, image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'عالم من الأناقة الذكية', sub: 'اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية' },
          { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف الجديدة', sub: 'أزياء عصرية تناسب جميع الأذواق' }
        ];
        useEffect(() => { const t = setInterval(() => setCurrent(c => (c === slides.length - 1 ? 0 : c + 1)), 5000); return () => clearInterval(t); }, []);
        return (
          <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl mb-12 group">
            {slides.map((s, i) => (
              <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img src={s.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
                  <h2 className="text-4xl md:text-6xl font-black mb-4 animate-fadeIn">{s.title}</h2>
                  <p className="text-lg md:text-xl opacity-90">{s.sub}</p>
                  <button className="mt-8 bg-indigo-600 w-fit px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg">تسوق الآن</button>
                </div>
              </div>
            ))}
          </div>
        );
      };

      const Brands = () => (
        <section className="py-12 bg-white rounded-[3rem] border border-gray-100 mb-12 overflow-hidden relative">
          <div className="flex animate-scroll pause whitespace-nowrap items-center">
            {[1,2,3,4,5,6,1,2,3,4,5,6].map((b, i) => (
              <div key={i} className="mx-12 grayscale opacity-40 hover:opacity-100 transition font-black text-2xl text-gray-300">BRAND {b}</div>
            ))}
          </div>
        </section>
      );

      const ProductCard = ({ product, onAddToCart, onView, isFavorite, onToggleFavorite }) => (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full relative">
          <div className="relative aspect-square overflow-hidden cursor-pointer bg-gray-50" onClick={onView}>
            <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }} className={`absolute top-4 left-4 p-2.5 rounded-2xl transition shadow-md backdrop-blur-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400'}`}>
              ❤️
            </button>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="font-bold text-lg mb-2 line-clamp-1 text-slate-800">{product.name}</h3>
            <div className="mt-auto flex justify-between items-center">
              <span className="text-xl font-black text-indigo-600">{product.price} ر.س</span>
              <button onClick={onAddToCart} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition shadow-lg active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
        </div>
      );

      // --- المكون الرئيسي ---

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

        const addToCart = (p) => {
          setCart([...cart, p]);
          alert('تمت إضافة المنتج للسلة');
        };

        const toggleFavorite = (id) => {
          setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        };

        return (
          <div className="min-h-screen flex flex-col">
            
            {/* Header المطور والكامل */}
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100 py-4">
              <div className="container mx-auto px-4 flex items-center justify-between gap-6">
                
                <div className="flex items-center gap-10">
                  <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-2xl font-black text-indigo-600 cursor-pointer tracking-tighter">
                    ELITE<span className="text-slate-900">STORE</span>
                  </h1>
                  
                  <nav className="hidden lg:flex items-center gap-2 font-bold text-slate-600">
                    <button onClick={() => setView('store')} className={`px-4 py-2 rounded-xl ${view === 'store' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>الرئيسية</button>
                    
                    <div className="relative group">
                      <button onMouseEnter={() => setIsCatsOpen(true)} className="px-4 py-2 hover:text-indigo-600 flex items-center gap-1">التصنيفات ▼</button>
                      {isCatsOpen && (
                        <div onMouseLeave={() => setIsCatsOpen(false)} className="absolute top-full right-0 w-56 bg-white shadow-2xl rounded-2xl border border-gray-100 py-3 animate-fadeIn">
                          <button onClick={() => {setSelectedCatId('all'); setIsCatsOpen(false);}} className="w-full text-right px-6 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition">كل المنتجات</button>
                          {categories.map(c => (
                            <button key={c.id} onClick={() => {setSelectedCatId(c.id); setIsCatsOpen(false);}} className="w-full text-right px-6 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition">{c.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-xl ${view === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>الإدارة</button>
                  </nav>
                </div>

                <div className="hidden md:block flex-grow max-w-lg relative">
                  <input 
                    type="text" 
                    placeholder="ابحث عن منتجك المفضل..." 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-gray-100 border-none rounded-[1.2rem] focus:ring-2 focus:ring-indigo-500 transition font-bold text-sm"
                  />
                  <span className="absolute right-4 top-3 text-gray-400">🔍</span>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => setView('wishlist')} className="p-3 bg-red-50 text-red-500 rounded-2xl relative transition hover:scale-110">
                    ❤️ <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-2 rounded-full font-bold">{wishlist.length}</span>
                  </button>
                  <button onClick={() => setView('cart')} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl relative transition hover:scale-110">
                    🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-2 rounded-full font-bold">{cart.length}</span>
                  </button>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-3 bg-gray-100 rounded-2xl">☰</button>
                </div>
              </div>

              {/* القائمة الجانبية للجوال */}
              {isMenuOpen && (
                <div className="lg:hidden bg-white border-t p-6 space-y-4 font-bold animate-fadeIn">
                  <button onClick={() => {setView('store'); setIsMenuOpen(false);}} className="block w-full text-right py-2">الرئيسية</button>
                  <button onClick={() => {setView('admin'); setIsMenuOpen(false);}} className="block w-full text-right py-2">لوحة الإدارة</button>
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-400 mb-2">الأقسام</p>
                    {categories.map(c => (
                      <button key={c.id} onClick={() => {setSelectedCatId(c.id); setIsMenuOpen(false);}} className="block w-full text-right py-2 text-sm">{c.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <Brands />
                  
                  <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">
                           {selectedCatId === 'all' ? 'أحدث المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}
                        </h2>
                        <p className="text-slate-500 font-bold">استعرض أفضل العروض المختارة لك بعناية</p>
                    </div>
                    <div className="flex gap-2 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
                      <button onClick={() => setSelectedCatId('all')} className={`px-6 py-2 rounded-2xl font-bold transition ${selectedCatId === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-50 text-slate-500'}`}>الكل</button>
                      {categories.map(c => (
                        <button key={c.id} onClick={() => setSelectedCatId(c.id)} className={`px-6 py-2 rounded-2xl font-bold transition ${selectedCatId === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-50 text-slate-500'}`}>{c.name}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(p => (
                      <ProductCard 
                        key={p.id} 
                        product={p} 
                        onAddToCart={() => addToCart(p)} 
                        isFavorite={wishlist.includes(p.id)} 
                        onToggleFavorite={toggleFavorite}
                        onView={() => { setSelectedProduct(p); setView('details'); }} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-6xl mx-auto bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-16 animate-fadeIn border border-gray-50">
                    <div className="relative group">
                        <img src={selectedProduct.images[0]} className="w-full rounded-[3rem] shadow-xl aspect-square object-cover border border-gray-100 transition duration-700 group-hover:scale-[1.02]" />
                        <div className="absolute top-6 right-6 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl">جديد</div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-indigo-600 font-black mb-4 uppercase tracking-widest text-sm">تفاصيل المنتج</span>
                        <h2 className="text-5xl font-black mb-6 text-slate-900">{selectedProduct.name}</h2>
                        <p className="text-slate-500 text-xl leading-relaxed mb-8">{selectedProduct.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}</p>
                        <div className="text-5xl font-black text-indigo-600 mb-10">{selectedProduct.price} <small className="text-lg">ر.س</small></div>
                        <div className="flex gap-4">
                            <button onClick={() => addToCart(selectedProduct)} className="flex-grow bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition shadow-2xl hover:-translate-y-1 active:scale-95">أضف للسلة</button>
                            <button onClick={() => setView('store')} className="px-10 py-5 border-2 border-gray-100 rounded-[2rem] font-bold text-slate-400 hover:bg-gray-50 transition">عودة</button>
                        </div>
                    </div>
                </div>
              )}

              {view === 'admin' && <AdminPanel products={products} fetchData={fetchData} setView={setView} />}
              {view === 'admin_form' && <AdminForm onBack={() => setView('admin')} categories={categories} fetchData={fetchData} />}
              
              {view === 'cart' && (
                <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-fadeIn">
                    <h2 className="text-3xl font-black mb-8 border-b pb-6">سلة التسوق ({cart.length})</h2>
                    {cart.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-slate-400 font-bold mb-6">سلة التسوق فارغة حالياً</p>
                            <button onClick={() => setView('store')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">تسوق الآن</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                        <div>
                                            <p className="font-bold text-slate-800">{item.name}</p>
                                            <p className="text-sm text-indigo-600 font-black">{item.price} ر.س</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition p-2">🗑️</button>
                                </div>
                            ))}
                            <div className="flex justify-between text-2xl font-black pt-8 border-t">
                                <span>الإجمالي:</span>
                                <span className="text-indigo-600">{cart.reduce((s, i) => s + Number(i.price), 0)} ر.س</span>
                            </div>
                            <button onClick={() => { alert('تم استلام طلبك بنجاح'); setCart([]); setView('store'); }} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl mt-8 shadow-xl hover:bg-indigo-600 transition shadow-indigo-100">إتمام الشراء</button>
                        </div>
                    )}
                </div>
              )}
            </main>

            <footer className="p-16 text-center text-slate-400 font-bold border-t border-gray-100 mt-20 bg-white">
               <h3 className="text-slate-900 text-xl font-black mb-4">ELITE STORE</h3>
               <p className="mb-8">وجهتك الأولى للتسوق الذكي والأنيق</p>
               <div className="text-sm">&copy; {new Date().getFullYear()} كافة الحقوق محفوظة لدى متجر النخبة</div>
            </footer>
          </div>
        );
      };

      const AdminPanel = ({ products, fetchData, setView }) => (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl animate-fadeIn border border-gray-50">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">إدارة المتجر</h2>
                    <p className="text-slate-400 font-bold text-sm">تحكم في منتجاتك ومخزونك بكل سهولة</p>
                </div>
                <button onClick={() => setView('admin_form')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1">+ إضافة منتج جديد</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-separate border-spacing-y-4">
                    <thead><tr className="text-slate-400 font-bold px-4 text-xs uppercase tracking-widest"><th>المنتج</th><th>السعر</th><th className="text-center">الإجراءات</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="bg-gray-50/50 rounded-2xl overflow-hidden hover:bg-gray-50 transition group">
                                <td className="p-5 rounded-r-[1.5rem] border-y border-r border-transparent group-hover:border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <img src={p.images[0]} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                                        <span className="font-bold text-slate-800">{p.name}</span>
                                    </div>
                                </td>
                                <td className="p-5 font-black text-indigo-600 border-y border-transparent group-hover:border-gray-100">{p.price} ر.س</td>
                                <td className="p-5 text-center rounded-l-[1.5rem] border-y border-l border-transparent group-hover:border-gray-100">
                                    <button onClick={() => {
                                        if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                                            fetch('api.php?action=delete_product', { method: 'POST', body: JSON.stringify({id: p.id}) }).then(() => fetchData());
                                        }
                                    }} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      );

      const AdminForm = ({ onBack, categories, fetchData }) => {
        const [formData, setFormData] = useState({ name: '', price: '', description: '', img: '', catId: categories[0]?.id });
        const save = () => {
            if(!formData.name || !formData.price) return alert('يرجى ملء الاسم والسعر');
            const product = { 
                id: Date.now(), 
                name: formData.name, 
                price: formData.price, 
                categoryId: formData.catId,
                description: formData.description,
                images: [formData.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600']
            };
            fetch('api.php?action=add_product', { method: 'POST', body: JSON.stringify(product) })
            .then(() => { alert('تمت الإضافة بنجاح'); fetchData(); onBack(); });
        };
        return (
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-fadeIn border border-gray-50">
                <h2 className="text-3xl font-black mb-8">إضافة منتج جديد</h2>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 mr-2">اسم المنتج</label>
                        <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 mr-2">السعر</label>
                            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" onChange={e => setFormData({...formData, price: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 mr-2">التصنيف</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" onChange={e => setFormData({...formData, catId: e.target.value})}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 mr-2">الوصف</label>
                        <textarea className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition min-h-[120px]" onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 mr-2">رابط الصورة</label>
                        <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="https://..." onChange={e => setFormData({...formData, img: e.target.value})} />
                    </div>
                    <button onClick={save} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition transform hover:-translate-y-1">حفظ ونشر المنتج</button>
                    <button onClick={onBack} className="w-full text-slate-400 font-bold mt-4">إلغاء</button>
                </div>
            </div>
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
