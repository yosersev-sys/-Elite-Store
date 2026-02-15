
import React, { useState, useMemo } from 'react';
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
  onReturnOrder: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, users, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onUpdateOrderPayment, onReturnOrder, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // نصوص العناوين حسب التبويب
  const tabTitles: Record<AdminTab, string> = {
    stats: 'نظرة عامة على النشاط',
    products: 'إدارة مخزون الأصناف',
    categories: 'إدارة أقسام المتجر',
    orders: 'أرشيف الطلبات والديون',
    members: 'إدارة شؤون الأعضاء',
    reports: 'تقارير الأرباح المحاسبية',
    settings: 'إعدادات النظام'
  };

  // حساب الأرباح (FIFO)
  const profitStats = useMemo(() => {
    try {
      const start = new Date(reportStart).setHours(0, 0, 0, 0);
      const end = new Date(reportEnd).setHours(23, 59, 59, 999);
      const periodOrders = (orders || []).filter(o => {
        if (!o || !o.createdAt) return false;
        const d = Number(o.createdAt);
        return d >= start && d <= end && o.status !== 'cancelled';
      });
      let revenue = 0;
      let cost = 0;
      periodOrders.forEach(order => {
        revenue += Number(order.total || 0);
        (order.items || []).forEach(item => {
          cost += (Number(item.actualWholesalePrice) || Number(item.wholesalePrice) || 0) * (Number(item.quantity) || 0);
        });
      });
      return { revenue, cost, profit: revenue - cost };
    } catch (e) {
      return { revenue: 0, cost: 0, profit: 0 };
    }
  }, [orders, reportStart, reportEnd]);

  // إحصائيات عامة
  const generalStats = useMemo(() => {
    const activeOrders = (orders || []).filter(o => o && o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const lowStockItems = (products || []).filter(p => Number(p.stockQuantity || 0) < 5);
    return { totalSales, lowStock: lowStockItems.length, totalOrders: (orders || []).length, totalProducts: (products || []).length };
  }, [products, orders]);

  // تصفية المنتجات
  const filteredProductsTable = useMemo(() => {
    return (products || []).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(adminSearch.toLowerCase()) || (p.barcode && p.barcode.includes(adminSearch));
      const matchesLowStock = !showLowStockOnly || Number(p.stockQuantity || 0) < 5;
      return matchesSearch && matchesLowStock;
    });
  }, [products, adminSearch, showLowStockOnly]);

  // تصفية الطلبات
  const filteredOrdersTable = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return orders || [];
    return (orders || []).filter(o => {
      if (!o) return false;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q))
      );
    });
  }, [orders, adminSearch]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-8 md:p-10 flex flex-col shrink-0">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">لوحة الإدارة</h2>
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">سوق العصر - فاقوس</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setAdminSearch(''); }} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setShowLowStockOnly(false); setAdminSearch(''); }} label="المخزن" icon="📦" badge={generalStats.lowStock > 0 ? generalStats.lowStock : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setAdminSearch(''); }} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setAdminSearch(''); }} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setAdminSearch(''); }} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setAdminSearch(''); }} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setAdminSearch(''); }} label="الإعدادات" icon="🛠️" />
        </nav>

        <button onClick={onLogout} className="mt-8 w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300">تسجيل الخروج 👋</button>
      </aside>

      <main className="flex-grow p-6 md:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* رأس موحد يظهر في كل الصفحات */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
           <div>
             <h3 className="text-3xl font-black text-slate-800 tracking-tight">{tabTitles[activeTab]}</h3>
             <p className="text-slate-400 text-sm font-bold mt-1">سوق العصر - لوحة تحكم الإدارة v4.2</p>
           </div>
           
           {/* أزرار العمليات السريعة - تظهر في كل الصفحات */}
           <div className="flex gap-3 w-full md:w-auto">
             <button 
               onClick={onOpenInvoiceForm} 
               className="flex-grow md:flex-initial bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <span>🧾</span>
               + فاتورة سريعة
             </button>
             <button 
               onClick={onOpenAddForm} 
               className="flex-grow md:flex-initial bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <span>📦</span>
               + إضافة صنف
             </button>
           </div>
        </div>

        {/* محتوى التبويبات */}
        
        {/* صفحة الإحصائيات */}
        {activeTab === 'stats' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard title="إجمالي المبيعات" value={`${generalStats.totalSales.toLocaleString()} ج.م`} icon="💰" color="emerald" />
               <StatCard title="إجمالي الطلبات" value={generalStats.totalOrders} icon="🧾" color="indigo" onClick={() => setActiveTab('orders')} />
               <StatCard title="نواقص المخزن" value={generalStats.lowStock} icon="⚠️" color="rose" onClick={() => { setActiveTab('products'); setShowLowStockOnly(true); }} />
               <StatCard title="أصناف المتجر" value={generalStats.totalProducts} icon="📦" color="amber" onClick={() => { setActiveTab('products'); setShowLowStockOnly(false); }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-xl text-slate-800">أحدث الطلبات</h4>
                    <button onClick={() => setActiveTab('orders')} className="text-[10px] text-emerald-600 font-black px-4 py-2 bg-emerald-50 rounded-full">عرض الكل ←</button>
                  </div>
                  <div className="space-y-4">
                    {(orders || []).slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-emerald-50 transition-colors">
                         <div>
                            <p className="font-black text-sm text-slate-700">#{order.id} - {order.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                         </div>
                         <p className="font-black text-emerald-600">{(order.total || 0).toLocaleString()} ج.م</p>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-xl text-slate-800">نواقص تحتاج توريد</h4>
                    <button onClick={() => { setActiveTab('products'); setShowLowStockOnly(true); }} className="text-[10px] text-rose-500 font-black px-4 py-2 bg-rose-50 rounded-full">عرض النواقص ←</button>
                  </div>
                  <div className="space-y-4">
                    {(products || []).filter(p => Number(p.stockQuantity || 0) < 5).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-4 p-5 bg-rose-50/30 rounded-[1.5rem] border border-rose-100/50">
                         <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                         <div className="flex-grow">
                            <p className="font-black text-sm text-slate-700">{p.name}</p>
                            <p className="text-[10px] text-rose-500 font-bold">متبقي {p.stockQuantity} وحدات</p>
                         </div>
                         <button onClick={() => onOpenEditForm(p)} className="p-2 text-slate-400 hover:text-emerald-600 transition">✎</button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* إدارة المخزن */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">
              <div className="relative w-full md:w-72">
                <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm" />
                <span className="absolute left-4 top-3 text-slate-300">🔍</span>
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-8 py-5">المنتج</th>
                    <th className="px-8 py-5">المخزون</th>
                    <th className="px-8 py-5">السعر</th>
                    <th className="px-8 py-5">دفعات FIFO</th>
                    <th className="px-8 py-5">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProductsTable.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-10 h-10 rounded-xl object-cover" />
                          <p className="font-bold text-slate-700">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`font-black px-3 py-1 rounded-full text-xs ${Number(p.stockQuantity || 0) < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                          {p.stockQuantity} وحدة
                        </span>
                      </td>
                      <td className="px-8 py-5 font-black text-emerald-600">{p.price} ج.م</td>
                      <td className="px-8 py-5">
                         <div className="flex flex-wrap gap-1 max-w-[150px]">
                           {(p.batches || []).filter(b => b.quantity > 0).map((b, i) => (
                             <span key={i} className="text-[8px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                               {b.quantity} @ {b.wholesalePrice}
                             </span>
                           ))}
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-blue-50 rounded-xl">✎</button>
                          <button onClick={() => { if(confirm('هل أنت متأكد من حذف المنتج نهائياً؟')) onDeleteProduct(p.id) }} className="p-2 text-rose-500 bg-rose-50 rounded-xl">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* إدارة الطلبات */}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  placeholder="بحث برقم الطلب، الاسم، أو الهاتف..." 
                  value={adminSearch} 
                  onChange={e => setAdminSearch(e.target.value)} 
                  className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm font-bold" 
                />
                <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-8 py-5">الطلب والعميل</th>
                    <th className="px-8 py-5">الإجمالي</th>
                    <th className="px-8 py-5">حالة الدفع</th>
                    <th className="px-8 py-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrdersTable.length > 0 ? (
                    filteredOrdersTable.map(o => {
                      if (!o) return null;
                      const isCancelled = o.status === 'cancelled';
                      const paymentMethod = o.paymentMethod || 'نقدي';
                      const isDebt = paymentMethod.includes('آجل');
                      
                      return (
                        <tr key={o.id} className={`hover:bg-slate-50 transition-colors ${isCancelled ? 'opacity-40 grayscale' : ''}`}>
                          <td className="px-8 py-5">
                            <div>
                              <p className="font-black text-slate-700">#{o.id} - {o.customerName || 'عميل مجهول'}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">
                                {o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : 'تاريخ غير معروف'}
                                {o.phone ? ` • ${o.phone}` : ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-black text-emerald-600 text-lg">{(o.total || 0).toLocaleString()} ج.م</td>
                          <td className="px-8 py-5">
                            {!isCancelled ? (
                              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border w-fit">
                                <button 
                                  onClick={() => onUpdateOrderPayment(o.id, 'نقدي (تم الدفع)')}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${!isDebt ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                                >نقدي 💰</button>
                                <button 
                                  onClick={() => onUpdateOrderPayment(o.id, 'آجل (مديونية)')}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${isDebt ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                                >آجل ⏳</button>
                              </div>
                            ) : (
                              <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">مسترجع ↩️</span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2">
                               <button onClick={() => onViewOrder(o)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="عرض الفاتورة">🧾</button>
                               
                               {isDebt && !isCancelled && (
                                 <button 
                                   onClick={() => WhatsAppService.sendDebtReminderToCustomer(o)}
                                   className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                   title="تذكير واتساب"
                                 >📢</button>
                               )}

                               {!isCancelled && (
                                 <button 
                                   onClick={() => onReturnOrder(o.id)}
                                   className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                   title="استرداد الفاتورة"
                                 >↩️</button>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">لا توجد نتائج بحث تطابق استعلامك</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* إدارة الأقسام */}
        {activeTab === 'categories' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 max-w-2xl">
              <h3 className="font-black mb-6 text-slate-800 text-xl">إضافة قسم تجاري جديد</h3>
              <div className="flex gap-4">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="مثال: بقالة جافة..." className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" />
                <button onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }} className="bg-emerald-600 text-white px-10 rounded-2xl font-black text-xs">إضافة</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(categories || []).map(cat => (
                <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold" />
                      <button onClick={() => { onUpdateCategory({id: cat.id, name: editingCatName}); setEditingCatId(null); }} className="p-2 bg-emerald-600 text-white rounded-xl">✓</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800 text-lg">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">الأصناف: {(products || []).filter(p => p.categoryId === cat.id).length}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-2 text-blue-400 bg-blue-50 rounded-xl">✎</button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-rose-400 bg-rose-50 rounded-xl">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* إدارة المستخدمين */}
        {activeTab === 'members' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black border-b">
                    <th className="px-8 py-5">الاسم</th>
                    <th className="px-8 py-5">رقم الموبايل</th>
                    <th className="px-8 py-5">الصلاحية</th>
                    <th className="px-8 py-5">تاريخ الانضمام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(users || []).map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                      <td className="px-8 py-5 font-black text-slate-500 tracking-wider">{u.phone}</td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          {u.role === 'admin' ? 'مدير' : 'عميل'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-400 italic">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* التقارير والأرباح */}
        {activeTab === 'reports' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="font-black text-slate-800 text-xl mb-8">فلترة النتائج المالية</h3>
               <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-grow space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">من تاريخ</label>
                    <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="w-full bg-slate-50 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm border-2 border-transparent focus:border-emerald-400 transition-all" />
                  </div>
                  <div className="flex-grow space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">إلى تاريخ</label>
                    <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="w-full bg-slate-50 rounded-[1.5rem] px-8 py-5 outline-none font-black text-sm border-2 border-transparent focus:border-emerald-400 transition-all" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي المبيعات</p>
                <p className="text-4xl font-black text-slate-800">{(profitStats.revenue || 0).toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تكلفة البضاعة</p>
                <p className="text-4xl font-black text-amber-600">{(profitStats.cost || 0).toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-emerald-600 p-10 rounded-[3.5rem] shadow-xl border border-emerald-500 text-white text-center transform hover:scale-105 transition-transform duration-500">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">صافي الربح الفعلي</p>
                <p className="text-4xl font-black">{(profitStats.profit || 0).toLocaleString()} <small className="text-xs text-white/50">ج.م</small></p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 relative ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-105 z-10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {(badge || 0) > 0 && <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon, color, onClick }: any) => {
  const themes: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-900/5',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-900/5',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-900/5',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-900/5'
  };
  return (
    <div 
      onClick={onClick}
      className={`p-8 md:p-10 rounded-[3rem] border shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl ${themes[color]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="text-4xl group-hover:rotate-12 transition-transform duration-500">{icon}</div>
        <div className="w-2 h-10 bg-current/10 rounded-full"></div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
};

export default AdminDashboard;
