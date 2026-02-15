import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Order, User } from '../types';
import { ApiService } from '../services/api';
import { WhatsAppService } from '../services/whatsappService';

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
  products, categories, orders, users, currentUser, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onUpdateOrderPayment, soundEnabled, onToggleSound, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  // لتقرير الأرباح
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  // لإدارة الأقسام
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // إحصائيات الأرباح الدقيقة
  const profitStats = useMemo(() => {
    const start = new Date(reportStart).setHours(0, 0, 0, 0);
    const end = new Date(reportEnd).setHours(23, 59, 59, 999);

    const periodOrders = orders.filter(o => {
      const d = o.createdAt;
      return d >= start && d <= end && o.status !== 'cancelled';
    });

    let revenue = 0;
    let cost = 0;
    periodOrders.forEach(order => {
      revenue += Number(order.total);
      order.items.forEach(item => {
        cost += (item.actualWholesalePrice || item.wholesalePrice || 0) * item.quantity;
      });
    });

    return { revenue, cost, profit: revenue - cost, count: periodOrders.length };
  }, [orders, reportStart, reportEnd]);

  // إحصائيات عامة
  const generalStats = useMemo(() => {
    const totalSales = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const lowStock = products.filter(p => p.stockQuantity < 5).length;
    return { totalSales, lowStock, totalOrders: orders.length, totalProducts: products.length };
  }, [products, orders]);

  const handleReturnOrder = async (order: Order) => {
    if (window.confirm(`هل أنت متأكد من استرجاع الطلب #${order.id}؟ سيتم إعادة الكميات للمخزن وتصفير الأرباح لهذا الطلب.`)) {
      const res = await ApiService.returnOrder(order.id);
      if (res.status === 'success') {
        alert('تم استرجاع الطلب بنجاح');
        window.location.reload();
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 md:p-8 flex flex-col shrink-0">
        <div className="mb-10">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> لوحة الإدارة
          </h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">نظام سوق العصر المتكامل</p>
        </div>
        
        <nav className="space-y-1.5 flex-grow overflow-y-auto no-scrollbar">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزن" icon="📦" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.filter(o => o.status === 'pending').length} />
          <AdminNavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="🛠️" />
        </nav>

        <div className="pt-6 border-t border-slate-800 mt-6 space-y-3">
           <button onClick={onToggleSound} className="w-full text-right px-4 py-2 text-[10px] font-black text-slate-400 hover:text-white transition uppercase">
             الصوت: {soundEnabled ? 'مفعل ✅' : 'صامت 🔇'}
           </button>
           <button onClick={onLogout} className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">تسجيل الخروج 👋</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* Statistics View */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <h3 className="text-2xl font-black text-slate-800">نظرة عامة</h3>
               <div className="flex gap-2">
                 <button onClick={onOpenInvoiceForm} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 hover:scale-105 transition">+ فاتورة سريعة</button>
                 <button onClick={onOpenAddForm} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition">+ إضافة منتج</button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               <StatCard title="إجمالي المبيعات" value={`${generalStats.totalSales.toLocaleString()} ج.م`} icon="💰" color="text-emerald-600" />
               <StatCard title="عدد الطلبات" value={generalStats.totalOrders} icon="🧾" color="text-indigo-600" />
               <StatCard title="نواقص المخزن" value={generalStats.lowStock} icon="⚠️" color="text-amber-500" />
               <StatCard title="إجمالي المنتجات" value={generalStats.totalProducts} icon="📦" color="text-blue-600" />
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <h4 className="font-black text-slate-800 mb-6">أحدث الطلبات</h4>
               <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div>
                          <p className="font-black text-sm">#{order.id} - {order.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                       </div>
                       <p className="font-black text-emerald-600">{order.total} ج.م</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* Products View */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">إدارة المخزون</h3>
              <div className="relative">
                <input type="text" placeholder="بحث..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="bg-white border rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-6 py-4">المنتج</th>
                    <th className="px-6 py-4">الدفعات (FIFO)</th>
                    <th className="px-6 py-4">المخزون</th>
                    <th className="px-6 py-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.filter(p => p.name.includes(adminSearch)).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-bold">{p.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.batches?.map((b, i) => (
                            <span key={i} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${b.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                              {b.quantity} ق @ {b.wholesalePrice}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black">{p.stockQuantity} {p.unit === 'kg' ? 'كجم' : 'ق'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-blue-50 rounded-lg">✎</button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories View */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800">إضافة قسم جديد</h3>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="اسم القسم..." 
                  className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-8 rounded-2xl font-black text-xs"
                >إضافة</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input 
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold border-2 border-emerald-200"
                      />
                      <button onClick={() => { onUpdateCategory({id: cat.id, name: editingCatName}); setEditingCatId(null); }} className="p-2 bg-emerald-600 text-white rounded-xl">✓</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">المنتجات: {products.filter(p => p.categoryId === cat.id).length}</p>
                      </div>
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

        {/* Orders View */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800">إدارة الطلبات</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
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
                    <tr key={o.id} className={`hover:bg-slate-50 transition ${o.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                      <td className="px-6 py-4 font-black">#{o.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400">{o.phone}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600">{o.total} ج.م</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black ${o.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {o.status === 'cancelled' ? 'مسترجع' : 'مكتمل'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           <button onClick={() => onViewOrder(o)} className="p-2 bg-slate-100 rounded-lg" title="عرض الفاتورة">🧾</button>
                           {o.status !== 'cancelled' && (
                             <button onClick={() => handleReturnOrder(o)} className="p-2 bg-rose-50 text-rose-500 rounded-lg font-black text-[10px]" title="استرجاع">استرجاع ↩</button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Members View */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800">قائمة الأعضاء</h3>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black border-b">
                    <th className="px-6 py-4">العضو</th>
                    <th className="px-6 py-4">الجوال</th>
                    <th className="px-6 py-4">الصلاحية</th>
                    <th className="px-6 py-4">تاريخ الانضمام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 font-bold">{u.name}</td>
                      <td className="px-6 py-4 font-black text-slate-500">{u.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {u.role === 'admin' ? 'مدير' : 'عميل'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports View (Profit Center) */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-800 text-xl mb-6">تقرير الأرباح الحقيقي (FIFO)</h3>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">من تاريخ</label>
                    <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">إلى تاريخ</label>
                    <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبيعات</p>
                 <p className="text-3xl font-black text-slate-800 mt-2">{profitStats.revenue.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التكلفة (الوارد أولاً)</p>
                 <p className="text-3xl font-black text-amber-600 mt-2">{profitStats.cost.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-emerald-600 p-8 rounded-[3rem] shadow-xl border border-emerald-500 text-white">
                 <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">صافي الربح الحقيقي</p>
                 <p className="text-3xl font-black mt-2">{profitStats.profit.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex items-center gap-4">
               <span className="text-2xl">💡</span>
               <p className="text-blue-800 text-xs font-bold leading-relaxed">
                 يتم حساب الأرباح بناءً على تكلفة كل دفعة (Batch) مبيعة. إذا كان لديك طماطم مشتراة بـ 10 وأخرى بـ 12، سيحسب النظام الربح بدقة عند بيع كل واحدة منهما.
               </p>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
           <div className="space-y-8 animate-fadeIn max-w-2xl">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100">
                 <h3 className="text-xl font-black text-slate-800 mb-8">إعدادات المتجر العامة</h3>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم واتساب الإدارة (لتلقي الطلبات)</label>
                       <input type="tel" defaultValue="201026034170" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المتجر</label>
                       <input type="text" defaultValue="سوق العصر - فاقوس" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                    </div>
                    <button className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl hover:bg-slate-900 transition-all">حفظ كافة الإعدادات 💾</button>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl font-black text-sm transition-all relative ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-lg">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge > 0 && (
      <span className="absolute left-2 top-2 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
    <div className={`text-2xl mb-4 ${color}`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
  </div>
);

export default AdminDashboard;