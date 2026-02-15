
import React, { useMemo } from 'react';
import { Product, Category } from '../../types';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ products, categories, adminSearch, setAdminSearch, onOpenEditForm, onDeleteProduct }) => {
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      (p.barcode && String(p.barcode).includes(adminSearch))
    );
  }, [products, adminSearch]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الباركود..." 
            value={adminSearch} 
            onChange={e => setAdminSearch(e.target.value)} 
            className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm outline-none shadow-sm font-bold" 
          />
          <span className="absolute left-4 top-3.5 text-slate-300">🔍</span>
        </div>
      </div>
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-8 py-5">المنتج</th>
              <th className="px-8 py-5">القسم</th>
              <th className="px-8 py-5">المخزون</th>
              <th className="px-8 py-5">السعر</th>
              <th className="px-8 py-5">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={p.images[0]} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    <p className="font-bold text-slate-700">{p.name}</p>
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-400 font-bold">
                  {categories.find(c => c.id === p.categoryId)?.name || 'عام'}
                </td>
                <td className="px-8 py-5">
                  <span className={`font-black px-3 py-1 rounded-full text-xs ${Number(p.stockQuantity || 0) < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                    {p.stockQuantity} وحدة
                  </span>
                </td>
                <td className="px-8 py-5 font-black text-emerald-600">{p.price} ج.م</td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button onClick={() => onOpenEditForm(p)} className="p-2 text-blue-500 bg-blue-50 rounded-xl">✎</button>
                    <button onClick={() => { if(confirm('حذف المنتج؟')) onDeleteProduct(p.id) }} className="p-2 text-rose-500 bg-rose-50 rounded-xl">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTab;
