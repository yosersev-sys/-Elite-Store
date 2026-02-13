
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

  // مزامنة البيانات فقط عند تغيير المنتج أو عند التحميل الأول
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
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
        name: '', 
        description: '', 
        price: '', 
        categoryId: categories[0]?.id || '', 
        stockQuantity: '0', 
        unit: 'piece',
        barcode: '', 
        sizes: '', 
        colors: '', 
        images: []
      });
      setSeoData({ metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' });
    }
  }, [product?.id]); // نعتمد فقط على ID المنتج لتجنب التكرار اللا نهائي

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSeoChange = (field: keyof SeoSettings, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  const generateRandomBarcode = () => {
    const random = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    handleChange('barcode', random.toString());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const newImg = reader.result;
          setFormData(prev => ({ ...prev, images: [...prev.images, newImg] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAiDescription = async () => {
    if (!formData.name) return alert('يرجى إدخال اسم المنتج أولاً');
    setIsLoadingAi(true);
    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
    const desc = await generateProductDescription(formData.name, catName);
    handleChange('description', desc);
    setIsLoadingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('يرجى إدخال الاسم والوصف أولاً');
    setIsLoadingSeo(true);
    const data = await generateSeoData(formData.name, formData.description);
    if (data) setSeoData(data);
    setIsLoadingSeo(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل');

    const productData: Product = {
      id: product ? product.id : 'p_' + Date.now(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
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
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h2>
          <p className="text-emerald-600 mt-2 font-bold uppercase tracking-widest text-xs">
            {product ? `تعديل المنتج: ${product.name}` : 'نظام إدارة المنتجات والمخزون المطور'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="bg-white border-2 border-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        {/* قسم الصور */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-emerald-600 flex items-center gap-3">معرض الصور</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-slate-50 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-50 transition">
                <span className="text-2xl">+</span>
                <span className="text-[10px] font-bold">إضافة صورة</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* اسم المنتج */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">اسم المنتج</label>
              <input 
                required 
                type="text"
                value={formData.name} 
                onChange={e => handleChange('name', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" 
                placeholder="مثال: طماطم بلدي" 
              />
            </div>
            
            {/* وحدة البيع */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">وحدة البيع</label>
              <div className="flex gap-2">
                {(['piece', 'kg', 'gram'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleChange('unit', u)}
                    className={`flex-grow py-4 rounded-2xl font-black text-sm transition-all border-2 ${formData.unit === u ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-emerald-100'}`}
                  >
                    {u === 'piece' ? 'بالقطعة' : u === 'kg' ? 'بالكيلو' : 'بالجرام'}
                  </button>
                ))}
              </div>
            </div>

            {/* التصنيف */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">التصنيف</label>
              <select 
                required 
                value={formData.categoryId} 
                onChange={e => handleChange('categoryId', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* السعر */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">السعر (ج.م) لكل وحدة</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                value={formData.price} 
                onChange={e => handleChange('price', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" 
                placeholder="0.00" 
              />
            </div>

            {/* المخزون */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">الكمية بالمخزن (بالوحدة المختارة)</label>
              <input 
                required 
                type="number" 
                value={formData.stockQuantity} 
                onChange={e => handleChange('stockQuantity', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" 
                placeholder="مثال: 50" 
              />
            </div>

            {/* الباركود */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">رقم الباركود</label>
              <div className="relative">
                <input 
                  type="text"
                  value={formData.barcode} 
                  onChange={e => handleChange('barcode', e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition text-left" 
                  placeholder="Barcode..." 
                  dir="ltr"
                />
                <button 
                  type="button" 
                  onClick={generateRandomBarcode} 
                  className="absolute left-2 top-2 bg-slate-200 px-3 py-2 rounded-xl text-[10px] font-black hover:bg-slate-300 transition"
                >توليد</button>
              </div>
            </div>

            {/* الوصف */}
            <div className="space-y-2 relative md:col-span-2">
              <label className="text-sm font-bold text-slate-500 mr-2 flex justify-between">
                الوصف
                <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                  {isLoadingAi ? 'جاري التوليد...' : '✨ وصف ذكي (AI)'}
                </button>
              </label>
              <textarea 
                required 
                value={formData.description} 
                onChange={e => handleChange('description', e.target.value)} 
                className="w-full p-6 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition min-h-[150px] resize-none" 
                placeholder="وصف المنتج..." 
              />
            </div>
          </div>
        </section>

        {/* قسم SEO */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-emerald-600 flex items-center gap-3">تحسين محركات البحث (SEO)</h3>
            <button type="button" onClick={handleAiSeo} disabled={isLoadingSeo} className="text-xs font-black bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl hover:bg-emerald-600 hover:text-white transition">
              {isLoadingSeo ? 'جاري التحليل...' : 'توليد SEO ذكي ✨'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">Meta Title</label>
              <input 
                type="text"
                value={seoData.metaTitle} 
                onChange={e => handleSeoChange('metaTitle', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">Slug (الرابط)</label>
              <input 
                type="text"
                value={seoData.slug} 
                onChange={e => handleSeoChange('slug', e.target.value)} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition" 
                dir="ltr" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-500 mr-2">Meta Description</label>
              <textarea 
                value={seoData.metaDescription} 
                onChange={e => handleSeoChange('metaDescription', e.target.value)} 
                className="w-full p-6 bg-slate-50 rounded-2xl border-2 border-transparent outline-none focus:border-emerald-400 focus:bg-white transition min-h-[100px] resize-none" 
              />
            </div>
          </div>
        </section>

        <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-emerald-600 transition transform hover:-translate-y-1 active:scale-95">
          {product ? 'حفظ التعديلات 💾' : 'نشر المحصول في المتجر 🚀'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
