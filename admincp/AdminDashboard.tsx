
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

type AdminTab = 'stats' | 'products' | 'orders' | 'categories';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [adminSearch, setAdminSearch] = useState('');

  // إحصائيات سريعة للوحة التحكم
  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter(p => p.stockQuantity < 10 && p.stockQuantity > 0).length;
    const outOfStock = products.filter(p => p.stockQuantity <= 0).length;
    return { revenue, lowStock, outOfStock, totalProducts: products.length, totalOrders: orders.length };
  }, [products, orders]);

  // تصفية المنتجات حسب البحث
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] gap-0 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-50 animate-fadeIn">
      
      {/* القائمة الجانبية (Sidebar) - ثابتة على اليمين */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-8 flex flex-col shrink-0 border-l border-slate-800">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🛍️</span>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">فاقوس <span className="text-green-500">ستور</span></h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">نظام الإدارة المتكامل</p>
            </div>
          </div>
        </div>

        {/* التبويبات الرئيسية */}
        <nav className="space-y-2 flex-grow">
          <p className="text-[10px] text-slate-500 font-black px-4 uppercase tracking-widest mb-4">التنقل السريع</p>
          
          <AdminNavButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            label="المخزون والمنتجات" 
            icon="📦" 
            badge={stats.outOfStock > 0 ? stats.outOfStock : undefined}
          />
          <AdminNavButton 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            label="سجل المبيعات" 
            icon="🛒" 
          />
          <AdminNavButton 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')} 
            label="الأقسام والتصنيفات" 
            icon="🏷️" 
          />
          <AdminNavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            label="تقارير الأداء" 
            icon="📊" 
          />
        </nav>

        {/* أزرار العمليات - مجمعة في أسفل القائمة الجانبية */}
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <p className="text-[10px] text-slate-500 font-black px-4 uppercase tracking-widest mb-2">إجراءات إدارية</p>
          
          <button 
            onClick={onOpenAddForm}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-900/20 hover:bg-green-500 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="text-xl">+</span> إضافة منتج جديد
          </button>

          <button 
            onClick={onOpenInvoiceForm}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>🧾</span> إنشاء فاتورة بيع
          </button>

          <button 
            onClick={() => window.location.href = 'index.php'}
            className="w-full text-slate-500 py-2 rounded-xl font-bold text-xs hover:text-white transition-colors mt-4"
          >
            الخروج من الإدارة ⬅️
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسي (Content) */}
      <main className="flex-grow p-6 lg:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* هيدر المحتوى مع شريط البحث */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
            {activeTab === 'products' ? 'إدارة المخزون' : 
             activeTab === 'orders' ? 'سجل المبيعات' : 
             activeTab === 'categories' ? 'الأقسام' : 'التقارير العامة'}
          </h3>
          
          {activeTab === 'products' && (
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الباركود..." 
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-sm shadow-sm transition-all"
              />
              <span className="absolute left-4 top-4 text-slate-300">🔍</span>
            </div>
          )}
        </div>

        {/* محتوى التبويبات الديناميكي */}
        <div className="animate-fadeIn">
          
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard title="إجمالي الدخل" value={`${stats.revenue.toLocaleString()} ر.س`} icon="💰" color="text-green-600" bg="bg-green-50" />
              <StatCard title="عدد الطلبات" value={stats.totalOrders} icon="📈" color="text-blue-600" bg="bg-blue-50" />
              <StatCard title="نقص مخزون" value={stats.lowStock} icon="⚠️" color="text-amber-600" bg="bg-amber-50" />
              <StatCard title="منتجات نفذت" value={stats.outOfStock} icon="🚫" color="text-red-600" bg="bg-red-50" />
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                      <th className="px-8 py-6">المنتج</th>
                      <th className="px-8 py-6">القسم</th>
                      <th className="px-8 py-6">السعر</th>
                      <th className="px-8 py-6">المخزون</th>
                      <th className="px-8 py-6 text-center">التحكم</th>
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
                              <p className="text-[9px] text-slate-400 font-bold uppercase">كود: {p.barcode || p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">
                          {categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                        </td>
                        <td className="px-8 py-4 font-black text-green-600 text-sm">{p.price} ر.س</td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{p.stockQuantity} وحدة</span>
                            <StockLevel qty={p.stockQuantity} />
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => onOpenEditForm(p)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm">✎</button>
                            <button onClick={() => onDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center text-slate-400 font-bold">لا توجد منتجات مطابقة للبحث</div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
               {orders.length > 0 ? (
                 orders.map(o => (
                  <div key={o.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl">🧾</div>
                      <div>
                        <p className="font-black text-slate-800">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">رقم الفاتورة: {o.id}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-green-600 text-lg">{o.total} ر.س</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                ))
               ) : (
                 <div className="bg-white p-20 rounded-[2rem] text-center text-slate-400 font-bold border-2 border-dashed">لم يتم تسجيل أي مبيعات بعد</div>
               )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex gap-4 max-w-xl shadow-sm">
                  <input 
                    id="new-cat-input"
                    placeholder="أضف قسم جديد..." 
                    className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-cat-input') as HTMLInputElement;
                      if(input.value) { onAddCategory({id: 'cat_'+Date.now(), name: input.value}); input.value = ''; }
                    }}
                    className="bg-slate-900 text-white px-8 rounded-2xl font-black"
                  >إضافة</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-green-300 transition-all">
                       <span className="font-black text-slate-700">{cat.name}</span>
                       <button onClick={() => onDeleteCategory(cat.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">🗑</button>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

// مكونات القائمة الجانبية (Sidebar Buttons)
const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-1' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge && (
      <span className="bg-red-500 text-white text-[9px] min-w-[18px] h-4.5 px-1.5 flex items-center justify-center rounded-lg border border-slate-900 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-300">
    <div className={`w-16 h-16 ${bg} ${color} rounded-[1.5rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const StockLevel = ({ qty }: { qty: number }) => {
  if (qty <= 0) return <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md mt-1">نفذت الكمية ❌</span>;
  if (qty < 10) return <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1">مخزون حرج ⚠️</span>;
  return <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-1">متوفر ✅</span>;
};

export default AdminDashboard;
