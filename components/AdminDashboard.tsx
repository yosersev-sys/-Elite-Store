
import React, { useState, useMemo } from 'react';
import { Product, Category, Order } from '../types';
import { ApiService } from '../services/api';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateOrder?: (order: Order) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onDeleteCategory, onUpdateOrder
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
    const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;
    
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      pendingOrders,
      lowStockCount,
      outOfStockCount
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      p.id.toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [products, adminSearch]);

  const getStockBadge = (qty: number) => {
    if (qty <= 0) return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black">نفذت الكمية</span>;
    if (qty < 10) return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black">مخزون منخفض</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black">متوفر</span>;
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    const success = await ApiService.updateCategory({ id, name: editingCatName });
    if (success) {
      alert('تم تحديث القسم بنجاح');
      window.location.reload();
    }
    setEditingCatId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-50 animate-fadeIn">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="p-2 bg-green-600 rounded-xl">⚙️</span>
            إدارة فاقوس
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">لوحة التحكم الذكية</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" badge={stats.outOfStockCount > 0 ? stats.outOfStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={stats.pendingOrders} />
        </nav>

        <div className="pt-8 border-t border-slate-800 mt-auto">
          <button onClick={() => window.location.href = 'index.php'} className="w-full text-right p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition font-black text-sm">
            الرجوع للمتجر 🏪
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-grow p-6 lg:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* Top Search Bar */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-grow max-w-md">
            <input 
              type="text" 
              placeholder="ابحث عن منتج أو كود..." 
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-sm"
            />
            <span className="absolute left-4 top-3 text-slate-300">🔍</span>
          </div>
          <button onClick={onOpenAddForm} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 transition active:scale-95">
            + إضافة منتج
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <StatCard title="إجمالي المبيعات" value={`${stats.revenue} ر.س`} icon="💰" color="text-green-600" />
            <StatCard title="الطلبات الجديدة" value={stats.pendingOrders} icon="🔥" color="text-orange-500" />
            <StatCard title="منتجات قاربت على النفاذ" value={stats.lowStockCount} icon="⚠️" color="text-amber-500" />
            <StatCard title="إجمالي المحاصيل" value={stats.productCount} icon="🧺" color="text-blue-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-8 py-6">المنتج</th>
                  <th className="px-8 py-6">القسم</th>
                  <th className="px-8 py-6">السعر</th>
                  <th className="px-8 py-6">المخزون</th>
                  <th className="px-8 py-6">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" alt="" />
                        <div>
                          <p className="font-black text-slate-800 text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-bold text-slate-500">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</span>
                    </td>
                    <td className="px-8 py-4 font-black text-green-600 text-sm">{p.price} ر.س</td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">{p.stockQuantity} وحدة</span>
                        {getStockBadge(p.stockQuantity)}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => onOpenEditForm(p)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition">✎</button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800">إضافة قسم جديد</h3>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="مثال: فواكه نادرة" 
                  className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-8 rounded-2xl font-black"
                >إضافة</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input 
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold border-2 border-green-200"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 bg-green-600 text-white rounded-xl">✓</button>
                      <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-xl">✕</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">المنتجات: {products.filter(p => p.categoryId === cat.id).length}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-2 text-slate-400 hover:text-green-600">✎</button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-600">🗑</button>
                      </div>
                    </>
                  )}
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
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className="bg-red-500 text-white text-[9px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-lg border-2 border-slate-900">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-500">
    <div className="flex justify-between items-center mb-4">
      <div className={`${color} text-3xl opacity-80 group-hover:scale-125 transition-transform`}>{icon}</div>
      <div className="w-2 h-8 bg-slate-50 rounded-full"></div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
  </div>
);

export default AdminDashboard;
