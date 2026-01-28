
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
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(33.33%); } }
      .animate-scroll { animation: scroll 40s linear infinite; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

      // --- المكونات المساعدة ---
      const Slider = () => {
        const slides = [
          { id: 1, image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600', title: 'أحدث التقنيات بين يديك' },
          { id: 2, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600', title: 'تشكيلة الصيف الجديدة' }
        ];
        const [cur, setCur] = useState(0);
        useEffect(() => { const t = setInterval(() => setCur(c => (c + 1) % slides.length), 5000); return () => clearInterval(t); }, []);
        return (
          <div className="relative h-[300px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl mb-10">
            {slides.map((s, i) => (
              <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? 'opacity-100' : 'opacity-0'}`}>
                <img src={s.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center px-10 text-white"><h2 className="text-3xl md:text-5xl font-black">{s.title}</h2></div>
              </div>
            ))}
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
                  <input type="text" placeholder="ابحث..." onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-2 bg-gray-100 rounded-xl text-sm outline-none" />
                  <span className="absolute right-3 top-2 text-gray-400">🔍</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setView('wishlist')} className="p-2 text-red-500 relative">❤️ <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 rounded-full">{wishlist.length}</span></button>
                  <button onClick={() => setView('cart')} className="p-2 text-indigo-600 relative">🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span></button>
                  
                  {/* زر الدخول - تم تعديله ليظهر دائماً بشكل احترافي */}
                  <button onClick={() => setView('auth')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 transition shadow-md">دخول</button>
                  
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-600">☰</button>
                </div>
              </div>

              {/* قائمة الجوال */}
              {isMenuOpen && (
                <div className="lg:hidden bg-white border-t p-4 space-y-3 font-bold animate-fadeIn">
                  <button onClick={() => {setView('store'); setIsMenuOpen(false);}} className="block w-full text-right py-2">الرئيسية</button>
                  <button onClick={() => {setView('auth'); setIsMenuOpen(false);}} className="block w-full text-right py-2 text-indigo-600 underline">تسجيل الدخول / إنشاء حساب</button>
                  <button onClick={() => {setView('admin'); setIsMenuOpen(false);}} className="block w-full text-right py-2">لوحة الإدارة</button>
                  <div className="border-t pt-2">
                    {categories.map(c => <button key={c.id} onClick={() => {setSelectedCatId(c.id); setIsMenuOpen(false);}} className="block w-full text-right py-1 text-sm text-gray-500">{c.name}</button>)}
                  </div>
                </div>
              )}
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <Slider />
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black">{selectedCatId === 'all' ? 'أحدث المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}</h2>
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
                            <button onClick={() => {setCart([...cart, p]); alert('تمت الإضافة للسلة');}} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition">🛒</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-xl grid md:grid-cols-2 gap-10 animate-fadeIn border">
                  <img src={selectedProduct.images[0]} className="w-full rounded-3xl aspect-square object-cover" />
                  <div className="flex flex-col justify-center">
                    <h2 className="text-4xl font-black mb-4">{selectedProduct.name}</h2>
                    <p className="text-gray-500 mb-6 text-lg">{selectedProduct.description}</p>
                    <div className="text-4xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</div>
                    <div className="flex gap-3">
                      <button onClick={() => {setCart([...cart, selectedProduct]); alert('تمت الإضافة للسلة');}} className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition">أضف للسلة</button>
                      <button onClick={() => setView('store')} className="px-6 py-4 border rounded-2xl text-gray-400 font-bold">عودة</button>
                    </div>
                  </div>
                </div>
              )}

              {view === 'auth' && (
                <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border text-center animate-fadeIn mt-10">
                  <h2 className="text-3xl font-black mb-4">تسجيل الدخول</h2>
                  <p className="text-gray-400 mb-8">أهلاً بك في متجر النخبة، سجل دخولك للمتابعة</p>
                  <div className="space-y-4">
                    <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={() => {alert('تم تسجيل الدخول بنجاح'); setView('store');}} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition">دخول</button>
                    <p className="text-sm text-gray-400">ليس لديك حساب؟ <span className="text-indigo-600 cursor-pointer font-bold">إنشاء حساب جديد</span></p>
                  </div>
                </div>
              )}

              {view === 'wishlist' && (
                <div className="animate-fadeIn">
                  <h2 className="text-3xl font-black mb-8">قائمة المفضلة ({wishlist.length})</h2>
                  {wishlist.length === 0 ? <p className="text-center py-20 text-gray-400">لا توجد منتجات في المفضلة</p> : <div className="grid grid-cols-1 md:grid-cols-4 gap-8">...</div>}
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border animate-fadeIn">
                  <h2 className="text-2xl font-black mb-6">سلة التسوق ({cart.length})</h2>
                  {cart.length === 0 ? <p className="text-center py-10 text-gray-400">السلة فارغة</p> : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-4"><img src={item.images[0]} className="w-12 h-12 rounded-lg" /><span className="font-bold">{item.name}</span></div>
                          <span className="font-black text-indigo-600">{item.price} ر.س</span>
                        </div>
                      ))}
                      <div className="text-2xl font-black pt-4 flex justify-between"><span>الإجمالي:</span><span>{cart.reduce((s,i)=>s+Number(i.price),0)} ر.س</span></div>
                      <button onClick={() => {alert('تم تأكيد الطلب'); setCart([]); setView('store');}} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl mt-6">إتمام الشراء</button>
                    </div>
                  )}
                </div>
              )}

              {view === 'admin' && (
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl animate-fadeIn">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black">لوحة التحكم</h2>
                    <button onClick={() => setView('admin_form')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">+ منتج جديد</button>
                  </div>
                  <table className="w-full text-right border-separate border-spacing-y-2">
                    <thead><tr className="text-gray-400"><th>المنتج</th><th>السعر</th><th>الإجراء</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="bg-gray-50 rounded-xl overflow-hidden">
                          <td className="p-4 font-bold">{p.name}</td>
                          <td className="p-4">{p.price} ر.س</td>
                          <td className="p-4 text-red-500 font-bold cursor-pointer" onClick={() => {if(confirm('حذف؟')) fetch('api.php?action=delete_product',{method:'POST', body:JSON.stringify({id:p.id})}).then(()=>fetchData())}}>حذف</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {view === 'admin_form' && (
                <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border animate-fadeIn">
                  <h2 className="text-3xl font-black mb-8">إضافة منتج</h2>
                  <div className="space-y-4">
                    <input id="p_name" placeholder="الاسم" className="w-full p-4 bg-gray-50 rounded-2xl border-none" />
                    <input id="p_price" type="number" placeholder="السعر" className="w-full p-4 bg-gray-50 rounded-2xl border-none" />
                    <select id="p_cat" className="w-full p-4 bg-gray-50 rounded-2xl border-none">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <textarea id="p_desc" placeholder="الوصف" className="w-full p-4 bg-gray-50 rounded-2xl border-none min-h-[100px]" />
                    <input id="p_img" placeholder="رابط الصورة" className="w-full p-4 bg-gray-50 rounded-2xl border-none" />
                    <button onClick={() => {
                      const prod = { id:Date.now(), name:document.getElementById('p_name').value, price:document.getElementById('p_price').value, categoryId:document.getElementById('p_cat').value, description:document.getElementById('p_desc').value, images:[document.getElementById('p_img').value || 'https://via.placeholder.com/400'] };
                      fetch('api.php?action=add_product',{method:'POST', body:JSON.stringify(prod)}).then(() => {alert('تم الإضافة'); setView('admin'); fetchData();});
                    }} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl">حفظ المنتج</button>
                    <button onClick={() => setView('admin')} className="w-full text-gray-400 font-bold">إلغاء</button>
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
