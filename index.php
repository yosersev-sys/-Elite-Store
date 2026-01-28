<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | الإدارة المتكاملة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@^1.38.0"
      }
    }
    </script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; }
      .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
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
      const { useState, useEffect, useRef } = React;

      // --- نموذج إضافة وتعديل المنتجات ---
      const AdminProductForm = ({ product, categories, onSubmit, onCancel }) => {
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

        return (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border animate-fadeIn max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-2xl font-black text-slate-800">{product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={onCancel} className="text-slate-400 font-bold hover:text-red-500 transition">إلغاء ✕</button>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400">اسم المنتج</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="مثال: آيفون 15 برو" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400">التصنيف</label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none transition">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400">السعر (ر.س)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400">الكمية المتوفرة</label>
                  <input required type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none transition" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400">وصف المنتج</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none min-h-[120px] resize-none" />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400">صور المنتج</label>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-[10px] flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current.click()} className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition">＋</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple hidden accept="image/*" />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-slate-900 transition transform active:scale-95">
                {product ? 'تحديث المنتج' : 'نشر المنتج الآن'}
              </button>
            </form>
          </div>
        );
      };

      // --- التطبيق الرئيسي ---
      const App = () => {
        const [view, setView] = useState('admin'); 
        const [adminTab, setAdminTab] = useState('products');
        const [products, setProducts] = useState([]);
        const [categories, setCategories] = useState([]);
        const [orders, setOrders] = useState([]);
        const [editingProduct, setEditingProduct] = useState(null);
        const [isFormOpen, setIsFormOpen] = useState(false);
        const [apiError, setApiError] = useState(null);

        const apiPath = 'api.php'; // تأكد من أن الملف في نفس المجلد

        const loadData = async () => {
          setApiError(null);
          try {
            const pRes = await fetch(`${apiPath}?action=get_products`);
            if (!pRes.ok) throw new Error(`API Error: ${pRes.status}`);
            const p = await pRes.json();
            
            const cRes = await fetch(`${apiPath}?action=get_categories`);
            const c = await cRes.json();
            
            const oRes = await fetch(`${apiPath}?action=get_orders`);
            const o = await oRes.json();

            setProducts(Array.isArray(p) ? p : []);
            setCategories(Array.isArray(c) ? c : []);
            setOrders(Array.isArray(o) ? o : []);
          } catch (e) { 
            console.error(e);
            setApiError('فشل الاتصال بـ api.php. يرجى التأكد من رفع جميع الملفات إلى الاستضافة.');
          }
        };

        useEffect(() => { loadData(); }, []);

        const handleProductSubmit = async (data) => {
          const action = editingProduct ? 'update_product' : 'add_product';
          try {
            const res = await fetch(`${apiPath}?action=${action}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            }).then(r => r.json());

            if (res.status === 'success') {
              setIsFormOpen(false);
              setEditingProduct(null);
              loadData();
            } else { alert(res.message || 'حدث خطأ أثناء الحفظ'); }
          } catch (e) { alert('خطأ في الشبكة'); }
        };

        const deleteProduct = async (id) => {
          if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
          await fetch(`${apiPath}?action=delete_product&id=${id}`, { method: 'DELETE' });
          loadData();
        };

        return (
          <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm">
              <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-black text-indigo-600">ELITE<span className="text-slate-900">ADMIN</span></h1>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">لوحة التحكم الكاملة</span>
                </div>
                <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-indigo-600 transition">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            </header>

            <main className="container mx-auto p-6 flex-grow">
              {apiError && (
                <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-2xl mb-8 flex items-center gap-4 animate-fadeIn">
                  <div className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
                  <div className="text-red-700 font-bold">{apiError}</div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full lg:w-64 space-y-2 shrink-0">
                  <button onClick={() => { setAdminTab('stats'); setIsFormOpen(false); }} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition ${adminTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border hover:bg-slate-50'}`}>📊 الإحصائيات العامة</button>
                  <button onClick={() => { setAdminTab('products'); setIsFormOpen(false); }} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition ${adminTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border hover:bg-slate-50'}`}>📦 إدارة المخزون</button>
                  <button onClick={() => { setAdminTab('orders'); setIsFormOpen(false); }} className={`w-full text-right p-4 rounded-2xl font-black text-sm transition ${adminTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border hover:bg-slate-50'}`}>📜 طلبات العملاء</button>
                </aside>

                {/* Content */}
                <section className="flex-grow">
                  {isFormOpen ? (
                    <AdminProductForm product={editingProduct} categories={categories} onSubmit={handleProductSubmit} onCancel={() => setIsFormOpen(false)} />
                  ) : (
                    <div className="animate-fadeIn space-y-8">
                      {adminTab === 'stats' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition duration-500">
                             <div className="text-slate-400 text-xs font-black uppercase mb-1">إجمالي الإيرادات</div>
                             <div className="text-3xl font-black text-slate-800">{orders.reduce((s,o) => s + o.total, 0).toLocaleString()} ر.س</div>
                          </div>
                          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition duration-500">
                             <div className="text-slate-400 text-xs font-black uppercase mb-1">الطلبات الحالية</div>
                             <div className="text-3xl font-black text-indigo-600">{orders.length}</div>
                          </div>
                          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl transition duration-500">
                             <div className="text-slate-400 text-xs font-black uppercase mb-1">المنتجات النشطة</div>
                             <div className="text-3xl font-black text-slate-800">{products.length}</div>
                          </div>
                        </div>
                      )}

                      {adminTab === 'products' && (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-black text-xl text-slate-800">قائمة المنتجات</h2>
                            <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-slate-900 transition">＋ إضافة منتج جديد</button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                              <thead className="bg-slate-100/50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                  <th className="p-5">المنتج</th>
                                  <th className="p-5">السعر</th>
                                  <th className="p-5">المخزون</th>
                                  <th className="p-5 text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {products.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                                    <td className="p-5 flex items-center gap-4">
                                      <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover border bg-white" />
                                      <div>
                                         <div className="font-black text-slate-800">{p.name}</div>
                                         <div className="text-[10px] text-slate-400 font-bold">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</div>
                                      </div>
                                    </td>
                                    <td className="p-5 font-black text-indigo-600">{p.price} ر.س</td>
                                    <td className="p-5">
                                       <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stockQuantity <= 5 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                          {p.stockQuantity} قطعة
                                       </span>
                                    </td>
                                    <td className="p-5">
                                      <div className="flex justify-center gap-2">
                                        <button onClick={() => { setEditingProduct(p); setIsFormOpen(true); }} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition">تعديل</button>
                                        <button onClick={() => deleteProduct(p.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition">حذف</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {products.length === 0 && (
                                  <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-black text-lg italic">لا توجد منتجات حالياً. ابدأ بإضافة منتجك الأول!</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {adminTab === 'orders' && (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
                          <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100/50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                               <tr><th className="p-5">رقم الطلب</th><th className="p-5">العميل</th><th className="p-5">الإجمالي</th><th className="p-5 text-center">الحالة</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {orders.map(o => (
                                 <tr key={o.id} className="hover:bg-slate-50/50 transition">
                                   <td className="p-5 font-mono text-indigo-600 font-black">{o.id}</td>
                                   <td className="p-5"><div className="font-bold">{o.customerName}</div><div className="text-[10px] text-slate-400">{o.phone}</div></td>
                                   <td className="p-5 font-black text-slate-800">{o.total} ر.س</td>
                                   <td className="p-5 text-center"><span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">جديد</span></td>
                                 </tr>
                               ))}
                               {orders.length === 0 && (
                                  <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-black text-lg italic">لم تصل أي طلبات بعد.</td></tr>
                               )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </main>
          </div>
        );
      };

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
