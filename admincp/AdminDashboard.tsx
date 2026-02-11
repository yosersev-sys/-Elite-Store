
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
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockCount = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length;
    const outOfStockCount = products.filter(p => (p.stockQuantity || 0) <= 0).length;
    
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
      p.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const getStockBadge = (qty: number) => {
    if (qty <= 0) return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black">نفذت الكمية</span>;
    if (qty < 10) return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black">مخزون منخفض</span>;
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black">متوفر</span>;
  };

  const handleUpdateCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    onUpdateCategory({ id, name: editingCatName });
    setEditingCatId(null);
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('خضروات')) return '🥦';
    if (n.includes('فواكه')) return '🍎';
    if (n.includes('ألبان')) return '🥛';
    if (n.includes('مخبوزات')) return '🥖';
    if (n.includes('لحوم')) return '🥩';
    if (n.includes('بقوليات')) return '🫘';
    return '📦';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black">قيد الانتظار</span>;
      case 'completed': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black">مكتمل</span>;
      case 'cancelled': return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black">ملغي</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-black">{status}</span>;
    }
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
          <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">admincp v2.5</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون والمنتجات" icon="📦" badge={stats.outOfStockCount > 0 ? stats.outOfStockCount : undefined} />
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الإحصائيات العامة" icon="📊" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام والتصنيفات" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="طلبات العملاء" icon="🛍️" badge={stats.pendingOrders} />
        </nav>

        <div className="pt-8 border-t border-slate-800 mt-auto">
          <p className="text-[10px] text-slate-500 font-bold mb-4 px-2 tracking-widest uppercase">نظام أسواق فاقوس</p>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-grow p-6 lg:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* Header Actions */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-grow max-w-md">
            {activeTab === 'products' ? (
              <input 
                type="text" 
                placeholder="ابحث بالاسم، الكود، أو الباركود..." 
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-sm"
              />
            ) : activeTab === 'categories' ? (
              <input 
                type="text" 
                placeholder="ابحث عن قسم..." 
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-sm"
              />
            ) : (
              <div className="h-10"></div>
            )}
            <span className="absolute left-4 top-3 text-slate-300">🔍</span>
          </div>
          <button 
            onClick={onOpenAddForm}
            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 transition active:scale-95"
          >
            + إضافة محصول جديد
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <StatCard title="إجمالي المبيعات" value={`${stats.revenue} ر.س`} icon="💰" color="text-green-600" />
            <StatCard title="الطلبات الجديدة" value={stats.pendingOrders} icon="🔥" color="text-orange-500" />
            <StatCard title="مخزون حرج" value={stats.lowStockCount} icon="⚠️" color="text-amber-500" />
            <StatCard title="إجمالي الأقسام" value={categories.length} icon="🏷️" color="text-blue-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-8 py-6">المنتج والباركود</th>
                  <th className="px-8 py-6">القسم</th>
                  <th className="px-8 py-6">السعر</th>
                  <th className="px-8 py-6">المخزون</th>
                  <th className="px-8 py-6 text-center">الإجراءات</th>
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">كود: {p.id}</span>
                            {p.barcode && (
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-black">|| {p.barcode}</span>
                            )}
                          </div>
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
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => onOpenEditForm(p)} 
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition font-black text-xs"
                        >
                          ✎ تعديل
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)} 
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition font-black text-xs"
                        >
                          🗑 حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-bold">لم يتم العثور على منتجات تطابق بحثك</div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          /* نظام الأقسام المحسن كما هو */
          <div className="space-y-12 animate-fadeIn">
            {/* Add Category Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="p-3 bg-green-50 text-green-600 rounded-2xl text-xl">✨</span>
                <div>
                  <h3 className="font-black text-slate-800">إضافة قسم جديد لفاقوس</h3>
                  <p className="text-xs text-slate-400 font-bold">أضف تصنيفاً جديداً لتنظيم منتجات المتجر</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="مثال: فواكه نادرة، خضروات ورقية..." 
                  onKeyDown={(e) => e.key === 'Enter' && newCatName && (onAddCategory({id: 'cat_'+Date.now(), name: newCatName}), setNewCatName(''))}
                  className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold transition shadow-inner"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-10 rounded-2xl font-black hover:bg-green-600 transition shadow-lg active:scale-95"
                >
                  إضافة القسم
                </button>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCategories.map(cat => {
                const productCount = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-green-200 hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[5rem] -mr-8 -mt-8 opacity-40 group-hover:bg-green-100 transition-colors"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl bg-white w-16 h-16 flex items-center justify-center rounded-2xl shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                          {getCategoryIcon(cat.name)}
                        </span>
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              className="bg-white border-2 border-green-200 px-4 py-2 rounded-xl outline-none font-bold text-sm w-40"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateCategory(cat.id);
                                if (e.key === 'Escape') setEditingCatId(null);
                              }}
                            />
                            <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 bg-green-600 text-white rounded-xl shadow-md">✓</button>
                            <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200">✕</button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-black text-slate-800 text-lg leading-none mb-1">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">ID: {cat.id}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-800 leading-none">{productCount}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">منتج مرتبط</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} 
                          className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition shadow-sm"
                          title="تعديل اسم القسم"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => { if(productCount > 0) { alert('لا يمكن حذف القسم لوجود منتجات تابعة له'); } else if(confirm('هل أنت متأكد من حذف القسم؟')) { onDeleteCategory(cat.id); } }} 
                          className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition shadow-sm"
                          title="حذف القسم"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                   <span className="text-5xl block mb-4 grayscale opacity-30">🔍</span>
                   <p className="text-slate-400 font-black text-xl">لا توجد أقسام مطابقة للبحث</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            {orders.length > 0 ? (
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">كود الطلب</th>
                    <th className="px-8 py-6">العميل</th>
                    <th className="px-8 py-6">المدينة</th>
                    <th className="px-8 py-6">الإجمالي</th>
                    <th className="px-8 py-6">الحالة</th>
                    <th className="px-8 py-6">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-bold text-slate-700">{o.id}</td>
                      <td className="px-8 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{o.customerName}</p>
                          <p className="text-[10px] text-slate-400">{o.phone}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-500">{o.city}</td>
                      <td className="px-8 py-4 font-black text-green-600 text-sm">{o.total} ر.س</td>
                      <td className="px-8 py-4">{getStatusBadge(o.status)}</td>
                      <td className="px-8 py-4 text-[10px] text-slate-400 font-bold">
                        {new Date(o.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center">
                <span className="text-6xl block mb-6">📝</span>
                <p className="text-slate-400 font-black text-xl">لا توجد طلبات مسجلة حالياً</p>
              </div>
            )}
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
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
    <div className="flex justify-between items-center mb-4">
      <div className={`${color} text-3xl opacity-80 group-hover:scale-125 transition-transform`}>{icon}</div>
      <div className="w-1 h-8 bg-slate-50 rounded-full"></div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
  </div>
);

export default AdminDashboard;
