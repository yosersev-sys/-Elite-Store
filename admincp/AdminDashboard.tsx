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
  // صمامات أمان نهائية لضمان وجود مصفوفات دائماً قبل العرض
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
    products: 'المخزن',
    categories: 'الأقسام',
    orders: 'الطلبات',
    members: 'الأعضاء',
    suppliers: 'الموردين',
    reports: 'الأرباح',
    settings: 'الإعدادات',
    'api-keys': 'مفاتيح API'
  };

  const renderTabContent = () => {
    // تجميع الخصائص الآمنة
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
    <div className="flex flex-col lg:flex-row min-h-[90vh] bg-white rounded-[1.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-4 lg:p-10 flex flex-col shrink-0">
        <div className="hidden lg:block mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">لوحة الإدارة</h2>
              <p className="text-emerald-500 text-[9px] font-black tracking-widest uppercase">سوق العصر</p>
            </div>
          </div>
        </div>
        
        <nav className="flex lg:flex-col flex-row gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-3 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => handleTabChange('stats')} icon="📊" label="الإحصائيات" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => handleTabChange('products')} icon="📦" label="المخزن" badge={lowStockCount > 0 ? lowStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => handleTabChange('categories')} icon="🏷️" label="الأقسام" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => handleTabChange('orders', '')} icon="🛍️" label="الطلبات" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => handleTabChange('members')} icon="👥" label="الأعضاء" />
          <AdminNavButton active={activeTab === 'suppliers'} onClick={() => handleTabChange('suppliers')} icon="🚛" label="الموردين" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => handleTabChange('reports')} icon="📈" label="الأرباح" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon="🛠️" label="الإعدادات" />
        </nav>

        <div className="mt-auto hidden lg:block space-y-4">
           <button onClick={props.onToggleSound} className={`w-full py-3 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 ${props.soundEnabled ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-700/30 text-slate-500 border-slate-700/50'}`}>
             <span>{props.soundEnabled ? '🔔 منبه مفعل' : '🔕 منبه صامت'}</span>
           </button>
           <button onClick={props.onLogout} className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">خروج 👋</button>
        </div>
      </aside>

      <main className="flex-grow p-4 md:p-12 bg-slate-50/50 overflow-y-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h3 className="text-2xl md:text-4xl font-black text-slate-800">{tabTitles[activeTab]}</h3>
             <p className="text-slate-400 text-xs font-bold mt-1">نظام إدارة فاقوس المتطور</p>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
             <button onClick={props.onOpenInvoiceForm} className="flex-grow md:flex-initial bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-xl">🧾 فاتورة</button>
             <button onClick={props.onOpenAddForm} className="flex-grow md:flex-initial bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs shadow-xl">📦 صنف جديد</button>
           </div>
        </div>

        {props.isLoading && safeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-slate-400 text-sm">جاري جلب البيانات...</p>
          </div>
        ) : (
          <div className="animate-fadeIn">
            {renderTabContent()}
          </div>
        )}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 px-4 lg:px-8 py-2.5 lg:py-4 rounded-xl lg:rounded-2xl font-black transition-all relative shrink-0 min-w-[70px] lg:min-w-0 ${active ? 'bg-emerald-600 text-white shadow-xl scale-105 z-10' : 'text-slate-400 hover:bg-slate-800'}`}>
    <span className="text-lg lg:text-xl">{icon}</span>
    <span className="text-[8px] lg:text-sm whitespace-nowrap">{label}</span>
    {badge && <span className="absolute -top-1 -left-1 lg:top-auto lg:left-4 bg-rose-500 text-white text-[7px] lg:text-[8px] w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full border-2 border-slate-900">{badge}</span>}
  </button>
);

export default AdminDashboard;
