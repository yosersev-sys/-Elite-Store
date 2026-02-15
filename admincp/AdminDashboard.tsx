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
  const [reportStart, setReportStart] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); 
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);

  // منطق حساب الأرباح الدقيق بناءً على تكلفة الدفعات المخزنة في الفواتير
  const profitStats = useMemo(() => {
    const start = new Date(reportStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportEnd);
    end.setHours(23, 59, 59, 999);

    const periodOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end && o.status !== 'cancelled';
    });

    let totalRevenue = 0;
    let totalWholesaleCost = 0;
    
    periodOrders.forEach(order => {
      totalRevenue += Number(order.total);
      order.items.forEach(item => {
        // نستخدم التكلفة الحقيقية المسجلة وقت البيع (Actual Wholesale Price)
        const itemWholesale = (item.actualWholesalePrice || item.wholesalePrice || 0) * item.quantity;
        totalWholesaleCost += itemWholesale;
      });
    });

    const netProfit = totalRevenue - totalWholesaleCost;

    return {
      revenue: totalRevenue,
      wholesale: totalWholesaleCost,
      profit: netProfit,
      orderCount: periodOrders.length
    };
  }, [orders, reportStart, reportEnd]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-50">
      
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-12">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-emerald-500">⚙️</span> لوحة الإدارة
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">نظام الدفعات الدقيق</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزن" icon="📦" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="الأرباح الدقيقة" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="👤" />
        </nav>

        <button onClick={onLogout} className="mt-auto w-full bg-rose-500/10 text-rose-500 py-3 rounded-xl font-black text-xs border border-rose-500/20">تسجيل الخروج 👋</button>
      </aside>

      <main className="flex-grow p-6 md:p-10 bg-slate-50/50 overflow-y-auto no-scrollbar">
        
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-800 text-xl mb-6">تقرير الأرباح (نظام الدفعات FIFO)</h3>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">من تاريخ</label>
                    <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">إلى تاريخ</label>
                    <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-black text-sm" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات</p>
                 <p className="text-3xl font-black text-slate-800 mt-2">{profitStats.revenue.toLocaleString()} <small className="text-xs">ج.م</small></p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التكلفة (FIFO)</p>
                 <p className="text-3xl font-black text-amber-600 mt-2">{profitStats.wholesale.toLocaleString()} <small className="text-xs">ج.م</small></p>
                 <p className="text-[8px] text-slate-400 mt-2">تم حساب التكلفة بناءً على أسعار شراء كل قطعة بعينها</p>
              </div>
              <div className="bg-emerald-600 p-8 rounded-[3rem] shadow-xl border border-emerald-500 relative overflow-hidden group">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">صافي الربح الحقيقي</p>
                    <p className="text-3xl font-black text-white mt-2">{profitStats.profit.toLocaleString()} <small className="text-xs">ج.م</small></p>
                    <div className="mt-4 inline-block bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black">
                      هامش الربح: {profitStats.revenue > 0 ? ((profitStats.profit / profitStats.revenue) * 100).toFixed(1) : 0}%
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex items-center gap-4">
               <span className="text-2xl">💡</span>
               <p className="text-blue-800 text-xs font-bold leading-relaxed">
                 هذا التقرير يعتمد على نظام **FIFO (First-In, First-Out)**، حيث يتم خصم تكلفة البضاعة الأقدم أولاً. 
                 حتى لو ارتفع سعر الجملة في الشحنات الجديدة، سيظل الربح دقيقاً بناءً على سعر شراء القطعة التي خرجت بالفعل للعميل.
               </p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">مخزون المنتجات</h3>
              <button onClick={onOpenAddForm} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition">+ إضافة منتج أو شحنة</button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
                    <th className="px-8 py-6">المنتج</th>
                    <th className="px-8 py-6">حالة الدفعات</th>
                    <th className="px-8 py-6">إجمالي المخزون</th>
                    <th className="px-8 py-6">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 flex items-center gap-4">
                        <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" />
                        <div><p className="font-black text-sm">{p.name}</p><p className="text-[9px] text-slate-400">السعر الحالي: {p.price} ج.م</p></div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.batches && p.batches.length > 0 ? (
                            p.batches.map((b, i) => (
                              <span key={i} className={`text-[8px] font-black px-2 py-0.5 rounded-md ${b.quantity > 0 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                                {b.quantity} ق @ {b.wholesalePrice}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-300">نظام دفعات قديم</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-8 py-4 font-black text-sm ${p.stockQuantity < 5 ? 'text-rose-500' : 'text-slate-700'}`}>{p.stockQuantity} وحدة</td>
                      <td className="px-8 py-4 flex gap-2"><button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-white shadow-sm rounded-xl">✎</button><button onClick={() => onDeleteProduct(p.id)} className="p-2 text-rose-500 bg-white shadow-sm rounded-xl">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* بقية التبويبات كالسابق... */}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="text-lg">{icon}</span><span className="flex-grow text-right">{label}</span></button>
);

export default AdminDashboard;
