
import React, { useState } from 'react';
import { Product, Category, Order, User } from '../types';
import StatsTab from './tabs/StatsTab.tsx';
import ProductsTab from './tabs/ProductsTab.tsx';
import CategoriesTab from './tabs/CategoriesTab.tsx';
import OrdersTab from './tabs/OrdersTab.tsx';
import MembersTab from './tabs/MembersTab.tsx';
import ReportsTab from './tabs/ReportsTab.tsx';
import SettingsTab from './tabs/SettingsTab.tsx';

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
  onReturnOrder: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

export type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');

  const tabTitles: Record<AdminTab, string> = {
    stats: 'نظرة عامة على النشاط',
    products: 'إدارة مخزون الأصناف',
    categories: 'إدارة أقسام المتجر',
    orders: 'أرشيف الطلبات والديون',
    members: 'إدارة شؤون الأعضاء',
    reports: 'تقارير الأرباح المحاسبية',
    settings: 'إعدادات النظام'
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return <StatsTab {...props} onNavigateToTab={setActiveTab} />;
      case 'products':
        return <ProductsTab {...props} adminSearch={adminSearch} setAdminSearch={setAdminSearch} />;
      case 'categories':
        return <CategoriesTab {...props} />;
      case 'orders':
        return <OrdersTab {...props} adminSearch={adminSearch} setAdminSearch={setAdminSearch} />;
      case 'members':
        return <MembersTab {...props} adminSearch={adminSearch} setAdminSearch={setAdminSearch} />;
      case 'reports':
        return <ReportsTab {...props} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <StatsTab {...props} onNavigateToTab={setActiveTab} />;
    }
  };

  const lowStockCount = props.products.filter(p => Number(p.stockQuantity || 0) < 5).length;

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-8 md:p-10 flex flex-col shrink-0">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">لوحة الإدارة</h2>
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">سوق العصر - فاقوس</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setAdminSearch(''); }} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setAdminSearch(''); }} label="المخزن" icon="📦" badge={lowStockCount > 0 ? lowStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); }} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setAdminSearch(''); }} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setAdminSearch(''); }} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setAdminSearch(''); }} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); }} label="الإعدادات" icon="🛠️" />
        </nav>

        <div className="mt-4 p-4 bg-slate-800/50 rounded-3xl border border-slate-700/50">
          <button 
            onClick={props.onToggleSound} 
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-xs transition-all border-2 ${props.soundEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}
          >
            <span>{props.soundEnabled ? '🔔 مفعل' : '🔕 معطل'}</span>
          </button>
        </div>

        <button onClick={props.onLogout} className="mt-4 w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300">تسجيل الخروج 👋</button>
      </aside>

      <main className="flex-grow p-6 md:p-12 bg-slate-50/50 overflow-y-auto no-scrollbar">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
           <div>
             <h3 className="text-3xl font-black text-slate-800 tracking-tight">{tabTitles[activeTab]}</h3>
             <p className="text-slate-400 text-sm font-bold mt-1">سوق العصر - الإدارة الذكية v4.3</p>
           </div>
           
           <div className="flex gap-3 w-full md:w-auto">
             <button onClick={props.onOpenInvoiceForm} className="flex-grow md:flex-initial bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"><span>🧾</span> + فاتورة سريعة</button>
             <button onClick={props.onOpenAddForm} className="flex-grow md:flex-initial bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl transition-transform active:scale-95"><span>📦</span> + إضافة صنف</button>
           </div>
        </div>

        <div className="animate-fadeIn">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 relative ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-105 z-10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span className="text-xl">{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {(badge || 0) > 0 && <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">{badge}</span>}
  </button>
);

export default AdminDashboard;
