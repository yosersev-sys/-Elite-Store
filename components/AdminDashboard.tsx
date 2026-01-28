
import React, { useState, useMemo } from 'react';
import { Product, Category, Order } from '../types';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onDeleteCategory 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [newCatName, setNewCatName] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      catCount: categories.length
    };
  }, [products, categories, orders]);

  // دالة مخصصة لفتح صفحة الإضافة الجديدة بشكل صحيح
  const handleOpenAddPage = () => {
    // التحقق مما إذا كان الملف موجوداً قبل التحويل (اختياري، لكن يفضل التحويل المباشر)
    window.location.href = 'add-product.php';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black text-indigo-400 tracking-tighter">لوحة الإدارة</h2>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Elite Store Management</p>
        </div>
        
        <nav className="space-y-3 flex-grow">
          <AdminNavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            label="الإحصائيات" 
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
          />
          <AdminNavButton 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            label="الطلبات" 
            badge={orders.length > 0 ? orders.length : undefined}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
          />
          <AdminNavButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            label="المنتجات" 
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
          />
          <AdminNavButton 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')} 
            label="التصنيفات" 
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />}
          />
        </nav>

        <div className="pt-8 mt-8 border-t border-slate-800">
           <button onClick={() => window.location.href = 'index.php'} className="flex items-center gap-3 text-slate-400 hover:text-white transition font-bold text-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             العودة للمتجر
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 bg-slate-50 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'stats' && (
          <div className="space-y-10 animate-fadeIn">
            <header className="flex justify-between items-end">
               <div>
                 <h3 className="text-3xl font-black text-slate-800">نظرة عامة</h3>
                 <p className="text-slate-400 font-bold mt-1">إحصائيات متجرك اليوم</p>
               </div>
               <div className="text-xs font-black text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                 آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
               </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي الإيرادات" value={`${stats.revenue} ر.س`} icon="💰" color="bg-emerald-500" />
              <StatCard title="عدد المبيعات" value={stats.sales} icon="📈" color="bg-blue-500" />
              <StatCard title="المنتجات" value={stats.productCount} icon="📦" color="bg-indigo-500" />
              <StatCard title="التصنيفات" value={stats.catCount} icon="🏷️" color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h4 className="font-black text-slate-800 mb-6 flex items-center justify-between">
                   أحدث الطلبات
                   <button onClick={() => setActiveTab('orders')} className="text-xs text-indigo-600 hover:underline">عرض الكل</button>
                 </h4>
                 <div className="space-y-4">
                   {orders.slice(0, 5).map(order => (
                     <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                            {order.customerName.charAt(0)}
                          </div>
                          <div>
                             <div className="font-black text-slate-800 text-sm">{order.customerName}</div>
                             <div className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-black text-indigo-600">{order.total} ر.س</div>
                           <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{order.status === 'pending' ? 'جديد' : 'مكتمل'}</span>
                        </div>
                     </div>
                   ))}
                   {orders.length === 0 && <p className="text-center py-10 text-slate-300 font-bold">لا توجد طلبات بعد.</p>}
                 </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h4 className="font-black text-slate-800 mb-6 flex items-center justify-between">
                   حالة المخزون
                   <button onClick={() => setActiveTab('products')} className="text-xs text-indigo-600 hover:underline">إدارة المخزون</button>
                 </h4>
                 <div className="space-y-4">
                    {products.sort((a,b) => a.stockQuantity - b.stockQuantity).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                         <div className="flex items-center gap-4">
                           <img src={p.images[0] ? p.images[0] : ''} className="w-10 h-10 rounded-lg object-cover" alt="" />
                           <span className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{p.name}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${p.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                               {p.stockQuantity} قطعة
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-800">إدارة الطلبات</h3>
              <div className="text-sm font-bold text-slate-400">إجمالي الطلبات: {orders.length}</div>
            </header>

            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">رقم الطلب</th>
                    <th className="px-8 py-5">العميل</th>
                    <th className="px-8 py-5">المدينة</th>
                    <th className="px-8 py-5">الإجمالي</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-mono text-[10px] font-bold text-indigo-600">{order.id}</td>
                      <td className="px-8 py-4">
                        <div className="font-black text-slate-800 text-sm">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.phone}</div>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-600">{order.city}</td>
                      <td className="px-8 py-4 font-black text-slate-900 text-sm">{order.total} ر.س</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {order.status === 'pending' ? 'قيد المراجعة' : 'مكتمل'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <button className="text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-black transition" onClick={() => alert(JSON.stringify(order.items, null, 2))}>
                          عرض العناصر
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-bold">لم تصل أي طلبات حتى الآن.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8 animate-fadeIn">
            <header className="flex justify-between items-center">
              <div>
                 <h3 className="text-3xl font-black text-slate-800">المخزون</h3>
                 <p className="text-slate-400 font-bold text-xs mt-1">إدارة منتجاتك وعرض الكميات المتوفرة</p>
              </div>
              <button 
                onClick={handleOpenAddPage} 
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition transform hover:-translate-y-1 active:scale-95"
              >
                + إضافة منتج جديد (في صفحة خاصة)
              </button>
            </header>

            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">المنتج</th>
                    <th className="px-8 py-5">السعر</th>
                    <th className="px-8 py-5">الكمية</th>
                    <th className="px-8 py-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0] ? p.images[0] : ''} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100" alt="" />
                          <div>
                             <div className="font-black text-slate-800 text-sm">{p.name}</div>
                             <div className="text-[10px] text-slate-400 font-bold">{categories.find(c => c.id === p.categoryId)?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-indigo-600 text-sm">{p.price} ر.س</td>
                      <td className="px-8 py-5">
                         <div className={`text-xs font-black flex items-center gap-2 ${p.stockQuantity <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${p.stockQuantity <= 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                            {p.stockQuantity} قطعة
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-3">
                           <button onClick={() => onOpenEditForm(p)} className="bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition font-black text-xs">تعديل</button>
                           <button onClick={() => onDeleteProduct(p.id)} className="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition font-black text-xs">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl">
            <h3 className="text-3xl font-black text-slate-800">التصنيفات</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); if(!newCatName) return; onAddCategory({ id: 'cat_' + Date.now(), name: newCatName }); setNewCatName(''); }} className="bg-white p-8 rounded-[2.5rem] shadow-sm flex gap-4 border border-slate-100">
              <input 
                placeholder="اسم التصنيف الجديد (مثال: أحذية رياضية)..." 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition font-bold" 
              />
              <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95">إضافة</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {categories.map(cat => (
                 <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                         #
                       </div>
                       <span className="font-black text-slate-800">{cat.name}</span>
                    </div>
                    <button onClick={() => onDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all group ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
  >
    <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
    <span className="flex-grow text-right">{label}</span>
    {badge && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition duration-500">
    <div className={`${color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-lg transform group-hover:rotate-12 transition-transform`}>{icon}</div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
    </div>
  </div>
);

export default AdminDashboard;
