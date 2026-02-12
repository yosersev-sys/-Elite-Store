
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

type AdminTab = 'inventory' | 'sales' | 'categories' | 'analytics';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory
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
    <div className="flex h-[90vh] w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-100 animate-fadeIn">
      
      {/* 🟢 القائمة الجانبية (Sidebar) - تحتوي على كل الأزرار */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col p-8 shrink-0 border-l border-slate-800">
        <div className="mb-12">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🛍️</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">إدارة <span className="text-green-500">فاقوس</span></h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">لوحة التحكم المركزية</p>
            </div>
          </div>
        </div>

        {/* أزرار التنقل الرئيسية في الجنب */}
        <nav className="space-y-3 flex-grow">
          <SidebarLink 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
            label="إدارة المخزون" 
            icon="📦" 
            badge={stats.outOfStock > 0 ? stats.outOfStock : undefined}
          />
          <SidebarLink 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
            label="سجل المبيعات" 
            icon="🛒" 
          />
          <SidebarLink 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')} 
            label="الأقسام" 
            icon="🏷️" 
          />
          <SidebarLink 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            label="إحصائيات الأداء" 
            icon="📊" 
          />
        </nav>

        {/* أزرار الإجراءات السريعة - مجمعة في أسفل الجنب */}
        <div className="pt-8 border-t border-slate-800 space-y-4">
          <p className="text-[10px] text-slate-500 font-black px-4 uppercase tracking-widest mb-2">إجراءات سريعة</p>
          
          <button 
            onClick={onOpenAddForm}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-green-900/40 hover:bg-green-500 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="text-xl">+</span> إضافة منتج
          </button>

          <button 
            onClick={onOpenInvoiceForm}
            className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm shadow-lg hover:bg-white transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>🧾</span> إنشاء فاتورة
          </button>

          <button 
            onClick={() => window.location.href = 'index.php'}
            className="w-full text-slate-500 py-3 rounded-xl font-bold text-xs hover:text-white transition-colors mt-2"
          >
            الرجوع للمتجر 🏪
          </button>
        </div>
      </aside>

      {/* ⚪ منطقة المحتوى الرئيسي */}
      <main className="flex-grow flex flex-col bg-slate-50/30">
        
        {/* شريط البحث العلوي */}
        <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-800">
            {activeTab === 'inventory' && 'إدارة المخزون والمنتجات'}
            {activeTab === 'sales' && 'سجل عمليات البيع'}
            {activeTab === 'categories' && 'إدارة أقسام المتجر'}
            {activeTab === 'analytics' && 'تحليل بيانات المتجر'}
          </h3>
          
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الباركود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-sm transition-all border border-slate-200"
            />
            <span className="absolute left-4 top-4 text-slate-300">🔍</span>
          </div>
        </header>

        {/* محتوى التبويبات */}
        <div className="p-10 overflow-y-auto no-scrollbar flex-grow">
          
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">المنتج والبيانات</th>
                    <th className="px-8 py-6">السعر</th>
                    <th className="px-8 py-6">الكمية</th>
                    <th className="px-8 py-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-14 h-14 rounded-2xl object-cover border shadow-sm" alt="" />
                          <div>
                            <p className="font-black text-slate-800 text-sm mb-1">{p.name}</p>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">كود: {p.barcode || p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-green-600 text-sm">{p.price} ر.س</td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs text-slate-700">{p.stockQuantity} وحدة</span>
                          <StockStatus qty={p.stockQuantity} />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => onOpenEditForm(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm">✎</button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center text-slate-400 font-bold">لا توجد منتجات مطابقة في المخزون</div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
              <StatBox title="إجمالي المبيعات" value={`${stats.revenue.toLocaleString()} ر.س`} icon="💰" color="text-green-600" />
              <StatBox title="إجمالي المبيعات" value={stats.totalOrders} icon="📦" color="text-blue-600" />
              <StatBox title="منتجات نفذت" value={stats.outOfStock} icon="🚫" color="text-red-600" />
              <StatBox title="تنوع الأقسام" value={categories.length} icon="🏷️" color="text-purple-600" />
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4 animate-fadeIn">
              {orders.length > 0 ? (
                orders.map(o => (
                  <div key={o.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🧾</div>
                      <div>
                        <p className="font-black text-slate-800">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">رقم الفاتورة: {o.id}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-green-600 text-xl">{o.total} ر.س</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-20 rounded-[3rem] text-center text-slate-300 font-black border-2 border-dashed border-slate-100">لا توجد مبيعات مسجلة حتى الآن</div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="animate-fadeIn space-y-10">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-xl flex gap-4 items-center">
                <input 
                  id="admin-cat-add"
                  placeholder="اسم القسم الجديد..." 
                  className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if(val) { onAddCategory({id: 'cat_'+Date.now(), name: val}); (e.target as HTMLInputElement).value = ''; }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('admin-cat-add') as HTMLInputElement;
                    if(input.value) { onAddCategory({id: 'cat_'+Date.now(), name: input.value}); input.value = ''; }
                  }}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg"
                >أضف القسم</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:border-green-300 transition">
                    <div>
                      <p className="font-black text-slate-800 text-lg">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">الرقم المرجعي: {cat.id}</p>
                    </div>
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

// 🔹 مكونات القائمة الجانبية المساعدة
const SidebarLink = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl font-black text-sm transition-all duration-300 ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-900/40 translate-x-2' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className="bg-red-500 text-white text-[9px] font-black h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-lg border-2 border-slate-900 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

const StatBox = ({ title, value, icon, color }: any) => (
  <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
    <div className={`w-20 h-20 bg-slate-50 ${color} rounded-[2rem] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

const StockStatus = ({ qty }: { qty: number }) => {
  if (qty <= 0) return <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg w-fit">نفذ المخزون 🚫</span>;
  if (qty < 10) return <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">كمية منخفضة ⚠️</span>;
  return <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg w-fit">متوفر ✅</span>;
};

export default AdminDashboard;
