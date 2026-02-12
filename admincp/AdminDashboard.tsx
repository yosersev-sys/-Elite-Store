
import React, { useState, useMemo } from 'react';
import { Product, Category, Order } from '../types';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onOpenInvoiceForm: () => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [adminSearch, setAdminSearch] = useState('');

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return {
      revenue: revenue.toLocaleString(),
      ordersCount: orders.length,
      productCount: products.length,
      outOfStock: products.filter(p => (p.stockQuantity || 0) <= 0).length
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase()));
  }, [products, adminSearch]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] bg-white rounded-[3rem] card-shadow border border-slate-50 overflow-hidden animate-fadeIn">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-xl">⚙️</span>
            الإدارة
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Control Center v3</p>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <NavBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" />
          <NavBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" />
          <NavBtn active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="التقارير" icon="📊" />
        </nav>

        <div className="pt-8 border-t border-slate-800">
          <button className="w-full bg-slate-800 text-slate-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">مرحباً، المدير</h3>
            <p className="text-slate-400 font-bold mt-1 text-sm">إليك ملخص ما يحدث في متجرك اليوم.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenInvoiceForm} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition">🧾 فاتورة سريعة</button>
            <button onClick={onOpenAddForm} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:scale-105 transition active:scale-95">+ إضافة منتج</button>
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox title="إجمالي المبيعات" value={`${stats.revenue} ر.س`} icon="💰" color="text-emerald-500" />
            <StatBox title="عدد الطلبات" value={stats.ordersCount} icon="🔥" color="text-orange-500" />
            <StatBox title="إجمالي المنتجات" value={stats.productCount} icon="🧺" color="text-blue-500" />
            <StatBox title="نفذ المخزون" value={stats.outOfStock} icon="⚠️" color="text-rose-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden card-shadow">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <input 
                 type="text" 
                 placeholder="بحث سريع..." 
                 value={adminSearch} 
                 onChange={e => setAdminSearch(e.target.value)}
                 className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
               />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} منتج موجود</span>
            </div>
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">المنتج</th>
                  <th className="px-8 py-5">السعر</th>
                  <th className="px-8 py-5">المخزون</th>
                  <th className="px-8 py-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                        <div>
                          <p className="font-black text-slate-800 text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ر.س</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stockQuantity > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {p.stockQuantity} وحدة
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">✎</button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

const NavBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <span className="text-xl">{icon}</span>
    {label}
  </button>
);

const StatBox = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 flex flex-col gap-4">
    <div className={`w-14 h-14 ${color} bg-opacity-10 rounded-2xl flex items-center justify-center text-3xl`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
