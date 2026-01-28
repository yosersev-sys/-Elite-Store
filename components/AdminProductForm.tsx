
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
    stockQuantity: '0', // الحالة الجديدة
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
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        categoryId: product.categoryId,
        stockQuantity: (product.stockQuantity || 0).toString(),
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        images: product.images || []
      });
      if (product.seoSettings) setSeoData(product.seoSettings);
    } else {
      setFormData({
        name: '', description: '', price: '', categoryId: categories[0]?.id || '', 
        stockQuantity: '10', sizes: '', colors: '', images: []
      });
    }
  }, [product, categories]);

  useEffect(() => {
    if (!product && formData.name && !seoData.slug) {
      setSeoData(prev => ({ ...prev, slug: formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
    }
  }, [formData.name, product]);

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
    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
    const desc = await generateProductDescription(formData.name, catName);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('يرجى إدخال الاسم والوصف أولاً لتوليد بيانات SEO دقيقة');
    setIsLoadingSeo(true);
    const data = await generateSeoData(formData.name, formData.description);
    if (data) setSeoData(data);
    setIsLoadingSeo(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل');

    const productData: Product = {
      id: product ? product.id : Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: formData.categoryId,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : undefined,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c !== '') : undefined,
      images: formData.images,
      createdAt: product ? product.createdAt : Date.now(),
      salesCount: product ? product.salesCount : 0,
      seoSettings: seoData
    };
    onSubmit(productData);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {product ? 'تعديل بيانات المنتج' : 'إضافة منتج احترافي'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">قم بإعداد المنتج وتجهيزه لمحركات البحث العالمية</p>
        </div>
        <button onClick={onCancel} className="bg-white border-2 border-slate-100 text-slate-500 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition shadow-sm">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        
        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-indigo-600 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">01</span>
              المعلومات الأساسية والمعرض
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-slate-50 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {index === 0 && <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-white text-[10px] text-center py-1 font-bold">الرئيسية</div>}
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50 transition">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span className="text-[10px] font-bold">إضافة صورة</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">اسم المنتج</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="مثال: ساعة ذكية الترا" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">التصنيف</label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">السعر (ر.س)</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="0.00" />
            </div>
            {/* الحقل الجديد: كمية المخزون */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">الكمية المتوفرة في المخزون</label>
              <input required type="number" min="0" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition" placeholder="مثال: 50" />
            </div>
            <div className="space-y-2 relative md:col-span-2">
              <label className="text-sm font-bold text-slate-500 mr-2">الوصف</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition min-h-[150px] resize-none" placeholder="اكتب وصفاً جذاباً..." />
              <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="absolute left-4 bottom-4 text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-slate-900 transition disabled:opacity-50">
                {isLoadingAi ? 'جاري التوليد...' : 'وصف ذكي ✨'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-emerald-600 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">02</span>
              تحسين محركات البحث (SEO)
            </h3>
            <button type="button" onClick={handleAiSeo} disabled={isLoadingSeo} className="text-xs font-black bg-emerald-500 text-white px-5 py-2.5 rounded-2xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-100 disabled:opacity-50">
              {isLoadingSeo ? 'جاري التحليل...' : 'توليد SEO ذكي ✨'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 flex justify-between">
                  Meta Title (عنوان البحث)
                  <span className={`text-[10px] ${seoData.metaTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
                    {seoData.metaTitle.length}/60 حرف
                  </span>
                </label>
                <input value={seoData.metaTitle} onChange={e => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 transition" placeholder="العنوان الذي يظهر في جوجل" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Slug (رابط المنتج)</label>
                <div className="flex items-center bg-slate-50 rounded-2xl px-6 border-2 border-transparent focus-within:border-emerald-300 transition">
                  <span className="text-slate-400 text-xs font-medium">elite-store.com/p/</span>
                  <input value={seoData.slug} onChange={e => setSeoData({...seoData, slug: e.target.value})} className="flex-grow py-4 bg-transparent outline-none text-emerald-700 font-bold" placeholder="product-url-name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 flex justify-between">
                  Meta Description (وصف البحث)
                  <span className={`text-[10px] ${seoData.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                    {seoData.metaDescription.length}/160 حرف
                  </span>
                </label>
                <textarea value={seoData.metaDescription} onChange={e => setSeoData({...seoData, metaDescription: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 transition min-h-[120px] resize-none" placeholder="وصف مخلص يظهر أسفل العنوان في جوجل..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Keywords (كلمات مفتاحية - مفصولة بفاصلة)</label>
                <input value={seoData.metaKeywords} onChange={e => setSeoData({...seoData, metaKeywords: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 transition" placeholder="مثال: ساعة، ذكية، تقنية، عروض" />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-sm font-bold text-slate-500">معاينة نتيجة البحث (Google Preview)</label>
              <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-2 max-w-lg">
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold">E</div>
                  <span>Elite Store › p › {seoData.slug || '...'}</span>
                </div>
                <h4 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight">
                  {seoData.metaTitle || (formData.name ? `${formData.name} | متجر النخبة` : 'عنوان المنتج يظهر هنا')}
                </h4>
                <p className="text-[14px] text-[#4d5156] leading-relaxed line-clamp-2">
                  <span className="text-slate-500">{new Date().toLocaleDateString('ar-SA')} — </span>
                  {seoData.metaDescription || 'هذا الوصف سيظهر للعملاء عند بحثهم عن المنتج في محرك بحث جوجل، تأكد من كتابته بشكل جذاب لزيادة النقرات.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-indigo-600 transition-all duration-500 transform hover:-translate-y-2 active:scale-95">
          {product ? 'حفظ كافة التغييرات' : 'نشر المنتج الآن 🚀'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
