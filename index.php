
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f9fafb; scroll-behavior: smooth; }
      .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 40s linear infinite; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      // --- المكونات الفرعية ---

      const ProductCard = ({ product, onAddToCart, onView, isFavorite, onToggleFavorite }) => (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full relative">
          <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={onView}>
            <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }} className={`absolute top-4 left-4 p-2.5 rounded-2xl transition-all shadow-md backdrop-blur-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400'}`}>
              <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="font-bold text-lg mb-2 line-clamp-1">{product.name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
            <div className="mt-auto flex justify-between items-center">
              <span className="text-xl font-black text-indigo-600">{product.price} ر.س</span>
              <button onClick={onAddToCart} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition shadow-lg active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
        </div>
      );

      const Slider = () => {
        const [current, setCurrent] = useState(0);
        const slides = [
          { img: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'عالم من الأناقة', sub: 'اكتشف أحدث صيحات التكنولوجيا' },
          { img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف', sub: 'أزياء عصرية تناسب ذوقك' }
        ];
        useEffect(() => { const t = setInterval(() => setCurrent(c => (c === slides.length - 1 ? 0 : c + 1)), 5000); return () => clearInterval(t); }, []);
        return (
          <div className="relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl mb-12 group">
            {slides.map((s, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-black/30 z-10" />
                <img src={s.img} className="w-full h-full object-cover" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
                  <h2 className="text-5xl font-black mb-4 animate-fadeIn">{s.title}</h2>
                  <p className="text-xl opacity-90">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        );
      };

      const Brands = () => (
        <section className="py-12 bg-white rounded-[3rem] border border-gray-100 mb-12 overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap items-center">
            {[1,2,3,4,5,6,1,2,3,4,5,6].map((b, i) => (
              <div key={i} className="mx-12 grayscale opacity-40 hover:opacity-100 transition h-12 w-32 flex items-center justify-center font-black text-2xl text-gray-300">BRAND {b}</div>
            ))}
          </div>
        </section>
      );

      // --- المكون الرئيسي ---

      const App = () => {
        const [view, setView] = useState('store');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [cart, setCart] = useState([]);
        const [wishlist, setWishlist] = useState([]);
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [loading, setLoading] = useState(true);

        const fetchData = async () => {
          setLoading(true);
          try {
            const [prodRes, catRes] = await Promise.all([
              fetch('api.php?action=get_products'),
              fetch('api.php?action=get_categories')
            ]);
            setProducts(await prodRes.json());
            setCategories(await catRes.json());
          } catch (e) { console.error(e); }
          setLoading(false);
        };

        useEffect(() => { fetchData(); }, []);

        const toggleFavorite = (id) => {
          setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        };

        const addToCart = (p) => {
          setCart(prev => [...prev, { ...p, cart_id: Date.now() }]);
          alert('تمت الإضافة للسلة');
        };

        const deleteProduct = (id) => {
            if(confirm('هل أنت متأكد؟')) {
                fetch('api.php?action=delete_product', { method: 'POST', body: JSON.stringify({id}) })
                .then(() => fetchData());
            }
        };

        return (
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 p-4 border-b border-gray-100">
              <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <h1 onClick={() => setView('store')} className="text-2xl font-black text-indigo-600 cursor-pointer tracking-tighter">ELITE<span className="text-slate-900">STORE</span></h1>
                    <nav className="hidden md:flex gap-4 font-bold text-gray-500">
                        <button onClick={() => setView('store')} className={view === 'store' ? 'text-indigo-600' : ''}>الرئيسية</button>
                        <button onClick={() => setView('admin')} className={view === 'admin' ? 'text-indigo-600' : ''}>الإدارة</button>
                    </nav>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setView('wishlist')} className="p-3 bg-red-50 text-red-500 rounded-2xl relative">
                    ❤️ <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 rounded-full">{wishlist.length}</span>
                  </button>
                  <button onClick={() => setView('cart')} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl relative">
                    🛒 <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] px-2 rounded-full">{cart.length}</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <Brands />
                  <div className="flex justify-between items-end mb-8">
                      <h2 className="text-3xl font-black">اكتشف منتجاتنا</h2>
                      <div className="flex gap-2">
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">الكل</button>
                        {categories.map(c => <button key={c.id} className="bg-white border border-gray-100 px-6 py-2 rounded-full font-bold hover:border-indigo-600 transition">{c.name}</button>)}
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map(p => (
                      <ProductCard key={p.id} product={p} onAddToCart={() => addToCart(p)} isFavorite={wishlist.includes(p.id)} onToggleFavorite={toggleFavorite} onView={() => { setSelectedProduct(p); setView('details'); }} />
                    ))}
                  </div>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-12 animate-fadeIn">
                    <img src={selectedProduct.images[0]} className="w-full rounded-[2.5rem] shadow-xl aspect-square object-cover" />
                    <div className="flex flex-col justify-center">
                        <span className="text-indigo-600 font-black mb-4 uppercase tracking-widest">تفاصيل المنتج</span>
                        <h2 className="text-5xl font-black mb-6">{selectedProduct.name}</h2>
                        <p className="text-gray-500 text-xl leading-relaxed mb-8">{selectedProduct.description}</p>
                        <div className="text-4xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</div>
                        <div className="flex gap-4">
                            <button onClick={() => addToCart(selectedProduct)} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-600 transition">أضف للسلة</button>
                            <button onClick={() => setView('store')} className="px-8 py-5 border-2 border-gray-100 rounded-3xl font-bold">عودة</button>
                        </div>
                    </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="bg-white rounded-[3rem] p-8 shadow-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black">لوحة التحكم</h2>
                        <button onClick={() => setView('admin_form')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black">+ إضافة منتج</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-separate border-spacing-y-3">
                            <thead><tr className="text-gray-400 font-bold px-4 text-sm"><th>المنتج</th><th>السعر</th><th className="text-center">الإجراءات</th></tr></thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                                        <td className="p-4 rounded-r-2xl">
                                            <div className="flex items-center gap-4">
                                                <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" />
                                                <span className="font-bold">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black">{p.price} ر.س</td>
                                        <td className="p-4 text-center rounded-l-2xl">
                                            <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black text-sm hover:underline">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              {view === 'admin_form' && <AdminForm onBack={() => setView('admin')} />}

              {view === 'cart' && (
                <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-fadeIn">
                    <h2 className="text-3xl font-black mb-8">سلة التسوق</h2>
                    {cart.length === 0 ? <p className="text-center text-gray-400 py-12">السلة فارغة حالياً</p> : (
                        <div className="space-y-6">
                            {cart.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-4">
                                    <div className="flex items-center gap-4">
                                        <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover" />
                                        <span className="font-bold">{item.name}</span>
                                    </div>
                                    <span className="font-black text-indigo-600">{item.price} ر.س</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-2xl font-black pt-6">
                                <span>الإجمالي:</span>
                                <span>{cart.reduce((s, i) => s + Number(i.price), 0)} ر.س</span>
                            </div>
                            <button onClick={() => { alert('تم استلام طلبك بنجاح'); setCart([]); setView('store'); }} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl mt-8 shadow-xl shadow-indigo-100">إتمام الشراء</button>
                        </div>
                    )}
                </div>
              )}
            </main>

            <footer className="p-12 text-center text-gray-400 font-bold border-t border-gray-100 mt-12">
              &copy; {new Date().getFullYear()} متجر النخبة - كافة الحقوق محفوظة
            </footer>
          </div>
        );
      };

      const AdminForm = ({ onBack }) => {
        const [formData, setFormData] = useState({ name: '', price: '', description: '', img: '' });
        const save = () => {
            const product = { 
                id: Date.now(), 
                name: formData.name, 
                price: formData.price, 
                description: formData.description,
                images: [formData.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600']
            };
            fetch('api.php?action=add_product', { method: 'POST', body: JSON.stringify(product) })
            .then(() => { alert('تمت الإضافة بنجاح'); window.location.reload(); });
        };
        return (
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-fadeIn">
                <h2 className="text-3xl font-black mb-8">إضافة منتج جديد</h2>
                <div className="space-y-4">
                    <input placeholder="اسم المنتج" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input placeholder="السعر" type="number" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, price: e.target.value})} />
                    <textarea placeholder="وصف المنتج" className="w-full p-5 bg-gray-50 rounded-2xl outline-none min-h-[120px]" onChange={e => setFormData({...formData, description: e.target.value})} />
                    <input placeholder="رابط الصورة" className="w-full p-5 bg-gray-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, img: e.target.value})} />
                    <button onClick={save} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-indigo-100">حفظ ونشر</button>
                    <button onClick={onBack} className="w-full text-gray-400 font-bold mt-4">إلغاء</button>
                </div>
            </div>
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
