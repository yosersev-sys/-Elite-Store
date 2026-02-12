
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

type AdminTab = 'inventory' | 'sales' | 'categories' | 'stats';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, onDeleteProduct, onAddCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter(p => p.stockQuantity < 10 && p.stockQuantity > 0).length;
    const outOfStock = products.filter(p => p.stockQuantity <= 0).length;
    return { revenue, lowStock, outOfStock, totalProducts: products.length, totalOrders: orders.length };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* 🚀 القائمة الجانبية الإدارية (Sidebar) */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-3xl">⚙️</span>
            <div>
              <h2 className="text-xl font-black tracking-tighter">إدارة <span className="text-green-500">فاقوس</span></h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">لوحة التحكم الذكية</p>
            </div>
          </div>

          <nav className="space-y-2">
            <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} label="المخزون والمنتجات" icon="📦" badge={stats.outOfStock > 0 ? stats.outOfStock : undefined} />
            <NavButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} label="سجل المبيعات" icon="🛒" />
            <NavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="إدارة الأقسام" icon="🏷️" />
            <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="تقارير الأداء" icon="📊" />
          </nav>
        </div>

        {/* أزرار العمليات السريعة */}
        <div className="mt-auto p-8 border-t border-slate-800 space-y-4">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-2 mb-2">إجراءات سريعة</p>
          <button 
            onClick={onOpenAddForm}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-sm transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-3"
          >
            <span>+</span> إضافة منتج جديد
          </button>
          <button 
            onClick={onOpenInvoiceForm}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm transition shadow-lg flex items-center justify-center gap-3"
          >
            <span>🧾</span> إنشاء فاتورة
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full text-slate-500 py-2 text-xs font-bold hover:text-white transition mt-4"
          >
            العودة لواجهة المتجر 🏪
          </button>
        </div>
      </aside>

      {/* 🖥️ منطقة المحتوى الرئيسي */}
      <main className="flex-grow flex flex-col overflow-hidden">
        
        {/* هيدر المحتوى العلوي */}
        <header className="bg-white px-10 py-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-black text-slate-800">
            {activeTab === 'inventory' && 'إدارة المخزون'}
            {activeTab === 'sales' && 'سجل المبيعات'}
            {activeTab === 'categories' && 'الأقسام والتصنيفات'}
            {activeTab === 'stats' && 'الإحصائيات العامة'}
          </h1>
          
          {activeTab === 'inventory' && (
            <div className="relative w-96">
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الباركود..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm transition-all shadow-sm"
              />
              <span className="absolute left-4 top-3 text-slate-300 font-bold">🔍</span>
            </div>
          )}
        </header>

        {/* جسم المحتوى المتغير */}
        <div className="flex-grow p-10 overflow-y-auto no-scrollbar animate-fadeIn">
          
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي المبيعات" value={`${stats.revenue.toLocaleString()} ر.س`} icon="💰" color="text-green-600" bg="bg-green-50" />
              <StatCard title="الطلبات الناجحة" value={stats.totalOrders} icon="📈" color="text-blue-600" bg="bg-blue-50" />
              <StatCard title="نقص في المخزون" value={stats.lowStock} icon="⚠️" color="text-amber-600" bg="bg-amber-50" />
              <StatCard title="منتجات نفذت" value={stats.outOfStock} icon="🚫" color="text-red-600" bg="bg-red-50" />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6">المنتج والبيانات</th>
                    <th className="px-8 py-6">القسم</th>
                    <th className="px-8 py-6">السعر</th>
                    <th className="px-8 py-6">الكمية</th>
                    <th className="px-8 py-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-14 h-14 rounded-2xl object-cover border shadow-sm" alt="" />
                          <div>
                            <p className="font-black text-slate-800 text-sm mb-0.5">{p.name}</p>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black tracking-tighter uppercase">BARCODE: {p.barcode || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-500">
                        {categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                      </td>
                      <td className="px-8 py-4 font-black text-green-600 text-sm">{p.price} ر.س</td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-700">{p.stockQuantity} وحدة</span>
                          <StockBadge qty={p.stockQuantity} />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => onOpenEditForm(p)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition">✎</button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center text-slate-400 font-bold italic">لم يتم العثور على أي منتجات مطابقة للبحث</div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map(o => (
                  <div key={o.id} className="p-6 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition">🧾</div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الفاتورة: {o.id}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-green-600 text-xl">{o.total} ر.س</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(o.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-32 rounded-[3rem] text-center text-slate-300 font-black border-2 border-dashed border-slate-200">لا توجد عمليات بيع مسجلة حالياً</div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-10">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex gap-4 max-w-xl shadow-sm">
                <input 
                  id="new-cat-input-admin"
                  placeholder="اسم القسم الجديد..." 
                  className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if(val) { onAddCategory({id: 'cat_'+Date.now(), name: val}); (e.target as HTMLInputElement).value = ''; }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-cat-input-admin') as HTMLInputElement;
                    if(input.value) { onAddCategory({id: 'cat_'+Date.now(), name: input.value}); input.value = ''; }
                  }}
                  className="bg-slate-900 text-white px-10 rounded-2xl font-black text-sm shadow-xl"
                >إضافة</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:border-green-300 transition-all">
                    <div>
                      <p className="font-black text-slate-800 text-lg">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">معرف القسم: {cat.id}</p>
                    </div>
                    <button onClick={() => onDeleteCategory(cat.id)} className="text-slate-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100">🗑</button>
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

// 🔹 مكونات مساعدة
const NavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-2' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className="bg-red-500 text-white text-[9px] font-black h-5 min-w-[22px] px-1.5 flex items-center justify-center rounded-lg border-2 border-slate-900 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
    <div className={`w-20 h-20 ${bg} ${color} rounded-[2rem] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

const StockBadge = ({ qty }: { qty: number }) => {
  if (qty <= 0) return <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md w-fit mt-1 uppercase tracking-tighter">نفذ المخزون 🚫</span>;
  if (qty < 10) return <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit mt-1 uppercase tracking-tighter">كمية حرجة ⚠️</span>;
  return <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1 uppercase tracking-tighter">متوفر بكثرة ✅</span>;
};

export default AdminDashboard;
