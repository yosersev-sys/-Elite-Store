
import React, { useState, useMemo } from 'react';
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
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, 
  onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'product' | 'category' | null;
    id: string | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: ''
  });

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length;
    const outOfStock = products.filter(p => (p.stockQuantity || 0) <= 0).length;

    return {
      revenue: revenue.toLocaleString(),
      ordersCount: orders.length,
      productCount: products.length,
      lowStock,
      outOfStock
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  const handleUpdateCat = (id: string) => {
    if (!editingCatName.trim()) return;
    const existing = categories.find(c => c.id === id);
    onUpdateCategory({ id, name: editingCatName, sortOrder: existing?.sortOrder });
    setEditingCatId(null);
  };

  // Define the missing openDeleteConfirmation function to manage the confirm modal state.
  const openDeleteConfirmation = (type: 'product' | 'category', id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      type,
      id,
      title
    });
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'product' && confirmModal.id) {
      onDeleteProduct(confirmModal.id);
    } else if (confirmModal.type === 'category' && confirmModal.id) {
      onDeleteCategory(confirmModal.id);
    }
    setConfirmModal({ isOpen: false, type: null, id: null, title: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden animate-fadeIn relative">
      
      {/* نافذة تأكيد الحذف */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fadeIn" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative z-10 animate-slideUp border border-slate-100">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-4xl mb-6 mx-auto">⚠️</div>
            <h4 className="text-2xl font-black text-slate-800 text-center mb-3">هل أنت متأكد؟</h4>
            <p className="text-slate-500 text-center font-bold mb-8">
              سيتم حذف <span className="text-rose-600">"{confirmModal.title}"</span> بشكل نهائي من النظام. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-4">
              <button onClick={handleConfirmDelete} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black hover:bg-rose-600 transition shadow-lg shadow-rose-100">تأكيد الحذف</button>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-grow bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض تفاصيل الطلب */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 animate-slideUp overflow-hidden">
             <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
                <div>
                   <h4 className="text-2xl font-black">تفاصيل الفاتورة #{selectedOrder.id}</h4>
                   <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white transition">✕</button>
             </div>
             <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العميل</p>
                      <p className="font-black text-slate-800">{selectedOrder.customerName}</p>
                      <p className="text-xs text-slate-500 font-bold">{selectedOrder.phone}</p>
                   </div>
                   <div className="space-y-1 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المجموع</p>
                      <p className="text-2xl font-black text-emerald-600">{selectedOrder.total} ج.م</p>
                   </div>
                </div>
                
                <div className="border rounded-2xl overflow-hidden">
                   <table className="w-full text-right">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                         <tr>
                            <th className="px-4 py-3">المنتج</th>
                            <th className="px-4 py-3">السعر</th>
                            <th className="px-4 py-3">الكمية</th>
                         </tr>
                      </thead>
                      <tbody>
                         {selectedOrder.items.map((item, i) => (
                            <tr key={i} className="border-b last:border-none">
                               <td className="px-4 py-3 font-bold text-sm">{item.name}</td>
                               <td className="px-4 py-3 text-sm">{item.price} ج.م</td>
                               <td className="px-4 py-3 font-black">{item.quantity}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="flex gap-4 no-print">
                   <button onClick={() => window.print()} className="flex-grow bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-slate-800 transition">طباعة الفاتورة 🖨️</button>
                   <button onClick={() => setSelectedOrder(null)} className="flex-grow bg-slate-100 text-slate-500 py-4 rounded-xl font-black">إغلاق</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col gap-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="M3 9l2.44-4.91A2 2 0 0 1 7.23 3h9.54a2 2 0 0 1 1.79 1.09L21 9" />
              </svg>
            </span>
            سوق العصر
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 border-t border-slate-800 pt-2 text-center">الإدارة والمخازن</p>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="لوحة البيانات" icon="📊" />
          <NavBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="إدارة المخزون" icon="📦" badge={stats.outOfStock > 0 ? stats.outOfStock : undefined} badgeColor="bg-rose-500" />
          <NavBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="سجل المبيعات" icon="🛍️" />
          <NavBtn active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
        </nav>
      </aside>

      <main className="flex-grow p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">نظام إدارة سوق العصر</h3>
            <p className="text-slate-400 font-bold mt-1 text-sm">مراقبة المخزون، المبيعات، والتقارير المالية.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenInvoiceForm} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 transition flex items-center gap-2 group">
               <span className="transition-transform group-hover:rotate-12">🧾</span>
               فاتورة جديدة (POS)
            </button>
            <button onClick={onOpenAddForm} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition">+ إضافة منتج</button>
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="space-y-10 animate-slideUp">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatBox title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-500" />
               <StatBox title="إجمالي المبيعات" value={stats.ordersCount} icon="🛒" color="text-blue-500" />
               <StatBox title="نقص في المخزون" value={stats.lowStock} icon="📉" color="text-orange-500" />
               <StatBox title="منتجات منتهية" value={stats.outOfStock} icon="🚫" color="text-rose-500" />
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                   <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">⚠️</span>
                   تنبيهات المخزون العاجلة
                </h4>
                <div className="space-y-4">
                   {products.filter(p => p.stockQuantity < 10).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                               <p className="font-black text-sm text-slate-800">{p.name}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">الكمية الحالية: {p.stockQuantity}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden hidden md:block">
                               <div className="h-full bg-orange-500" style={{ width: `${(p.stockQuantity/100)*100}%` }}></div>
                            </div>
                            <button onClick={() => onOpenEditForm(p)} className="text-xs font-black text-emerald-600 hover:underline">طلب توريد</button>
                         </div>
                      </div>
                   ))}
                   {products.filter(p => p.stockQuantity < 10).length === 0 && (
                      <p className="text-center text-slate-400 font-bold italic py-4">لا توجد نواقص حالياً. المخزون بحالة جيدة!</p>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="بحث بالاسم أو الباركود..." 
                    value={adminSearch} 
                    onChange={e => setAdminSearch(e.target.value)}
                    className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-80 font-bold shadow-sm"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
               </div>
               <div className="flex gap-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} صنف مسجل</span>
               </div>
            </div>
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">المحصول / المنتج</th>
                  <th className="px-8 py-5">السعر</th>
                  <th className="px-8 py-5">المخزون الحالي</th>
                  <th className="px-8 py-5">المبيعات</th>
                  <th className="px-8 py-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => {
                  const isLow = (p.stockQuantity || 0) < 10;
                  const isOut = (p.stockQuantity || 0) <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={p.images[0]} className={`w-12 h-12 rounded-xl object-cover border ${isOut ? 'grayscale' : ''}`} />
                            {isOut && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1 rounded-md font-black">NA</span>}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest">{p.barcode || `ID: ${p.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                             <span className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-orange-600' : 'text-slate-700'}`}>
                               {p.stockQuantity} وحدة
                             </span>
                          </div>
                          {isOut ? (
                            <span className="text-[9px] font-black text-rose-400 uppercase">نفذت الكمية</span>
                          ) : isLow ? (
                            <span className="text-[9px] font-black text-orange-400 uppercase">تحذير: كمية منخفضة</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                         <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500">{p.salesCount || 0} مباع</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="تعديل">✎</button>
                          <button onClick={() => openDeleteConfirmation('product', p.id, p.name)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="حذف">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
             <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-black text-slate-800 text-xl">سجل المبيعات والفواتير</h3>
               <button onClick={() => window.print()} className="text-xs font-black text-slate-400 hover:text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  استخراج تقرير 📄
               </button>
             </div>
             <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-8 py-5">كود الفاتورة</th>
                    <th className="px-8 py-5">العميل</th>
                    <th className="px-8 py-5">المبلغ النهائي</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5">التاريخ والوقت</th>
                    <th className="px-8 py-5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 font-black text-xs text-slate-400">#{o.id}</td>
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-800 text-sm">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{o.phone}</p>
                      </td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{o.total} ج.م</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                          {o.status === 'completed' ? 'تم البيع' : 'بانتظار التأكيد'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-400">
                        {new Date(o.createdAt).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-8 py-4 text-center">
                         <button onClick={() => setSelectedOrder(o)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-black transition">عرض</button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic">لا توجد عمليات بيع مسجلة بعد.</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-slideUp">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800 text-xl">إضافة قسم جديد للمتجر</h3>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="مثال: مكسرات وياميش" 
                  className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-8 rounded-2xl font-black shadow-lg"
                >إضافة</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((cat) => (
                <div key={cat.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input 
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold border-2 border-emerald-200"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCat(cat.id)} className="p-2 bg-emerald-600 text-white rounded-xl">✓</button>
                      <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-xl">✕</button>
                    </div>
                  ) : (
                    <>
                      <div>
                         <p className="font-black text-slate-800 text-lg leading-none mb-1">{cat.name}</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                           {products.filter(p => p.categoryId === cat.id).length} صنف مضاف
                         </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-3 text-slate-400 hover:text-blue-600 transition">✎</button>
                        <button onClick={() => openDeleteConfirmation('category', cat.id, cat.name)} className="p-3 text-slate-400 hover:text-rose-600 transition">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const NavBtn = ({ active, onClick, label, icon, badge, badgeColor = "bg-emerald-500" }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group relative ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <span className={`text-xl transition-transform group-hover:scale-125 ${active ? 'scale-110' : ''}`}>{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && (
      <span className={`${badgeColor} text-white text-[9px] font-black h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-lg border-2 border-slate-900 shadow-lg`}>
        {badge}
      </span>
    )}
  </button>
);

const StatBox = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-xl transition-all duration-500">
    <div className={`w-14 h-14 ${color} bg-opacity-10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
