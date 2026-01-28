
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
      body { background-color: #f9fafb; scroll-behavior: smooth; }
      .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      
      /* تحسين ظهور العناصر في الهيدر */
      .header-glass {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo } = React;

      // --- المكونات ---

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

        // جلب البيانات
        const fetchData = async () => {
          try {
            const [pRes, cRes] = await Promise.all([
              fetch('api.php?action=get_products'),
              fetch('api.php?action=get_categories')
            ]);
            setProducts(await pRes.json());
            setCategories(await cRes.json());
          } catch (e) { console.error("Error fetching data", e); }
        };

        useEffect(() => { fetchData(); }, []);

        // فلترة المنتجات
        const filteredProducts = useMemo(() => {
          return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = selectedCatId === 'all' || p.categoryId === selectedCatId;
            return matchesSearch && matchesCat;
          });
        }, [products, searchQuery, selectedCatId]);

        return (
          <div className="min-h-screen flex flex-col">
            
            {/* Header الاحترافي */}
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-gray-100">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                
                {/* Logo & Desktop Nav */}
                <div className="flex items-center gap-8">
                  <h1 onClick={() => { setView('store'); setSelectedCatId('all'); }} className="text-2xl font-black text-indigo-600 cursor-pointer tracking-tighter">
                    ELITE<span className="text-slate-900">STORE</span>
                  </h1>
                  <nav className="hidden lg:flex items-center gap-2 font-bold text-gray-500">
                    <button onClick={() => setView('store')} className={`px-4 py-2 rounded-xl transition ${view === 'store' ? 'text-indigo-600 bg-indigo-50' : 'hover:text-indigo-600'}`}>الرئيسية</button>
                    
                    {/* Categories Dropdown */}
                    <div className="relative group">
                      <button onMouseEnter={() => setIsCatsOpen(true)} className="px-4 py-2 rounded-xl hover:text-indigo-600 flex items-center gap-1">
                        التصنيفات
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {isCatsOpen && (
                        <div onMouseLeave={() => setIsCatsOpen(false)} className="absolute top-full right-0 w-48 bg-white shadow-xl rounded-2xl border border-gray-100 py-2 animate-fadeIn">
                          <button onClick={() => { setSelectedCatId('all'); setIsCatsOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 text-sm font-bold">كل المنتجات</button>
                          {categories.map(c => (
                            <button key={c.id} onClick={() => { setSelectedCatId(c.id); setIsCatsOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 text-sm font-bold">{c.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-xl transition ${view === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'hover:text-indigo-600'}`}>الإدارة</button>
                  </nav>
                </div>

                {/* Search Bar */}
                <div className="hidden md:block flex-grow max-w-md relative">
                  <input 
                    type="text" 
                    placeholder="ابحث عن منتج..." 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-2.5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition font-bold text-sm"
                  />
                  <svg className="absolute right-4 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                {/* Actions Icons */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setView('wishlist')} className="p-2.5 text-gray-500 hover:text-red-500 relative">
                    ❤️ <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{wishlist.length}</span>
                  </button>
                  <button onClick={() => setView('cart')} className="p-2.5 text-gray-500 hover:text-indigo-600 relative">
                    🛒 <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span>
                  </button>
                  {/* Mobile Menu Toggle */}
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                  </button>
                </div>
              </div>

              {/* Mobile Menu Panel */}
              {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-3 font-bold text-gray-600 animate-fadeIn">
                  <button onClick={() => { setView('store'); setIsMenuOpen(false); }} className="w-full text-right p-2 hover:bg-gray-50">الرئيسية</button>
                  <button onClick={() => { setView('admin'); setIsMenuOpen(false); }} className="w-full text-right p-2 hover:bg-gray-50">لوحة الإدارة</button>
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-400 px-2 mb-2">الأقسام</p>
                    {categories.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCatId(c.id); setIsMenuOpen(false); }} className="w-full text-right p-2 text-sm">{c.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black">
                      {selectedCatId === 'all' ? 'أحدث المنتجات' : `قسم ${categories.find(c => c.id === selectedCatId)?.name}`}
                    </h2>
                  </div>
                  
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">لا توجد منتجات مطابقة للبحث</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {filteredProducts.map(p => (
                        <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition group relative">
                          <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(p); setView('details'); }}>
                            <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="p-6">
                            <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                            <p className="text-indigo-600 font-black text-xl mb-4">{p.price} ر.س</p>
                            <button 
                                onClick={() => { setCart([...cart, p]); alert('تمت الإضافة للسلة'); }} 
                                className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-600 transition shadow-lg active:scale-95"
                            >
                                أضف للسلة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === 'details' && selectedProduct && (
                <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-12 animate-fadeIn">
                    <img src={selectedProduct.images[0]} className="w-full rounded-[2.5rem] shadow-xl aspect-square object-cover border border-gray-50" />
                    <div className="flex flex-col justify-center">
                        <span className="text-indigo-600 font-black mb-4 uppercase tracking-widest text-sm">تفاصيل المنتج</span>
                        <h2 className="text-5xl font-black mb-6 text-slate-900">{selectedProduct.name}</h2>
                        <p className="text-gray-500 text-xl leading-relaxed mb-8">{selectedProduct.description}</p>
                        <div className="text-4xl font-black text-indigo-600 mb-8">{selectedProduct.price} ر.س</div>
                        <div className="flex gap-4">
                            <button onClick={() => {setCart([...cart, selectedProduct]); alert('تمت الإضافة للسلة');}} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-600 transition shadow-xl">أضف للسلة</button>
                            <button onClick={() => setView('store')} className="px-8 py-5 border-2 border-gray-100 rounded-3xl font-bold text-gray-500 hover:bg-gray-50 transition">عودة</button>
                        </div>
                    </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="bg-white rounded-[3rem] p-8 shadow-xl animate-fadeIn">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black">إدارة المنتجات</h2>
                        <button onClick={() => setView('admin_form')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">+ منتج جديد</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-separate border-spacing-y-3">
                            <thead><tr className="text-gray-400 font-bold px-4 text-xs uppercase tracking-widest"><th>المنتج</th><th>السعر</th><th>التصنيف</th><th className="text-center">الإجراءات</th></tr></thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition">
                                        <td className="p-4 rounded-r-2xl">
                                            <div className="flex items-center gap-4">
                                                <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                                <span className="font-bold">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-indigo-600">{p.price} ر.س</td>
                                        <td className="p-4 text-sm font-bold text-gray-400">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</td>
                                        <td className="p-4 text-center rounded-l-2xl">
                                            <button onClick={() => {
                                                if(confirm('هل تريد حذف هذا المنتج؟')) {
                                                    fetch('api.php?action=delete_product', { method: 'POST', body: JSON.stringify({id: p.id}) }).then(() => fetchData());
                                                }
                                            }} className="text-red-500 font-black hover:underline px-4">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              {view === 'admin_form' && (
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl animate-fadeIn">
                    <h2 className="text-3xl font-black mb-8">إضافة منتج جديد</h2>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 mr-2">اسم المنتج</label>
                            <input id="p_name" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 mr-2">السعر</label>
                                <input id="p_price" type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 mr-2">التصنيف</label>
                                <select id="p_cat" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 mr-2">وصف مختصر</label>
                            <textarea id="p_desc" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 mr-2">رابط الصورة</label>
                            <input id="p_img" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="https://..." />
                        </div>
                        <button onClick={() => {
                            const name = document.getElementById('p_name').value;
                            const price = document.getElementById('p_price').value;
                            const catId = document.getElementById('p_cat').value;
                            const desc = document.getElementById('p_desc').value;
                            const img = document.getElementById('p_img').value;
                            
                            if(!name || !price) return alert('يرجى ملء البيانات الأساسية');
                            
                            const prod = { id: Date.now(), name, price, categoryId: catId, description: desc, images: [img || 'https://via.placeholder.com/400'] };
                            fetch('api.php?action=add_product', { method: 'POST', body: JSON.stringify(prod) })
                            .then(() => { alert('تم الحفظ!'); setView('admin'); fetchData(); });
                        }} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition">حفظ ونشر المنتج</button>
                        <button onClick={() => setView('admin')} className="w-full text-gray-400 font-bold py-2">إلغاء</button>
                    </div>
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl animate-fadeIn">
                    <h2 className="text-3xl font-black mb-8">سلة التسوق ({cart.length})</h2>
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 font-bold mb-6">سلة التسوق فارغة حالياً</p>
                            <button onClick={() => setView('store')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">تسوق الآن</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-4">
                                    <div className="flex items-center gap-4">
                                        <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                        <div>
                                            <p className="font-bold text-slate-800">{item.name}</p>
                                            <p className="text-sm text-indigo-600 font-black">{item.price} ر.س</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 transition">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            <div className="flex justify-between text-2xl font-black pt-6">
                                <span>الإجمالي التقريبي:</span>
                                <span className="text-indigo-600">{cart.reduce((s, i) => s + Number(i.price), 0)} <small className="text-xs">ر.س</small></span>
                            </div>
                            <button onClick={() => { alert('تم استلام طلبك بنجاح'); setCart([]); setView('store'); }} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl mt-8 shadow-xl hover:bg-indigo-600 transition">إتمام عملية الشراء</button>
                        </div>
                    )}
                </div>
              )}
            </main>

            <footer className="p-12 text-center text-gray-400 font-bold border-t border-gray-100 mt-12 bg-white">
              &copy; {new Date().getFullYear()} متجر النخبة - منصة تجارة إلكترونية PHP
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
