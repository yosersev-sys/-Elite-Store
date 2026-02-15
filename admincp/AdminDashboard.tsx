import React, { useState, useMemo } from 'react';
import { Product, Category, Order, User } from '../types';
import { ApiService } from '../services/api';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  currentUser: User | null;
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onOpenInvoiceForm: () => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onViewOrder: (order: Order) => void;
  onUpdateOrderPayment: (id: string, paymentMethod: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, users, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  // تواريخ التقارير
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  // إدارة الأقسام
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // 1. حساب الأرباح الحقيقية (FIFO) للتقارير
  const profitStats = useMemo(() => {
    const start = new Date(reportStart).setHours(0, 0, 0, 0);
    const end = new Date(reportEnd).setHours(23, 59, 59, 999);

    const periodOrders = orders.filter(o => {
      const d = o.createdAt;
      return d >= start && d <= end && o.status !== 'cancelled';
    });

    let totalRevenue = 0;
    let totalCost = 0;
    
    periodOrders.forEach(order => {
      totalRevenue += Number(order.total);
      order.items.forEach(item => {
        // نستخدم التكلفة الحقيقية المسجلة في الفاتورة أو التكلفة الحالية كاحتياطي
        const cost = (item.actualWholesalePrice || item.wholesalePrice || 0) * item.quantity;
        totalCost += cost;
      });
    });

    return { 
      revenue: totalRevenue, 
      cost: totalCost, 
      profit: totalRevenue - totalCost,
      count: periodOrders.length 
    };
  }, [orders, reportStart, reportEnd]);

  // 2. إحصائيات عامة للصفحة الرئيسية
  const generalStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + o.total, 0);
    const lowStockCount = products.filter(p => p.stockQuantity < 5).length;
    return { totalSales, lowStockCount, totalOrders: orders.length, totalProducts: products.length };
  }, [products, orders]);

  const handleReturnOrder = async (order: Order) => {
    if (window.confirm(`هل أنت متأكد من استرجاع الطلب #${order.id}؟`)) {
      const res = await ApiService.returnOrder(order.id);
      if (res.status === 'success') {
        alert('تم استرجاع الطلب وإعادة الكميات للمخزن');
        window.location.reload();
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50">
      
      {/* Sidebar - القائمة الجانبية */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 md:p-8 flex flex-col shrink-0">
        <div className="mb-10">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">⚙️</span>
            لوحة الإدارة
          </h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-2 mr-1">نظام سوق العصر المحاسبي</p>
        </div>
        
        <nav className="space-y-1 flex-grow overflow-y-auto no-scrollbar">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزن" icon="📦" badge={generalStats.lowStockCount > 0 ? generalStats.lowStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح الدقيقة" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="🛠️" />
        </nav>

        <button onClick={onLogout} className="mt-6 w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">تسجيل الخروج 👋</button>
      </aside>

      {/* Main Content - المحتوى الرئيسي */}
      <main className="flex-grow p-4 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* صفحة الإحصائيات الرئيسية */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <h3 className="text-2xl font-black text-slate-800">نظرة عامة</h3>
               <div className="flex gap-2">
                 <button onClick={onOpenInvoiceForm} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg hover:bg-slate-900 transition-all">+ فاتورة سريعة</button>
                 <button onClick={onOpenAddForm} className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all">+ إضافة منتج</button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               <StatCard title="إجمالي المبيعات" value={`${generalStats.totalSales.toLocaleString()} ج.م`} icon="💰" color="emerald" />
               <StatCard title="إجمالي الطلبات" value={generalStats.totalOrders} icon="🧾" color="indigo" />
               <StatCard title="نواقص المخزن" value={generalStats.lowStockCount} icon="⚠️" color="rose" />
               <StatCard title="إجمالي الأصناف" value={generalStats.totalProducts} icon="📦" color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span>أحدث الطلبات</span>
                    <button onClick={() => setActiveTab('orders')} className="text-[10px] text-emerald-600 font-black">عرض الكل ←</button>
                  </h4>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition">
                         <div>
                            <p className="font-black text-sm text-slate-700">#{order.id} - {order.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                         </div>
                         <p className="font-black text-emerald-600">{order.total} ج.م</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span>منتجات تحتاج شحن (نواقص)</span>
                    <button onClick={() => setActiveTab('products')} className="text-[10px] text-rose-500 font-black">تحديث المخزن ←</button>
                  </h4>
                  <div className="space-y-4">
                    {products.filter(p => p.stockQuantity < 5).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                         <img src={p.images[0]} className="w-10 h-10 rounded-xl object-cover" />
                         <div className="flex-grow">
                            <p className="font-black text-sm text-slate-700">{p.name}</p>
                            <p className="text-[10px] text-rose-500 font-bold">متبقي فقط {p.stockQuantity} وحدة</p>
                         </div>
                         <button onClick={() => onOpenEditForm(p)} className="bg-white text-slate-400 p-2 rounded-lg hover:text-emerald-600 transition">✎</button>
                      </div>
                    ))}
                    {products.filter(p => p.stockQuantity < 5).length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-slate-300 font-bold italic">كل الأصناف متوفرة بكثرة ✅</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* صفحة المخزن وإدارة الدفعات */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">إدارة المخزن</h3>
              <input type="text" placeholder="بحث باسم المنتج..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-sm outline-none w-64" />
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-6 py-4">المنتج</th>
                    <th className="px-6 py-4">دفعات الشراء (FIFO)</th>
                    <th className="px-6 py-4">الإجمالي</th>
                    <th className="px-6 py-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.filter(p => p.name.includes(adminSearch)).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                        <div><p className="font-bold">{p.name}</p><p className="text-[9px] text-slate-400 uppercase tracking-widest">{p.id}</p></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.batches?.map((b, i) => (
                            <span key={i} className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${b.quantity > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                              {b.quantity} ق @ {b.wholesalePrice}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-black ${p.stockQuantity < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>{p.stockQuantity} وحدة</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-blue-50 rounded-lg">✎</button>
                          <button onClick={() => { if(confirm('حذف المنتج نهائياً؟')) onDeleteProduct(p.id) }} className="p-2 text-rose-500 bg-rose-50 rounded-lg">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* صفحة الأقسام */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800">إضافة قسم جديد</h3>
              <div className="flex gap-3">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none font-bold" />
                <button onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }} className="bg-emerald-600 text-white px-8 rounded-2xl font-black text-xs shadow-lg">إضافة</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="flex-grow bg-slate-50 px-4 py-2 rounded-xl border-2 border-emerald-200 outline-none" />
                      <button onClick={() => { onUpdateCategory({id: cat.id, name: editingCatName}); setEditingCatId(null); }} className="p-2 bg-emerald-600 text-white rounded-xl">✓</button>
                    </div>
                  ) : (
                    <>
                      <div><p className="font-black text-slate-800">{cat.name}</p><p className="text-[10px] text-slate-400">المنتجات: {products.filter(p => p.categoryId === cat.id).length}</p></div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-2 text-blue-400">✎</button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-rose-400">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* صفحة الطلبات */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800">إدارة الطلبات</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-6 py-4">الطلب</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">الإجمالي</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className={`hover:bg-slate-50 transition ${o.status === 'cancelled' ? 'opacity-40' : ''}`}>
                      <td className="px-6 py-4 font-black">#{o.id}</td>
                      <td className="px-6 py-4"><p className="font-bold">{o.customerName}</p><p className="text-[10px] text-slate-400">{o.phone}</p></td>
                      <td className="px-6 py-4 font-black text-emerald-600">{o.total} ج.م</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${o.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{o.status === 'cancelled' ? 'مسترجع' : 'مكتمل'}</span></td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => onViewOrder(o)} className="p-2 bg-slate-100 rounded-lg">🧾</button>
                        {o.status !== 'cancelled' && <button onClick={() => handleReturnOrder(o)} className="p-2 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black">استرجاع</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* صفحة الأعضاء */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800">قائمة الأعضاء</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black border-b"><th className="px-6 py-4">الاسم</th><th className="px-6 py-4">الموبايل</th><th className="px-6 py-4">الصلاحية</th><th className="px-6 py-4">الانضمام</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold">{u.name}</td><td className="px-6 py-4 font-black text-slate-500">{u.phone}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{u.role === 'admin' ? 'مدير' : 'عميل'}</span></td><td className="px-6 py-4 text-[10px] font-bold text-slate-400">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* صفحة الأرباح الدقيقة (Profit Center) */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-800 text-xl mb-6">تقرير الأرباح الحقيقي (نظام FIFO)</h3>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-grow space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">من تاريخ</label><input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div>
                  <div className="flex-grow space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">إلى تاريخ</label><input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-black text-sm" /></div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات</p><p className="text-3xl font-black text-slate-800 mt-2">{profitStats.revenue.toLocaleString()} ج.م</p></div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تكلفة البضاعة (FIFO)</p><p className="text-3xl font-black text-amber-600 mt-2">{profitStats.cost.toLocaleString()} ج.م</p></div>
              <div className="bg-emerald-600 p-8 rounded-[3rem] shadow-xl border border-emerald-500 text-white"><p className="text-[10px] font-black text-white/70 uppercase tracking-widest">صافي الربح الفعلي</p><p className="text-3xl font-black mt-2">{profitStats.profit.toLocaleString()} ج.م</p></div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex items-center gap-4"><span className="text-2xl">💡</span><p className="text-blue-800 text-xs font-bold leading-relaxed">هذا التقرير دقيق بنسبة 100%، حيث يخصم سعر الجملة للقطعة المبيعة من دفعتها الخاصة، مما يضمن لك حساب الربح بشكل صحيح حتى مع تقلب الأسعار اليومي.</p></div>
          </div>
        )}

        {/* صفحة الإعدادات */}
        {activeTab === 'settings' && (
           <div className="space-y-8 animate-fadeIn max-w-2xl">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100">
                 <h3 className="text-xl font-black text-slate-800 mb-8">إعدادات المتجر العامة</h3>
                 <div className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم واتساب الإدارة</label><input type="tel" defaultValue="201026034170" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المتجر الرسمي</label><input type="text" defaultValue="سوق العصر - فاقوس" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" /></div>
                    <button className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl hover:bg-slate-900 transition-all">حفظ التغييرات 💾</button>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl font-black text-sm transition-all relative ${active ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-lg">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge > 0 && <span className="absolute left-2 top-2 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-900">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return (
    <div className={`p-6 md:p-8 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-lg ${themes[color]}`}>
      <div className="text-3xl mb-4">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{title}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
};

export default AdminDashboard;