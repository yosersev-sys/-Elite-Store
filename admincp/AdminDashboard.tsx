
import React, { useState, useEffect } from 'react';
import { Product, Category, Order, User } from '../types';
import StatsTab from './tabs/StatsTab.tsx';
import ProductsTab from './tabs/ProductsTab.tsx';
import CategoriesTab from './tabs/CategoriesTab.tsx';
import OrdersTab from './tabs/OrdersTab.tsx';
import MembersTab from './tabs/MembersTab.tsx';
import ReportsTab from './tabs/ReportsTab.tsx';
import SettingsTab from './tabs/SettingsTab.tsx';
import ApiKeysTab from './tabs/ApiKeysTab.tsx';

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
  onRefreshData?: () => void;
}

export type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'members' | 'reports' | 'settings' | 'api-keys';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [adminSearch, setAdminSearch] = useState('');

  // نستخدم useEffect للتأكد من أن البيانات موجودة عند فتح اللوحة
  useEffect(() => {
    if (props.onRefreshData) {
      props.onRefreshData();
    }
  }, []);

  const tabTitles: Record<AdminTab, string> = {
    stats: 'نظرة عامة على النشاط',
    products: 'إدارة مخزون الأصناف',
    categories: 'إدارة أقسام المتجر',
    orders: 'أرشيف الطلبات والديون',
    members: 'إدارة شؤون الأعضاء',
    reports: 'تقارير الأرباح المحاسبية',
    settings: 'إعدادات النظام',
    'api-keys': 'إدارة مفاتيح API الذكية'
  };

  const renderTabContent = () => {
    // التحقق من وجود بيانات قبل العرض لتجنب الانهيار أو المساحات الفارغة
    const hasData = props.products.length > 0 || props.orders.length > 0;
    
    if (!hasData && activeTab !== 'settings' && activeTab !== 'api-keys') {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="font-black text-slate-400">جاري مزامنة بيانات النظام...</p>
           <button onClick={props.onRefreshData} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs">تحديث يدوي 🔄</button>
        </div>
      );
    }

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
      case 'api-keys':
        return <ApiKeysTab />;
      default:
        return <StatsTab {...props} onNavigateToTab={setActiveTab} />;
    }
  };

  const lowStockCount = props.products.filter(p => Number(p.stockQuantity || 0) < 5).length;

  return (
    <div className="flex flex-col lg:flex-row min-h-[90vh] md:min-h-[85vh] bg-white rounded-[1.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-emerald-50 animate-fadeIn">
      
      {/* Sidebar / Top Nav on Mobile */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-4 lg:p-10 flex flex-col shrink-0">
        <div className="hidden lg:block mb-12">
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
        
        <nav className="flex lg:flex-col flex-row gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-3 lg:pb-0 -mx-2 lg:mx-0 px-2 lg:px-0">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setAdminSearch(''); }} label="الإحصائيات" icon="📊" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setAdminSearch(''); }} label="المخزن" icon="📦" badge={lowStockCount > 0 ? lowStockCount : undefined} />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); }} label="الأقسام" icon="🏷️" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setAdminSearch(''); }} label="الطلبات" icon="🛍️" />
          <AdminNavButton active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setAdminSearch(''); }} label="الأعضاء" icon="👥" />
          <AdminNavButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setAdminSearch(''); }} label="الأرباح" icon="📈" />
          <AdminNavButton active={activeTab === 'api-keys'} onClick={() => { setActiveTab('api-keys'); }} label="مفاتيح API" icon="🔑" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); }} label="الإعدادات" icon="🛠️" />
        </nav>

        <div className="mt-4 lg:mt-auto space-y-3 hidden lg:block">
          <div className="p-4 bg-slate-800/50 rounded-3xl border border-slate-700/50">
            <button 
              onClick={props.onToggleSound} 
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-black text-xs transition-all border-2 ${props.soundEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}
            >
              <span>{props.soundEnabled ? '🔔 التنبيهات مفعلة' : '🔕 التنبيهات معطلة'}</span>
            </button>
          </div>
          <button onClick={props.onLogout} className="w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300">تسجيل الخروج 👋</button>
        </div>
      </aside>

      <main className="flex-grow p-3 md:p-12 bg-slate-50/50 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
           <div className="flex items-center justify-between w-full md:w-auto">
             <div>
               <h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">{tabTitles[activeTab]}</h3>
               <p className="text-slate-400 text-[10px] md:text-sm font-bold mt-1">إدارة فاقوس v4.5</p>
             </div>
             {/* زر تحديث سريع للموبايل */}
             <button onClick={props.onRefreshData} className="md:hidden p-2 bg-white rounded-xl shadow-sm text-emerald-600" title="تحديث البيانات">🔄</button>
           </div>
           
           <div className="flex gap-2 w-full md:w-auto">
             <button onClick={props.onOpenInvoiceForm} className="flex-grow md:flex-initial bg-emerald-600 text-white px-4 lg:px-8 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs shadow-xl flex items-center justify-center gap-2"><span>🧾</span> فاتورة</button>
             <button onClick={props.onOpenAddForm} className="flex-grow md:flex-initial bg-slate-900 text-white px-4 lg:px-8 py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs shadow-xl"><span>📦</span> صنف جديد</button>
           </div>
        </div>

        <div className="animate-fadeIn min-h-[50vh]">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-8 py-2.5 lg:py-4 rounded-xl lg:rounded-[1.5rem] font-black text-xs lg:text-sm transition-all duration-300 relative whitespace-nowrap flex-shrink-0 lg:w-full ${
      active 
      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 scale-105 lg:scale-105 z-10' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <span className="text-lg lg:text-xl">{icon}</span>
    <span className="text-right">{label}</span>
    {(badge || 0) > 0 && (
      <span className="absolute left-1 lg:left-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[7px] lg:text-[8px] font-black w-3.5 h-3.5 lg:w-5 lg:h-5 flex items-center justify-center rounded-full border border-slate-900 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

export default AdminDashboard;
