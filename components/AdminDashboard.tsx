
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
    <div className="flex flex-col lg:flex-row min-h-[700px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
      
      <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-10 text-xl font-black text-indigo-400">إدارة النخبة</div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('stats')} className={`w-full text-right px-4 py-3 rounded-xl font-bold transition ${activeTab === 'stats' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>لوحة الإحصائيات</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-right px-4 py-3 rounded-xl font-bold transition ${activeTab === 'orders' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'} flex items-center justify-between`}>
            <span>الطلبات</span>
            {orders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{orders.length}</span>}
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-right px-4 py-3 rounded-xl font-bold transition ${activeTab === 'products' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>المنتجات</button>
          <button onClick={() => setActiveTab('categories')} className={`w-full text-right px-4 py-3 rounded-xl font-bold transition ${activeTab === 'categories' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>التصنيفات</button>
        </nav>
      </aside>

      <main className="flex-grow p-8 bg-slate-50 overflow-y-auto">
        
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-800">نظرة عامة على المتجر</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي الإيرادات" value={`${stats.revenue} ر.س`} icon="💰" color="bg-green-500" />
              <StatCard title="عدد الطلبات" value={stats.sales} icon="📦" color="bg-blue-500" />
              <StatCard title="المنتجات بالمخزن" value={stats.productCount} icon="🏷️" color="bg-indigo-500" />
              <StatCard title="إجمالي التصنيفات" value={stats.catCount} icon="📁" color="bg-orange-500" />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <h4 className="font-bold text-slate-800 mb-4">أحدث 5 طلبات</h4>
               <div className="space-y-4">
                 {orders.slice(0, 5).map(order => (
                   <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {order.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{order.customerName}</div>
                          <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</div>
                        </div>
                     </div>
                     <div className="text-sm font-black text-indigo-600">{order.total} ر.س</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-800">إدارة المخزون</h3>
               <button onClick={onOpenAddForm} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform hover:-translate-y-1">
                 + إضافة منتج جديد
               </button>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-600 text-sm font-bold">
                  <tr>
                    <th className="px-8 py-5">المنتج</th>
                    <th className="px-8 py-5">السعر</th>
                    <th className="px-8 py-5">المخزون</th>
                    <th className="px-8 py-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.length > 0 ? products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                            <div className="font-black text-slate-800">{p.name}</div>
                            <div className="text-xs text-slate-400">{categories.find(c => c.id === p.categoryId)?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-black text-indigo-600">{p.price} ر.س</td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${
                            p.stockQuantity <= 0 ? 'text-red-500' : 
                            p.stockQuantity < 10 ? 'text-orange-500' : 'text-emerald-600'
                          }`}>
                            {p.stockQuantity} قطعة
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.stockQuantity <= 0 ? 'نفذت الكمية' : 
                             p.stockQuantity < 10 ? 'كمية منخفضة' : 'متوفر'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => onOpenEditForm(p)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl transition font-bold text-sm">تعديل</button>
                          <button onClick={() => onDeleteProduct(p.id)} className="bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2 rounded-xl transition font-bold text-sm">حذف</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400">لا توجد منتجات حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* تبويبات الأقسام والطلبات تبقى كما هي */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-800">إدارة الطلبات الواردة</h3>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-600 text-sm font-bold">
                  <tr>
                    <th className="px-8 py-5">رقم الطلب</th>
                    <th className="px-8 py-5">العميل</th>
                    <th className="px-8 py-5">المدينة</th>
                    <th className="px-8 py-5">المجموع</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-mono text-xs text-indigo-600 font-bold">{order.id}</td>
                      <td className="px-8 py-4">
                        <div className="font-bold text-slate-800">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.phone}</div>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium">{order.city}</td>
                      <td className="px-8 py-4 font-black text-slate-900">{order.total} ر.س</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {order.status === 'pending' ? 'قيد المراجعة' : 'مكتمل'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <button className="text-indigo-600 hover:underline text-xs font-bold" onClick={() => alert(JSON.stringify(order.items, null, 2))}>
                          عرض العناصر
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-800">إدارة الأقسام</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddCategory({ id: 'cat_' + Date.now(), name: newCatName }); setNewCatName(''); }} className="bg-white p-6 rounded-3xl shadow-sm flex gap-4 border border-slate-200">
              <input placeholder="اسم التصنيف الجديد..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none" />
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">إضافة</button>
            </form>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-600 text-sm font-bold">
                  <tr><th className="px-8 py-4">الاسم</th><th className="px-8 py-4 text-center">الإجراء</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td className="px-8 py-4 font-bold">{cat.name}</td>
                      <td className="px-8 py-4 text-center"><button onClick={() => onDeleteCategory(cat.id)} className="text-red-500 hover:underline text-sm">حذف</button></td>
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
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>{icon}</div>
    <div><div className="text-xs font-bold text-slate-400">{title}</div><div className="text-lg font-black text-slate-900">{value}</div></div>
  </div>
);

export default AdminDashboard;
