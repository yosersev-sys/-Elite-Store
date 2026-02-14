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

  // نافذة التأكيد المخصصة
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({ show: false, title: '', message: '', action: () => {}, type: 'info' });

  const showConfirm = (title: string, message: string, action: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({ show: true, title, message, action, type });
  };

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, show: false }));

  // فلتر التقارير
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({ id: '', name: '', image: '', isActive: true, sortOrder: 0 });

  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [memberFormData, setMemberFormData] = useState({ id: '', name: '', phone: '', password: '' });
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [profileData, setProfileData] = useState({ name: currentUser?.name || '', phone: currentUser?.phone || '', password: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPass, setShowPass] = useState(false);

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = orderSearch.toLowerCase();
      const matchesSearch = order.id.toLowerCase().includes(searchLower) || (order.customerName?.toLowerCase().includes(searchLower)) || (order.phone?.includes(searchLower));
      const isDelayed = (order.paymentMethod || '').includes('آجل');
      const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'cash' && !isDelayed) || (paymentFilter === 'delayed' && isDelayed);
      
      let matchesDate = true;
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0,0,0,0);
      if (startDate) { const start = new Date(startDate); start.setHours(0,0,0,0); if (orderDate < start) matchesDate = false; }
      if (endDate) { const end = new Date(endDate); end.setHours(0,0,0,0); if (orderDate > end) matchesDate = false; }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [orders, orderSearch, paymentFilter, startDate, endDate]);

  const profitStats = useMemo(() => {
    const start = new Date(reportStart); start.setHours(0,0,0,0);
    const end = new Date(reportEnd); end.setHours(23,59,59,999);
    const periodOrders = orders.filter(o => { const d = new Date(o.createdAt); return d >= start && d <= end && o.status !== 'cancelled'; });
    let totalRevenue = 0, totalWholesale = 0;
    const categoryBreakdown: Record<string, { revenue: number, profit: number }> = {};
    const productPerformance: Record<string, { name: string, qty: number, profit: number }> = {};

    periodOrders.forEach(order => {
      order.items.forEach(item => {
        const itemRevenue = item.price * item.quantity;
        const itemWholesale = (item.wholesalePrice || 0) * item.quantity;
        const itemProfit = itemRevenue - itemWholesale;
        totalRevenue += itemRevenue; totalWholesale += itemWholesale;
        const catName = categories.find(c => c.id === item.categoryId)?.name || 'أخرى';
        if (!categoryBreakdown[catName]) categoryBreakdown[catName] = { revenue: 0, profit: 0 };
        categoryBreakdown[catName].revenue += itemRevenue; categoryBreakdown[catName].profit += itemProfit;
        if (!productPerformance[item.id]) productPerformance[item.id] = { name: item.name, qty: 0, profit: 0 };
        productPerformance[item.id].qty += item.quantity; productPerformance[item.id].profit += itemProfit;
      });
    });
    return { revenue: totalRevenue, wholesale: totalWholesale, profit: totalRevenue - totalWholesale, orderCount: periodOrders.length, categoryBreakdown: Object.entries(categoryBreakdown).sort((a,b) => b[1].profit - a[1].profit), topProducts: Object.values(productPerformance).sort((a,b) => b.profit - a.profit).slice(0, 5) };
  }, [orders, reportStart, reportEnd, categories]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const delayedOrders = activeOrders.filter(o => (o.paymentMethod || '').includes('آجل'));
    const criticalCount = products.filter(p => p.stockQuantity < 5).length;
    return { revenue: totalRevenue.toLocaleString(), salesCount: activeOrders.length, productCount: products.length, criticalCount, delayedAmount: delayedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toLocaleString(), delayedCount: delayedOrders.length, userCount: users.length };
  }, [products, orders, users]);

  const handleAdminUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSavingMember(true);
    try {
      const res = await ApiService.adminUpdateUser(memberFormData);
      if (res?.status === 'success') { alert('تم التحديث ✨'); setEditingMember(null); window.location.reload(); }
      else { alert(res?.message || 'خطأ'); }
    } catch { alert('خطأ اتصال'); } finally { setIsSavingMember(false); }
  };

  const handleReturnOrder = async (orderId: string) => {
    showConfirm('تأكيد الاسترداد', 'سيتم إعادة الأصناف للمخزن وخصم المبيعات من التقارير. هل أنت متأكد؟', async () => {
      try {
        const res = await ApiService.returnOrder(orderId);
        if (res?.status === 'success') { alert('تم الاسترداد ✅'); window.location.reload(); }
      } catch { alert('فشل الاتصال'); }
    });
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* Confirmation Modal Overlay */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={closeConfirm}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
              {confirmModal.type === 'danger' ? '⚠️' : '🔔'}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => { confirmModal.action(); closeConfirm(); }} className={`flex-grow py-4 rounded-2xl font-black text-sm text-white transition shadow-lg active:scale-95 ${confirmModal.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'}`}>تأكيد</button>
              <button onClick={closeConfirm} className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMember(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-12 animate-slideUp">
            <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2">👤 تعديل بيانات العضو</h3>
            <form onSubmit={handleAdminUpdateMember} className="space-y-6">
              <input type="text" required value={memberFormData.name} onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold" placeholder="الاسم" />
              <input type="tel" required value={memberFormData.phone} onChange={e => setMemberFormData({...memberFormData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-left" dir="ltr" />
              <input type="text" value={memberFormData.password} onChange={e => setMemberFormData({...memberFormData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold" placeholder="كلمة مرور جديدة (اختياري)" />
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSavingMember} className="flex-grow bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-600 transition shadow-lg active:scale-95 disabled:opacity-50">حفظ ✨</button>
                <button type="button" onClick={() => setEditingMember(null)} className="px-8 bg-slate-100 text-slate-500 py-5 rounded-[2rem] font-black hover:bg-slate-200 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black flex items-center gap-2"><span className="text-emerald-500">⚙️</span> لوحة التحكم</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1">سوق العصر - فاقوس</p>
        </div>
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" badge={stats.criticalCount > 0 ? stats.criticalCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="👤" />
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-800 flex flex-col gap-3">
           <button onClick={onOpenInvoiceForm} className="bg-blue-600 text-white py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-blue-700 transition active:scale-95">📄 فاتورة كاشير</button>
           <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 hover:text-white font-bold text-sm transition">المتجر 🏪</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-fadeIn">
            <StatCard title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
            <StatCard title="الطلبيات" value={stats.salesCount} icon="🛒" color="text-blue-600" onClick={() => setActiveTab('orders')} />
            <StatCard title="إجمالي الآجل" value={`${stats.delayedAmount} ج.م`} icon="⏳" color="text-orange-600" highlight={stats.delayedCount > 0} onClick={() => { setActiveTab('orders'); setPaymentFilter('delayed'); }} />
            <StatCard title="نقص مخزون" value={stats.criticalCount} icon="🚨" color="text-rose-600" highlight={stats.criticalCount > 0} onClick={() => { setActiveTab('products'); setStockFilter('critical'); }} />
            <StatCard title="الأعضاء" value={stats.userCount} icon="👥" color="text-indigo-600" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full md:w-80 px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" />
              <div className="flex gap-3">
                {stockFilter === 'critical' && <button onClick={() => setStockFilter('all')} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black">إلغاء فلتر النقص ✕</button>}
                <button onClick={onOpenAddForm} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ إضافة منتج</button>
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b"><tr className="px-8 py-6"><th className="px-8 py-6">المنتج</th><th className="px-8 py-6">السعر</th><th className="px-8 py-6">المخزون</th><th className="px-8 py-6">الإجراء</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 flex items-center gap-4"><img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" /><div><p className="font-black text-sm">{p.name}</p><p className="text-[9px] text-slate-400">{p.barcode || 'بدون كود'}</p></div></td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                      <td className={`px-8 py-4 font-black text-sm ${p.stockQuantity < 5 ? 'text-rose-500' : 'text-slate-700'}`}>{p.stockQuantity} وحدة</td>
                      <td className="px-8 py-4 flex gap-2">
                        <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500">✎</button>
                        <button onClick={() => showConfirm('حذف المنتج', `هل أنت متأكد من حذف "${p.name}" نهائياً؟`, () => onDeleteProduct(p.id))} className="p-2 text-rose-500">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-slate-50/50 flex justify-between">
                <div className="text-xs font-bold text-slate-400">عرض {paginatedProducts.length} من أصل {filteredProducts.length}</div>
                <div className="flex gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border rounded-xl font-black text-xs disabled:opacity-30">السابق</button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border rounded-xl font-black text-xs disabled:opacity-30">التالي</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">إدارة الأقسام</h3>
              <button onClick={() => setIsEditingCategory(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg">+ إضافة قسم</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center transition-all hover:shadow-xl group">
                   <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-3xl mb-4">{cat.image ? <img src={cat.image} className="w-full h-full object-cover rounded-3xl" /> : '🏷️'}</div>
                   <h5 className="font-black text-lg text-slate-800">{cat.name}</h5>
                   <div className="flex gap-2 mt-4 w-full pt-4 border-t border-slate-50">
                      <button onClick={() => { setCatFormData(cat); setIsEditingCategory(true); }} className="flex-grow text-blue-600 font-bold text-xs">تعديل</button>
                      <button onClick={() => showConfirm('حذف القسم', `هل أنت متأكد من حذف قسم "${cat.name}"؟ سيتم فك ارتباط المنتجات به.`, () => onDeleteCategory(cat.id))} className="flex-grow text-rose-500 font-bold text-xs">حذف</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <input type="text" placeholder="بحث بالرقم أو الهاتف..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-2 outline-none font-bold text-xs" />
                <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as any)} className="bg-slate-50 rounded-xl px-4 py-2 outline-none font-black text-xs cursor-pointer">
                  <option value="all">كل طرق الدفع</option>
                  <option value="cash">نقدي فقط</option>
                  <option value="delayed">آجل فقط</option>
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 rounded-xl px-4 py-2 outline-none font-bold text-xs" />
                <button onClick={() => { setOrderSearch(''); setPaymentFilter('all'); setStartDate(''); setEndDate(''); }} className="bg-rose-50 text-rose-500 font-bold text-xs rounded-xl">مسح الفلاتر</button>
             </div>
             {filteredOrders.map(order => {
                const isDelayed = (order.paymentMethod || '').includes('آجل');
                const isCancelled = order.status === 'cancelled';
                return (
                  <div key={order.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border-l-8 transition-all hover:shadow-md ${isCancelled ? 'border-l-slate-300' : (isDelayed ? 'border-l-orange-500' : 'border-l-emerald-500')}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isCancelled ? 'bg-slate-100' : (isDelayed ? 'bg-orange-50' : 'bg-emerald-50')}`}>{isCancelled ? '🔄' : '📦'}</div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">طلب #{order.id} {isCancelled && '(مسترد)'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{order.customerName} • {order.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                       <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ</p><p className={`font-black text-base ${isCancelled ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>{order.total.toFixed(2)} ج.م</p></div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => onViewOrder(order)} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] active:scale-95">عرض</button>
                       {!isCancelled && <button onClick={() => handleReturnOrder(order.id)} className="px-6 py-2.5 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] active:scale-95">استرداد</button>}
                    </div>
                  </div>
                );
             })}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات</p>
                 <p className="text-3xl font-black text-slate-800 mt-1">{profitStats.revenue.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التكلفة</p>
                 <p className="text-3xl font-black text-slate-800 mt-1">{profitStats.wholesale.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-emerald-600 p-8 rounded-[3rem] shadow-xl border border-emerald-500 text-white">
                 <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">صافي الربح</p>
                 <p className="text-3xl font-black mt-1">{profitStats.profit.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
               <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><span className="w-2 h-6 bg-purple-500 rounded-full"></span> أعلى 5 منتجات ربحية</h4>
               <div className="space-y-4">
                 {profitStats.topProducts.map((p, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <div><p className="font-black text-slate-800 text-xs">{p.name}</p><p className="text-[9px] text-slate-400 font-bold">باع {p.qty} قطعة</p></div>
                     <div className="text-right"><p className="font-black text-emerald-600 text-sm">{p.profit.toLocaleString()} ج.م</p><p className="text-[8px] font-black text-slate-300 uppercase">صافي ربح</p></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden animate-fadeIn">
             <div className="p-6 border-b"><input type="text" placeholder="بحث بالأعضاء..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full md:w-80 px-4 py-2 bg-slate-50 rounded-xl outline-none font-bold text-sm" /></div>
             <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black border-b"><tr><th className="px-8 py-4">العضو</th><th className="px-8 py-4">الهاتف</th><th className="px-8 py-4">المشتريات</th><th className="px-8 py-4">الإجراء</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                   {users.filter(u => u.name.includes(memberSearch) || u.phone.includes(memberSearch)).map(u => (
                     <tr key={u.id} className="hover:bg-slate-50 transition">
                       <td className="px-8 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">{u.name[0]}</div><div><p className="font-black text-sm">{u.name}</p><p className="text-[9px] text-slate-400">{u.role}</p></div></div></td>
                       <td className="px-8 py-4 font-bold text-slate-600" dir="ltr">{u.phone}</td>
                       <td className="px-8 py-4 font-black text-emerald-600">{orders.filter(o => o.phone === u.phone).reduce((s,o) => s+o.total, 0).toLocaleString()} ج.م</td>
                       <td className="px-8 py-4"><button onClick={() => setEditingMember(u)} className="text-blue-600 font-bold text-xs">تعديل</button></td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span>{badge !== undefined && <span className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-full border-2 border-slate-900">{badge}</span>}</button>
);

const StatCard = ({ title, value, icon, color, highlight = false, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all hover:shadow-md group ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${highlight ? 'border-orange-200 bg-orange-50/20' : 'border-slate-50'}`}>
    <div className={`${color} text-4xl mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase mr-1">{title}</p>
    <p className={`text-xl font-black ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default AdminDashboard;