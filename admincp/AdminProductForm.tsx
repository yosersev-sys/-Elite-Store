
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

  // مزامنة البيانات عند فتح المنتج للتحرير
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
    } catch (err) {
      console.error("Error loading library:", err);
    } finally {
      setIsLoadingLibrary(false);
    }
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
      wholesalePrice: price.toString() 
    }));
    setNewBatchQty('');
    setNewBatchPrice('');
  };

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
        stockQuantity: finalStock || 0,
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
      console.error("Submit Error:", err);
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
      
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-slideUp">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">تجاهل التغييرات؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">هل أنت متأكد من الخروج؟ سيتم حذف جميع البيانات التي قمت بإدخالها ولم يتم حفظها.</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-grow bg-rose-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-rose-100">نعم، خروج</button>
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
                  <p className="text-slate-400 font-bold text-xs mt-1">اختر من الصور المرفوعة سابقاً</p>
               </div>
               <div className="relative flex-grow max-w-md">
                 <input 
                   type="text" 
                   placeholder="ابحث باسم المنتج..." 
                   value={librarySearch}
                   onChange={e => setLibrarySearch(e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-sm shadow-inner"
                 />
                 <span className="absolute left-4 top-4 text-slate-300">🔍</span>
               </div>
               <button onClick={() => setShowLibrary(false)} className="hidden md:block bg-slate-100 p-2 rounded-xl text-slate-500">✕</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {isLoadingLibrary ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-bold text-slate-400">جاري التحميل...</p>
                 </div>
              ) : filteredLibrary.length === 0 ? (
                 <div className="text-center py-20 text-slate-300 font-bold">لا توجد صور مطابقة</div>
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
            <button onClick={() => setShowLibrary(false)} className="mt-4 bg-slate-900 text-white py-4 rounded-2xl font-black">إغلاق المكتبة</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px]">إدارة المخزون والتسعير الذكي</p>
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
              <input 
                required 
                value={formData.name} 
                onChange={e => {
                  const val = e.target.value;
                  // مزامنة الاسم مع الوصف وعنوان Meta والرابط تلقائياً
                  setFormData(prev => ({ ...prev, name: val, description: val }));
                  setSeoData(prev => ({ ...prev, metaTitle: val, slug: val.trim().replace(/\s+/g, '-') }));
                }} 
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner" 
                placeholder="مثال: طماطم بلدي طازجة" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">القسم الرئيسي</label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner">
                <option value="">-- اختر القسم --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">المورد (اختياري)</label>
              <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold shadow-inner">
                <option value="">-- بدون مورد محدد --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.companyName ? `(${s.companyName})` : ''}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">وحدة البيع</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border">
                 {(['piece', 'kg', 'gram'] as const).map(u => (
                   <button 
                    key={u} type="button" 
                    onClick={() => setFormData({...formData, unit: u})}
                    className={`py-3 rounded-xl font-black text-xs transition-all ${formData.unit === u ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                   >
                     {u === 'piece' ? 'قطعة' : u === 'kg' ? 'كيلو' : 'جرام'}
                   </button>
                 ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">باركود المنتج</label>
              <div className="flex gap-2">
                 <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" placeholder="أدخل الكود أو امسح بالكاميرا" />
                 <button type="button" onClick={handleGenerateBarcode} className="bg-indigo-600 text-white px-5 rounded-2xl hover:bg-slate-900 transition shadow-lg" title="توليد باركود تلقائي">✨</button>
                 <button type="button" onClick={() => setShowScanner(true)} className="bg-slate-900 text-white px-5 rounded-2xl hover:bg-emerald-600 transition shadow-lg" title="مسح باركود بالكاميرا">📷</button>
              </div>
            </div>
          </div>
        </section>

        {/* تحسين قسم إدارة المخزون (FIFO) */}
        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border-t-8 border-emerald-500 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-3">
                <span className="p-2 bg-emerald-50 rounded-xl text-xl">📦</span>
                إدارة المخزون والتوريد (FIFO)
              </h3>
              <p className="text-slate-400 font-bold text-sm mt-2 leading-relaxed max-w-xl">
                نظام الوارد أولاً يصرف أولاً (FIFO) يضمن لك حساب أرباح دقيق بناءً على تكلفة كل شحنة توريد على حدة.
              </p>
            </div>
            <div className="flex items-center justify-center bg-slate-900 text-white px-8 py-6 rounded-[2.5rem] shadow-2xl border-4 border-emerald-500/20 transform hover:scale-105 transition-transform">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">المخزون الكلي المتوفر</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-4xl font-black">{formData.stockQuantity}</p>
                 <p className="text-xs font-bold text-slate-400">{getUnitAr(formData.unit)}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* إدخال شحنة جديدة */}
            <div className="bg-emerald-50/40 p-8 rounded-[2.5rem] border border-emerald-100 shadow-inner space-y-8 h-full">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-200">＋</span>
                <h4 className="font-black text-slate-800 text-lg">توريد شحنة جديدة للمخزن</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase mr-2 tracking-widest">الكمية الواردة</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="any" 
                      value={newBatchQty} 
                      onChange={e => setNewBatchQty(e.target.value)} 
                      className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none font-black text-lg shadow-sm focus:border-emerald-500 transition-all" 
                      placeholder="0.00" 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">{getUnitAr(formData.unit)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase mr-2 tracking-widest">سعر التكلفة للواحدة</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="any" 
                      value={newBatchPrice} 
                      onChange={e => setNewBatchPrice(e.target.value)} 
                      className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none font-black text-lg shadow-sm focus:border-emerald-500 transition-all text-emerald-600" 
                      placeholder="0.00" 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">ج.م</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={handleAddBatch} 
                className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-emerald-100 active:scale-95 flex items-center justify-center gap-3"
              >
                إضافة للمخزن 📦
              </button>
              
              <div className="bg-white/60 p-4 rounded-2xl border border-dashed border-emerald-200">
                <p className="text-[10px] text-emerald-700 font-bold text-center leading-relaxed">
                  تلميح: آخر سعر تكلفة يتم إدخاله سيتم اعتباره "سعر الجملة الافتراضي" للمنتج.
                </p>
              </div>
            </div>

            {/* عرض الدفعات الحالية */}
            <div className="space-y-6">
               <h4 className="font-black text-slate-700 text-sm flex items-center justify-between px-2">
                 <span>تفصيل الدفعات (تاريخياً)</span>
                 <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md">أقدم → أحدث</span>
               </h4>
               
               <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                  {formData.batches.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                       <span className="text-5xl mb-4">🗄️</span>
                       <p className="font-black text-sm">المخزن فارغ حالياً</p>
                       <p className="text-[10px] font-bold">ابدأ بإضافة أول شحنة توريد</p>
                    </div>
                  ) : (
                    formData.batches.map((batch, index) => (
                      <div key={batch.id} className="bg-white border-2 border-slate-50 hover:border-emerald-100 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                               <span className="text-[8px] font-black uppercase">{new Date(batch.createdAt).toLocaleDateString('ar-EG', {month: 'short'})}</span>
                               <span className="text-lg font-black leading-none">{new Date(batch.createdAt).getDate()}</span>
                            </div>
                            <div>
                               <p className="font-black text-slate-800 text-sm">{batch.quantity} {getUnitAr(formData.unit)}</p>
                               <p className="text-[10px] text-emerald-600 font-bold">التكلفة: {batch.wholesalePrice} ج.م</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {index === 0 && batch.quantity > 0 && (
                              <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">أولوية الصرف ⚡</span>
                            )}
                            <button 
                              type="button" 
                              onClick={() => setFormData(prev => ({...prev, batches: prev.batches.filter(b => b.id !== batch.id)}))} 
                              className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="حذف هذه شحنة"
                            >
                              ✕
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
             <div className="w-full md:w-auto space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">تحديد سعر البيع للجمهور (ج.م)</label>
                </div>
                <div className="relative group max-w-sm">
                  <input 
                    required 
                    type="number" 
                    step="any" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="w-full pl-12 pr-12 py-6 bg-slate-900 text-emerald-400 text-5xl font-black rounded-[2.5rem] outline-none shadow-2xl border-4 border-slate-800 focus:border-emerald-500 transition-all text-center tracking-tighter" 
                    placeholder="0.00" 
                  />
                  <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                     <span className="text-slate-600 font-black text-xs">ج.م</span>
                  </div>
                </div>
             </div>

             <div className="flex-grow max-w-md bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shrink-0">💡</div>
                <div>
                   <p className="font-black text-indigo-900 text-xs mb-1">الربح المتوقع لكل قطعة</p>
                   <p className="text-slate-500 text-[10px] leading-relaxed">
                     بناءً على التكلفة الحالية ({formData.wholesalePrice} ج.م)، ربحك في القطعة الواحدة هو <span className="text-indigo-600 font-black">{(parseFloat(formData.price || '0') - parseFloat(formData.wholesalePrice || '0')).toFixed(2)} ج.م</span>
                   </p>
                </div>
             </div>
          </div>
        </section>

        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
           <div className="space-y-2 relative">
              <label className="text-sm font-bold text-slate-500 mr-2">وصف المنتج التسويقي</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-8 bg-slate-50 rounded-[2rem] outline-none min-h-[180px] focus:ring-2 focus:ring-indigo-400 shadow-inner" placeholder="اكتب وصفاً جذاباً للعملاء..." />
              <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="absolute left-6 bottom-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50">
                {isLoadingAi ? 'جاري الكتابة...' : '✨ وصف ذكي بواسطة Gemini'}
              </button>
           </div>

           <div className="pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><span>🌍</span> محركات البحث (SEO)</h3>
                 <div className="space-y-4">
                    <input placeholder="عنوان الـ Meta (Meta Title)" value={seoData.metaTitle} onChange={e => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border font-bold text-sm shadow-sm" />
                    <input placeholder="رابط المنتج (Slug)" value={seoData.slug} onChange={e => setSeoData({...seoData, slug: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border font-bold text-sm text-indigo-600 shadow-sm" />
                 </div>
              </div>
              <div className="flex items-end">
                <button type="button" onClick={handleAiSeo} disabled={isLoadingSeo} className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                   {isLoadingSeo ? 'جاري التحليل...' : 'توليد بيانات SEO ذكية ✨'}
                </button>
              </div>
           </div>
        </section>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full py-7 rounded-[3rem] font-black text-3xl shadow-2xl transition-all transform active:scale-[0.97] flex items-center justify-center gap-6 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-slate-900 hover:-translate-y-1'}`}
        >
           {isSubmitting ? (
             <>
               <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               جاري الحفظ والرفع...
             </>
           ) : (
             product ? 'حفظ التعديلات النهائية 💾' : 'نشر المنتج في المتجر الآن 🚀'
           )}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
