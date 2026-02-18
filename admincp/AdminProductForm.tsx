
import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, SeoSettings, StockBatch, Supplier } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { ApiService } from '../services/api';
import { generateProductDescription, generateSeoData } from '../services/geminiService';

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
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        } else { resolve(base64Str); }
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
          stockQuantity: product.stockQuantity?.toString() || '0', // نستخدم الكمية الحالية من قاعدة البيانات
          barcode: product.barcode ? String(product.barcode) : '', 
          unit: product.unit || 'piece', 
          sizes: product.sizes?.join(', ') || '',
          colors: product.colors?.join(', ') || '',
          images: product.images || [],
          batches: product.batches || []
        });
        
        if (product.seoSettings) {
          setSeoData(product.seoSettings);
        }
        prevProductIdRef.current = product.id;
      }
    } else {
      prevProductIdRef.current = null;
    }
  }, [product]);

  useEffect(() => {
    if (!product && categories.length > 0 && formData.categoryId === '') {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, product, formData.categoryId]);

  const openLibrary = async () => {
    setShowLibrary(true);
    setIsLoadingLibrary(true);
    try {
      const items = await ApiService.getAllImages();
      setLibraryImages(items || []);
    } catch (err) { console.error(err); } finally { setIsLoadingLibrary(false); }
  };

  const filteredLibrary = libraryImages.filter(img => 
    img.productName.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const handleAiDescription = async () => {
    if (!formData.name) return alert('يرجى إدخل اسم المنتج أولاً');
    setIsLoadingAi(true);
    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
    const desc = await generateProductDescription(formData.name, catName);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('يرجى إدخل الاسم والوصف أولاً');
    setIsLoadingSeo(true);
    const data = await generateSeoData(formData.name, formData.description);
    if (data) setSeoData(data);
    setIsLoadingSeo(false);
  };

  const handleGenerateBarcode = () => {
    const randomCode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData(prev => ({ ...prev, barcode: randomCode.toString() }));
  };

  // إضافة دفعة جديدة: تزيد على الكمية الحالية
  const handleAddBatch = () => {
    const qty = parseFloat(newBatchQty);
    const price = parseFloat(newBatchPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return alert("يرجى إدخال كمية وسعر تكلفة صحيحين");

    const newBatch: StockBatch = {
      id: 'batch_' + Date.now(),
      quantity: qty,
      wholesalePrice: price,
      createdAt: Date.now()
    };

    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, newBatch],
      // التعديل الجوهري: إضافة الكمية الجديدة للمخزون الحالي بدلاً من تصفيره
      stockQuantity: (parseFloat(prev.stockQuantity) + qty).toString(),
      wholesalePrice: price.toString() 
    }));
    setNewBatchQty('');
    setNewBatchPrice('');
  };

  const clearAllStock = () => {
    if (window.confirm('سيتم تصفير الكمية الحالية وحذف سجل الدفعات. هل أنت متأكد؟')) {
      setFormData(prev => ({ ...prev, batches: [], stockQuantity: '0' }));
    }
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
    const finalStock = parseFloat(formData.stockQuantity);

    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل للمنتج');
    if (!formData.categoryId) return alert('يرجى اختيار قسم للمنتج');
    if (isNaN(finalPrice) || finalPrice <= 0) return alert('يرجى تحديد سعر بيع صحيح');
    if (!formData.name.trim()) return alert('يرجى إدخال اسم المنتج');

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
        stockQuantity: finalStock,
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
    } catch (err) {
      alert('حدث خطأ تقني، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUnitAr = (u: string) => {
    if (u === 'kg') return 'كيلو';
    if (u === 'gram') return 'جرام';
    return 'وحدة';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fadeIn pb-32">
      {showScanner && <BarcodeScanner onScan={(code) => setFormData({...formData, barcode: code})} onClose={() => setShowScanner(false)} />}
      
      {(isSubmitting || isCompressing) && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white p-10 rounded-[3rem] text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 border-4 border-emerald-50 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-black text-slate-800 text-lg">
                {isCompressing ? 'جاري تحسين الصور...' : 'جاري حفظ التعديلات...'}
              </p>
              <p className="text-slate-400 text-xs font-bold">يرجى عدم إغلاق الصفحة</p>
           </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">تجاهل التغييرات؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">هل أنت متأكد من الخروج؟ سيتم فقدان البيانات غير المحفوظة.</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg">نعم، خروج</button>
              <button onClick={() => setShowCancelConfirm(false)} className="flex-grow bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-800">مكتبة صور المتجر 📸</h3>
               </div>
               <div className="relative flex-grow max-w-md">
                 <input 
                   type="text" 
                   placeholder="ابحث باسم المنتج..." 
                   value={librarySearch}
                   onChange={e => setLibrarySearch(e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm shadow-inner"
                 />
               </div>
               <button onClick={() => setShowLibrary(false)} className="hidden md:block bg-slate-100 p-2 rounded-xl text-slate-500">✕</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {isLoadingLibrary ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
                    {filteredLibrary.map((item, i) => (
                      <button 
                        key={i} type="button"
                        onClick={() => { 
                          if (!formData.images.includes(item.url)) {
                            setFormData(prev => ({...prev, images: [...prev.images, item.url]})); 
                          }
                          setShowLibrary(false); 
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-4 border-transparent hover:border-emerald-500 transition-all shadow-sm"
                      >
                        <img src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-[8px] text-white truncate">{item.productName}</div>
                      </button>
                    ))}
                 </div>
              )}
            </div>
            <button onClick={() => setShowLibrary(false)} className="mt-4 bg-slate-900 text-white py-4 rounded-2xl font-black">إغلاق</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px]">إدارة المخزون والتسعير</p>
        </div>
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="bg-white border-2 border-slate-100 text-slate-400 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-indigo-600">1. صور المنتج والمعلومات</h3>
              <button type="button" onClick={openLibrary} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl font-black text-xs">مكتبة الصور 📸</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 group shadow-sm">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 transition">
                <span className="text-2xl">+</span>
                <span className="text-[10px] font-bold">رفع صور</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">اسم المنتج</label>
              <input required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">القسم</label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner">
                <option value="">-- اختر القسم --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">المورد (اختياري)</label>
              <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner">
                <option value="">-- بدون مورد --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">وحدة البيع</label>
              <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner">
                <option value="piece">وحدة/قطعة</option>
                <option value="kg">كيلو جرام</option>
                <option value="gram">جرام</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">الباركود</label>
              <div className="flex gap-2">
                 <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" />
                 <button type="button" onClick={handleGenerateBarcode} className="bg-indigo-600 text-white px-5 rounded-2xl shadow-lg">✨</button>
                 <button type="button" onClick={() => setShowScanner(true)} className="bg-slate-900 text-white px-5 rounded-2xl shadow-lg">📷</button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-emerald-500 space-y-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-3">إدارة المخزون الفعلي 📦</h3>
              <p className="text-slate-400 font-bold text-sm mt-2">المخزون المعروض هو الكمية المتوفرة للبيع حالياً (بعد خصم المبيعات).</p>
            </div>
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-center bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl border-4 border-emerald-500/20">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">الرصيد الحالي بالمخزن</p>
                    <div className="flex items-baseline gap-2">
                      <input 
                        type="number"
                        step="any"
                        value={formData.stockQuantity}
                        onChange={e => setFormData({...formData, stockQuantity: e.target.value})}
                        className="bg-transparent text-4xl font-black text-center w-32 outline-none border-b-2 border-emerald-500/50 focus:border-emerald-500"
                      />
                      <p className="text-xs font-bold text-slate-400">{getUnitAr(formData.unit)}</p>
                    </div>
                  </div>
               </div>
               <button type="button" onClick={clearAllStock} className="text-[10px] font-black text-rose-500 hover:bg-rose-50 py-2 rounded-xl transition-all">تصفير الرصيد 🔄</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-emerald-50/40 p-8 rounded-[2.5rem] border border-emerald-100 shadow-inner space-y-6 h-full">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg">＋</span>
                <h4 className="font-black text-slate-800">توريد شحنة (إضافة للرصيد الحالي)</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الكمية الجديدة</label>
                  <input type="number" step="any" value={newBatchQty} onChange={e => setNewBatchQty(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black text-lg shadow-sm" placeholder="0.00" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">سعر التكلفة</label>
                  <input type="number" step="any" value={newBatchPrice} onChange={e => setNewBatchPrice(e.target.value)} className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black text-lg shadow-sm" placeholder="0.00" />
                </div>
              </div>
              
              <button type="button" onClick={handleAddBatch} className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-95">تأكيد إضافة الكمية للمخزن 📦</button>
            </div>

            <div className="space-y-6">
               <h4 className="font-black text-slate-700 text-sm flex items-center justify-between">
                 <span>تاريخ دفعات التوريد</span>
               </h4>
               <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                  {formData.batches.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                       <span className="text-4xl mb-4">🗄️</span>
                       <p className="font-black text-xs">لا يوجد سجل دفعات</p>
                    </div>
                  ) : (
                    formData.batches.map((batch) => (
                      <div key={batch.id} className="bg-white border-2 border-slate-50 rounded-3xl p-5 flex items-center justify-between shadow-sm transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400">
                               <span className="text-xs font-black">{new Date(batch.createdAt).getDate()}</span>
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-sm">{batch.quantity} {getUnitAr(formData.unit)}</p>
                               <p className="text-[9px] text-emerald-600 font-bold">التكلفة: {batch.wholesalePrice} ج.م</p>
                            </div>
                         </div>
                         <button type="button" onClick={() => setFormData(prev => ({...prev, batches: prev.batches.filter(b => b.id !== batch.id)}))} className="text-rose-300 hover:text-rose-600 p-2 transition-all">✕</button>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
             <div className="w-full md:w-auto space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">سعر البيع للجمهور (ج.م)</label>
                <div className="relative max-w-sm">
                  <input required type="number" step="any" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-12 pr-12 py-6 bg-slate-900 text-emerald-400 text-5xl font-black rounded-[2.5rem] outline-none shadow-2xl text-center" placeholder="0.00" />
                </div>
             </div>
             <div className="flex-grow max-w-md bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">💡</div>
                <div>
                   <p className="font-black text-indigo-900 text-xs mb-1">هامش الربح</p>
                   <p className="text-slate-500 text-[10px] leading-relaxed">
                     بناءً على آخر تكلفة ({formData.wholesalePrice} ج.م)، ربحك في القطعة هو <span className="text-indigo-600 font-black">{(parseFloat(formData.price || '0') - parseFloat(formData.wholesalePrice || '0')).toFixed(2)} ج.م</span>
                   </p>
                </div>
             </div>
          </div>
        </section>

        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
           <div className="space-y-2 relative">
              <label className="text-sm font-bold text-slate-500 mr-2">وصف المنتج</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-8 bg-slate-50 rounded-[2rem] outline-none min-h-[180px] focus:ring-2 focus:ring-indigo-400 shadow-inner" />
              <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="absolute left-6 bottom-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] shadow-xl disabled:opacity-50">✨ وصف ذكي</button>
           </div>
           <div className="pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><span>🌍</span> محركات البحث (SEO)</h3>
                 <div className="space-y-4">
                    <input placeholder="عنوان Meta" value={seoData.metaTitle} onChange={e => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border font-bold text-sm shadow-sm" />
                    <input placeholder="رابط المنتج (Slug)" value={seoData.slug} onChange={e => setSeoData({...seoData, slug: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border font-bold text-sm text-indigo-600 shadow-sm" />
                 </div>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={handleAiSeo} disabled={isLoadingSeo} className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50">توليد بيانات SEO ✨</button>
              </div>
           </div>
        </section>

        <button type="submit" disabled={isSubmitting || isCompressing} className={`w-full py-7 rounded-[3rem] font-black text-3xl shadow-2xl transition-all flex items-center justify-center gap-6 ${isSubmitting || isCompressing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-slate-900 hover:-translate-y-1'}`}>
           {isSubmitting ? 'جاري الحفظ...' : (product ? 'حفظ التعديلات النهائية 💾' : 'نشر المنتج الآن 🚀')}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
