
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category } from '../../types';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  initialFilter?: string;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ products, categories, adminSearch, setAdminSearch, onOpenEditForm, onDeleteProduct, initialFilter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState(initialFilter || 'all');
  const itemsPerPage = 10;

  // مزامنة الفلتر عند التغيير الخارجي
  useEffect(() => {
    if (initialFilter) {
      setCurrentFilter(initialFilter);
      setCurrentPage(1);
    }
  }, [initialFilter]);

  // تصفير الصفحة عند تغيير البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch]);

  const filteredProducts = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    let result = products;

    // تطبيق فلتر النواقص إذا كان نشطاً
    if (currentFilter === 'low_stock') {
      result = result.filter(p => Number(p.stockQuantity || 0) < (p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5));
    }

    // تطبيق البحث النصي
    if (q) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && String(p.barcode).includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, adminSearch, currentFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* أزرار التصفية السريعة */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto">
          <button 
            onClick={() => setCurrentFilter('all')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${currentFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            الكل ({products.length})
          </button>
          <button 
            onClick={() => setCurrentFilter('low_stock')}
            className={`flex-grow md:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all ${currentFilter === 'low_stock' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:text-rose-500'}`}
          >
            نواقص ({products.filter(p => Number(p.stockQuantity || 0) < (p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5)).length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الباركود..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all" 
          />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>

      {currentFilter === 'low_stock' && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
             <span className="text-xl">⚠️</span>
             <p className="text-rose-600 font-black text-xs md:text-sm">أنت تشاهد حالياً نواقص المخزن فقط (أقل من 5 قطع)</p>
          </div>
          <button onClick={() => setCurrentFilter('all')} className="text-rose-400 hover:text-rose-600 font-black text-xs underline">عرض كل المنتجات</button>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-8 py-5">المنتج</th>
              <th className="px-8 py-5">القسم</th>
              <th className="px-8 py-5">المخزون</th>
              <th className="px-8 py-5">السعر</th>
              <th className="px-8 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                        <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div>
                        <p className="font-black text-slate-700">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black">
                      {categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {(() => {
                      const isLow = Number(p.stockQuantity || 0) < (p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5);
                      const unitText = p.unit || 'قطعة';
                      const equivalents = p.units
                        ? p.units
                            .filter(u => u.isActive === 1 && (u.conversionFactor || 1) > 1)
                            .map(u => {
                              const qty = Math.floor(Number(p.stockQuantity || 0) / u.conversionFactor);
                              return `${qty} ${u.unitName}`;
                            })
                        : [];
                      return (
                        <div className="flex flex-col gap-1 text-right">
                          <span className={`font-black px-3 py-1 rounded-full text-xs w-max ${isLow ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                            {p.stockQuantity} {unitText}
                          </span>
                          {equivalents.length > 0 && (
                            <span className="text-[9px] text-slate-400 font-bold leading-normal">
                              يعادل: {equivalents.join(' | ')}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-5 font-black text-slate-900 text-lg">
                    {p.price.toLocaleString()} <small className="text-[10px] text-emerald-600">ج.م</small>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => onOpenEditForm(p)} 
                        className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="تعديل المنتج"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => { if(confirm('حذف المنتج نهائياً من المخزن؟')) onDeleteProduct(p.id) }} 
                        className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="حذف المنتج"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">
                  لا توجد منتجات مطابقة لهذا الفلتر أو البحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* أدوات التحكم بالترقيم (Pagination UI) */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            عرض الصفحة {currentPage} من أصل {totalPages} صفحات
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              السابق 🡒
            </button>
            
            <div className="flex gap-1">
              {Array.from({length: totalPages}, (_, i) => i + 1).map(num => (
                <button 
                  key={num}
                  onClick={() => { setCurrentPage(num); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === num ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {num}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              🡐 التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
