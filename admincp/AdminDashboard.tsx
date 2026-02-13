import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const [memberSearch, setMemberSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all');
  const itemsPerPage = 10;
  
  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'delayed'>('all');

  // فلتر التقارير المطور
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  // إدارة الأقسام
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({
    id: '', name: '', image: '', isActive: true, sortOrder: 0
  });

  // إدارة استرداد الطلبات
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // إحصائيات الأعضاء وتعديلهم
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [memberFormData, setMemberFormData] = useState({ id: '', name: '', phone: '', password: '' });
  const [isSavingMember, setIsSavingMember] = useState(false);

  // إعدادات الملف الشخصي للمدير
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    password: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // حسابات الأرباح المتطورة
  const profitAnalysis = useMemo(() => {
    const start = new Date(reportStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportEnd);
    end.setHours(23, 59, 59, 999);

    const periodOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end && o.status !== 'cancelled';
    });

    let totalRevenue = 0;
    let totalWholesale = 0;
    let totalItemsSold = 0;
    const dailyData: Record<string, { revenue: number, profit: number }> = {};
    const categoryStats: Record<string, { revenue: number, profit: number }> = {};
    const productStats: Record<string, { name: string, qty: number, profit: number, img?: string }> = {};

    periodOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toLocaleDateString('en-CA');
      if (!dailyData[dateKey]) dailyData[dateKey] = { revenue: 0, profit: 0 };

      order.items.forEach(item => {
        const itemRevenue = (item.price || 0) * (item.quantity || 0);
        const itemWholesale = (item.wholesalePrice || 0) * (item.quantity || 0);
        const itemProfit = itemRevenue - itemWholesale;

        totalRevenue += itemRevenue;
        totalWholesale += itemWholesale;
        totalItemsSold += (Number(item.quantity) || 0);

        dailyData[dateKey].revenue += itemRevenue;
        dailyData[dateKey].profit += itemProfit;

        const catName = categories.find(c => c.id === item.categoryId)?.name || 'أخرى';
        if (!categoryStats[catName]) categoryStats[catName] = { revenue: 0, profit: 0 };
        categoryStats[catName].revenue += itemRevenue;
        categoryStats[catName].profit += itemProfit;

        if (!productStats[item.id]) productStats[item.id] = { name: item.name, qty: 0, profit: 0, img: item.images?.[0] };
        productStats[item.id].qty += (Number(item.quantity) || 0);
        productStats[item.id].profit += itemProfit;
      });
    });

    return {
      revenue: totalRevenue,
      wholesale: totalWholesale,
      profit: totalRevenue - totalWholesale,
      orderCount: periodOrders.length,
      itemsSold: totalItemsSold,
      avgOrderValue: periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0,
      margin: totalRevenue > 0 ? ((totalRevenue - totalWholesale) / totalRevenue) * 100 : 0,
      dailyChart: Object.entries(dailyData).sort((a, b) => a[0].localeCompare(b[0])),
      categoryBreakdown: Object.entries(categoryStats).sort((a, b) => b[1].profit - a[1].profit),
      topProducts: Object.values(productStats).sort((a, b) => b.profit - a.profit).slice(0, 5),
      recentTransactions: periodOrders.slice(0, 10)
    };
  }, [orders, reportStart, reportEnd, categories]);

  // فلترة المنتجات
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
                           (p.barcode && p.barcode.includes(adminSearch));
      const matchesStock = stockFilter === 'all' || (p.stockQuantity < 5 && p.stockQuantity >= 0);
      return matchesSearch && matchesStock;
    });
  }, [products, adminSearch, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // فلترة الطلبات
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = orderSearch.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.phone && order.phone.includes(searchLower));

      const paymentMethod = order.paymentMethod || '';
      const matchesPayment = 
        paymentFilter === 'all' || 
        (paymentFilter === 'cash' && paymentMethod.includes('نقدي')) ||
        (paymentFilter === 'delayed' && paymentMethod.includes('آجل'));

      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (orderDate > end) matchesDate = false;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [orders, orderSearch, paymentFilter, startDate, endDate]);

  // فلترة الأعضاء
  const filteredUsersList = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
      u.phone.includes(memberSearch)
    ).map(u => {
      const userOrders = orders.filter(o => o.userId === u.id || o.phone === u.phone);
      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return { ...u, orderCount: userOrders.length, totalSpent: totalSpent };
    });
  }, [users, memberSearch, orders]);

  // إحصائيات عامة
  const globalStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const criticalCount = products.filter(p => p.stockQuantity < 5 && p.stockQuantity >= 0).length;
    const delayedOrders = activeOrders.filter(o => (o.paymentMethod || '').includes('آجل'));
    const delayedAmount = delayedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    return {
      revenue: totalRevenue.toLocaleString(),
      salesCount: activeOrders.length,
      productCount: products.length,
      criticalCount,
      delayedAmount: delayedAmount.toLocaleString(),
      delayedCount: delayedOrders.length,
      userCount: users.length
    };
  }, [products, orders, users]);

  // دوال المعالجة
  const handleReturnOrder = async (orderId: string) => {
    if (isProcessingReturn) return;
    if (!confirm('هل أنت متأكد من استرداد هذه الفاتورة؟ سيتم إعادة الكميات للمخزن وخصم المبيعات من الإحصائيات.')) return;
    setIsProcessingReturn(true);
    try {
      const res = await ApiService.returnOrder(orderId);
      if (res && res.status === 'success') { 
        alert('تم استرداد الفاتورة بنجاح ✅'); 
        window.location.reload(); 
      }
    } finally { setIsProcessingReturn(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await ApiService.updateProfile(profileData);
      if (res.status === 'success') {
        alert('تم التحديث بنجاح. سيتم تسجيل الخروج للأمان.');
        onLogout();
      } else alert(res.message || 'خطأ في التحديث');
    } finally { setIsUpdatingProfile(false); }
  };

  const handleSaveCategory = () => {
    if (!catFormData.name.trim()) return alert('يرجى إدخال اسم القسم');
    const existing = categories.find(c => c.id === catFormData.id);
    if (existing) onUpdateCategory(catFormData);
    else onAddCategory(catFormData);
    setIsEditingCategory(false);
  };

  const setQuickDate = (range: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    if (range === 'yesterday') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); }
    else if (range === 'week') { start.setDate(now.getDate() - 7); }
    else if (range === 'month') { start.setDate(1); }
    setReportStart(start.toISOString().split('T')[0]);
    setReportEnd(end.toISOString().split('T')[0]);
  };

  const resetOrderFilters = () => {
    setOrderSearch('');
    setStartDate('');
    setEndDate('');
    setPaymentFilter('all');
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* القائمة الجانبية (يمين) */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-10">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> الإدارة
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1">سوق العصر - لوحة التحكم</p>
        </div>

        {/* زر فاتورة الكاشير المدمج */}
        <button 
          onClick={onOpenInvoiceForm}
          className="w-full mb-8 flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95 group"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">📄</span>
          <span>فاتورة كاشير</span>
        </button>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setStockFilter('all'); }} label="المخزون" icon="📦" badge={globalStats.criticalCount > 0 ? globalStats.criticalCount : undefined} badgeColor="bg-rose-500" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="الأعضاء" icon="👥" badge={users.length} badgeColor="bg-blue-500" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="👤" />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
           <button onClick={onToggleSound} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
             {soundEnabled ? '🔔 منبه مفعل' : '🔕 منبه صامت'}
           </button>
           <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 hover:text-white font-bold text-sm transition text-center">المتجر 🏪</button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* التبويب: الرئيسية */}
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard title="إجمالي الدخل" value={`${globalStats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
              <StatCard title="عدد الطلبات" value={globalStats.salesCount} icon="🛒" color="text-blue-600" onClick={() => setActiveTab('orders')} />
              <StatCard title="إجمالي الآجل" value={`${globalStats.delayedAmount} ج.م`} icon="⏳" color="text-orange-600" highlight={globalStats.delayedCount > 0} onClick={() => { setActiveTab('orders'); setPaymentFilter('delayed'); }} />
              <StatCard title="نقص مخزون" value={globalStats.criticalCount} icon="🚨" color="text-rose-600" highlight={globalStats.criticalCount > 0} onClick={() => { setActiveTab('products'); setStockFilter('critical'); }} />
              <StatCard title="إجمالي الأعضاء" value={globalStats.userCount} icon="👥" color="text-indigo-600" onClick={() => setActiveTab('members')} />
            </div>
          </div>
        )}

        {/* التبويب: المخزون */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full md:w-80 px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm" />
              <button onClick={onOpenAddForm} className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition">+ إضافة منتج جديد</button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b"><th className="px-8 py-6">المنتج</th><th className="px-8 py-6">السعر</th><th className="px-8 py-6">المخزون</th><th className="px-8 py-6">الإجراء</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 flex items-center gap-4"><img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" /><div><p className="font-black text-sm">{p.name}</p><p className="text-[9px] text-slate-400">{p.barcode || 'بدون كود'}</p></div></td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                      <td className={`px-8 py-4 font-black text-sm ${p.stockQuantity < 5 ? 'text-rose-500' : 'text-slate-700'}`}>{p.stockQuantity} وحدة</td>
                      <td className="px-8 py-4 flex gap-2"><button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-white shadow-sm rounded-xl">✎</button><button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 bg-white shadow-sm rounded-xl">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-400">
                 <span>صفحة {currentPage} من {totalPages || 1}</span>
                 <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c-1)} className="px-3 py-1 bg-white border rounded-lg hover:bg-slate-100 disabled:opacity-30">السابق</button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c+1)} className="px-3 py-1 bg-white border rounded-lg hover:bg-slate-100 disabled:opacity-30">التالي</button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* التبويب: الأرباح (التقرير المطور) */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">تقرير الأداء المالي</h3>
                  <p className="text-slate-400 font-bold text-sm">تحليل الأرباح للفترة المحددة</p>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex gap-1">
                    <button onClick={() => setQuickDate('today')} className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black hover:bg-emerald-50 transition">اليوم</button>
                    <button onClick={() => setQuickDate('week')} className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black hover:bg-emerald-50 transition">7 أيام</button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs text-slate-700" />
                    <span className="text-slate-300">←</span>
                    <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="bg-transparent border-none outline-none font-black text-xs text-slate-700" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <ReportStatCard label="صافي الربح" value={profitAnalysis.profit.toLocaleString()} subValue={`هامش ${profitAnalysis.margin.toFixed(1)}%`} icon="✨" color="bg-emerald-600" textColor="text-white" />
               <ReportStatCard label="إجمالي المبيعات" value={profitAnalysis.revenue.toLocaleString()} subValue={`${profitAnalysis.orderCount} طلب`} icon="💰" color="bg-white" />
               <ReportStatCard label="متوسط الطلب" value={profitAnalysis.avgOrderValue.toFixed(0)} subValue="ج.م لكل عملية" icon="📈" color="bg-white" />
               <ReportStatCard label="وحدات مباعة" value={profitAnalysis.itemsSold.toLocaleString()} subValue="قطعة/كيلو" icon="📦" color="bg-white" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">أرباح الأقسام</h4>
                  <div className="space-y-4">
                     {profitAnalysis.categoryBreakdown.map(([name, data]) => (
                       <div key={name} className="space-y-1.5">
                          <div className="flex justify-between font-black text-[11px]">
                             <span className="text-slate-600">{name}</span>
                             <span className="text-emerald-600">{data.profit.toLocaleString()} ج.م</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.profit / (profitAnalysis.profit || 1)) * 100}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                  <h4 className="font-black mb-6 text-emerald-400">المنتجات الأكثر ربحية</h4>
                  <div className="space-y-4">
                     {profitAnalysis.topProducts.map((p, idx) => (
                       <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                          <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0">
                             {p.img ? <img src={p.img} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-700" />}
                          </div>
                          <div className="flex-grow min-w-0">
                             <p className="font-black text-xs truncate">{p.name}</p>
                             <p className="text-[9px] text-emerald-400 font-bold">{p.profit.toLocaleString()} ج.م ربح</p>
                          </div>
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg">{p.qty} بيع</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* التبويب: الطلبات */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">بحث</label><input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-bold text-xs" placeholder="رقم، اسم، هاتف..." /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">من</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-bold text-xs" /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">إلى</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-bold text-xs" /></div>
               <button onClick={resetOrderFilters} className="bg-slate-100 p-2.5 rounded-xl font-black text-xs hover:bg-rose-50 hover:text-rose-500 transition">مسح الفلاتر ✕</button>
            </div>
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border-r-8 ${order.status === 'cancelled' ? 'border-r-slate-300 opacity-60' : (order.paymentMethod?.includes('آجل') ? 'border-r-orange-500' : 'border-r-emerald-500')}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">📦</div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">طلب #{order.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{order.customerName} • {order.phone}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">المبلغ</p>
                    <p className="font-black text-lg text-emerald-600">{(Number(order.total) || 0).toFixed(2)} ج.م</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onViewOrder(order)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] hover:bg-emerald-600 transition">الفاتورة</button>
                    {order.status !== 'cancelled' && (
                      <button onClick={() => handleReturnOrder(order.id)} className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition">استرداد</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب: الأقسام */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-800">إدارة الأقسام</h3>
               {!isEditingCategory && <button onClick={() => { setCatFormData({id: 'cat_'+Date.now(), name: '', isActive: true, sortOrder: categories.length}); setIsEditingCategory(true); }} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ إضافة قسم</button>}
            </div>
            {isEditingCategory ? (
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-emerald-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2">الاسم</label><input value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2">الترتيب</label><input type="number" value={catFormData.sortOrder} onChange={e => setCatFormData({...catFormData, sortOrder: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold" /></div>
                </div>
                <div className="flex gap-3"><button onClick={handleSaveCategory} className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-emerald-600 transition">حفظ 💾</button><button onClick={() => setIsEditingCategory(false)} className="bg-slate-100 px-10 py-4 rounded-2xl font-black">إلغاء</button></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center group hover:border-emerald-300 transition-all">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">🏷️</div>
                    <h5 className="font-black text-slate-800">{cat.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">المنتجات: {products.filter(p => p.categoryId === cat.id).length}</p>
                    <div className="flex gap-2 mt-4 w-full pt-4 border-t border-slate-50">
                      <button onClick={() => { setCatFormData(cat); setIsEditingCategory(true); }} className="flex-grow bg-blue-50 text-blue-600 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition">تعديل</button>
                      <button onClick={() => onDeleteCategory(cat.id)} className="flex-grow bg-rose-50 text-rose-500 py-2 rounded-xl text-[10px] font-black hover:bg-rose-500 hover:text-white transition">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* التبويب: الأعضاء */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
               <input type="text" placeholder="ابحث عن عضو بالاسم أو الهاتف..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <table className="w-full text-right">
                  <thead><tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b"><th className="px-8 py-5">العضو</th><th className="px-8 py-5">الهاتف</th><th className="px-8 py-5 text-center">المشتريات</th><th className="px-8 py-5 text-center">الإجراء</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="px-8 py-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">{u.name[0].toUpperCase()}</div><div><p className="font-black text-sm">{u.name}</p>{u.role === 'admin' && <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded-md">مدير</span>}</div></td>
                        <td className="px-8 py-4 font-bold text-slate-600 text-sm" dir="ltr">{u.phone}</td>
                        <td className="px-8 py-4 text-center font-black text-emerald-600 text-sm">{u.totalSpent.toLocaleString()} <small className="text-[10px]">ج.م</small></td>
                        <td className="px-8 py-4 text-center"><button onClick={() => window.open(`https://wa.me/2${u.phone}`, '_blank')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition">💬</button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* التبويب: الإعدادات */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto py-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-emerald-100">
               <h3 className="text-xl font-black text-slate-800 mb-8 border-b pb-4">إعدادات الحساب</h3>
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الاسم الكامل</label><input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">رقم الجوال</label><input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-left" dir="ltr" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">كلمة مرور جديدة (English Only)</label><input type="password" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value.replace(/[\u0600-\u06FF]/g, '')})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold" placeholder="••••••••" /></div>
                  <button disabled={isUpdatingProfile} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-600 transition shadow-lg disabled:opacity-50">{isUpdatingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات ✨'}</button>
               </form>
               <div className="mt-10 pt-6 border-t border-slate-50 text-center"><button onClick={onLogout} className="text-rose-500 font-black text-sm hover:bg-rose-50 px-8 py-2 rounded-xl transition">تسجيل الخروج 👋</button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// مكونات فرعية
const ReportStatCard = ({ label, value, subValue, icon, color, textColor = "text-slate-800" }: any) => (
  <div className={`${color} ${color === 'bg-white' ? 'border border-slate-100 shadow-sm' : 'shadow-xl'} p-8 rounded-[3rem] transition-all hover:-translate-y-1 relative overflow-hidden group`}>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6 ${color === 'bg-white' ? 'bg-slate-50' : 'bg-white/20'}`}>{icon}</div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'bg-white' ? 'text-slate-400' : 'text-white/70'}`}>{label}</p>
      <p className={`text-3xl font-black mb-1 ${textColor}`}>{value} <small className="text-[10px] font-bold">ج.م</small></p>
      <p className={`text-[9px] font-bold ${color === 'bg-white' ? 'text-emerald-500' : 'text-white/60'}`}>{subValue}</p>
    </div>
    {color !== 'bg-white' && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>}
  </div>
);

const AdminNavButton = ({ active, onClick, label, icon, badge, badgeColor = "bg-red-500" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span>{badge !== undefined && <span className={`${badgeColor} text-white text-[9px] px-2.5 py-1 rounded-full border-2 border-slate-900`}>{badge}</span>}</button>
);

const StatCard = ({ title, value, icon, color, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all hover:shadow-md group ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${highlight ? 'border-orange-200 bg-orange-50/20' : 'border-slate-50'}`}>
    <div className={`${color} text-4xl mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase mr-1">{title}</p>
    <p className={`text-2xl font-black ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default AdminDashboard;