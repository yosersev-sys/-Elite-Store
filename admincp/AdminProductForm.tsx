
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
    wholesalePrice: '',
    categoryId: '',
    stockQuantity: '0',
    unit: 'piece' as 'piece' | 'kg' | 'gram',
    barcode: '',
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
        images: product.images || []
      });
      if (product.seoSettings) setSeoData(product.seoSettings);
    } else {
      setFormData({
        name: '', description: '', price: '', wholesalePrice: '', 
        categoryId: categories[0]?.id || '', stockQuantity: '0', 
        unit: 'piece', barcode: '', images: []
      });
      setSeoData({ metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' });
    }
  }, [product, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAiDescription = async () => {
    if (!formData.name) return alert('يرجى إدخال اسم المنتج أولاً');
    setIsLoadingAi(true);
    try {
      const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
      const desc = await generateProductDescription(formData.name, catName);
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (err) {
      alert('فشل في الاتصال بالذكاء الاصطناعي');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('يرجى إدخال الاسم والوصف أولاً');
    setIsLoadingSeo(true);
    try {
      const data = await generateSeoData(formData.name, formData.description);
      if (data) setSeoData(data);
    } catch (err) {
      alert('خطأ أثناء توليد بيانات SEO');
    } finally {
      setIsLoadingSeo(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل للمنتج');

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
      images: formData.images,
      createdAt: product ? product.createdAt : Date.now(),
      salesCount: product ? product.salesCount : 0,
      seoSettings: seoData
    };
    onSubmit(productData);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fadeIn pb-24">
      {/* الترويسة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <p className="text-emerald-600 font-bold mt-1 uppercase tracking-widest text-xs">إدارة مخزون سوق العصر</p>
        </div>
        <button type="button" onClick={onCancel} className="bg-white border-2 border-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-black hover:bg-rose-50 hover:text-rose-500 transition">
          إلغاء التغييرات
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        
        {/* القسم 1: الصور - تم إصلاحه لضمان الظهور */}
        <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">🖼️</span>
            صور المنتج
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {formData.images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-[2rem] overflow-hidden group border-4 border-slate-50 shadow-md">
                <img src={img} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))}
                  className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black"
                >
                  حذف
                </button>
                {index === 0 && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase">الرئيسية</div>}
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <span className="text-4xl group-hover:scale-125 transition-transform">➕</span>
              <span className="text-[10px] font-black uppercase tracking-widest">إضافة صورة</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
          </div>
        </section>

        {/* القسم 2: المعلومات الأساسية */}
        <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">📝</span>
            المعلومات الأساسية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم المنتج</label>
              <input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition"
                placeholder="مثال: أرز بسمتي هندي"
              />
            </div>

            <div className="space-y-2 relative md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">وصف المنتج</label>
              <textarea 
                required 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition min-h-[150px] resize-none"
                placeholder="اكتب وصفاً جذاباً للمنتج..."
              />
              <button 
                type="button" 
                onClick={handleAiDescription} 
                disabled={isLoadingAi}
                className="absolute left-4 bottom-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {isLoadingAi ? 'جاري التوليد...' : '✨ وصف ذكي (AI)'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">التصنيف</label>
              <select 
                required 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition cursor-pointer"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الباركود</label>
              <input 
                value={formData.barcode} 
                onChange={e => setFormData({...formData, barcode: e.target.value})} 
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition text-left" 
                dir="ltr"
                placeholder="628xxxxxxxx"
              />
            </div>
          </div>
        </section>

        {/* القسم 3: الأسعار والمخزون */}
        <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">💰</span>
            الأسعار والمخزون
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">سعر الجملة (التكلفة)</label>
              <input 
                required type="number" step="0.01"
                value={formData.wholesalePrice} 
                onChange={e => setFormData({...formData, wholesalePrice: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">سعر البيع</label>
              <input 
                required type="number" step="0.01"
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">وحدة القياس</label>
              <div className="flex gap-2">
                {(['piece', 'kg', 'gram'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({...formData, unit: u})}
                    className={`flex-grow py-4 rounded-2xl font-black text-[10px] transition-all border-2 ${formData.unit === u ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:border-emerald-200'}`}
                  >
                    {u === 'piece' ? 'بالقطعة' : u === 'kg' ? 'بالكيلو' : 'بالجرام'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الكمية المتوفرة</label>
              <input 
                required type="number"
                value={formData.stockQuantity} 
                onChange={e => setFormData({...formData, stockQuantity: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-400 font-bold transition"
              />
            </div>
          </div>
        </section>

        {/* القسم 4: SEO */}
        <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">🚀</span>
              SEO ذكي
            </h3>
            <button 
              type="button" 
              onClick={handleAiSeo} 
              disabled={isLoadingSeo}
              className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {isLoadingSeo ? 'جاري التحليل...' : 'توليد SEO ذكي ✨'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Meta Title</label>
              <input 
                value={seoData.metaTitle} 
                onChange={e => setSeoData({...seoData, metaTitle: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-400 font-bold transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">رابط المنتج (Slug)</label>
              <input 
                value={seoData.slug} 
                onChange={e => setSeoData({...seoData, slug: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-400 font-bold transition text-left"
                dir="ltr"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Meta Description</label>
              <textarea 
                value={seoData.metaDescription} 
                onChange={e => setSeoData({...seoData, metaDescription: e.target.value})}
                className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-400 font-bold transition h-24 resize-none"
              />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-95"
        >
          {product ? 'حفظ كافة التغييرات' : 'نشر المنتج في المتجر 🚀'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
