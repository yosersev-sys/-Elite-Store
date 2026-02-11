
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
      .admin-card { background: white; border-radius: 2.5rem; border: 1px solid #f0fdf4; box-shadow: 0 4px 25px rgba(0,0,0,0.03); transition: all 0.3s ease; }
      .admin-card:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
      .no-scrollbar::-webkit-scrollbar { display: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useCallback } = React;

      const App = () => {
        const [view, setView] = useState('store');
        const [adminTab, setAdminTab] = useState('products');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        
        // Category Management States
        const [newCatName, setNewCatName] = useState('');
        const [editingCatId, setEditingCatId] = useState(null);
        const [editingCatName, setEditingCatName] = useState('');
        const [searchQuery, setSearchQuery] = useState('');

        const loadData = async () => {
          setIsLoading(true);
          try {
            const ts = Date.now();
            const [pRes, cRes] = await Promise.all([
              fetch(`api.php?action=get_products&t=${ts}`).then(r => r.json()),
              fetch(`api.php?action=get_categories&t=${ts}`).then(r => r.json())
            ]);
            setProducts(Array.isArray(pRes) ? pRes : []);
            setCategories(Array.isArray(cRes) ? cRes : []);
          } catch (e) {
            console.error("Data fetch error:", e);
          } finally {
            setIsLoading(false);
          }
        };

        useEffect(() => { loadData(); }, []);

        // Actions
        const handleAddCategory = async () => {
          if(!newCatName.trim()) return;
          const newCat = { id: 'cat_' + Date.now(), name: newCatName };
          try {
            const res = await fetch('api.php?action=add_category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCat)
            }).then(r => r.json());
            if(res.status === 'success') {
              setCategories(prev => [...prev, newCat]);
              setNewCatName('');
            }
          } catch(e) { alert('فشل إضافة القسم'); }
        };

        const handleUpdateCategory = async (id) => {
          if(!editingCatName.trim()) return;
          try {
            const res = await fetch('api.php?action=update_category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, name: editingCatName })
            }).then(r => r.json());
            if(res.status === 'success') {
              setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCatName } : c));
              setEditingCatId(null);
            }
          } catch(e) { alert('فشل التحديث'); }
        };

        const handleDeleteCategory = async (id) => {
          const hasProducts = products.some(p => p.categoryId === id);
          if(hasProducts) return alert('لا يمكن حذف القسم لوجود منتجات تابعة له');
          if(!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
          
          try {
            const res = await fetch(`api.php?action=delete_category&id=${id}`, { method: 'DELETE' }).then(r => r.json());
            if(res.status === 'success') {
              setCategories(prev => prev.filter(c => c.id !== id));
            }
          } catch(e) { alert('فشل الحذف'); }
        };

        const handleDeleteProduct = async (id) => {
          if(!confirm('هل أنت متأكد من حذف المنتج؟')) return;
          try {
            const res = await fetch(`api.php?action=delete_product&id=${id}`, { method: 'DELETE' }).then(r => r.json());
            if(res.status === 'success') setProducts(prev => prev.filter(p => p.id !== id));
          } catch(e) { alert('فشل الحذف'); }
        };

        const filteredCategories = useMemo(() => {
          return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }, [categories, searchQuery]);

        const stats = useMemo(() => ({
          total: products.length,
          lowStock: products.filter(p => p.stockQuantity < 10).length,
          cats: categories.length
        }), [products, categories]);

        const getCatIcon = (name) => {
          const n = name.toLowerCase();
          if(n.includes('خضروات')) return '🥦';
          if(n.includes('فواكه')) return '🍎';
          if(n.includes('ألبان')) return '🥛';
          return '📦';
        };

        if (isLoading) return (
          <div className="h-screen flex flex-col items-center justify-center gap-4 text-green-600">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black">جاري تحميل لوحة التحكم...</p>
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
              {view === 'store' ? (
                <div className="animate-fadeIn">
                  <h2 className="text-3xl font-black text-slate-800 mb-8">تسوق الطازج الآن</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map(p => (
                      <div key={p.id} className="admin-card overflow-hidden flex flex-col h-full group">
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
              ) : (
                <div className="animate-fadeIn space-y-8 pb-20">
                  {/* Dashboard Header */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">إدارة فاقوس</h2>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">مركز التحكم والعمليات</p>
                    </div>
                    <div className="flex gap-4">
                       <input 
                         type="text" 
                         placeholder="بحث سريع..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-sm"
                       />
                       <a href="add-product.php" className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 transition">+ إضافة منتج</a>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-green-50 p-4 rounded-2xl">📦</div>
                      <div><p className="text-xs font-black text-slate-400 uppercase">المنتجات</p><p className="text-3xl font-black text-slate-800">{stats.total}</p></div>
                    </div>
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-amber-50 p-4 rounded-2xl">⚠️</div>
                      <div><p className="text-xs font-black text-slate-400 uppercase">نقص المخزون</p><p className="text-3xl font-black text-amber-600">{stats.lowStock}</p></div>
                    </div>
                    <div className="admin-card p-8 flex items-center gap-6">
                      <div className="text-4xl bg-blue-50 p-4 rounded-2xl">🏷️</div>
                      <div><p className="text-xs font-black text-slate-400 uppercase">الأقسام</p><p className="text-3xl font-black text-blue-600">{stats.cats}</p></div>
                    </div>
                  </div>

                  {/* Tabs Container */}
                  <div className="admin-card overflow-hidden min-h-[500px]">
                    <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                      <div className="flex bg-white rounded-xl p-1 border">
                         <button onClick={() => setAdminTab('products')} className={`px-6 py-2 rounded-lg text-xs font-black transition ${adminTab === 'products' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>المخزون</button>
                         <button onClick={() => setAdminTab('categories')} className={`px-6 py-2 rounded-lg text-xs font-black transition ${adminTab === 'categories' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>الأقسام</button>
                      </div>
                    </div>

                    <div className="p-0">
                      {adminTab === 'products' ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                                <th className="px-8 py-6">المنتج</th>
                                <th className="px-8 py-6">السعر</th>
                                <th className="px-8 py-6">المخزون</th>
                                <th className="px-8 py-6 text-center">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {products.filter(p => p.name.includes(searchQuery)).map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/30 transition">
                                  <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                      <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                                      <div><p className="font-black text-slate-800 text-sm">{p.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id}</p></div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-4 font-black text-green-600 text-sm">{p.price} ر.س</td>
                                  <td className="px-8 py-4"><span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stockQuantity < 10 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{p.stockQuantity} وحدة</span></td>
                                  <td className="px-8 py-4">
                                    <div className="flex gap-2 justify-center">
                                      <a href={`add-product.php?id=${p.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition">✎</a>
                                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition">🗑</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 space-y-8 animate-fadeIn">
                          {/* Category Management UI */}
                          <div className="bg-slate-50 p-8 rounded-[2rem] border border-dashed flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-grow space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">إضافة قسم جديد</label>
                              <input 
                                value={newCatName} 
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="مثال: فواكه موسمية..."
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                className="w-full px-6 py-4 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                              />
                            </div>
                            <button onClick={handleAddCategory} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-green-600 transition shadow-lg">إضافة</button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCategories.map(cat => (
                              <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-green-200 transition relative">
                                <div className="flex items-center gap-4">
                                  <span className="text-3xl bg-slate-50 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:scale-110 transition">{getCatIcon(cat.name)}</span>
                                  {editingCatId === cat.id ? (
                                    <div className="flex gap-2 flex-grow">
                                      <input 
                                        value={editingCatName}
                                        onChange={e => setEditingCatName(e.target.value)}
                                        className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold border-2 border-green-200"
                                        autoFocus
                                      />
                                      <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 bg-green-600 text-white rounded-xl">✓</button>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-black text-slate-800">{cat.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">المنتجات: {products.filter(p => p.categoryId === cat.id).length}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-end gap-2 border-t pt-4 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="text-[10px] font-black text-blue-600 hover:underline">✎ تعديل</button>
                                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-[10px] font-black text-red-600 hover:underline">🗑 حذف</button>
                                </div>
                              </div>
                            ))}
                            {filteredCategories.length === 0 && (
                              <div className="col-span-full py-20 text-center text-slate-400 font-black">لا توجد أقسام مطابقة للبحث</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="py-10 bg-slate-900 text-white text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">&copy; {new Date().getFullYear()} نظام إدارة اسواق فاقوس</p>
            </footer>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
