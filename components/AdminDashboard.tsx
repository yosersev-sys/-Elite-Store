
import React, { useState, useMemo } from 'react';
import { Product, Category, Order, AdminTab } from '../types';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOpenAddForm: () => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, categories, orders, onOpenAddForm, onOpenEditForm, onDeleteProduct, onAddCategory, onDeleteCategory 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [newCatName, setNewCatName] = useState('');
  const [deploymentStep, setDeploymentStep] = useState(1);
  
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue: totalRevenue.toLocaleString(),
      sales: orders.length,
      productCount: products.length,
      catCount: categories.length
    };
  }, [products, categories, orders]);

  const nextStep = () => setDeploymentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setDeploymentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex flex-col lg:flex-row min-h-[700px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-fadeIn">
      
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xl font-black text-white tracking-tight">لوحة الإدارة</span>
        </div>
        
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('stats')} className={`w-full text-right px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>الإحصائيات</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-right px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-slate-800'} flex items-center justify-between`}>
            <span>الطلبات</span>
            {orders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{orders.length}</span>}
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-right px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>المنتجات</button>
          <button onClick={() => setActiveTab('categories')} className={`w-full text-right px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>التصنيفات</button>
          
          <div className="pt-8 mt-8 border-t border-slate-800">
            <button 
              onClick={() => setActiveTab('deployment-guide')} 
              className={`w-full text-right px-5 py-4 rounded-2xl font-black transition-all flex items-center gap-3 ${activeTab === 'deployment-guide' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              دليل الرفع والربط (تفاعلي)
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-grow p-10 bg-slate-50 overflow-y-auto">
        
        {activeTab === 'stats' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-slate-800">نظرة عامة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard title="إجمالي الإيرادات" value={`${stats.revenue} ر.س`} icon="💰" color="bg-green-500" />
              <StatCard title="عدد الطلبات" value={stats.sales} icon="📦" color="bg-blue-500" />
              <StatCard title="المنتجات" value={stats.productCount} icon="🏷️" color="bg-indigo-500" />
              <StatCard title="التصنيفات" value={stats.catCount} icon="📁" color="bg-orange-500" />
            </div>
          </div>
        )}

        {activeTab === 'deployment-guide' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-emerald-600 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-white/20 p-6 rounded-[2rem] backdrop-blur-md animate-bounce">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-center md:text-right">
                    <h3 className="text-3xl font-black mb-1">دليل الرفع التفاعلي 🎬</h3>
                    <p className="text-emerald-100 font-bold opacity-90">شرح مرئي خطوة بخطوة لربط موقعك بالإنترنت.</p>
                  </div>
               </div>
               
               <div className="mt-8 relative h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 right-0 h-full bg-white transition-all duration-700"
                    style={{ width: `${(deploymentStep / 4) * 100}%` }}
                  ></div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl min-h-[450px] flex flex-col">
              
              {deploymentStep === 1 && (
                <div className="space-y-6 animate-slideLeft">
                   <div className="flex items-center gap-4 text-emerald-600">
                     <span className="text-5xl font-black opacity-20">01</span>
                     <h4 className="text-2xl font-black text-slate-900">الخطوة الأولى: رفع الكود لـ GitHub</h4>
                   </div>
                   <p className="text-slate-500 font-bold leading-relaxed">افتح Terminal في مجلد المشروع وانسخ هذه الأوامر بالترتيب. هذه العملية تضمن وجود نسخة من موقعك في السحاب (Cloud).</p>
                   
                   <div className="bg-slate-900 rounded-2xl p-6 text-indigo-400 font-mono text-sm space-y-3 relative group">
                      <button className="absolute top-4 left-4 text-[10px] bg-slate-800 px-3 py-1 rounded-lg text-slate-400 hover:text-white transition">Copy</button>
                      <p><span className="text-emerald-500">git</span> init</p>
                      <p><span className="text-emerald-500">git</span> add .</p>
                      <p><span className="text-emerald-500">git</span> commit -m "إطلاق النسخة الأولى"</p>
                      <p><span className="text-emerald-500">git</span> remote add origin <span className="text-indigo-300">https://github.com/yosersev-sys/-Elite-Store.git</span></p>
                      <p><span className="text-emerald-500">git</span> push -u origin main</p>
                   </div>
                </div>
              )}

              {deploymentStep === 2 && (
                <div className="space-y-6 animate-slideLeft">
                   <div className="flex items-center gap-4 text-emerald-600">
                     <span className="text-5xl font-black opacity-20">02</span>
                     <h4 className="text-2xl font-black text-slate-900">الخطوة الثانية: الربط في Hostinger</h4>
                   </div>
                   <p className="text-slate-500 font-bold leading-relaxed">ادخل للوحة Hostinger hPanel وابحث عن قسم <span className="text-indigo-600">Git</span>.</p>
                   
                   <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4 shadow-inner">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-10 bg-white rounded-xl border border-slate-200 flex items-center px-4 text-[10px] font-bold text-slate-500 overflow-hidden">Repo: https://github.com/yosersev-sys/-Elite-Store.git</div>
                        <div className="h-10 bg-white rounded-xl border border-slate-200 flex items-center px-4 text-xs font-bold text-slate-400">Install Directory: /public_html</div>
                        <button className="w-full bg-indigo-600 text-white h-12 rounded-xl font-black shadow-lg shadow-indigo-100">Create Repository Link</button>
                      </div>
                   </div>
                </div>
              )}

              {deploymentStep === 3 && (
                <div className="space-y-6 animate-slideLeft">
                   <div className="flex items-center gap-4 text-emerald-600">
                     <span className="text-5xl font-black opacity-20">03</span>
                     <h4 className="text-2xl font-black text-slate-900">الخطوة الثالثة: التحديث التلقائي</h4>
                   </div>
                   <p className="text-slate-500 font-bold leading-relaxed">بمجرد الضغط على زر <span className="text-emerald-600">Auto Deployment</span> في Hostinger، انسخ الرابط الذي سيظهر لك.</p>
                   
                   <div className="flex flex-col items-center justify-center py-10 bg-emerald-50 rounded-[2rem] border-2 border-dashed border-emerald-200">
                      <div className="text-4xl mb-4">🔗</div>
                      <p className="text-emerald-800 font-black text-center max-w-xs">ضعه في إعدادات GitHub (Webhooks) ليتم تحديث الموقع تلقائياً عند أي تغيير.</p>
                   </div>
                </div>
              )}

              {deploymentStep === 4 && (
                <div className="space-y-6 animate-slideLeft text-center">
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h4 className="text-3xl font-black text-slate-900">مبروك! موقعك الآن حي 🌍</h4>
                   <p className="text-slate-500 font-bold max-w-md mx-auto">لقد أكملت جميع الخطوات. رابط موقعك على GitHub هو:</p>
                   <p className="text-indigo-600 font-mono text-sm break-all font-bold">https://github.com/yosersev-sys/-Elite-Store.git</p>
                   
                   <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="p-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition">توثيق الدفع لجيمناي</a>
                      <button onClick={() => setDeploymentStep(1)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition">إعادة الدليل</button>
                   </div>
                </div>
              )}

              <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-50">
                 <button 
                  onClick={prevStep} 
                  disabled={deploymentStep === 1}
                  className={`px-8 py-4 rounded-2xl font-black transition-all ${deploymentStep === 1 ? 'opacity-0 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                 >
                   السابق
                 </button>
                 <div className="flex gap-2">
                   {[1,2,3,4].map(s => (
                     <div key={s} className={`w-2 h-2 rounded-full transition-all ${deploymentStep === s ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`}></div>
                   ))}
                 </div>
                 <button 
                  onClick={nextStep} 
                  disabled={deploymentStep === 4}
                  className={`px-8 py-4 rounded-2xl font-black transition-all ${deploymentStep === 4 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 active:scale-95'}`}
                 >
                   {deploymentStep === 4 ? 'تم الانتهاء' : 'الخطوة التالية'}
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-3xl font-black text-slate-800">إدارة المخزون</h3>
               <button onClick={onOpenAddForm} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95">
                 + إضافة منتج
               </button>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">المنتج</th>
                    <th className="px-8 py-6">السعر</th>
                    <th className="px-8 py-6">المخزون</th>
                    <th className="px-8 py-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white" alt="" />
                          <div>
                            <div className="font-black text-slate-800">{p.name}</div>
                            <div className="text-[10px] font-black text-slate-400">{categories.find(c => c.id === p.categoryId)?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-indigo-600">{p.price} ر.س</td>
                      <td className="px-8 py-5">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stockQuantity <= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {p.stockQuantity} قطعة
                         </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => onOpenEditForm(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-slate-800">الطلبات الواردة</h3>
            <div className="grid gap-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center font-black text-slate-400">#</div>
                      <div>
                        <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{order.id}</div>
                        <div className="text-xl font-black text-slate-800">{order.customerName}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-12">
                      <div className="text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase">المدينة</div>
                        <div className="font-bold">{order.city}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase">المجموع</div>
                        <div className="font-black text-indigo-600">{order.total} ر.س</div>
                      </div>
                      <div className={`px-5 py-2 rounded-2xl text-xs font-black ${order.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {order.status === 'pending' ? 'قيد الانتظار' : 'تم التوصيل'}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-slate-800">الأقسام</h3>
            <div className="flex gap-4">
              <input 
                placeholder="اسم القسم الجديد..." 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                className="flex-grow bg-white px-8 py-5 rounded-[2rem] shadow-sm outline-none border border-slate-100 focus:border-indigo-300 transition"
              />
              <button 
                onClick={() => { if(newCatName) { onAddCategory({id: 'cat_'+Date.now(), name: newCatName}); setNewCatName(''); } }}
                className="bg-slate-900 text-white px-10 rounded-[2rem] font-black active:scale-95 transition"
              >
                إضافة
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <span className="font-black text-slate-800">{cat.name}</span>
                  <button onClick={() => onDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 p-3 rounded-xl transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      
      <style>{`
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideLeft { animation: slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition duration-500 group">
    <div className={`${color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-lg transition group-hover:scale-110 group-hover:rotate-6`}>{icon}</div>
    <div>
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
    </div>
  </div>
);

export default AdminDashboard;
