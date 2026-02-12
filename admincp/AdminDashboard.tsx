
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
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black">قيد الانتظار</span>;
      case 'completed': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black">مكتمل</span>;
      case 'cancelled': return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black">ملغي</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-[10px] font-black">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-50 animate-fadeIn">
      
      {/* القائمة الجانبية (Sidebar) */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-10">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-3xl">🛍️</span>
            <span>فاقوس <span className="text-green-500">ستور</span></span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest border-t border-slate-800 pt-2">لوحة التحكم الإدارية</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="إدارة المخزون" icon="📦" badge={stats.outOfStockCount > 0 ? stats.outOfStockCount : undefined} />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات والمبيعات" icon="🛒" badge={stats.pendingOrders} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام والتصنيفات" icon="🏷️" />
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="إحصائيات الأداء" icon="📊" />
        </nav>

        {/* قسم الأزرار السريعة في الجنب */}
        <div className="pt-8 border-t border-slate-800 mt-8 space-y-4">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-2 mb-2">إجراءات سريعة</p>
          
          <button 
            onClick={onOpenAddForm}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 hover:bg-green-500 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="text-lg">+</span> إضافة محصول جديد
          </button>

          <button 
            onClick={onOpenInvoiceForm}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>🧾</span> إنشاء فاتورة بيع
          </button>

          <button 
            onClick={() => window.location.href = 'index.php'}
            className="w-full text-slate-400 py-3 rounded-xl font-bold text-xs hover:text-white transition-colors"
          >
            الرجوع للمتجر الرئيسي 🏪
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى (Content Area) */}
      <main className="flex-grow p-6 lg:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* شريط البحث العلوي */}
        <div className="mb-10">
          <div className="relative max-w-xl">
            {activeTab === 'products' ? (
              <input 
                type="text" 
                placeholder="ابحث في المخزون بالاسم، الكود، أو الباركود..." 
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-sm shadow-sm transition-all"
              />
            ) : activeTab === 'categories' ? (
              <input 
                type="text" 
                placeholder="ابحث عن قسم معين..." 
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-sm shadow-sm transition-all"
              />
            ) : (
              <div className="h-2"></div>
            )}
            <span className="absolute left-6 top-5 text-slate-300">🔍</span>
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <StatCard title="إجمالي المبيعات" value={`${stats.revenue} ر.س`} icon="💰" color="text-green-600" />
            <StatCard title="الطلبات الجديدة" value={stats.pendingOrders} icon="🔥" color="text-orange-500" />
            <StatCard title="نقص في المخزون" value={stats.lowStockCount} icon="⚠️" color="text-amber-500" />
            <StatCard title="إجمالي الأقسام" value={categories.length} icon="🏷️" color="text-blue-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">قائمة المخزون الحالي</h3>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-4 py-1 rounded-full uppercase tracking-widest">مجموع المنتجات: {products.length}</span>
            </div>
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-8 py-6">المنتج والبيانات</th>
                  <th className="px-8 py-6">القسم</th>
                  <th className="px-8 py-6">السعر</th>
                  <th className="px-8 py-6">المخزون</th>
                  <th className="px-8 py-6 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={p.images[0]} className="w-14 h-14 rounded-2xl object-cover border shadow-sm" alt="" />
                        <div>
                          <p className="font-black text-slate-800 text-sm mb-1">{p.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">ID: {p.id}</span>
                            {p.barcode && (
                              <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-black border border-green-100">|| {p.barcode}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500">{categories.find(c => c.id === p.categoryId)?.name || 'عام'}</span>
                    </td>
                    <td className="px-8 py-6 font-black text-green-600 text-sm">{p.price} ر.س</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs">{p.stockQuantity} وحدة</span>
                        {getStockBadge(p.stockQuantity)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => onOpenEditForm(p)} 
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm"
                          title="تعديل المنتج"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)} 
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"
                          title="حذف من المخزون"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-bold">عذراً، لا توجد نتائج مطابقة لبحثك في المخزون</div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-12 animate-fadeIn">
            {/* قسم إضافة تصنيف جديد */}
            <div className="bg-white p-10 rounded-[3rem] border shadow-sm max-w-2xl">
              <div className="flex items-center gap-4 mb-8">
                <span className="p-4 bg-green-50 text-green-600 rounded-[1.5rem] text-2xl">🏷️</span>
                <div>
                  <h3 className="font-black text-slate-800 text-xl">إضافة قسم جديد</h3>
                  <p className="text-xs text-slate-400 font-bold">قم بتنظيم محاصيلك في تصنيفات واضحة للعملاء</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="مثال: فواكه نادرة، خضروات عضوية..." 
                  onKeyDown={(e) => e.key === 'Enter' && newCatName && (onAddCategory({id: 'cat_'+Date.now(), name: newCatName}), setNewCatName(''))}
                  className="flex-grow px-8 py-5 bg-slate-50 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold transition shadow-inner"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-10 rounded-3xl font-black hover:bg-green-600 transition shadow-lg active:scale-95"
                >
                  إضافة الآن
                </button>
              </div>
            </div>

            {/* شبكة الأقسام */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCategories.map(cat => {
                const productCount = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-green-200 hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              className="bg-white border-2 border-green-200 px-4 py-2 rounded-xl outline-none font-bold text-sm w-44 shadow-inner"
                              autoFocus
                            />
                            <button onClick={() => handleUpdateCategory(cat.id)} className="p-2 bg-green-600 text-white rounded-xl shadow-md">✓</button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-black text-slate-800 text-xl mb-1">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">التصنيف: {cat.id}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-500">
                        {cat.name.includes('خضروات') ? '🥦' : cat.name.includes('فواكه') ? '🍎' : '📦'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-slate-800 leading-none">{productCount}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">منتج مرتبط</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} 
                          className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition shadow-sm"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => onDeleteCategory(cat.id)} 
                          className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition shadow-sm"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="p-8 border-b border-slate-50">
                <h3 className="text-xl font-black text-slate-800">سجل الطلبات والمبيعات</h3>
            </div>
            {orders.length > 0 ? (
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">رقم الفاتورة</th>
                    <th className="px-8 py-6">العميل</th>
                    <th className="px-8 py-6">الإجمالي النهائي</th>
                    <th className="px-8 py-6">حالة الطلب</th>
                    <th className="px-8 py-6">تاريخ العملية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-8 py-6 font-black text-slate-700">{o.id}</td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-bold text-slate-800 text-sm mb-1">{o.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{o.phone}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-green-600 text-sm">{o.total} ر.س</td>
                      <td className="px-8 py-6">{getStatusBadge(o.status)}</td>
                      <td className="px-8 py-6 text-[11px] text-slate-500 font-bold">
                        {new Date(o.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center">
                <span className="text-6xl block mb-6">📉</span>
                <p className="text-slate-400 font-black text-xl">لا توجد عمليات بيع مسجلة في النظام حتى الآن</p>
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
    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm transition-all duration-300 ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/30' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className="bg-red-500 text-white text-[9px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-lg border-2 border-slate-900 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
    <div className="flex justify-between items-center mb-6">
      <div className={`${color} text-4xl opacity-80 group-hover:scale-125 transition-transform duration-500`}>{icon}</div>
      <div className="w-1 h-12 bg-slate-50 rounded-full"></div>
    </div>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
  </div>
);

export default AdminDashboard;
