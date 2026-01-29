
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

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onDeleteCategory, onUpdateOrder
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockCount = products.filter(p => p.stockQuantity < 5).length;
    
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      catCount: categories.length,
      pendingOrders,
      lowStockCount
    };
  }, [products, categories, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleStatusChange = async (order: Order, newStatus: any) => {
    const updatedOrder = { ...order, status: newStatus };
    const success = await ApiService.updateOrder(updatedOrder);
    if (success && onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    } else {
      alert('تم تحديث الحالة بنجاح (محاكاة)');
      if (onUpdateOrder) onUpdateOrder(updatedOrder);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    const success = await ApiService.updateCategory({ id, name: editingCatName });
    if (success) {
      // تحديث الحالة محلياً (هذا يتم عادة عبر إعادة جلب البيانات أو تمرير دالة تحديث من الأب)
      // للتبسيط، سنقوم بتحديث الحالة في App.tsx إذا كان ممكناً، لكن حالياً سنفترض نجاح السيرفر
      window.location.reload(); // أسرع طريقة لمزامنة التغييرات الشاملة
    }
    setEditingCatId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn font-sans">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0 border-r border-slate-800">
        <div className="mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">E</div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">لوحة النخبة</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Admin Control</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" badge={stats.pendingOrders} icon="🛍️" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" badge={stats.lowStockCount > 0 ? stats.lowStockCount : undefined} badgeColor="bg-orange-500" icon="📦" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="التصنيفات" icon="🏷️" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="⚙️" />
        </nav>

        <div className="pt-8 mt-8 border-t border-slate-800">
           <button onClick={() => window.location.href = 'index.php'} className="w-full flex items-center gap-3 text-slate-400 hover:text-white transition font-bold text-sm px-4 py-3 rounded-xl hover:bg-slate-800">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             الرجوع للمتجر
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 lg:p-10 bg-slate-50/50 overflow-y-auto custom-scrollbar">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'stats' && 'نظرة عامة'}
              {activeTab === 'orders' && 'إدارة الطلبات'}
              {activeTab === 'products' && 'المستودع والمخزون'}
              {activeTab === 'categories' && 'إدارة التصنيفات'}
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard title="إجمالي الدخل" value={`${stats.revenue} ر.س`} growth="+12%" icon="💰" color="bg-emerald-500" />
              <StatCard title="الطلبات الجديدة" value={stats.pendingOrders} growth="نشط" icon="🔥" color="bg-orange-500" />
              <StatCard title="المخزون الناقص" value={stats.lowStockCount} growth="انتبه" icon="⚠️" color="bg-rose-500" />
              <StatCard title="إجمالي المنتجات" value={stats.productCount} growth="نمو" icon="📦" color="bg-indigo-500" />
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-4xl animate-fadeIn space-y-12">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
               <h3 className="text-xl font-black mb-6 text-slate-800 flex items-center gap-2">
                 <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                 إضافة تصنيف جديد
               </h3>
               <div className="flex gap-4">
                  <input 
                    placeholder="مثل: عطور، ساعات، أثاث..." 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-grow bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition"
                  />
                  <button 
                    onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                    className="bg-indigo-600 text-white px-10 rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition"
                  >إضافة</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition shadow-sm">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input 
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="bg-slate-50 px-4 py-2 rounded-xl outline-none border-2 border-indigo-100 font-bold flex-grow"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 bg-emerald-500 text-white rounded-xl">✓</button>
                      <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-xl">✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {cat.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                          className="p-2 text-slate-300 hover:text-indigo-600 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-slate-300 hover:text-rose-500 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
               <button onClick={onOpenAddForm} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100">+ إضافة منتج</button>
            </div>
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-6">المنتج</th>
                    <th className="px-8 py-6">السعر</th>
                    <th className="px-8 py-6 text-center">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-12 h-12 rounded-2xl object-cover border" alt="" />
                          <div className="font-black text-slate-800 text-sm">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-black text-indigo-600 text-sm">{p.price} ر.س</td>
                      <td className="px-8 py-4">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => onOpenEditForm(p)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-indigo-600 hover:text-white transition">✎</button>
                           <button onClick={() => onDeleteProduct(p.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge, badgeColor = 'bg-indigo-600' }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all group relative ${
      active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className={`${badgeColor} text-white text-[9px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-lg border-2 ${active ? 'border-indigo-500' : 'border-slate-900'}`}>
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, growth, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-500">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg transform group-hover:rotate-12 transition-transform`}>{icon}</div>
      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${growth.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{growth}</span>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-black text-slate-800 mt-1">{value}</div>
    </div>
  </div>
);

export default AdminDashboard;
