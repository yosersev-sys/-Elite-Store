
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, Order, Brand } from '../types';
import { ApiService } from '../services/api';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateOrder?: (order: Order) => void;
}

type AdminTab = 'stats' | 'products' | 'categories' | 'brands' | 'orders' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onDeleteCategory, onUpdateOrder
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [newCatName, setNewCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrand, setNewBrand] = useState({ name: '', logo: '' });
  
  useEffect(() => {
    const fetchBrands = async () => {
      const data = await ApiService.getBrands();
      setBrands(data);
    };
    fetchBrands();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockCount = products.filter(p => p.stockQuantity < 5).length;
    
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      catCount: categories.length,
      pendingOrders,
      lowStockCount
    };
  }, [products, categories, orders]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleAddBrand = async () => {
    if (!newBrand.name || !newBrand.logo) return alert('يرجى تعبئة كافة الحقول');
    const brandData: Brand = { id: 'br_' + Date.now(), ...newBrand };
    const success = await ApiService.addBrand(brandData);
    if (success) {
      setBrands([...brands, brandData]);
      setNewBrand({ name: '', logo: '' });
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الماركة؟')) return;
    const success = await ApiService.deleteBrand(id);
    if (success) setBrands(brands.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn font-sans">
      
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0 border-r border-slate-800">
        <div className="mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">E</div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">لوحة النخبة</h2>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Admin Control</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <AdminNavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="الرئيسية" icon="📊" />
          <AdminNavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="الطلبات" badge={stats.pendingOrders} icon="🛍️" />
          <AdminNavButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="المخزون" badge={stats.lowStockCount > 0 ? stats.lowStockCount : undefined} icon="📦" />
          <AdminNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="التصنيفات" icon="🏷️" />
          <AdminNavButton active={activeTab === 'brands'} onClick={() => setActiveTab('brands')} label="العلامات التجارية" icon="✨" />
          <AdminNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="الإعدادات" icon="⚙️" />
        </nav>
      </aside>

      <main className="flex-grow p-6 lg:p-10 bg-slate-50/50 overflow-y-auto">
        
        {activeTab === 'stats' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard title="إجمالي الدخل" value={`${stats.revenue} ر.س`} growth="+12%" icon="💰" color="bg-emerald-500" />
              <StatCard title="الطلبات الجديدة" value={stats.pendingOrders} growth="نشط" icon="🔥" color="bg-orange-500" />
              <StatCard title="المخزون الناقص" value={stats.lowStockCount} growth="انتبه" icon="⚠️" color="bg-rose-500" />
              <StatCard title="إجمالي المنتجات" value={stats.productCount} growth="نمو" icon="📦" color="bg-indigo-500" />
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 className="text-xl font-black mb-6 text-slate-800">إضافة علامة تجارية جديدة</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="اسم الماركة (مثال: Apple)" 
                    value={newBrand.name}
                    onChange={e => setNewBrand({...newBrand, name: e.target.value})}
                    className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                  />
                  <input 
                    placeholder="رابط الشعار (SVG أو PNG)" 
                    value={newBrand.logo}
                    onChange={e => setNewBrand({...newBrand, logo: e.target.value})}
                    className="bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                  />
               </div>
               <button onClick={handleAddBrand} className="mt-4 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">إضافة البراند</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {brands.map(brand => (
                <div key={brand.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 relative group">
                  <div className="w-20 h-20 flex items-center justify-center grayscale group-hover:grayscale-0 transition">
                    <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="font-black text-slate-700">{brand.name}</span>
                  <button onClick={() => handleDeleteBrand(brand.id)} className="absolute top-4 right-4 text-rose-300 hover:text-rose-500 transition">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* باقي التبويبات تظل كما هي ... */}
      </main>
    </div>
  );
};

const AdminNavButton = ({ active, onClick, label, icon, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition ${active ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <span>{icon}</span>
    <span className="flex-grow text-right">{label}</span>
    {badge !== undefined && <span className="bg-red-500 text-white text-[9px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-lg border-2 border-slate-900">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, growth, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg`}>{icon}</div>
      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">{growth}</span>
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
    <div className="text-2xl font-black text-slate-800 mt-1">{value}</div>
  </div>
);

export default AdminDashboard;
