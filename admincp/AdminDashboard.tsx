
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  onViewOrder: (order: Order) => void;
  onUpdateOrderPayment: (id: string, paymentMethod: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, onUpdateOrderPayment, soundEnabled, onToggleSound
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // فلاتر الطلبات المتقدمة
  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'delayed'>('all');

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({
    id: '', name: '', image: '', isActive: true, sortOrder: 0
  });

  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // تصفية المنتجات
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

  // تصفية الطلبات المتقدمة
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. البحث النصي
      const searchLower = orderSearch.toLowerCase();
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.phone && order.phone.includes(searchLower));

      // 2. فلترة حالة الدفع
      const paymentMethod = order.paymentMethod || '';
      const matchesPayment = 
        paymentFilter === 'all' || 
        (paymentFilter === 'cash' && paymentMethod.includes('نقدي')) ||
        (paymentFilter === 'delayed' && paymentMethod.includes('آجل'));

      // 3. فلترة التاريخ
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

  const criticalStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity < 5 && p.stockQuantity >= 0);
  }, [products]);

  useEffect(() => {
    if (soundEnabled && criticalStockProducts.length > 0) {
      if (!alertAudioRef.current) {
        alertAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      }
      alertAudioRef.current.play().catch(() => {});
    }
  }, [criticalStockProducts.length, soundEnabled]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return {
      revenue: totalRevenue.toLocaleString(),
      salesCount: orders.length,
      productCount: products.length,
      criticalCount: criticalStockProducts.length
    };
  }, [products, orders, criticalStockProducts]);

  const handleEditCategory = (cat: Category) => {
    setCatFormData(cat);
    setIsEditingCategory(true);
  };

  const handleAddCategoryClick = () => {
    setCatFormData({ id: 'cat_' + Date.now(), name: '', image: '', isActive: true, sortOrder: categories.length });
    setIsEditingCategory(true);
  };

  const handleSaveCategory = () => {
    if (!catFormData.name.trim()) return alert('يرجى إدخل اسم القسم');
    const existing = categories.find(c => c.id === catFormData.id);
    if (existing) onUpdateCategory(catFormData);
    else onAddCategory(catFormData);
    setIsEditingCategory(false);
  };

  const resetOrderFilters = () => {
    setOrderSearch('');
    setStartDate('');
    setEndDate('');
    setPaymentFilter('all');
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* زر فاتورة كاشير العائم */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
            <StatCard title="عدد الطلبيات" value={stats.salesCount} icon="🛒" color="text-blue-600" />
            <StatCard title="نقص حاد" value={stats.criticalCount} icon="🚨" color="text-rose-600" highlight={stats.criticalCount > 0} />
            <StatCard title="إجمالي الأصناف" value={stats.productCount} icon="📦" color="text-purple-600" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="w-full md:w-80 px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm" />
              <div className="flex gap-3 w-full md:w-auto">
                 <button onClick={onOpenAddForm} className="flex-grow bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">+ إضافة منتج جديد</button>
              </div>
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
              
              {/* Pagination Controls - أدوات التنقل بين الصفحات */}
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400">
                    عرض {paginatedProducts.length} من أصل {filteredProducts.length} منتج
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 bg-white border rounded-xl font-black text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      السابق
                    </button>
                    <div className="bg-white px-4 py-2 rounded-xl border font-black text-xs text-emerald-600">
                      صفحة {currentPage} من {totalPages}
                    </div>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-4 py-2 bg-white border rounded-xl font-black text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center"><h3 className="text-2xl font-black">إدارة الأقسام</h3>{!isEditingCategory && <button onClick={handleAddCategoryClick} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl">+ إضافة قسم</button>}</div>
            {isEditingCategory ? (
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-emerald-100 space-y-8">
                <input value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="اسم القسم" />
                <button onClick={handleSaveCategory} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl">حفظ القسم 💾</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{categories.map(cat => <div key={cat.id} className="bg-white rounded-[2.5rem] p-6 border shadow-sm text-center"><p className="font-black text-lg">{cat.name}</p><div className="flex justify-center gap-2 mt-4"><button onClick={() => handleEditCategory(cat)} className="text-blue-500 text-xs font-bold">تعديل</button><button onClick={() => onDeleteCategory(cat.id)} className="text-rose-500 text-xs font-bold">حذف</button></div></div>)}</div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* بار الفلاتر المتقدم للطلبات */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slideDown">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">بحث (رقم/اسم/هاتف)</label>
                    <input 
                      type="text" 
                      placeholder="ابحث..." 
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">من تاريخ</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">إلى تاريخ</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-2">نوع الدفع</label>
                    <div className="flex gap-2">
                       <select 
                         value={paymentFilter}
                         onChange={e => setPaymentFilter(e.target.value as any)}
                         className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xs cursor-pointer"
                       >
                         <option value="all">الكل</option>
                         <option value="cash">نقدي فقط</option>
                         <option value="delayed">آجل فقط</option>
                       </select>
                       {(orderSearch || startDate || endDate || paymentFilter !== 'all') && (
                         <button 
                           onClick={resetOrderFilters}
                           className="bg-rose-50 text-rose-500 p-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm"
                           title="مسح الفلاتر"
                         >
                           ✕
                         </button>
                       )}
                    </div>
                  </div>

               </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-slate-400 font-black">لا توجد طلبات تطابق معايير البحث الحالية</p>
                    <button onClick={resetOrderFilters} className="mt-4 text-emerald-600 font-bold text-xs underline">عرض كل الطلبات</button>
                 </div>
              ) : (
                filteredOrders.map(order => {
                  const paymentMethod = order.paymentMethod || 'غير محدد';
                  const isDelayed = paymentMethod.includes('آجل');

                  return (
                    <div key={order.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border-l-8 transition-all hover:shadow-md ${isDelayed ? 'border-l-orange-500' : 'border-l-emerald-500'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDelayed ? 'bg-orange-50' : 'bg-emerald-50'}`}>📦</div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-black text-slate-800 text-sm">طلب #{order.id}</p>
                             <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-bold">
                               {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                             </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">{order.customerName || 'عميل مجهول'} • {order.phone || 'بدون هاتف'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">حالة الدفع</p>
                          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                             <button 
                               onClick={() => onUpdateOrderPayment(order.id, 'نقدي (تم الدفع)')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${!isDelayed ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                             >
                               نقدي
                             </button>
                             <button 
                               onClick={() => onUpdateOrderPayment(order.id, 'آجل (مديونية)')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${isDelayed ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                             >
                               آجل
                             </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ</p>
                          <p className="font-black text-emerald-600 text-base">{(Number(order.total) || 0).toFixed(2)} ج.م</p>
                        </div>
                      </div>
                      <button onClick={() => onViewOrder(order)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] hover:bg-emerald-600 transition shadow-lg active:scale-95">عرض الفاتورة</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 50px rgba(37,99,235,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 25px 60px rgba(37,99,235,0.6); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge, badgeColor = "bg-red-500" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span>{badge !== undefined && <span className={`${badgeColor} text-white text-[9px] px-2.5 py-1 rounded-full border-2 border-slate-900`}>{badge}</span>}</button>
);

const StatCard = ({ title, value, icon, color, highlight = false }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border ${highlight ? 'border-rose-200 bg-rose-50/30' : 'border-slate-50'}`}><div className={`${color} text-4xl mb-4`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">{title}</p><p className={`text-2xl font-black ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p></div>
);

export default AdminDashboard;
