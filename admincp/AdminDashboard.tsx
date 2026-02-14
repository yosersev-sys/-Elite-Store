
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Order, User } from '../types';
import { ApiService } from '../services/api';
import { WhatsAppService } from '../services/whatsappService';
import { generateSeoData } from '../services/geminiService';

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
  const itemsPerPage = 10;
  
  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'delayed'>('all');

  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({
    id: '', name: '', image: '', isActive: true, sortOrder: 0
  });

  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [memberFormData, setMemberFormData] = useState({
    id: '', name: '', phone: '', password: ''
  });
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    password: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [storeSeo, setStoreSeo] = useState({
    store_meta_title: '',
    store_meta_description: '',
    store_meta_keywords: ''
  });
  const [isLoadingSeoSettings, setIsLoadingSeoSettings] = useState(false);
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [isGeneratingSeoAi, setIsGeneratingSeoAi] = useState(false);

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'settings') {
      const fetchSettings = async () => {
        setIsLoadingSeoSettings(true);
        const settings = await ApiService.getStoreSettings();
        setStoreSeo({
          store_meta_title: settings.store_meta_title || '',
          store_meta_description: settings.store_meta_description || '',
          store_meta_keywords: settings.store_meta_keywords || ''
        });
        setIsLoadingSeoSettings(false);
      };
      fetchSettings();
    }
  }, [activeTab]);

  const handleSaveSeo = async () => {
    setIsSavingSeo(true);
    const success = await ApiService.updateStoreSettings(storeSeo);
    if (success) alert('تم حفظ إعدادات SEO بنجاح ✅');
    setIsSavingSeo(false);
  };

  const handleGenerateStoreSeoAi = async () => {
    setIsGeneratingSeoAi(true);
    const result = await generateSeoData("سوق العصر", "متجر فاقوس الأول");
    if (result) {
      setStoreSeo({
        store_meta_title: result.metaTitle,
        store_meta_description: result.metaDescription,
        store_meta_keywords: result.metaKeywords
      });
    }
    setIsGeneratingSeoAi(false);
  };

  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all');
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(adminSearch.toLowerCase()) || (p.barcode && p.barcode.includes(adminSearch));
      const matchesStock = stockFilter === 'all' || (p.stockQuantity < 5 && p.stockQuantity >= 0);
      return matchesSearch && matchesStock;
    });
  }, [products, adminSearch, stockFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = orderSearch.toLowerCase();
      const matchesSearch = order.id.toLowerCase().includes(searchLower) || (order.customerName && order.customerName.toLowerCase().includes(searchLower)) || (order.phone && order.phone.includes(searchLower));
      const paymentMethod = order.paymentMethod || '';
      const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'cash' && paymentMethod.includes('نقدي')) || (paymentFilter === 'delayed' && paymentMethod.includes('آجل'));
      return matchesSearch && matchesPayment;
    });
  }, [orders, orderSearch, paymentFilter]);

  const filteredUsersList = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.phone.includes(memberSearch))
      .map(u => {
        const userOrders = orders.filter(o => o.userId === u.id || o.phone === u.phone);
        return { ...u, orderCount: userOrders.length, totalSpent: userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) };
      });
  }, [users, memberSearch, orders]);

  const paginatedItems = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'products') list = filteredProducts;
    else if (activeTab === 'orders') list = filteredOrders;
    else if (activeTab === 'members') list = filteredUsersList;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  }, [activeTab, filteredProducts, filteredOrders, filteredUsersList, currentPage]);

  const currentTotalCount = useMemo(() => {
    if (activeTab === 'products') return filteredProducts.length;
    if (activeTab === 'orders') return filteredOrders.length;
    if (activeTab === 'members') return filteredUsersList.length;
    return 0;
  }, [activeTab, filteredProducts, filteredOrders, filteredUsersList]);

  const totalPages = Math.ceil(currentTotalCount / itemsPerPage);

  const profitStats = useMemo(() => {
    const periodOrders = orders.filter(o => o.status !== 'cancelled');
    let rev = 0, cost = 0;
    periodOrders.forEach(o => o.items.forEach(i => { rev += i.price * i.quantity; cost += (i.wholesalePrice || 0) * i.quantity; }));
    return { revenue: rev, wholesale: cost, profit: rev - cost, orderCount: periodOrders.length };
  }, [orders]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const delayed = activeOrders.filter(o => (o.paymentMethod || '').includes('آجل'));
    return {
      revenue: activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toLocaleString(),
      salesCount: activeOrders.length,
      productCount: products.length,
      criticalCount: products.filter(p => p.stockQuantity < 5).length,
      delayedAmount: delayed.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toLocaleString(),
      delayedCount: delayed.length,
      userCount: users.length
    };
  }, [products, orders, users]);

  const handleReturnOrder = async (id: string) => {
    if (!confirm('تأكيد استرداد الفاتورة؟')) return;
    setIsProcessingReturn(true);
    await ApiService.returnOrder(id);
    window.location.reload();
  };

  const handleSaveCategory = () => {
    if (!catFormData.name.trim()) return;
    const existing = categories.find(c => c.id === catFormData.id);
    if (existing) onUpdateCategory(catFormData);
    else onAddCategory(catFormData);
    setIsEditingCategory(false);
  };

  // Fix: Added missing handleAddCategoryClick function to resolve error on line 336
  const handleAddCategoryClick = () => {
    setCatFormData({ id: '', name: '', image: '', isActive: true, sortOrder: 0 });
    setIsEditingCategory(true);
  };

  // Fix: Added missing handleEditCategory function to resolve error on line 346
  const handleEditCategory = (cat: Category) => {
    setCatFormData({ ...cat });
    setIsEditingCategory(true);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] lg:bg-white lg:rounded-[3rem] lg:shadow-2xl overflow-hidden animate-fadeIn pb-24 lg:pb-0">
      
      {/* Mobile Top Header (Fixed for Admin) */}
      <div className="lg:hidden bg-slate-900 text-white p-5 flex items-center justify-between sticky top-0 z-[100] shadow-lg">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-lg">⚙️</div>
            <div>
               <h2 className="text-lg font-black leading-none">لوحة الإدارة</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">سوق العصر</p>
            </div>
         </div>
         <button onClick={onLogout} className="bg-slate-800 p-2.5 rounded-xl text-rose-500">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
         </button>
      </div>

      {/* Sidebar Navigation (Horizontal on Mobile) */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="hidden lg:block p-10 pb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> لوحة التحكم
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1">إدارة سوق العصر</p>
        </div>
        
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar p-3 lg:p-6 lg:space-y-2 lg:flex-grow border-t border-slate-800 lg:border-none">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" badge={stats.criticalCount > 0 ? stats.criticalCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
          <AdminNavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="👤" />
        </nav>

        <div className="hidden lg:flex flex-col gap-4 p-8 border-t border-slate-800 mt-auto">
           <button onClick={onToggleSound} className={`w-full py-2 rounded-xl font-bold text-xs ${soundEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}>{soundEnabled ? '🔔 منبه مفعل' : '🔕 منبه صامت'}</button>
           <button onClick={() => window.location.hash = ''} className="text-slate-400 hover:text-white font-bold text-sm">المتجر 🏪</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 lg:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              <StatCard title="الدخل" value={`${stats.revenue}`} icon="💰" color="text-emerald-600" />
              <StatCard title="الطلبات" value={stats.salesCount} icon="🛒" color="text-blue-600" onClick={() => setActiveTab('orders')} />
              <StatCard title="الآجل" value={`${stats.delayedAmount}`} icon="⏳" color="text-orange-600" highlight={stats.delayedCount > 0} />
              <StatCard title="نقص" value={stats.criticalCount} icon="🚨" color="text-rose-600" highlight={stats.criticalCount > 0} onClick={() => { setActiveTab('products'); setStockFilter('critical'); }} />
            </div>

            {stats.delayedCount > 0 && (
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-right">
                  <h4 className="font-black text-orange-900">تنبيه المديونيات ⏳</h4>
                  <p className="text-orange-700 text-xs font-bold">لديك {stats.delayedCount} طلبيات آجل بمبلغ {stats.delayedAmount} ج.م</p>
                </div>
                <button onClick={() => { setActiveTab('orders'); setPaymentFilter('delayed'); }} className="bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs">عرض المديونيات</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full md:w-80 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm" />
              <button onClick={onOpenAddForm} className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg">+ منتج جديد</button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b"><th className="px-6 py-5">المنتج</th><th className="px-6 py-5">السعر</th><th className="px-6 py-5">المخزون</th><th className="px-6 py-5">الإجراء</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(paginatedItems as Product[]).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition text-sm">
                        <td className="px-6 py-4 flex items-center gap-3"><img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" /><div><p className="font-black text-slate-800">{p.name}</p><p className="text-[8px] text-slate-400">{p.barcode}</p></div></td>
                        <td className="px-6 py-4 font-black text-emerald-600">{p.price} <small>ج.م</small></td>
                        <td className={`px-6 py-4 font-black ${p.stockQuantity < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>{p.stockQuantity}</td>
                        <td className="px-6 py-4 flex gap-2"><button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-blue-50 rounded-lg">✎</button><button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg">🗑</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
               <div className="flex flex-col md:flex-row gap-3">
                  <input type="text" placeholder="رقم الطلب أو الهاتف..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="flex-grow bg-slate-50 border-none rounded-xl px-5 py-3 outline-none font-bold text-xs" />
                  <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as any)} className="bg-slate-50 border-none rounded-xl px-4 py-3 outline-none font-black text-xs cursor-pointer">
                     <option value="all">كل أنواع الدفع</option>
                     <option value="cash">نقدي</option>
                     <option value="delayed">آجل</option>
                  </select>
               </div>
            </div>

            <div className="space-y-3">
                {(paginatedItems as Order[]).map(order => {
                  const isDelayed = (order.paymentMethod || '').includes('آجل');
                  return (
                    <div key={order.id} className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 ${isDelayed ? 'border-l-orange-500' : 'border-l-emerald-500'}`}>
                      <div className="w-full flex items-center justify-between md:justify-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isDelayed ? 'bg-orange-50' : 'bg-emerald-50'}`}>📦</div>
                          <div><p className="font-black text-slate-800 text-xs">طلب #{order.id}</p><p className="text-[10px] text-slate-400 font-bold">{order.customerName}</p></div>
                        </div>
                        <div className="text-left md:hidden"><p className="font-black text-emerald-600 text-base">{order.total} ج.م</p></div>
                      </div>
                      <div className="w-full md:w-auto flex items-center justify-between md:gap-6 pt-3 md:pt-0 border-t md:border-none">
                        <div className="hidden md:block text-center"><p className="text-[10px] font-black text-slate-400 uppercase">المبلغ</p><p className="font-black text-emerald-600">{order.total} ج.م</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => onViewOrder(order)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px]">عرض</button>
                          <button onClick={() => handleReturnOrder(order.id)} className="bg-rose-50 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[10px]">استرداد</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <Pagination current={currentPage} total={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Fix: Added Category Edit/Add Form UI for better UX and to make isEditingCategory state functional */}
            {isEditingCategory && (
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-100 shadow-xl space-y-4 animate-slideDown">
                <h4 className="font-black text-slate-800">{catFormData.id ? 'تعديل القسم' : 'إضافة قسم جديد'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">اسم القسم</label>
                    <input 
                      type="text" 
                      placeholder="مثال: فواكه موسمية" 
                      value={catFormData.name} 
                      onChange={e => setCatFormData({...catFormData, name: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold border focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">رابط الصورة</label>
                    <input 
                      type="text" 
                      placeholder="رابط الصورة (URL)" 
                      value={catFormData.image || ''} 
                      onChange={e => setCatFormData({...catFormData, image: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none font-bold border focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveCategory} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-emerald-700 transition active:scale-95">حفظ البيانات</button>
                  <button onClick={() => setIsEditingCategory(false)} className="bg-slate-100 text-slate-500 px-8 py-3 rounded-xl font-black text-xs hover:bg-slate-200 transition">إلغاء</button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">الأقسام</h3>
              <button onClick={handleAddCategoryClick} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs shadow-lg">+ إضافة قسم</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-3xl p-5 border shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">{cat.image ? <img src={cat.image} className="w-full h-full object-cover rounded-2xl" /> : '🏷️'}</div>
                      <p className="font-black text-slate-800 text-sm">{cat.name}</p>
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => handleEditCategory(cat)} className="p-2 text-blue-500 bg-blue-50 rounded-lg text-xs">✎</button>
                      <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg text-xs">🗑</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... Reports & Members & Settings (Already handle grids nicely) ... */}
        {activeTab === 'members' && (
           <div className="space-y-4">
              <input type="text" placeholder="بحث عن عضو..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm shadow-sm" />
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-right min-w-[500px]">
                    <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b"><th className="px-6 py-5">العضو</th><th className="px-6 py-5">المشتريات</th><th className="px-6 py-5">الإجراء</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {(paginatedItems as any[]).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition text-sm">
                          <td className="px-6 py-4 font-black text-slate-800">{u.name} <p className="text-[10px] text-slate-400">{u.phone}</p></td>
                          <td className="px-6 py-4 font-black text-emerald-600">{u.totalSpent} ج.م</td>
                          <td className="px-6 py-4 flex gap-2"><button onClick={() => window.open(`https://wa.me/${u.phone}`, '_blank')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">💬</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        )}

      </main>

      {/* Admin Floating Add Button (Mobile Only) */}
      <button 
        onClick={onOpenInvoiceForm}
        className="lg:hidden fixed bottom-28 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-[90] animate-bounce"
      >
        🧾
      </button>

    </div>
  );
};

// Sub-components to clean up code
const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center lg:w-full gap-3 px-5 py-3 rounded-2xl font-black text-[11px] lg:text-sm transition-all whitespace-nowrap ${
      active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
    {badge !== undefined && (
      <span className="bg-rose-500 text-white text-[8px] px-2 py-0.5 rounded-full border border-slate-900">{badge}</span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, color, highlight, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-4 lg:p-6 rounded-3xl shadow-sm border transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''} ${highlight ? 'border-rose-200 bg-rose-50/20' : 'border-slate-50'}`}>
    <div className={`${color} text-2xl lg:text-3xl mb-3`}>{icon}</div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{title}</p>
    <p className={`text-sm lg:text-xl font-black truncate ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

const Pagination = ({ current, total, onPageChange }: any) => {
  if (total <= 1) return null;
  return (
    <div className="p-4 bg-slate-50/50 flex items-center justify-center gap-3 border-t">
       <button disabled={current === 1} onClick={() => onPageChange(current - 1)} className="px-4 py-2 bg-white rounded-xl text-xs font-black shadow-sm disabled:opacity-30">السابق</button>
       <span className="text-xs font-bold">{current} / {total}</span>
       <button disabled={current === total} onClick={() => onPageChange(current + 1)} className="px-4 py-2 bg-white rounded-xl text-xs font-black shadow-sm disabled:opacity-30">التالي</button>
    </div>
  );
};

export default AdminDashboard;
