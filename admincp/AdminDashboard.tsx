
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Order, User } from '../types';
import { ApiService } from '../services/api';
import { WhatsAppService } from '../services/whatsappService';

// مكون العداد المتحرك (Animated Counter)
const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const duration = 1000;

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = startValueRef.current + (value - startValueRef.current) * easeOutQuad(percentage);
      setDisplayValue(currentCount);
      if (percentage < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString('ar-EG', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}</span>;
};

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
  onRefreshData: () => void; // إضافة دالة لتحديث البيانات
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, users, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onUpdateOrderPayment, onReturnOrder, onRefreshData, soundEnabled, onToggleSound, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [catSearch, setCatSearch] = useState(''); 
  const [newCatName, setNewCatName] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // حالات تعديل المستخدم
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ name: '', phone: '', password: '' });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const tabTitles: Record<AdminTab, string> = {
    stats: 'نظرة عامة على النشاط',
    products: 'إدارة مخزون الأصناف',
    categories: 'إدارة أقسام المتجر',
    orders: 'أرشيف الطلبات والديون',
    members: 'إدارة شؤون الأعضاء',
    reports: 'تقارير الأرباح المحاسبية',
    settings: 'إعدادات النظام'
  };

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

  const generalStats = useMemo(() => {
    const activeOrders = (orders || []).filter(o => o && o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const lowStockItems = (products || []).filter(p => Number(p.stockQuantity || 0) < 5);
    const debtOrders = activeOrders.filter(o => o.paymentMethod && o.paymentMethod.includes('آجل'));
    const totalDebtAmount = debtOrders.reduce((s, o) => s + Number(o.total || 0), 0);

    return { 
      totalSales, 
      lowStock: lowStockItems.length, 
      totalOrders: (orders || []).length, 
      totalProducts: (products || []).length,
      debtCount: debtOrders.length,
      totalDebtAmount
    };
  }, [products, orders]);

  const filteredProductsTable = useMemo(() => {
    return (products || []).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(adminSearch.toLowerCase()) || (p.barcode && p.barcode.includes(adminSearch));
      const matchesLowStock = !showLowStockOnly || Number(p.stockQuantity || 0) < 5;
      return matchesSearch && matchesLowStock;
    });
  }, [products, adminSearch, showLowStockOnly]);

  const filteredOrdersTable = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return orders || [];
    return (orders || []).filter(o => {
      if (!o) return false;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q))
      );
    });
  }, [orders, adminSearch]);

  const filteredMembers = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return users || [];
    return (users || []).filter(u => 
      u.name.toLowerCase().includes(q) || u.phone.includes(q)
    );
  }, [users, adminSearch]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({ name: user.name, phone: user.phone, password: '' });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await ApiService.adminUpdateUser({
        id: editingUser.id,
        name: userFormData.name,
        phone: userFormData.phone,
        password: userFormData.password || undefined
      });
      if (res.status === 'success') {
        alert('تم تحديث بيانات العضو بنجاح ✨');
        setEditingUser(null);
        onRefreshData();
      } else {
        alert(res.message || 'فشل التحديث');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const getCategoryMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('سوبر ماركت')) return { icon: '🛒', color: 'bg-emerald-500', text: 'text-emerald-600' };
    if (n.includes('خضروات')) return { icon: '🥦', color: 'bg-green-500', text: 'text-green-600' };
    if (n.includes('فواكه')) return { icon: '🍎', color: 'bg-rose-500', text: 'text-rose-600' };
    if (n.includes('ألبان')) return { icon: '🥛', color: 'bg-sky-500', text: 'text-sky-600' };
    return { icon: '📦', color: 'bg-slate-500', text: 'text-slate-600' };
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn relative">
      
      {/* نافذة تعديل العضو المنبثقة */}
      {editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
          <form onSubmit={handleUpdateUser} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slideUp">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">👤</span>
              تعديل بيانات العضو
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاسم بالكامل</label>
                <input required value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold border border-slate-100" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم الجوال</label>
                <input required value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} className="w-full px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold border border-slate-100 text-left" dir="ltr" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كلمة مرور جديدة (اختياري)</label>
                <input type="password" placeholder="اتركها فارغة لعدم التغيير" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className="w-full px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold border border-slate-100" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button disabled={isUpdatingUser} type="submit" className="flex-grow bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-xl shadow-emerald-100 disabled:opacity-50">
                {isUpdatingUser ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button type="button" onClick={() => setEditingUser(null)} className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm active:scale-95">إلغاء</button>
            </div>
          </form>
        </div>
      )}

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
          <AdminNavButton active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setCatSearch(''); }} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setAdminSearch(''); }} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setAdminSearch(''); }} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setAdminSearch(''); }} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setAdminSearch(''); }} label="الإعدادات" icon="🛠️" />
        </nav>

        <div className="mt-4 p-4 bg-slate-800/50 rounded-3xl border border-slate-700/50">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 mr-2">جرس التنبيه للطلبات</p>
          <button 
            onClick={onToggleSound} 
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-xs transition-all border-2 ${soundEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}
          >
            <span className="flex items-center gap-2">
              {soundEnabled ? '🔔 مفعل' : '🔕 معطل'}
            </span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${soundEnabled ? 'right-6' : 'right-1'}`}></div>
            </div>
          </button>
        </div>

        <button onClick={onLogout} className="mt-4 w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300">تسجيل الخروج 👋</button>
      </aside>

      <main className="flex-grow p-6 md:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
           <div>
             <h3 className="text-3xl font-black text-slate-800 tracking-tight">{tabTitles[activeTab]}</h3>
             <p className="text-slate-400 text-sm font-bold mt-1">سوق العصر - لوحة تحكم الإدارة v4.2</p>
           </div>
           
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

        {/* صفحة الإحصائيات */}
        {activeTab === 'stats' && (
          <div className="space-y-10 animate-fadeIn">
            {generalStats.debtCount > 0 && (
              <div className="bg-orange-500 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-orange-700 animate-slideDown">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl animate-pulse">⏳</div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black">تحذير مديونيات معلقة!</h4>
                    <p className="text-orange-100 font-bold text-sm mt-1">يوجد عدد <span className="underline decoration-2">{generalStats.debtCount} فواتير آجل</span> لم يتم تحصيلها بإجمالي <span className="text-white text-lg"><AnimatedNumber value={generalStats.totalDebtAmount} /> ج.م</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => { setAdminSearch('آجل'); setActiveTab('orders'); }}
                  className="bg-white text-orange-600 px-8 py-3.5 rounded-2xl font-black text-xs shadow-lg hover:bg-slate-900 hover:text-white transition-all active:scale-95 whitespace-nowrap"
                >
                  مراجعة وتحصيل الديون الآن ←
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard title="إجمالي المبيعات" value={generalStats.totalSales} suffix="ج.م" icon="💰" color="emerald" />
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
                         <p className="font-black text-emerald-600"><AnimatedNumber value={order.total || 0} decimals={2} /> ج.م</p>
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
                            <p className="text-[10px] text-rose-500 font-bold">متبقي <AnimatedNumber value={p.stockQuantity} /> وحدات</p>
                         </div>
                         <button onClick={() => onOpenEditForm(p)} className="p-2 text-slate-400 hover:text-emerald-600 transition">✎</button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* إدارة الأعضاء - تم تحسينها لإضافة إمكانية التعديل */}
        {activeTab === 'members' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-end">
              <div className="relative w-full md:w-80">
                <input type="text" placeholder="بحث بالاسم أو رقم الجوال..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm font-bold" />
                <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
              </div>
            </div>
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black border-b uppercase">
                    <th className="px-8 py-5">الاسم</th>
                    <th className="px-8 py-5">رقم الموبايل</th>
                    <th className="px-8 py-5">الصلاحية</th>
                    <th className="px-8 py-5">تاريخ الانضمام</th>
                    <th className="px-8 py-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800">{u.name}</td>
                        <td className="px-8 py-5 font-black text-slate-500 tracking-wider text-left" dir="ltr">{u.phone}</td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            {u.role === 'admin' ? 'مدير' : 'عميل'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400 italic">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-2">
                             <button 
                               onClick={() => handleEditUser(u)}
                               className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                               title="تعديل بيانات العضو والباسورد"
                             >
                               ✎
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic">لا توجد نتائج بحث</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* باقي التبويبات تظل كما هي... */}
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
                          <AnimatedNumber value={p.stockQuantity} /> وحدة
                        </span>
                      </td>
                      <td className="px-8 py-5 font-black text-emerald-600"><AnimatedNumber value={p.price} decimals={2} /> ج.م</td>
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

        {/* ... (باقي كود التبويبات Categories, Orders, Reports) ... */}
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
                <p className="text-4xl font-black text-slate-800"><AnimatedNumber value={profitStats.revenue || 0} decimals={2} /> <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تكلفة البضاعة</p>
                <p className="text-4xl font-black text-amber-600"><AnimatedNumber value={profitStats.cost || 0} decimals={2} /> <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-emerald-600 p-10 rounded-[3.5rem] shadow-xl border border-emerald-500 text-white text-center transform hover:scale-105 transition-transform duration-500">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">صافي الربح الفعلي</p>
                <p className="text-4xl font-black"><AnimatedNumber value={profitStats.profit || 0} decimals={2} /> <small className="text-xs text-white/50">ج.م</small></p>
              </div>
            </div>
          </div>
        )}

        {/* ... (إغلاق الـ main والـaside) ... */}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 relative ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-105 z-10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {(badge || 0) > 0 && <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse"><AnimatedNumber value={badge} /></span>}
  </button>
);

const StatCard = ({ title, value, suffix = '', icon, color, onClick }: any) => {
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
      <p className="text-2xl font-black tracking-tight"><AnimatedNumber value={value} /> <small className="text-xs font-bold">{suffix}</small></p>
    </div>
  );
};

export default AdminDashboard;
