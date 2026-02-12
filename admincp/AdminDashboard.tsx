
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
    return {
      revenue: revenue.toLocaleString(),
      ordersCount: orders.length,
      productCount: products.length,
      outOfStock: products.filter(p => (p.stockQuantity || 0) <= 0).length
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase()));
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

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedCategories.findIndex(c => c.id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sortedCategories.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentCat = sortedCategories[currentIndex];
    const targetCat = sortedCategories[targetIndex];

    const currentOrder = currentCat.sortOrder || 0;
    const targetOrder = targetCat.sortOrder || 0;

    await onUpdateCategory({ ...currentCat, sortOrder: targetOrder });
    await onUpdateCategory({ ...targetCat, sortOrder: currentOrder });
  };

  const openDeleteConfirmation = (type: 'product' | 'category', id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type,
      id,
      title: name
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
    <div className="flex flex-col lg:flex-row min-h-[80vh] bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden animate-fadeIn relative">
      
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
              <button 
                onClick={handleConfirmDelete}
                className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black hover:bg-rose-600 transition shadow-lg shadow-rose-100"
              >
                تأكيد الحذف
              </button>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-grow bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl">🏛️</span>
            سوق العصر
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 border-t border-slate-800 pt-2">إدارة أكبر سوق في فاقوس</p>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <NavBtn active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" />
          <NavBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" />
          <NavBtn active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="التقارير" icon="📊" />
        </nav>

        <div className="pt-8 border-t border-slate-800">
          <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-slate-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition">تحديث البيانات 🔄</button>
        </div>
      </aside>

      <main className="flex-grow p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">إدارة سوق العصر</h3>
            <p className="text-slate-400 font-bold mt-1 text-sm">أهلاً بك، يمكنك إدارة كل شيء بلمسات بسيطة من هنا.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenInvoiceForm} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm hover:bg-slate-50 transition">🧾 فاتورة سريعة</button>
            <button onClick={onOpenAddForm} className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 transition active:scale-95">+ إضافة منتج</button>
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideUp">
            <StatBox title="إجمالي المبيعات" value={`${stats.revenue} ج.م`} icon="💰" color="text-indigo-500" />
            <StatBox title="عدد الطلبات" value={stats.ordersCount} icon="🔥" color="text-orange-500" />
            <StatBox title="إجمالي المنتجات" value={stats.productCount} icon="🧺" color="text-blue-500" />
            <StatBox title="نفذ المخزون" value={stats.outOfStock} icon="⚠️" color="text-rose-500" />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <input 
                 type="text" 
                 placeholder="بحث سريع في المنتجات..." 
                 value={adminSearch} 
                 onChange={e => setAdminSearch(e.target.value)}
                 className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
               />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} منتج</span>
            </div>
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">المنتج</th>
                  <th className="px-8 py-5">السعر</th>
                  <th className="px-8 py-5">المخزون</th>
                  <th className="px-8 py-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                        <div>
                          <p className="font-black text-slate-800 text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-black text-indigo-600 text-sm">{p.price} ج.م</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stockQuantity > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        {p.stockQuantity} وحدة
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">✎</button>
                        <button onClick={() => openDeleteConfirmation('product', p.id, p.name)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-slideUp">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm max-w-xl">
              <h3 className="font-black mb-6 text-slate-800">إضافة قسم جديد</h3>
              <div className="flex gap-3">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="مثال: محاصيل موسمية" 
                  className="flex-grow px-6 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <button 
                  onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                  className="bg-slate-900 text-white px-8 rounded-2xl font-black"
                >إضافة</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((cat, index) => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <input 
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        className="flex-grow bg-slate-50 px-4 py-2 rounded-xl outline-none font-bold border-2 border-indigo-200"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCat(cat.id)} className="p-2 bg-indigo-600 text-white rounded-xl">✓</button>
                      <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-xl">✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             disabled={index === 0}
                             onClick={() => handleMoveCategory(cat.id, 'up')}
                             className="text-slate-300 hover:text-indigo-500 disabled:opacity-20 transition"
                             title="تحريك للأعلى"
                           >▲</button>
                           <button 
                             disabled={index === sortedCategories.length - 1}
                             onClick={() => handleMoveCategory(cat.id, 'down')}
                             className="text-slate-300 hover:text-indigo-500 disabled:opacity-20 transition"
                             title="تحريك للأسفل"
                           >▼</button>
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {products.filter(p => p.categoryId === cat.id).length} منتج متاح
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-2 text-slate-400 hover:text-blue-600 transition">✎</button>
                        <button onClick={() => openDeleteConfirmation('category', cat.id, cat.name)} className="p-2 text-slate-400 hover:text-rose-600 transition">🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-slideUp">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50">
               <h3 className="font-black text-slate-800">قائمة الطلبات الأخيرة - سوق العصر</h3>
             </div>
             <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-8 py-5">العميل</th>
                    <th className="px-8 py-5">المحافظة</th>
                    <th className="px-8 py-5">المبلغ</th>
                    <th className="px-8 py-5">الحالة</th>
                    <th className="px-8 py-5">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-800 text-sm">{o.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{o.phone}</p>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold text-slate-500">{o.city}</td>
                      <td className="px-8 py-4 font-black text-indigo-600 text-sm">{o.total} ج.م</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${o.status === 'completed' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                          {o.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString('ar-SA')}
                      </td>
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

const NavBtn = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <span className="text-xl">{icon}</span>
    {label}
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
