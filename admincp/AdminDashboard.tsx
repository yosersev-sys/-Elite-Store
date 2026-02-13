
import React, { useState, useMemo } from 'react';
import { Product, Category, Order } from '../types';
import { ApiService } from '../services/api';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  // Added missing onOpenInvoiceForm prop required by App.tsx
  onOpenInvoiceForm: () => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  // Added missing onUpdateCategory prop required by App.tsx
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateOrder?: (order: Order) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'orders';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onOpenInvoiceForm, onDeleteProduct, onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      lowStockCount
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && p.barcode.includes(adminSearch))
    );
  }, [products, adminSearch]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-green-50 animate-fadeIn">
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2">⚙️ لوحة المدير</h2>
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" icon="📦" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" badge={orders.length} />
        </nav>
      </aside>

      <main className="flex-grow p-10 bg-slate-50/50 overflow-y-auto">
        <div className="mb-10 flex justify-between items-center">
          <input 
            type="text" placeholder="بحث..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
            className="px-6 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm w-80 shadow-sm"
          />
          <div className="flex gap-4">
             {/* Add button to trigger POS invoice form as expected by navigation system */}
             <button onClick={onOpenInvoiceForm} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition">📄 إصدار فاتورة</button>
             <button onClick={onOpenAddForm} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition">+ منتج جديد</button>
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden animate-fadeIn">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <th className="px-8 py-6">المنتج</th>
                  <th className="px-8 py-6">سعر الجملة</th>
                  <th className="px-8 py-6">سعر البيع</th>
                  <th className="px-8 py-6">الربح</th>
                  <th className="px-8 py-6">المخزون</th>
                  <th className="px-8 py-6">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => {
                  const margin = p.price - (p.wholesalePrice || 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover border" />
                          <p className="font-black text-slate-800 text-sm">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-bold text-slate-400 text-sm">{p.wholesalePrice || 0} ج.م</td>
                      <td className="px-8 py-4 font-black text-emerald-600 text-sm">{p.price} ج.م</td>
                      <td className="px-8 py-4"><span className={`font-bold text-xs ${margin > 0 ? 'text-blue-500' : 'text-rose-500'}`}>{margin.toFixed(2)} ج.م</span></td>
                      <td className="px-8 py-4 font-bold text-slate-700 text-sm">{p.stockQuantity} {p.unit === 'kg' ? 'كجم' : 'وحدة'}</td>
                      <td className="px-8 py-4 flex gap-2">
                        <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition">✎</button>
                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition ${active ? 'bg-green-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span>{icon}</span><span className="flex-grow text-right">{label}</span>
    {badge !== undefined && <span className="bg-red-500 text-white text-[9px] px-2 rounded-lg">{badge}</span>}
  </button>
);

export default AdminDashboard;
