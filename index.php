
<?php
// إعدادات البيئة
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | Elite Store PHP</title>
    
    <!-- CSS & Fonts -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- Libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { background-color: #f8fafc; }
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <!-- Script Block -->
    <script type="text/babel">
      const { useState, useEffect, useMemo, useRef } = React;

      // --- المكونات (سيتم دمجها هنا لضمان عملها كملف PHP واحد) ---

      const App = () => {
        const [view, setView] = useState('store');
        const [products, setProducts] = useState([]);
        const [cart, setCart] = useState([]);
        const [categories, setCategories] = useState([
          { id: 'cat_1', name: 'إلكترونيات' },
          { id: 'cat_2', name: 'أزياء' },
          { id: 'cat_3', name: 'منزل' }
        ]);

        // جلب البيانات من api.php
        useEffect(() => {
          fetch('api.php?action=get_products')
            .then(res => res.json())
            .then(data => setProducts(data));
        }, []);

        const addToCart = (product) => {
          setCart([...cart, { ...product, id_inst: Date.now() }]);
        };

        return (
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50 p-4">
              <div className="container mx-auto flex justify-between items-center">
                <h1 onClick={() => setView('store')} className="text-2xl font-black text-indigo-600 cursor-pointer">ELITE STORE</h1>
                <div className="flex gap-4">
                  <button onClick={() => setView('admin')} className="text-gray-600 font-bold hover:text-indigo-600">الإدارة</button>
                  <button onClick={() => setView('cart')} className="relative p-2 bg-indigo-50 rounded-xl">
                    🛒 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 rounded-full">{cart.length}</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto p-4 py-8">
              {view === 'store' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fadeIn">
                  {products.map(p => (
                    <div key={p.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-xl transition">
                      <img src={p.images[0]} className="w-full h-48 object-cover rounded-2xl mb-4" />
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-indigo-600 font-black my-2">{p.price} ر.س</p>
                      <button onClick={() => addToCart(p)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition">أضف للسلة</button>
                    </div>
                  ))}
                </div>
              )}

              {view === 'cart' && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl animate-fadeIn">
                  <h2 className="text-2xl font-black mb-6">سلة التسوق</h2>
                  {cart.length === 0 ? <p className="text-center text-gray-400">السلة فارغة</p> : (
                    <div className="space-y-4">
                      {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b pb-4">
                          <span>{item.name}</span>
                          <span className="font-bold">{item.price} ر.س</span>
                        </div>
                      ))}
                      <div className="pt-4 flex justify-between text-xl font-black">
                        <span>الإجمالي:</span>
                        <span>{cart.reduce((s, i) => s + Number(i.price), 0)} ر.س</span>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black mt-6 shadow-lg">تأكيد الطلب</button>
                    </div>
                  )}
                </div>
              )}

              {view === 'admin' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl animate-fadeIn">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black">لوحة التحكم</h2>
                    <button onClick={() => setView('admin_form')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">+ منتج جديد</button>
                  </div>
                  <table className="w-full text-right">
                    <thead><tr className="border-b text-gray-400"><th>المنتج</th><th>السعر</th><th>الإجراء</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b">
                          <td className="py-4 font-bold">{p.name}</td>
                          <td>{p.price} ر.س</td>
                          <td><button className="text-red-500 font-bold">حذف</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {view === 'admin_form' && <AdminForm onBack={() => setView('admin')} />}
            </main>

            <footer className="p-8 text-center text-gray-400">
              جميع الحقوق محفوظة &copy; متجر النخبة PHP
            </footer>
          </div>
        );
      };

      const AdminForm = ({ onBack }) => {
        const [name, setName] = useState('');
        const [price, setPrice] = useState('');
        const [img, setImg] = useState('');

        const save = () => {
          const product = { id: Date.now(), name, price, images: [img || 'https://via.placeholder.com/300'] };
          fetch('api.php?action=add_product', {
            method: 'POST',
            body: JSON.stringify(product)
          }).then(() => {
            alert('تم الحفظ!');
            window.location.reload();
          });
        };

        return (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl">
             <h2 className="text-2xl font-black mb-6">إضافة منتج</h2>
             <div className="space-y-4">
               <input placeholder="اسم المنتج" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" />
               <input placeholder="السعر" type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" />
               <input placeholder="رابط الصورة" value={img} onChange={e => setImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" />
               <button onClick={save} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">حفظ المنتج</button>
               <button onClick={onBack} className="w-full text-gray-400 font-bold">إلغاء</button>
             </div>
          </div>
        );
      }

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
