<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | لوحة التحكم المتكاملة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- مكتبة Google Generative AI -->
    <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@^1.38.0"
      }
    }
    </script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; scroll-behavior: smooth; overflow-x: hidden; }
      .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .header-glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .preview-google { border: 1px solid #dadce0; border-radius: 8px; padding: 15px; max-width: 600px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="module">
      import { GoogleGenAI, Type } from "@google/genai";
      window.GoogleGenAI = GoogleGenAI;
      window.Type = Type;
    </script>

    <script type="text/babel">
      const { useState, useEffect, useMemo, useRef } = React;

      // --- مكون نموذج المنتج (AdminProductForm) ---
      const AdminProductForm = ({ product, categories, onSubmit, onCancel }) => {
        const [isAiLoading, setIsAiLoading] = useState(false);
        const fileInputRef = useRef(null);
        const [formData, setFormData] = useState({
          id: product ? product.id : 'p_' + Date.now(),
          name: product ? product.name : '',
          description: product ? product.description : '',
          price: product ? product.price : '',
          categoryId: product ? product.categoryId : (categories[0]?.id || ''),
          stockQuantity: product ? product.stockQuantity : '10',
          images: product ? product.images : [],
          seoSettings: product?.seoSettings || { metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' }
        });

        const handleFileChange = (e) => {
          const files = Array.from(e.target.files);
          files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
            };
            reader.readAsDataURL(file);
          });
        };

        const generateAiDesc = async () => {
          if (!formData.name) return alert('أدخل اسم المنتج أولاً');
          setIsAiLoading(true);
          try {
            const ai = new window.GoogleGenAI({ apiKey: "<?php echo getenv('API_KEY'); ?>" || process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `اكتب وصفاً تسويقياً جذاباً ومختصراً باللغة العربية لمنتج "${formData.name}".`
            });
            setFormData(prev => ({ ...prev, description: response.text }));
          } catch (e) { alert('خطأ في الاتصال بالذكاء الاصطناعي'); }
          setIsAiLoading(false);
        };

        const generateSeo = async () => {
          if (!formData.name || !formData.description) return alert('أدخل الاسم والوصف أولاً');
          setIsAiLoading(true);
          try {
            const ai = new window.GoogleGenAI({ apiKey: "<?php echo getenv('API_KEY'); ?>" || process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `قم بتوليد بيانات SEO (عنوان، وصف، كلمات مفتاحية، ورابط slug بالإنجليزية) لمنتج: ${formData.name}. الوصف: ${formData.description}`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: window.Type.OBJECT,
                  properties: {
                    metaTitle: { type: window.Type.STRING },
                    metaDescription: { type: window.Type.STRING },
                    metaKeywords: { type: window.Type.STRING },
                    slug: { type: window.Type.STRING }
                  },
                  required: ["metaTitle", "metaDescription", "metaKeywords", "slug"]
                }
              }
            });
            setFormData(prev => ({ ...prev, seoSettings: JSON.parse(response.text) }));
          } catch (e) { alert('فشل توليد SEO'); }
          setIsAiLoading(false);
        };

        return (
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl border animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={onCancel} className="text-gray-400 font-bold hover:text-red-500">إلغاء</button>
            </div>

            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">اسم المنتج</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">التصنيف</label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">السعر (ر.س)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">الكمية في المخزون</label>
                  <input required type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-gray-500">الوصف</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-xl outline-none min-h-[120px]" />
                <button type="button" onClick={generateAiDesc} className="absolute left-2 bottom-2 bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-lg hover:bg-slate-900 transition">وصف ذكي ✨</button>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-500">معرض الصور</label>
                <div className="flex flex-wrap gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-500 text-white p-1 text-[10px]">X</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current.click()} className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:border-indigo-500 transition">+</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple hidden accept="image/*" />
                </div>
              </div>

              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-emerald-700">بيانات SEO</h3>
                  <button type="button" onClick={generateSeo} className="bg-emerald-600 text-white text-[10px] px-4 py-1.5 rounded-lg">توليد SEO ذكي ✨</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Meta Title" value={formData.seoSettings.metaTitle} onChange={e => setFormData({...formData, seoSettings: {...formData.seoSettings, metaTitle: e.target.value}})} className="w-full px-3 py-2 text-xs border rounded-lg outline-none" />
                  <input placeholder="Slug" value={formData.seoSettings.slug} onChange={e => setFormData({...formData, seoSettings: {...formData.seoSettings, slug: e.target.value}})} className="w-full px-3 py-2 text-xs border rounded-lg outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition shadow-xl">حفظ المنتج</button>
            </form>
          </div>
        );
      };

      const App = () => {
        const [view, setView] = useState('store'); 
        const [adminTab, setAdminTab] = useState('stats');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [cart, setCart] = useState([]);
        const [selectedCatId, setSelectedCatId] = useState('all');
        const [editingProduct, setEditingProduct] = useState(null);
        const [isFormOpen, setIsFormOpen] = useState(false);

        const loadData = async () => {
          try {
            const [p, c, o] = await Promise.all([
              fetch('api.php?action=get_products').then(r => r.json()),
              fetch('api.php?action=get_categories').then(r => r.json()),
              fetch('api.php?action=get_orders').then(r => r.json())
            ]);
            setProducts(Array.isArray(p) ? p : []);
            setCategories(Array.isArray(c) ? c : []);
            setOrders(Array.isArray(o) ? o : []);
          } catch (e) { console.error(e); }
        };

        useEffect(() => { loadData(); }, []);

        const handleFormSubmit = async (data) => {
          const action = editingProduct ? 'update_product' : 'add_product';
          const res = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(r => r.json());

          if (res.status === 'success') {
            setIsFormOpen(false);
            setEditingProduct(null);
            loadData();
          } else { alert('خطأ في الحفظ'); }
        };

        const deleteProduct = async (id) => {
          if (!confirm('حذف؟')) return;
          await fetch(`api.php?action=delete_product&id=${id}`, { method: 'DELETE' });
          loadData();
        };

        return (
          <div className="min-h-screen flex flex-col">
            <header className="header-glass sticky top-0 z-50 border-b p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 onClick={() => setView('store')} className="text-2xl font-black text-indigo-600 cursor-pointer">ELITE<span className="text-slate-900">STORE</span></h1>
                <div className="flex gap-4">
                   <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-xl font-bold text-xs ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>الإدارة</button>
                   <button onClick={() => setView('cart')} className="bg-gray-100 px-4 py-2 rounded-xl text-xs">🛒 {cart.length}</button>
                </div>
              </div>
            </header>

            <main className="container mx-auto p-6 flex-grow">
              {view === 'admin' && (
                <div className="flex flex-col lg:flex-row gap-8">
                  <aside className="w-full lg:w-64 space-y-2">
                    <button onClick={() => { setAdminTab('stats'); setIsFormOpen(false); }} className={`w-full text-right p-3 rounded-xl font-bold ${adminTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>📊 الإحصائيات</button>
                    <button onClick={() => { setAdminTab('products'); setIsFormOpen(false); }} className={`w-full text-right p-3 rounded-xl font-bold ${adminTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>📦 المنتجات</button>
                    <button onClick={() => { setAdminTab('orders'); setIsFormOpen(false); }} className={`w-full text-right p-3 rounded-xl font-bold ${adminTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>📜 الطلبات</button>
                  </aside>

                  <section className="flex-grow">
                    {isFormOpen ? (
                      <AdminProductForm product={editingProduct} categories={categories} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
                    ) : (
                      <div className="animate-fadeIn">
                        {adminTab === 'stats' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                              <p className="opacity-60 text-xs font-bold uppercase">الإيرادات</p>
                              <p className="text-3xl font-black mt-2">{orders.reduce((s,o) => s + o.total, 0)} ر.س</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border shadow-sm">
                              <p className="text-gray-400 text-xs font-bold uppercase">الطلبات</p>
                              <p className="text-3xl font-black mt-2">{orders.length}</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border shadow-sm">
                              <p className="text-gray-400 text-xs font-bold uppercase">المنتجات</p>
                              <p className="text-3xl font-black mt-2">{products.length}</p>
                            </div>
                          </div>
                        )}

                        {adminTab === 'products' && (
                          <div className="bg-white rounded-3xl border overflow-hidden">
                            <div className="p-6 border-b flex justify-between items-center">
                              <h2 className="font-black text-xl">قائمة المخزون</h2>
                              <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm">+ إضافة منتج</button>
                            </div>
                            <table className="w-full text-right">
                              <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                                <tr>
                                  <th className="p-4">المنتج</th>
                                  <th className="p-4">السعر</th>
                                  <th className="p-4">الكمية</th>
                                  <th className="p-4 text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-sm">
                                {products.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 flex items-center gap-3">
                                      <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                                      <span className="font-bold">{p.name}</span>
                                    </td>
                                    <td className="p-4 font-black">{p.price} ر.س</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] ${p.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stockQuantity} قطعة</span></td>
                                    <td className="p-4 text-center">
                                      <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="text-indigo-600 ml-4 font-bold">تعديل</button>
                                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-bold">حذف</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {adminTab === 'orders' && (
                          <div className="bg-white rounded-3xl border overflow-hidden">
                             <table className="w-full text-right">
                               <thead className="bg-gray-50 text-xs font-bold text-gray-400 p-4 uppercase">
                                 <tr><th className="p-4">رقم الطلب</th><th className="p-4">العميل</th><th className="p-4">الإجمالي</th></tr>
                               </thead>
                               <tbody className="text-sm divide-y">
                                 {orders.map(o => (
                                   <tr key={o.id} className="hover:bg-gray-50">
                                     <td className="p-4 font-mono text-[10px] text-indigo-600">{o.id}</td>
                                     <td className="p-4"><p className="font-bold">{o.customerName}</p><p className="text-[10px] opacity-40">{o.phone}</p></td>
                                     <td className="p-4 font-black">{o.total} ر.س</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {view === 'store' && (
                <div className="animate-fadeIn grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-[2rem] border overflow-hidden group hover:shadow-2xl transition-all">
                      <div className="aspect-square bg-gray-50 overflow-hidden"><img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" /></div>
                      <div className="p-5">
                        <h3 className="font-bold mb-2 truncate">{p.name}</h3>
                        <div className="flex justify-between items-center">
                           <span className="text-xl font-black text-indigo-600">{p.price} ر.س</span>
                           <button onClick={() => setCart([...cart, p])} className="bg-slate-900 text-white p-2 rounded-xl">🛒</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-xl mx-auto bg-white p-10 rounded-[2rem] shadow-xl animate-fadeIn">
                  <h2 className="text-2xl font-black mb-8 text-center">سلة المشتريات</h2>
                  {cart.length === 0 ? <p className="text-center text-gray-400">السلة خالية</p> : (
                    <div className="space-y-4">
                      {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                          <span className="font-bold">{item.name}</span>
                          <span className="font-black text-indigo-600">{item.price} ر.س</span>
                        </div>
                      ))}
                      <div className="pt-6 border-t text-xl font-black flex justify-between">
                         <span>الإجمالي:</span>
                         <span>{cart.reduce((s,i) => s + parseFloat(i.price), 0)} ر.س</span>
                      </div>
                      <button onClick={() => {alert('شكراً لك!'); setCart([]); setView('store');}} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">تأكيد الشراء</button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
