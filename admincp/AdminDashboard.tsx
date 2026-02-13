
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
    isOpen: false, type: null, id: null, title: ''
  });

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length;
    const outOfStock = products.filter(p => (p.stockQuantity || 0) <= 0).length;
    return { revenue: revenue.toLocaleString(), ordersCount: orders.length, productCount: products.length, lowStock, outOfStock };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase()) || (p.barcode && p.barcode.includes(adminSearch)));
  }, [products, adminSearch]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories]);

  const handleUpdateCat = (id: string) => {
    if (!editingCatName.trim()) return;
    onUpdateCategory({ id, name: editingCatName, sortOrder: categories.find(c => c.id === id)?.sortOrder });
    setEditingCatId(null);
  };

  const openDeleteConfirmation = (type: 'product' | 'category', id: string, title: string) => {
    setConfirmModal({ isOpen: true, type, id, title });
  };

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'product' && confirmModal.id) onDeleteProduct(confirmModal.id);
    else if (confirmModal.type === 'category' && confirmModal.id) onDeleteCategory(confirmModal.id);
    setConfirmModal({ isOpen: false, type: null, id: null, title: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden animate-fadeIn relative">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fadeIn" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative z-10 animate-slideUp border border-slate-100">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 text-4xl mb-6 mx-auto">⚠️</div>
            <h4 className="text-2xl font-black text-slate-800 text-center mb-3">هل أنت متأكد؟</h4>
            <p className="text-slate-500 text-center font-bold mb-8">سيتم حذف <span className="text-rose-600">"{confirmModal.title}"</span> بشكل نهائي.</p>
            <div className="flex gap-4">
              <button onClick={handleConfirmDelete} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black shadow-lg">تأكيد الحذف</button>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-grow bg-slate-100 text-slate-500 py-4 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 animate-slideUp overflow-hidden">
             <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
                <div><h4 className="text-2xl font-black">تفاصيل الفاتورة #{selectedOrder.id}</h4></div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white transition">✕</button>
             </div>
             <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العميل</p><p className="font-black text-slate-800">{selectedOrder.customerName}</p></div>
                   <div className="text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المجموع</p><p className="text-2xl font-black text-emerald-600">{selectedOrder.total} ج.م</p></div>
                </div>
                <div className="border rounded-2xl overflow-hidden">
                   <table className="w-full text-right"><thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="px-4 py-3">المنتج</th><th className="px-4 py-3">السعر</th><th className="px-4 py-3">الكمية</th></tr></thead>
                   <tbody>{selectedOrder.items.map((item, i) => (<tr key={i} className="border-b last:border-none"><td className="px-4 py-3 font-bold text-sm">{item.name}</td><td className="px-4 py-3 text-sm">{item.price} ج.م</td><td className="px-4 py-3 font-black">{item.quantity}</td></tr>))}</tbody></table>
                </div>
                <div className="flex gap-4"><button onClick={() => window.print()} className="flex-grow bg-slate-900 text-white py-4 rounded-xl font-black">طباعة الفاتورة 🖨️</button><button onClick={() => setSelectedOrder(null)} className="flex-grow bg-slate-100 text-slate-500 py-4 rounded-xl font-black">إغلاق</button></div>
             </div>
          </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
          <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-white">⚙️</span> سوق العصر
        </h2>
        <nav className="flex flex-col gap-2 flex-grow">
          <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="لوحة البيانات" icon="📊" />
          <NavBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="إدارة المخزون" icon="📦" badge={stats.outOfStock > 0 ? stats.outOfStock : undefined} badgeColor="bg-rose-500" />
          <NavBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="سجل المبيعات" icon="🛍️" />
          <NavBtn active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
        </nav>
      </aside>

      <main className="flex-grow p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div><h3 className="text-3xl font-black text-slate-800 tracking-tight">نظام إدارة سوق العصر</h3></div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenInvoiceForm} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 transition flex items-center gap-2">🧾 فاتورة جديدة (POS)</button>
            <button onClick={onOpenAddForm} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition">+ إضافة منتج</button>
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="space-y-10 animate-slideUp">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatBox title="إجمالي الدخل" value={`${stats.revenue} ج.م`} icon="💰" color="text-emerald-500" />
               <StatBox title="إجمالي الفواتير" value={stats.ordersCount} icon="🛒" color="text-blue-500" />
               <StatBox title="نقص في المخزون" value={stats.lowStock} icon="📉" color="text-orange-500" />
               <StatBox title="منتجات منتهية" value={stats.outOfStock} icon="🚫" color="text-rose-500" />
             </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="relative group"><input type="text" placeholder="بحث بالاسم أو الباركود..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-80 font-bold shadow-sm"/><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span></div>
            </div>
            <table className="w-full text-right">
              <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-5">المحصول / المنتج</th><th className="px-8 py-5">السعر</th><th className="px-8 py-5">المخزون الحالي</th><th className="px-8 py-5">المبيعات</th><th className="px-8 py-5 text-center">الإجراءات</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4"><div className="flex items-center gap-4"><img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" /><div><p className="font-black text-slate-800 text-sm">{p.name}</p></div></div></td>
                    <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                    <td className="px-8 py-4 font-black text-sm">{p.stockQuantity} وحدة</td>
                    <td className="px-8 py-4 font-black text-slate-400 text-[10px]">{p.salesCount || 0} مباع</td>
                    <td className="px-8 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">✎</button><button onClick={() => openDeleteConfirmation('product', p.id, p.name)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition">🗑</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
             <table className="w-full text-right">
                <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-8 py-5">كود الفاتورة</th><th className="px-8 py-5">العميل</th><th className="px-8 py-5">المبلغ النهائي</th><th className="px-8 py-5">التاريخ والوقت</th><th className="px-8 py-5 text-center">التفاصيل</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 font-black text-xs text-slate-400">#{o.id}</td>
                      <td className="px-8 py-4"><p className="font-black text-slate-800 text-sm">{o.customerName}</p></td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{o.total} ج.م</td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-400">{new Date(o.createdAt).toLocaleString('ar-SA')}</td>
                      <td className="px-8 py-4 text-center"><button onClick={() => setSelectedOrder(o)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-black transition">عرض</button></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-slideUp">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800 text-xl">إضافة قسم جديد</h3>
              <div className="flex gap-3">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="مثال: مكسرات" className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
                <button onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }} className="bg-slate-900 text-white px-8 rounded-2xl font-black shadow-lg">إضافة</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((cat) => (
                <div key={cat.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition">
                  <div><p className="font-black text-slate-800 text-lg leading-none mb-1">{cat.name}</p></div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"><button onClick={() => openDeleteConfirmation('category', cat.id, cat.name)} className="p-3 text-slate-400 hover:text-rose-600">🗑</button></div>
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
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group relative ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-xl transition-transform group-hover:scale-125">{icon}</span><span className="flex-grow text-right">{label}</span>
    {badge !== undefined && <span className={`${badgeColor} text-white text-[9px] font-black h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-lg border-2 border-slate-900 shadow-lg`}>{badge}</span>}
  </button>
);

const StatBox = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-xl transition-all duration-500">
    <div className={`w-14 h-14 ${color} bg-opacity-10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p></div>
  </div>
);

export default AdminDashboard;
