
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>اسواق فاقوس | لوحة التحكم المتكاملة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- React & Libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8faf7; scroll-behavior: smooth; overflow-x: hidden; }
      .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .header-glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .admin-card { background: white; border-radius: 2rem; border: 1px solid #f0fdf4; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      const App = () => {
        const [view, setView] = useState('store');
        const [adminTab, setAdminTab] = useState('products'); // Default to products for easy access
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [cart, setCart] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [isLoading, setIsLoading] = useState(true);

        const loadData = async () => {
          setIsLoading(true);
          try {
            const apiBase = 'api.php'; 
            const ts = Date.now();
            const [pRes, cRes] = await Promise.all([
              fetch(`${apiBase}?action=get_products&t=${ts}`).then(r => r.json()),
              fetch(`${apiBase}?action=get_categories&t=${ts}`).then(r => r.json())
            ]);
            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
          } catch (e) {
            console.error("Data fetch error:", e);
          } finally {
            setIsLoading(false);
          }
        };

        useEffect(() => {
          loadData();
          const savedCart = localStorage.getItem('fresh_cart');
          if (savedCart) setCart(JSON.parse(savedCart));
        }, []);

        const handleDeleteProduct = async (id) => {
          if(!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
          try {
            const res = await fetch(`api.php?action=delete_product&id=${id}`, { method: 'DELETE' }).then(r => r.json());
            if(res.status === 'success') {
              setProducts(prev => prev.filter(p => p.id !== id));
            }
          } catch(e) { alert('فشل الحذف'); }
        };

        const stats = useMemo(() => {
          return {
            total: products.length,
            lowStock: products.filter(p => p.stockQuantity < 10).length,
            cats: categories.length
          };
        }, [products, categories]);

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4 text-green-600">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black">جاري تحميل بيانات فاقوس...</p>
          </div>
        );

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass shadow-sm sticky top-0 z-50 border-b border-green-100">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <h1 onClick={() => setView('store')} className="text-2xl font-black text-green-600 cursor-pointer flex items-center gap-2">
                  <span className="text-3xl">🧺</span>
                  <span>اسواق <span className="text-slate-900">فاقوس</span></span>
                </h1>
                <div className="flex gap-3">
                  <button onClick={() => setView('store')} className={`px-5 py-2 rounded-xl font-bold text-sm ${view === 'store' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-green-50'}`}>المتجر</button>
                  <button onClick={() => setView('admin')} className={`px-5 py-2 rounded-xl font-bold text-sm ${view === 'admin' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-green-50'}`}>لوحة التحكم</button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
              {view === 'store' && (
                <div className="animate-fadeIn">
                  <h2 className="text-3xl font-black text-slate-800 mb-8">تسوق الطازج الآن</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map(p => (
                      <div key={p.id} className="bg-white rounded-[2rem] border border-green-50 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col h-full group">
                        <div className="aspect-square relative overflow-hidden">
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-black text-slate-800 mb-1">{p.name}</h3>
                          <p className="text-green-700 font-black mt-auto">{p.price} ر.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'admin' && (
                <div className="animate-fadeIn space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">إدارة أسواق فاقوس</h2>
                      <p className="text-slate-400 font-bold">مرحباً بك في لوحة التحكم المركزية</p>
                    </div>
                    <a href="add-product.php" className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 transition">
                      + إضافة منتج جديد
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-green-50 p-4 rounded-2xl">📦</div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase">إجمالي المنتجات</p>
                        <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                      </div>
                    </div>
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-amber-50 p-4 rounded-2xl">⚠️</div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase">نقص في المخزون</p>
                        <p className="text-3xl font-black text-amber-600">{stats.lowStock}</p>
                      </div>
                    </div>
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-blue-50 p-4 rounded-2xl">🏷️</div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase">إجمالي الأقسام</p>
                        <p className="text-3xl font-black text-blue-600">{stats.cats}</p>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-xl font-black text-slate-800">قائمة المخزون الحالي</h3>
                      <div className="flex bg-white rounded-xl p-1 border">
                         <button onClick={() => setAdminTab('products')} className={`px-4 py-2 rounded-lg text-xs font-black ${adminTab === 'products' ? 'bg-green-600 text-white' : 'text-slate-400'}`}>المنتجات</button>
                         <button onClick={() => setAdminTab('categories')} className={`px-4 py-2 rounded-lg text-xs font-black ${adminTab === 'categories' ? 'bg-green-600 text-white' : 'text-slate-400'}`}>الأقسام</button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {adminTab === 'products' ? (
                        <table className="w-full text-right">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                              <th className="px-8 py-6">المنتج</th>
                              <th className="px-8 py-6">السعر</th>
                              <th className="px-8 py-6">المخزون</th>
                              <th className="px-8 py-6">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {products.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-8 py-4">
                                  <div className="flex items-center gap-4">
                                    <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                                    <div>
                                      <p className="font-black text-slate-800 text-sm">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">ID: {p.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-4 font-black text-green-600 text-sm">{p.price} ر.س</td>
                                <td className="px-8 py-4">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stockQuantity < 10 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                    {p.stockQuantity} وحدة
                                  </span>
                                </td>
                                <td className="px-8 py-4">
                                  <div className="flex gap-2">
                                    <a href={`add-product.php?id=${p.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition">✎ تعديل</a>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition">🗑 حذف</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-20 text-center">
                          <p className="text-slate-400 font-black">إدارة الأقسام قيد التحديث في هذه النسخة...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="py-20 bg-slate-900 text-white text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">&copy; {new Date().getFullYear()} نظام إدارة اسواق فاقوس المتطور</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
