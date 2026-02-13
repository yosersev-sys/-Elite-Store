
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
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory,
  onViewOrder, soundEnabled, onToggleSound
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  
  // نظام ترقيم الصفحات
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // لنموذج إضافة/تعديل القسم
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Category>({
    id: '', name: '', image: '', isActive: true, sortOrder: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // تصفية المنتجات بناءً على البحث
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  // تقسيم المنتجات المفلترة إلى صفحات
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // إعادة ضبط الصفحة عند البحث أو تغيير التبويب
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
    if (!catFormData.name.trim()) return alert('يرجى إدخال اسم القسم');
    const existing = categories.find(c => c.id === catFormData.id);
    if (existing) {
      onUpdateCategory(catFormData);
    } else {
      onAddCategory(catFormData);
    }
    setIsEditingCategory(false);
  };

  const handleCategoryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCatFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> لوحة التحكم
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">سوق العصر - الإدارة</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" badge={stats.criticalCount > 0 ? stats.criticalCount : undefined} badgeColor="bg-rose-500" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
           <button 
             onClick={onToggleSound} 
             className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
           >
             {soundEnabled ? '🔔 منبه مفعل' : '🔕 منبه صامت'}
           </button>
           <button onClick={() => window.location.hash = ''} className="w-full text-slate-400 hover:text-white font-bold text-sm transition">المتجر 🏪</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {/* نظام التنبيهات المرئية الحاد */}
        {criticalStockProducts.length > 0 && (
          <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2rem] animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-rose-200">⚠️</div>
               <div>
                  <h4 className="font-black text-rose-900 text-lg">تنبيه: مخزون حرج!</h4>
                  <p className="text-rose-600 text-xs font-bold">يوجد {criticalStockProducts.length} منتجات رصيدها أقل من 5 وحدات.</p>
               </div>
            </div>
            <button 
              onClick={() => setActiveTab('products')}
              className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition active:scale-95"
            >
              مراجعة النواقص الآن
            </button>
          </div>
        )}

        {/* التبويبات */}
        <div className="animate-fadeIn">
          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-600" />
                <StatCard title="عدد الطلبيات" value={stats.salesCount} icon="🛒" color="text-blue-600" />
                <StatCard title="نقص حاد (أقل من 5)" value={stats.criticalCount} icon="🚨" color="text-rose-600" highlight={stats.criticalCount > 0} />
                <StatCard title="إجمالي الأصناف" value={stats.productCount} icon="📦" color="text-purple-600" />
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                    className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-sm"
                  />
                  <span className="absolute left-4 top-3 text-slate-300">🔍</span>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                   <button onClick={onOpenInvoiceForm} className="flex-grow md:flex-grow-0 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition">📄 إصدار فاتورة</button>
                   <button onClick={onOpenAddForm} className="flex-grow md:flex-grow-0 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition">+ إضافة منتج</button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                        <th className="px-8 py-6">المنتج</th>
                        <th className="px-8 py-6">سعر البيع</th>
                        <th className="px-8 py-6">الربح المتوقع</th>
                        <th className="px-8 py-6">المخزون الحالي</th>
                        <th className="px-8 py-6">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedProducts.map(p => {
                        const margin = p.price - (p.wholesalePrice || 0);
                        const isCritical = p.stockQuantity < 5;
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50 transition ${isCritical ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-4">
                                <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                                <div>
                                  <p className="font-black text-slate-800 text-sm">{p.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.barcode || 'NO SKU'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                            <td className="px-8 py-4 font-black text-blue-500 text-xs">+{margin.toFixed(2)}</td>
                            <td className="px-8 py-4">
                              <div className="flex flex-col gap-1">
                                 <span className={`font-black text-sm ${isCritical ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                                   {p.stockQuantity} {p.unit === 'kg' ? 'كجم' : 'قطعة'}
                                 </span>
                                 {isCritical && <span className="text-[8px] font-black text-rose-500 uppercase">نقص حاد!</span>}
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => onOpenEditForm(p)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition shadow-sm bg-white">✎</button>
                                <button onClick={() => onDeleteProduct(p.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition shadow-sm bg-white">🗑</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">لا توجد منتجات مطابقة للبحث</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* شريط ترقيم الصفحات - التحديث الجديد */}
                {totalPages > 1 && (
                  <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      عرض {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredProducts.length, currentPage * itemsPerPage)} من إجمالي {filteredProducts.length} منتج
                    </p>
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition disabled:opacity-30 disabled:hover:bg-white"
                      >
                        السابق
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition disabled:opacity-30 disabled:hover:bg-white"
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
            <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800">إدارة الأقسام</h3>
                  <p className="text-slate-400 text-xs font-bold">تحكم في ظهور وترتيب الأقسام في واجهة المتجر</p>
                </div>
                {!isEditingCategory && (
                  <button onClick={handleAddCategoryClick} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition active:scale-95 flex items-center gap-2">
                    <span>+ إضافة قسم</span>
                  </button>
                )}
              </div>

              {isEditingCategory ? (
                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-emerald-100 animate-slideUp space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black text-emerald-600">
                      {categories.some(c => c.id === catFormData.id) ? 'تعديل القسم' : 'قسم جديد'}
                    </h4>
                    <button onClick={() => setIsEditingCategory(false)} className="text-slate-400 font-bold hover:text-rose-500 transition">إلغاء ✕</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* رفع صورة القسم */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">صورة/أيقونة القسم</label>
                       <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group">
                             {catFormData.image ? (
                               <>
                                 <img src={catFormData.image} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button onClick={() => setCatFormData({...catFormData, image: ''})} className="text-white text-xs font-bold">حذف</button>
                                 </div>
                               </>
                             ) : (
                               <span className="text-slate-300 text-2xl">🖼️</span>
                             )}
                          </div>
                          <button onClick={() => fileInputRef.current?.click()} className="text-emerald-600 font-black text-xs hover:underline uppercase tracking-widest">اختر صورة من جهازك</button>
                          <input type="file" ref={fileInputRef} onChange={handleCategoryImage} accept="image/*" hidden />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم القسم</label>
                          <input 
                            value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})}
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold transition shadow-inner"
                            placeholder="مثال: بقالة جافة"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الترتيب</label>
                             <input 
                               type="number"
                               value={catFormData.sortOrder} onChange={e => setCatFormData({...catFormData, sortOrder: parseInt(e.target.value) || 0})}
                               className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-center shadow-inner"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">حالة الظهور</label>
                             <button 
                               onClick={() => setCatFormData({...catFormData, isActive: !catFormData.isActive})}
                               className={`w-full py-4 rounded-2xl font-black text-xs transition-all ${catFormData.isActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}
                             >
                               {catFormData.isActive ? 'نشط في المتجر' : 'مخفي حالياً'}
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCategory}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    حفظ بيانات القسم 💾
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map(cat => (
                    <div key={cat.id} className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all relative group shadow-sm ${!cat.isActive ? 'opacity-50 border-slate-100 bg-slate-50/50 grayscale' : 'border-transparent hover:border-emerald-200 hover:shadow-xl'}`}>
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                          {cat.image ? (
                            <img src={cat.image} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">📂</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg">{cat.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {products.filter(p => p.categoryId === cat.id).length} صنف متوفر
                          </p>
                        </div>
                      </div>

                      {/* إجراءات سريعة */}
                      <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditCategory(cat)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl font-bold text-xs flex items-center gap-2 transition">تعديل</button>
                         <button onClick={() => onDeleteCategory(cat.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-2 transition">حذف</button>
                      </div>

                      {/* شارات الحالة */}
                      <div className="absolute top-4 left-4">
                         <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${cat.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                           {cat.isActive ? 'نشط' : 'مخفي'}
                         </span>
                      </div>
                      <div className="absolute top-4 right-4 w-6 h-6 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full flex items-center justify-center border border-slate-100">
                        {cat.sortOrder}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl transition-all border-l-8 border-l-emerald-500">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                    <div>
                      <p className="font-black text-slate-800">طلب رقم {order.id}</p>
                      <p className="text-xs text-slate-400 font-bold">{order.customerName} • {order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ</p>
                      <p className="font-black text-emerald-600 text-lg">{order.total} ج.م</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ الطلب</p>
                      <p className="font-bold text-slate-700 text-xs">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewOrder(order)} 
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition shadow-lg active:scale-95"
                  >
                    عرض الفاتورة
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge, badgeColor = "bg-red-500" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span>
    {badge !== undefined && <span className={`${badgeColor} text-white text-[9px] px-2.5 py-1 rounded-full border-2 border-slate-900 animate-bounce`}>{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon, color, highlight = false }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all duration-500 ${highlight ? 'border-rose-200 bg-rose-50/30' : 'border-slate-50'}`}>
    <div className={`${color} text-4xl mb-4 ${highlight ? 'animate-bounce' : ''}`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-2xl font-black ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default AdminDashboard;
