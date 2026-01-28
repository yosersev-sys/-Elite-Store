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

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black text-indigo-400 tracking-tighter">لوحة الإدارة</h2>
        </div>
        
        <nav className="space-y-3 flex-grow">
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition ${activeTab === 'stats' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>📊 الإحصائيات</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition ${activeTab === 'orders' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>🛍️ الطلبات</button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition ${activeTab === 'products' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>📦 المنتجات</button>
          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition ${activeTab === 'categories' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>🏷️ التصنيفات</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 bg-slate-50 overflow-y-auto">
        
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <StatCard title="إجمالي الإيرادات" value={`${stats.revenue} ر.س`} icon="💰" color="bg-emerald-500" />
            <StatCard title="الطلبات" value={stats.sales} icon="📈" color="bg-blue-500" />
            <StatCard title="المنتجات" value={stats.productCount} icon="📦" color="bg-indigo-500" />
            <StatCard title="التصنيفات" value={stats.catCount} icon="🏷️" color="bg-orange-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">المنتجات</h3>
              <button onClick={onOpenAddForm} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">+ إضافة منتج</button>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="p-4">المنتج</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-bold">{p.name}</span>
                      </td>
                      <td className="p-4 font-black text-indigo-600">{p.price} ر.س</td>
                      <td className="p-4 text-center">
                        <button onClick={() => onOpenEditForm(p)} className="text-blue-500 mx-2">تعديل</button>
                        <button onClick={() => onDeleteProduct(p.id)} className="text-red-500">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <h3 className="text-2xl font-black">إدارة التصنيفات</h3>
            <div className="flex gap-4">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="اسم التصنيف..." className="flex-grow p-4 rounded-xl border outline-none focus:border-indigo-500" />
              <button onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }} className="bg-indigo-600 text-white px-8 rounded-xl font-bold">إضافة</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.length > 0 ? categories.map(cat => (
                <div key={cat.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                  <span className="font-bold">{cat.name}</span>
                  <button onClick={() => onDeleteCategory(cat.id)} className="text-red-400">✕</button>
                </div>
              )) : <div className="col-span-2 text-center py-10 text-slate-400 font-bold">لا توجد تصنيفات حالياً.</div>}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-black">طلبات العملاء</h3>
            <div className="bg-white rounded-2xl border overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">العميل</th>
                    <th className="p-4">الإجمالي</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="p-4 font-bold">{o.customerName}</td>
                      <td className="p-4 font-black">{o.total} ر.س</td>
                      <td className="p-4"><span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">جديد</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
    <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;