import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, SeoSettings, StockBatch, Supplier } from '../types.ts';
import BarcodeScanner from '../components/BarcodeScanner.tsx';
import { ApiService } from '../services/api.ts';
import { generateProductDescription, generateSeoData } from '../services/geminiService.ts';

interface AdminProductFormProps {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ product, categories, suppliers, onSubmit, onCancel }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [libraryImages, setLibraryImages] = useState<{url: string, productName: string}[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevProductIdRef = useRef<string | null>(null);
  
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchPrice, setNewBatchPrice] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    wholesalePrice: '',
    categoryId: '',
    supplierId: '',
    stockQuantity: '0',
    barcode: '',
    unit: 'piece' as 'piece' | 'kg' | 'gram', 
    sizes: '',
    colors: '',
    images: [] as string[],
    batches: [] as StockBatch[]
  });

  const [seoData, setSeoData] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: ''
  });

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.7)); }
        else { resolve(base64Str); }
      };
    });
  };

  useEffect(() => {
    if (product) {
      if (product.id !== prevProductIdRef.current) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          wholesalePrice: product.wholesalePrice?.toString() || '',
          categoryId: product.categoryId || '',
          supplierId: product.supplierId || '',
          stockQuantity: product.stockQuantity?.toString() || '0',
          barcode: product.barcode ? String(product.barcode) : '', 
          unit: product.unit || 'piece', 
          sizes: product.sizes?.join(', ') || '',
          colors: product.colors?.join(', ') || '',
          images: product.images || [],
          batches: product.batches || []
        });
        if (product.seoSettings) setSeoData(product.seoSettings);
        prevProductIdRef.current = product.id;
      }
    } else prevProductIdRef.current = null;
  }, [product]);

  useEffect(() => {
    if (!product && categories.length > 0 && formData.categoryId === '') {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, product, formData.categoryId]);

  useEffect(() => {
    const total = formData.batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
    setFormData(prev => ({ ...prev, stockQuantity: total.toString() }));
  }, [formData.batches]);

  const openLibrary = async () => {
    setShowLibrary(true);
    setIsLoadingLibrary(true);
    try {
      const items = await ApiService.getAllImages();
      setLibraryImages(items || []);
    } catch (err) { console.error(err); }
    finally { setIsLoadingLibrary(false); }
  };

  const filteredLibrary = libraryImages.filter(img => img.productName.toLowerCase().includes(librarySearch.toLowerCase()));

  const handleAiDescription = async () => {
    if (!formData.name) return alert('يرجى إدخال اسم المنتج أولاً');
    setIsLoadingAi(true);
    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
    const desc = await generateProductDescription(formData.name, catName);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('يرجى إدخال الاسم والوصف أولاً');
    setIsLoadingSeo(true);
    const data = await generateSeoData(formData.name, formData.description);
    if (data) setSeoData(data);
    setIsLoadingSeo(false);
  };

  const handleGenerateBarcode = () => {
    const randomCode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData(prev => ({ ...prev, barcode: randomCode.toString() }));
  };

  const handleAddBatch = () => {
    const qty = parseFloat(newBatchQty);
    const price = parseFloat(newBatchPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return alert("يرجى إدخال بيانات صحيحة");
    const newBatch: StockBatch = { id: 'batch_' + Date.now(), quantity: qty, wholesalePrice: price, createdAt: Date.now() };
    setFormData(prev => ({ ...prev, batches: [...prev.batches, newBatch], wholesalePrice: price.toString() }));
    setNewBatchQty(''); setNewBatchPrice('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsCompressing(true);
    const fileList = Array.from(files) as File[];
    for (const file of fileList) {
      const reader = new FileReader();
      const p = new Promise<void>((resolve) => {
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const compressed = await compressImage(reader.result);
            setFormData(prev => ({ ...prev, images: [...prev.images, compressed] }));
          }
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await p;
    }
    setIsCompressing(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(formData.price);
    if (formData.images.length === 0) return alert('يرجى إضافة صورة');
    setIsSubmitting(true);
    try {
      const productData: Product = {
        id: product ? product.id : Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: finalPrice,
        wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
        categoryId: formData.categoryId,
        supplierId: formData.supplierId || undefined,
        stockQuantity: parseFloat(formData.stockQuantity) || 0,
        barcode: formData.barcode.trim(),
        unit: formData.unit,
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : undefined,
        colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c !== '') : undefined,
        images: formData.images,
        batches: formData.batches,
        createdAt: product ? product.createdAt : Date.now(),
        salesCount: product ? product.salesCount : 0,
        seoSettings: seoData
      };
      await onSubmit(productData);
    } catch (err) { alert('خطأ أثناء الحفظ'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="w-full py-8 px-4 animate-fadeIn pb-32">
      {showScanner && <BarcodeScanner onScan={(code) => setFormData({...formData, barcode: code})} onClose={() => setShowScanner(false)} />}
      {(isSubmitting || isCompressing) && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white p-10 rounded-[3rem] text-center space-y-4 shadow-2xl animate-bounce">
              <div className="w-16 h-16 border-4 border-emerald-50 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-black text-slate-800 text-lg">{isCompressing ? 'تحسين الصور...' : 'نشر المنتج...'}</p>
           </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-slideUp">
            <h3 className="text-2xl font-black mb-2">تجاهل التغييرات؟</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={onCancel} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black">نعم</button>
              <button onClick={() => setShowCancelConfirm(false)} className="flex-grow bg-slate-100 py-4 rounded-2xl font-black">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[2rem] p-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-black">مكتبة الصور 📸</h3>
               <input type="text" placeholder="بحث..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-2" />
            </div>
            <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-6 gap-4 no-scrollbar">
              {filteredLibrary.map((item, i) => (
                <div key={i} onClick={() => { if(!formData.images.includes(item.url)) setFormData(prev => ({...prev, images: [...prev.images, item.url]})); setShowLibrary(false); }} className="cursor-pointer border rounded-xl overflow-hidden aspect-square hover:border-emerald-500 transition-all">
                  <img src={item.url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <button onClick={() => setShowLibrary(false)} className="mt-4 bg-slate-900 text-white py-4 rounded-2xl font-black">إغلاق</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10 px-4">
        <h2 className="text-4xl font-black tracking-tighter">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="bg-white border-2 px-10 py-3 rounded-2xl font-black text-slate-400">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <section className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[2rem] shadow-xl space-y-8 border border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-indigo-600 uppercase tracking-widest">1. المعلومات والملفات</h3>
                <button type="button" onClick={openLibrary} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl font-black text-xs">المكتبة 📸</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center text-slate-300 text-3xl hover:border-emerald-500 hover:text-emerald-500 transition-all">＋</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">اسم المنتج</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">التصنيف</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2 relative">
                  <label className="text-xs font-black text-slate-400 mr-2">وصف المنتج</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-bold min-h-[150px]" />
                  <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="absolute left-4 bottom-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black">{isLoadingAi ? 'جاري الكتابة...' : 'وصف ذكي ✨'}</button>
                </div>
              </div>
           </section>

           <div className="space-y-8">
              <section className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border-t-8 border-emerald-500 space-y-6">
                <h3 className="text-2xl font-black text-emerald-600">📦 المخزون (FIFO)</h3>
                <div className="bg-emerald-50 p-6 rounded-3xl space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="الكمية" value={newBatchQty} onChange={e => setNewBatchQty(e.target.value)} className="p-4 rounded-xl border-none outline-none font-bold" />
                      <input type="number" placeholder="التكلفة" value={newBatchPrice} onChange={e => setNewBatchPrice(e.target.value)} className="p-4 rounded-xl border-none outline-none font-bold" />
                   </div>
                   <button type="button" onClick={handleAddBatch} className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black active:scale-95 transition-all">إضافة دفعة</button>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                  {formData.batches.map(b => (
                    <div key={b.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
                      <span className="text-slate-600">{b.quantity} قطعة × {b.wholesalePrice} ج.م</span>
                      <button type="button" onClick={() => setFormData({...formData, batches: formData.batches.filter(x => x.id !== b.id)})} className="text-rose-500">✕</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 p-8 md:p-10 rounded-[2rem] shadow-2xl text-white">
                 <label className="block text-center font-black text-emerald-400 uppercase tracking-widest text-xs mb-4">سعر البيع النهائي</label>
                 <div className="relative">
                   <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-800 p-8 text-5xl font-black rounded-3xl text-center outline-none border-2 border-slate-700 focus:border-emerald-500 transition-all" />
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">ج.م</span>
                 </div>
              </section>

              <button type="submit" className="w-full py-8 rounded-[2rem] font-black text-2xl bg-emerald-600 text-white shadow-2xl hover:bg-slate-900 transition-all active:scale-95">حفظ المنتج نهائياً</button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;