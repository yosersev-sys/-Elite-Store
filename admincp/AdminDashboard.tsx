
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Order, User } from '../types';
import { ApiService } from '../services/api';
import { WhatsAppService } from '../services/whatsappService';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
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

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, currentUser, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onUpdateOrderPayment, soundEnabled, onToggleSound, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'delayed'>('all');

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({
    id: '', name: '', image: '', isActive: true, sortOrder: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // إعدادات الملف الشخصي
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    password: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch, activeTab]);

  const stats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const delayedOrders = validOrders.filter(o => (o.paymentMethod || '').includes('آجل'));
    const delayedAmount = delayedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter(p => p.stockQuantity < 5);
    
    return {
      revenue: totalRevenue.toLocaleString(),
      salesCount: validOrders.length,
      productCount: products.length,
      criticalCount: lowStock.length,
      delayedAmount: delayedAmount.toLocaleString(),
      delayedCount: delayedOrders.length
    };
  }, [products, orders]);

  const handleReturnOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من استرداد هذه الفاتورة؟ سيتم إعادة المنتجات للمخزن وخصم المبالغ من الإحصائيات.')) return;
    
    setIsProcessing(true);
    try {
      const res = await ApiService.returnOrder(orderId);
      if (res && res.status === 'success') {
        alert('تم استرداد الفاتورة بنجاح ✅');
        window.location.reload(); // تحديث شامل للبيانات
      } else {
        alert(res?.message || 'فشل استرداد الفاتورة');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name || !profileData.phone) return alert('يرجى ملء الاسم ورقم الجوال');
    setIsUpdatingProfile(true);
    try {
      const res = await ApiService.updateProfile(profileData);
      if (res.status === 'success') {
        alert('تم تحديث البيانات بنجاح. سيتم تسجيل خروجك للأمان.');
        onLogout();
      } else alert(res.message || 'حدث خطأ أثناء التحديث');
    } catch (err) { alert('خطأ في الاتصال'); }
    finally { setIsUpdatingProfile(false); }
  };

  const handleSaveCategory = () => {
    if (!catFormData.name.trim()) return alert('يرجى إدخال اسم القسم');
    const existing = categories.find(c => c.id === catFormData.id);
    if (existing) onUpdateCategory(catFormData);
    else onAddCategory(catFormData);
    setIsEditingCategory(false);
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      <button 
        onClick={onOpenInvoiceForm}
        className="fixed bottom-32 left-10 z-[100] flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-3xl font-black shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95 animate-pulse-slow group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">📄</span>
        <span>فاتورة كاشير</span>
        <div className="absolute inset-0 rounded-3xl bg-blue-400 animate-ping opacity-20 pointer-events-none"></div>
      </button>

      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> لوحة التحكم
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1">سوق العصر - الإدارة</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label=" الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" badge={stats.criticalCount > 0 ? stats.criticalCount : undefined} badgeColor="bg-rose-500" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="👤" />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
           <button onClick={onToggleSound} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
             {soundEnabled ? '🔔 منبه مفعل' : '🔕 منبه صامت'}
           </button>
           <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 hover:text-white font-bold text-sm transition">المتجر 🏪</button>
        </div>
      </aside>

      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
              <StatCard title="عدد الطلبيات" value={stats.salesCount} icon="🛒" color="text-blue-600" />
              <StatCard title="إجمالي الآجل" value={`${stats.delayedAmount} ج.م`} icon="⏳" color="text-orange-600" highlight={stats.delayedCount > 0} />
              <StatCard title="نقص حاد" value={stats.criticalCount} icon="🚨" color="text-rose-600" highlight={stats.criticalCount > 0} />
              <StatCard title="إجمالي الأصناف" value={stats.productCount} icon="📦" color="text-purple-600" />
            </div>

            {stats.delayedCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-slow">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h4 className="font-black text-orange-900">تنبيه المديونيات</h4>
                    <p className="text-orange-700 text-sm font-bold">لديك حالياً {stats.delayedCount} طلبيات بنظام الآجل، بإجمالي مبلغ {stats.delayedAmount} ج.م</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveTab('orders'); setPaymentFilter('delayed'); }}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-orange-700 transition shadow-lg"
                >
                  عرض مديونيات الآجل 🔍
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full md:w-80 px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm" />
              <button onClick={onOpenAddForm} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ إضافة منتج جديد</button>
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
                      <td className={`px-8 py-4 font-black text-sm ${p.stockQuantity < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>{p.stockQuantity} وحدة</td>
                      <td className="px-8 py-4 flex gap-2"><button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-white shadow-sm rounded-xl">✎</button><button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 bg-white shadow-sm rounded-xl">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400">عرض {paginatedProducts.length} منتج</div>
                  <div className="flex items-center gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="px-4 py-2 bg-white border rounded-xl font-black text-xs">السابق</button>
                    <span className="font-black text-xs">صفحة {currentPage} من {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="px-4 py-2 bg-white border rounded-xl font-black text-xs">التالي</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slideDown">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">بحث (رقم/اسم/هاتف)</label>
                    <input type="text" placeholder="ابحث..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">نوع الدفع</label>
                    <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as any)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none font-black text-xs cursor-pointer">
                      <option value="all">الكل</option>
                      <option value="cash">نقدي فقط</option>
                      <option value="delayed">آجل فقط</option>
                    </select>
                  </div>
                  <button onClick={() => {setOrderSearch(''); setStartDate(''); setEndDate(''); setPaymentFilter('all');}} className="bg-rose-50 text-rose-500 py-2.5 rounded-xl font-black text-xs">مسح الفلاتر</button>
               </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-black">لا توجد طلبات تطابق البحث</p>
                 </div>
              ) : (
                filteredOrders.map(order => {
                  const isDelayed = (order.paymentMethod || '').includes('آجل');
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div key={order.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border-l-8 transition-all hover:shadow-md ${isCancelled ? 'border-l-slate-300 opacity-70 grayscale' : (isDelayed ? 'border-l-orange-500' : 'border-l-emerald-500')}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isCancelled ? 'bg-slate-100' : (isDelayed ? 'bg-orange-50' : 'bg-emerald-50')}`}>
                          {isCancelled ? '🔄' : '📦'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-black text-slate-800 text-sm">طلب #{order.id}</p>
                             <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${isCancelled ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                               {isCancelled ? 'مسترد/ملغي' : 'مكتمل'}
                             </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">{order.customerName || 'عميل مجهول'} • {new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">طريقة الدفع</p>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${isDelayed ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {order.paymentMethod}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ</p>
                          <p className="font-black text-emerald-600 text-base">{order.total.toFixed(2)} ج.م</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => onViewOrder(order)} className="flex-grow md:flex-none bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px]">عرض</button>
                        
                        {!isCancelled && (
                          <button 
                            onClick={() => handleReturnOrder(order.id)}
                            disabled={isProcessing}
                            className="bg-rose-50 text-rose-500 p-3 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition group"
                            title="استرداد الفاتورة"
                          >
                            <span className="text-xs group-hover:rotate-180 transition-transform block">🔄</span>
                          </button>
                        )}
                        
                        {isDelayed && !isCancelled && (
                          <button 
                            onClick={() => WhatsAppService.sendDebtReminderToCustomer(order)}
                            className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100"
                            title="تنبيه واتساب"
                          >
                            💬
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto py-8 animate-fadeIn">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-emerald-100">
               <h3 className="text-xl font-black text-slate-800 mb-8 border-b pb-4">إعدادات الحساب الإداري</h3>
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الاسم</label>
                    <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">رقم الموبايل</label>
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-left" dir="ltr" />
                  </div>
                  <button disabled={isUpdatingProfile} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl mt-4">حفظ التغييرات</button>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge, badgeColor = "bg-red-500" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span>{badge !== undefined && <span className={`${badgeColor} text-white text-[9px] px-2.5 py-1 rounded-full border-2 border-slate-900`}>{badge}</span>}</button>
);

const StatCard = ({ title, value, icon, color, highlight = false }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all hover:shadow-md ${highlight ? 'border-orange-200 bg-orange-50/20' : 'border-slate-50'}`}><div className={`${color} text-4xl mb-4`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase mr-1">{title}</p><p className={`text-2xl font-black ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>{value}</p></div>
);

export default AdminDashboard;
