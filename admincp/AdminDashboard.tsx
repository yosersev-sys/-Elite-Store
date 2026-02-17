
import React, { useState, useEffect } from 'react';
import { Product, Category, Order, User, Supplier } from '../types';
import StatsTab from './tabs/StatsTab.tsx';
import ProductsTab from './tabs/ProductsTab.tsx';
import CategoriesTab from './tabs/CategoriesTab.tsx';
import OrdersTab from './tabs/OrdersTab.tsx';
import MembersTab from './tabs/MembersTab.tsx';
import SuppliersTab from './tabs/SuppliersTab.tsx';
import ReportsTab from './tabs/ReportsTab.tsx';
import SettingsTab from './tabs/SettingsTab.tsx';
import ApiKeysTab from './tabs/ApiKeysTab.tsx';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  suppliers: Supplier[];
  currentUser: User | null;
  isLoading: boolean;
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
  onDeleteUser: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
  onRefreshData?: () => void;
}

export type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'suppliers' | 'reports' | 'settings' | 'api-keys';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const safeProducts = Array.isArray(props.products) ? props.products : [];
  const safeCategories = Array.isArray(props.categories) ? props.categories : [];
  const safeOrders = Array.isArray(props.orders) ? props.orders : [];
  const safeUsers = Array.isArray(props.users) ? props.users : [];
  const safeSuppliers = Array.isArray(props.suppliers) ? props.suppliers : [];

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    return (localStorage.getItem('admin_active_tab') as AdminTab) || 'stats';
  });
  
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<string>('all');

  const handleTabChange = (tab: AdminTab, searchVal?: string, filterVal?: string) => {
    setActiveTab(tab);
    if (searchVal !== undefined) setAdminSearch(searchVal);
    if (filterVal !== undefined) setAdminFilter(filterVal);
    else setAdminFilter('all'); 
    localStorage.setItem('admin_active_tab', tab);
  };

  const tabTitles: Record<AdminTab, string> = {
    stats: 'احصائيات عامة',
    products: 'المخزن والمخزون',
    categories: 'أقسام المتجر',
    orders: 'طلبات العملاء',
    members: 'إدارة الأعضاء',
    suppliers: 'شبكة الموردين',
    reports: 'تقارير الأرباح',
    settings: 'إعدادات النظام',
    'api-keys': 'مفاتيح الربط'
  };

  const renderTabContent = () => {
    const tabProps = {
      ...props,
      products: safeProducts,
      categories: safeCategories,
      orders: safeOrders,
      users: safeUsers,
      suppliers: safeSuppliers
    };

    switch (activeTab) {
      case 'stats': return <StatsTab {...tabProps} isLoading={props.isLoading} onNavigateToTab={handleTabChange} />;
      case 'products': return <ProductsTab {...tabProps} adminSearch={adminSearch} setAdminSearch={setAdminSearch} initialFilter={adminFilter} />;
      case 'categories': return <CategoriesTab {...tabProps} />;
      case 'orders': return <OrdersTab {...tabProps} adminSearch={adminSearch} setAdminSearch={setAdminSearch} isLoading={props.isLoading} />;
      case 'members': return <MembersTab {...tabProps} adminSearch={adminSearch} setAdminSearch={setAdminSearch} onRefreshData={props.onRefreshData} isLoading={props.isLoading} />;
      case 'suppliers': return <SuppliersTab isLoading={props.isLoading} suppliersData={safeSuppliers} onRefresh={props.onRefreshData} initialFilter={adminFilter as any} />;
      case 'reports': return <ReportsTab orders={safeOrders} />;
      case 'settings': return <SettingsTab currentUser={props.currentUser} onLogout={props.onLogout} />;
      case 'api-keys': return <ApiKeysTab />;
      default: return <StatsTab {...tabProps} isLoading={props.isLoading} onNavigateToTab={handleTabChange} />;
    }
  };

  const lowStockCount = safeProducts.filter(p => Number(p.stockQuantity || 0) < 5).length;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8fafc] animate-fadeIn overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 z-50">
        <div className="p-6 md:p-8 flex items-center justify-between lg:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none">سوق العصر</h2>
              <p className="text-emerald-500 text-[8px] font-black tracking-[0.2em] uppercase mt-1">لوحة التحكم</p>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-400">☰</button>
        </div>
        
        <nav className="flex lg:flex-col flex-row gap-1 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-3 lg:pb-0 px-2 lg:px-4 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => handleTabChange('stats')} icon="📊" label="الإحصائيات" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => handleTabChange('products')} icon="📦" label="المخزن" badge={lowStockCount > 0 ? lowStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => handleTabChange('categories')} icon="🏷️" label="الأقسام" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => handleTabChange('orders', '')} icon="🛍️" label="الطلبات" badge={safeOrders.filter(o => o.status === 'pending').length || undefined} />
          <AdminNavButton active={activeTab === 'members'} onClick={() => handleTabChange('members')} icon="👥" label="الأعضاء" />
          <AdminNavButton active={activeTab === 'suppliers'} onClick={() => handleTabChange('suppliers')} icon="🚛" label="الموردين" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => handleTabChange('reports')} icon="📈" label="الأرباح" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon="🛠️" label="الإعدادات" />
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 hidden lg:block space-y-3">
           <button onClick={props.onToggleSound} className={`w-full py-2.5 rounded-xl font-black text-[10px] border transition-all flex items-center justify-center gap-2 ${props.soundEnabled ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
             <span>{props.soundEnabled ? '🔔 التنبيهات: تعمل' : '🖵 صامت'}</span>
           </button>
           <button onClick={props.onLogout} className="w-full bg-rose-500/10 text-rose-500 py-2.5 rounded-xl font-black text-[10px] border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">تسجيل الخروج 👋</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0 bg-[#f8fafc]">
        {/* Header Strip */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
           <div>
             <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{tabTitles[activeTab]}</h3>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-slate-400 text-[10px] font-bold">تحديث فوري للبيانات من فاقوس</p>
             </div>
           </div>
           
           <div className="flex gap-2 w-full md:w-auto">
             <button onClick={props.onOpenInvoiceForm} className="flex-grow md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/10 transition-all active:scale-95">＋ إنشاء فاتورة</button>
             <button onClick={props.onOpenAddForm} className="flex-grow md:flex-initial bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-slate-900/10 transition-all active:scale-95">📦 إضافة صنف</button>
           </div>
        </header>

        {/* Content Section (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-4 md:p-10 no-scrollbar">
          {props.isLoading && safeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-black text-slate-400 text-xs">جاري مزامنة قاعدة البيانات...</p>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto animate-fadeIn">
              {renderTabContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 px-3 lg:px-6 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black transition-all relative shrink-0 min-w-[70px] lg:min-w-0 mb-1 ${active ? 'bg-emerald-600 text-white shadow-xl lg:scale-[1.02] z-10' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
    <span className="text-lg lg:text-xl">{icon}</span>
    <span className="text-[8px] lg:text-[13px] whitespace-nowrap">{label}</span>
    {badge && <span className="absolute -top-1 -left-1 lg:top-auto lg:left-4 bg-rose-500 text-white text-[7px] lg:text-[9px] w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full border-2 border-slate-900 font-black">{badge}</span>}
  </button>
);

export default AdminDashboard;
