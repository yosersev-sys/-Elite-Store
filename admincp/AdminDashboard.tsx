
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

  // إحصائيات سريعة
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
    <div className="flex flex-col lg:flex-row min-h-[85vh] gap-6 animate-fadeIn">
      
      {/* القائمة الجانبية -Sidebar- */}
      <aside className="w-full lg:w-72 bg-white rounded-[2.5rem] shadow-xl border border-green-50 p-6 flex flex-col shrink-0 self-start sticky top-24">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            إدارة المتجر
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">لوحة التحكم الرئيسية</p>
        </div>

        {/* أزرار التنقل */}
        <nav className="space-y-2 mb-8">
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            label="الإحصائيات" 
            icon="📊" 
          />
          <NavButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            label="المخزون والمنتجات" 
            icon="📦" 
            badge={stats.outOfStock > 0 ? stats.outOfStock : undefined}
            badgeColor="bg-red-500"
          />
          <NavButton 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            label="سجل المبيعات" 
            icon="🛒" 
            badge={orders.filter(o => o.status === 'pending').length || undefined}
          />
          <NavButton 
            active={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')} 
            label="الأقسام" 
            icon="🏷️" 
          />
        </nav>

        {/* أزرار العمليات - مجمعة في الجنب */}
        <div className="pt-6 border-t border-slate-50 space-y-3">
          <p className="text-[10px] text-slate-400 font-black px-2 uppercase tracking-widest mb-2">إجراءات سريعة</p>
          
          <button 
            onClick={onOpenAddForm}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition flex items-center justify-center gap-2 group"
          >
            <span className="text-lg group-hover:rotate-90 transition-transform">+</span>
            إضافة منتج جديد
          </button>

          <button 
            onClick={onOpenInvoiceForm}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <span>🧾</span>
            إنشاء فاتورة
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسي */}
      <main className="flex-grow space-y-6">
        
        {/* شريط البحث العلوي (يظهر فقط في تبويب المنتجات) */}
        {activeTab === 'products' && (
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center px-6 gap-4">
            <span className="text-slate-300">🔍</span>
            <input 
              type="text" 
              placeholder="ابحث في المخزون بالاسم أو الباركود..." 
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="flex-grow bg-transparent outline-none font-bold text-sm"
            />
          </div>
        )}

        {/* محتوى التبويبات */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-50 overflow-hidden min-h-[60vh]">
          
          {activeTab === 'stats' && (
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              <StatCard title="إجمالي الدخل" value={`${stats.revenue.toLocaleString()} ر.س`} icon="💰" color="text-green-600" bg="bg-green-50" />
              <StatCard title="عدد الطلبات" value={stats.totalOrders} icon="📈" color="text-blue-600" bg="bg-blue-50" />
              <StatCard title="منتجات قاربت للنفاذ" value={stats.lowStock} icon="⚠️" color="text-amber-600" bg="bg-amber-50" />
              <StatCard title="منتجات نفذت" value={stats.outOfStock} icon="🚫" color="text-red-600" bg="bg-red-50" />
            </div>
          )}

          {activeTab === 'products' && (
            <div className="animate-fadeIn">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-lg">قائمة المنتجات والمخزون</h3>
                <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-[10px] font-black">{filteredProducts.length} منتج</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                      <th className="px-8 py-5">المنتج</th>
                      <th className="px-8 py-5">القسم</th>
                      <th className="px-8 py-5">السعر</th>
                      <th className="px-8 py-5">المخزون</th>
                      <th className="px-8 py-5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" alt="" />
                            <div>
                              <p className="font-black text-slate-800 text-sm">{p.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">BARCODE: {p.barcode || 'N/A'}</p>
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
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-8 animate-fadeIn">
               <h3 className="font-black text-slate-800 text-lg mb-6">سجل العمليات والطلبات</h3>
               {orders.length > 0 ? (
                 <div className="space-y-4">
                    {orders.map(o => (
                      <div key={o.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">📄</div>
                          <div>
                            <p className="font-black text-slate-800">{o.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">رقم الفاتورة: {o.id}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-black text-green-600">{o.total} ر.س</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-20 text-slate-400 font-bold">لا توجد طلبات مسجلة حالياً</div>
               )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="p-8 animate-fadeIn space-y-8">
               <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 max-w-xl">
                  <h4 className="font-black text-slate-800 mb-4">إضافة قسم جديد</h4>
                  <div className="flex gap-3">
                    <input 
                      id="new-cat-input"
                      placeholder="اسم القسم (مثال: بقوليات)" 
                      className="flex-grow px-6 py-3 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if(val) { onAddCategory({id: 'cat_'+Date.now(), name: val}); (e.target as HTMLInputElement).value = ''; }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('new-cat-input') as HTMLInputElement;
                        if(input.value) { onAddCategory({id: 'cat_'+Date.now(), name: input.value}); input.value = ''; }
                      }}
                      className="bg-slate-900 text-white px-8 rounded-2xl font-black"
                    >أضف</button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-green-200 transition">
                       <span className="font-black text-slate-700">{cat.name}</span>
                       <button onClick={() => onDeleteCategory(cat.id)} className="text-slate-300 hover:text-red-500 transition">🗑</button>
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

// مكونات فرعية مساعدة
const NavButton = ({ active, onClick, label, icon, badge, badgeColor = 'bg-green-600' }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all ${
      active ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge && (
      <span className={`${badgeColor} text-white text-[9px] min-w-[18px] h-4.5 px-1.5 flex items-center justify-center rounded-lg`}>
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-lg transition-all">
    <div className={`w-16 h-16 ${bg} ${color} rounded-[1.5rem] flex items-center justify-center text-3xl transition-transform group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const StockLevel = ({ qty }: { qty: number }) => {
  if (qty <= 0) return <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">نفذت الكمية ❌</span>;
  if (qty < 10) return <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">مخزون حرج ⚠️</span>;
  return <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">متوفر بكثرة ✅</span>;
};

export default AdminDashboard;
