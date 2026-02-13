
import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, SeoSettings } from '../types';
import { generateProductDescription, generateSeoData } from '../services/geminiService';

interface AdminProductFormProps {
  product: Product | null;
  categories: Category[];
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ product, categories, onSubmit, onCancel }) => {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    wholesalePrice: '', // الحقل الجديد
    categoryId: '',
    stockQuantity: '0',
    unit: 'piece' as 'piece' | 'kg' | 'gram',
    barcode: '',
    sizes: '',
    colors: '',
    images: [] as string[]
  });

  const [seoData, setSeoData] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        wholesalePrice: product.wholesalePrice?.toString() || '',
        categoryId: product.categoryId || (categories[0]?.id || ''),
        stockQuantity: (product.stockQuantity || 0).toString(),
        unit: product.unit || 'piece',
        barcode: product.barcode || '',
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        images: product.images || []
      });
      if (product.seoSettings) setSeoData(product.seoSettings);
    } else {
      setFormData({
        name: '', description: '', price: '', wholesalePrice: '', categoryId: categories[0]?.id || '', 
        stockQuantity: '0', unit: 'piece', barcode: '', sizes: '', colors: '', images: []
      });
      setSeoData({ metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' });
    }
  }, [product?.id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل');

    const productData: Product = {
      id: product ? product.id : 'p_' + Date.now(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
      categoryId: formData.categoryId,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
      unit: formData.unit,
      barcode: formData.barcode,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : undefined,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c !== '') : undefined,
      images: formData.images,
      createdAt: product ? product.createdAt : Date.now(),
      salesCount: product ? product.salesCount : 0,
      seoSettings: {
        ...seoData,
        slug: seoData.slug || formData.name.toLowerCase().replace(/ /g, '-')
      }
    };
    onSubmit(productData);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
          <p className="text-emerald-600 mt-2 font-bold uppercase tracking-widest text-xs">نظام إدارة مبيعات سوق العصر</p>
        </div>
        <button type="button" onClick={onCancel} className="bg-white border-2 border-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-500 mr-2">اسم المنتج</label>
              <input required value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" placeholder="مثال: طماطم بلدي" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">سعر الجملة (التكلفة)</label>
              <input required type="number" step="0.01" value={formData.wholesalePrice} onChange={e => handleChange('wholesalePrice', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">سعر البيع (للجمهور)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => handleChange('price', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">التصنيف</label>
              <select required value={formData.categoryId} onChange={e => handleChange('categoryId', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">وحدة القياس</label>
              <select value={formData.unit} onChange={e => handleChange('unit', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition">
                <option value="piece">بالقطعة</option>
                <option value="kg">بالكيلو</option>
                <option value="gram">بالجرام</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">الكمية بالمخزن</label>
              <input required type="number" value={formData.stockQuantity} onChange={e => handleChange('stockQuantity', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">رقم الباركود</label>
              <input value={formData.barcode} onChange={e => handleChange('barcode', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition text-left" dir="ltr" placeholder="628xxxxxxxx" />
            </div>
          </div>
        </section>

        <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-emerald-600 transition transform hover:-translate-y-1 active:scale-95">
          {product ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
