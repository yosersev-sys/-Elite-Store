
import React, { useState, useMemo } from 'react';
import { Product, Category, Order } from '../types';
import { ApiService } from '../services/api';

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
  onUpdateOrder?: (order: Order) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  soundEnabled, onToggleSound
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
    const outOfStock = products.filter(p => p.stockQuantity <= 0).length;
    return {
      revenue: totalRevenue.toLocaleString(),
      salesCount: orders.length,
      productCount: products.length,
      lowStockCount,
      outOfStock
    };
  }, [products, orders]);

  // تصفية المنتجات حسب البحث
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory({ id: 'cat_' + Date.now(), name: newCatName });
    setNewCatName('');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      {/* القائمة الجانبية */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> الإدارة
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">سوق العصر - فاقوس</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
           <button 
             onClick={onToggleSound} 
             className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
           >
             {soundEnabled ? '🔔 التنبيهات مفعلة' : '🔕 التنبيهات معطلة'}
           </button>
           <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 hover:text-white font-bold text-sm transition">العودة للمتجر 🏪</button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <input 
              type="text" placeholder="بحث سريع..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
              className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm"
            />
            <span className="absolute left-4 top-3 text-slate-300">🔍</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button onClick={onOpenInvoiceForm} className="flex-grow md:flex-grow-0 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition">📄 فاتورة POS</button>
             <button onClick={onOpenAddForm} className="flex-grow md:flex-grow-0 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition">+ منتج جديد</button>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div className="animate-fadeIn">
          
          {/* قسم الإحصائيات */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي المبيعات" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
              <StatCard title="عدد الطلبات" value={stats.salesCount} icon="🛒" color="text-blue-600" />
              <StatCard title="نواقص المخزون" value={stats.lowStockCount} icon="⚠️" color="text-orange-500" />
              <StatCard title="نفذت الكمية" value={stats.outOfStock} icon="❌" color="text-rose-500" />
            </div>
          )}

          {/* قسم المخزون */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">المنتج</th>
                    <th className="px-8 py-6">سعر الجملة</th>
                    <th className="px-8 py-6">سعر البيع</th>
                    <th className="px-8 py-6">الربح</th>
                    <th className="px-8 py-6">المخزون</th>
                    <th className="px-8 py-6">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => {
                    const margin = p.price - (p.wholesalePrice || 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                            <div>
                              <p className="font-black text-slate-800 text-sm">{p.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{p.barcode || 'بدون باركود'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 font-bold text-slate-400 text-sm">{p.wholesalePrice || 0} ج.م</td>
                        <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                        <td className="px-8 py-4 font-black text-blue-500 text-xs">+{margin.toFixed(2)}</td>
                        <td className="px-8 py-4 font-bold text-slate-700 text-sm">{p.stockQuantity} {p.unit === 'kg' ? 'كجم' : 'وحدة'}</td>
                        <td className="px-8 py-4 flex gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition">✎</button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition">🗑</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* قسم الأقسام */}
          {activeTab === 'categories' && (
            <div className="space-y-8 max-w-2xl">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h3 className="font-black mb-6 text-slate-800">إضافة قسم جديد</h3>
                <div className="flex gap-3">
                  <input 
                    value={newCatName} onChange={e => setNewCatName(e.target.value)} 
                    placeholder="مثال: بقالة جافة" className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold"
                  />
                  <button onClick={handleAddCategory} className="bg-slate-900 text-white px-8 rounded-2xl font-black">إضافة</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white p-6 rounded-2xl border flex items-center justify-between group">
                    <span className="font-black text-slate-700">{cat.name}</span>
                    <button onClick={() => onDeleteCategory(cat.id)} className="text-rose-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100">🗑</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* قسم الطلبات */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl">📦</div>
                    <div>
                      <p className="font-black text-slate-800">طلب #{order.id}</p>
                      <p className="text-xs text-slate-400 font-bold">{order.customerName} • {order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">الإجمالي</p>
                      <p className="font-black text-emerald-600">{order.total} ج.م</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">التاريخ</p>
                      <p className="font-bold text-slate-700 text-xs">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <button onClick={() => window.location.hash = '#/order-success/' + order.id} className="bg-slate-100 px-6 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition">تفاصيل الفاتورة</button>
                </div>
              ))}
              {orders.length === 0 && <div className="text-center py-20 text-slate-400 font-bold">لا يوجد طلبات حالياً</div>}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

// مكونات مساعدة
const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span>{icon}</span><span className="flex-grow text-right">{label}</span>
    {badge !== undefined && <span className="bg-red-500 text-white text-[9px] px-2 rounded-lg">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col items-center text-center">
    <div className={`${color} text-4xl mb-4`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-xl font-black text-slate-800">{value}</p>
  </div>
);

export default AdminDashboard;
