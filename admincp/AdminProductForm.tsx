
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [libraryImages, setLibraryImages] = useState<{url: string, productName: string}[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    images: [] as string[],
    batches: [] as StockBatch[]
  });

  const [seoData, setSeoData] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: ''
  });

  // جلب صور المكتبة عند فتحها
  useEffect(() => {
    if (showLibrary) {
      const loadLibrary = async () => {
        setIsLoadingLibrary(true);
        const images = await ApiService.getAllImages();
        setLibraryImages(images || []);
        setIsLoadingLibrary(false);
      };
      loadLibrary();
    }
  }, [showLibrary]);

  const profitStats = useMemo(() => {
    const sellPrice = parseFloat(formData.price) || 0;
    const lastCost = formData.batches.length > 0 
      ? formData.batches[formData.batches.length - 1].wholesalePrice 
      : (parseFloat(formData.wholesalePrice) || 0);
    
    const profit = sellPrice - lastCost;
    const percentage = lastCost > 0 ? (profit / lastCost) * 100 : 0;

    return { profit, percentage, lastCost };
  }, [formData.price, formData.wholesalePrice, formData.batches]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        wholesalePrice: product.wholesalePrice?.toString() || '',
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        stockQuantity: product.stockQuantity?.toString() || '0',
        barcode: product.barcode || '',
        unit: product.unit || 'piece', 
        images: product.images || [],
        batches: product.batches || []
      });
      if (product.seoSettings) setSeoData(product.seoSettings);
    }
  }, [product]);

  const handleAddBatch = () => {
    const qty = parseFloat(newBatchQty);
    const price = parseFloat(newBatchPrice);
    if (!qty || !price) return;
    
    const newBatch: StockBatch = {
      id: 'batch_' + Date.now(),
      quantity: qty,
      wholesalePrice: price,
      createdAt: Date.now()
    };

    const updatedBatches = [...formData.batches, newBatch];
    const totalQty = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

    setFormData({
      ...formData,
      batches: updatedBatches,
      stockQuantity: totalQty.toString(),
      wholesalePrice: price.toString()
    });
    setNewBatchQty('');
    setNewBatchPrice('');
  };

  const handleAiDescription = async () => {
    if (!formData.name) return alert('أدخل اسم المنتج أولاً');
    setIsLoadingAi(true);
    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
    const desc = await generateProductDescription(formData.name, catName);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsLoadingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.name || !formData.description) return alert('أدخل الاسم والوصف أولاً');
    setIsLoadingSeo(true);
    const data = await generateSeoData(formData.name, formData.description);
    if (data) setSeoData(data);
    setIsLoadingSeo(false);
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.price || formData.images.length === 0) {
      return alert('يرجى إكمال البيانات الأساسية والصور');
    }
    
    setIsSubmitting(true);
    const productData: Product = {
      id: product ? product.id : 'p_' + Date.now(),
      ...formData,
      price: parseFloat(formData.price),
      wholesalePrice: profitStats.lastCost,
      stockQuantity: parseFloat(formData.stockQuantity),
      createdAt: product ? product.createdAt : Date.now(),
      seoSettings: seoData
    } as any;

    await onSubmit(productData);
    setIsSubmitting(false);
  };

  const filteredLibrary = libraryImages.filter(img => 
    img.productName.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 animate-fadeIn pb-32 space-y-10">
      
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">إضافة منتج جديد</h1>
            <p className="text-slate-400 font-bold text-xs">إدارة المخزون والتسعير الذكي</p>
         </div>
         <button onClick={onCancel} className="px-6 py-2 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-400 hover:bg-slate-50 transition-all">إلغاء</button>
      </div>

      {/* 1. الصور والمعلومات */}
      <section className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-50 space-y-10">
        <div className="flex justify-between items-center">
           <h3 className="text-lg font-black text-indigo-700 flex items-center gap-3">
             <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
             1. صور المنتج والمعلومات
           </h3>
           <button type="button" onClick={() => setShowLibrary(true)} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 hover:bg-emerald-100 transition-colors">
             مكتبة الصور 🖼️
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
           {/* Photo Upload Box */}
           <div className="md:col-span-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-400 transition-all group overflow-hidden relative"
              >
                 {formData.images.length > 0 ? (
                   <div className="relative w-full h-full">
                      <img src={formData.images[0]} className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, images: []}); }} 
                        className="absolute top-4 right-4 bg-rose-500 text-white w-8 h-8 rounded-full shadow-lg"
                      >✕</button>
                   </div>
                 ) : (
                   <>
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm group-hover:scale-110 transition-transform">＋</div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رفع صور</p>
                   </>
                 )}
                 <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={(e) => {
                   const fileList = e.target.files;
                   if (!fileList) return;
                   const files: File[] = Array.from(fileList);
                   files.forEach((f: File) => {
                     const r = new FileReader();
                     r.onload = () => setFormData(prev => ({...prev, images: [...prev.images, r.result as string]}));
                     r.readAsDataURL(f);
                   });
                 }} />
              </div>
              {formData.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                   {formData.images.slice(1).map((img, idx) => (
                     <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border shrink-0 relative group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx + 1)})} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                     </div>
                   ))}
                </div>
              )}
           </div>

           {/* Form Inputs */}
           <div className="md:col-span-8 space-y-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">اسم المنتج</label>
                 <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  placeholder="مثال: طماطم بلدي طازجة"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">القسم الرئيسي</label>
                    <select 
                      value={formData.categoryId} 
                      onChange={e => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800"
                    >
                      <option value="">اختر القسم...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">وحدة البيع</label>
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                       {['piece', 'kg', 'gram'].map(u => (
                         <button 
                          key={u}
                          type="button"
                          onClick={() => setFormData({...formData, unit: u as any})}
                          className={`flex-grow py-3 rounded-xl font-black text-[10px] transition-all ${formData.unit === u ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                         >
                           {u === 'piece' ? 'قطعة' : u === 'kg' ? 'كيلو' : 'جرام'}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase mr-4 tracking-widest">باركود المنتج</label>
                 <div className="flex gap-2">
                    <input 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      className="flex-grow px-8 py-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-800" 
                      placeholder="أدخل الكود أو امسح بالكاميرا"
                    />
                    <button type="button" onClick={() => setFormData({...formData, barcode: (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString()})} className="p-5 bg-indigo-500 text-white rounded-2xl shadow-lg hover:bg-indigo-600 transition-all">✨</button>
                    <button type="button" onClick={() => setShowScanner(true)} className="p-5 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all">📸</button>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. إدارة المخزون (FIFO) */}
      <section className="bg-white rounded-[3rem] shadow-xl shadow-slate-100 border-2 border-emerald-50 relative overflow-hidden">
         <div className="bg-emerald-50/30 p-8 md:p-12 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-emerald-800 flex items-center gap-3">
                    📦 إدارة المخزون والتوريد (FIFO)
                  </h3>
                  <p className="text-emerald-600/70 font-bold text-sm max-w-xl leading-relaxed">
                    نظام الوارد أولاً يصرف أولاً (FIFO) يضمن لك حساب أرباح دقيق بناءً على تكلفة كل شحنة توريد على حدة.
                  </p>
               </div>
               <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center gap-4 shadow-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المخزون الكلي المتوفر</span>
                  <span className="text-4xl font-black text-emerald-400">{formData.stockQuantity} <small className="text-xs text-white">وحدة</small></span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-5 space-y-4">
                  <div className="flex justify-between items-center px-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تفصيل الدفعات (تاريخياً)</h4>
                     <button className="text-[9px] font-black text-slate-300">أقدم ← أحدث</button>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 p-8 min-h-[250px] flex flex-col items-center justify-center text-center">
                     {formData.batches.length === 0 ? (
                       <>
                         <div className="text-5xl opacity-10 mb-4">📜</div>
                         <p className="font-black text-slate-300">المخزن فارغ حالياً</p>
                         <p className="text-[10px] text-slate-300 font-bold mt-1">ابدأ بإضافة أول شحنة توريد</p>
                       </>
                     ) : (
                       <div className="w-full space-y-2">
                         {formData.batches.map(b => (
                           <div key={b.id} className="flex justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50">
                              <span className="font-black text-slate-700 text-sm">{b.quantity} وحدة</span>
                              <span className="font-bold text-slate-400 text-xs">تكلفة: {b.wholesalePrice} ج.م</span>
                              <button onClick={() => setFormData({...formData, batches: formData.batches.filter(x => x.id !== b.id)})} className="text-rose-400 hover:text-rose-600 transition-colors">✕</button>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
               </div>

               <div className="lg:col-span-7 bg-emerald-50/50 p-8 md:p-10 rounded-[2.5rem] border-2 border-emerald-100/50 space-y-6 relative group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform">＋</div>
                  <h4 className="text-center font-black text-emerald-800 text-lg">توريد شحنة جديدة للمخزن</h4>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest text-center block">الكمية الواردة</label>
                        <input 
                          type="number" 
                          value={newBatchQty}
                          onChange={e => setNewBatchQty(e.target.value)}
                          className="w-full p-5 bg-white rounded-2xl text-center font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                          placeholder="0.00" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest text-center block">سعر التكلفة للواحدة</label>
                        <input 
                          type="number" 
                          value={newBatchPrice}
                          onChange={e => setNewBatchPrice(e.target.value)}
                          className="w-full p-5 bg-white rounded-2xl text-center font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                          placeholder="0.00" 
                        />
                     </div>
                  </div>
                  <button onClick={handleAddBatch} type="button" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-slate-900 transition-all active:scale-95">
                     إضافة للمخزن 📦
                  </button>
               </div>
            </div>

            <div className="pt-10 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-center gap-6 flex-grow max-w-md">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">💡</div>
                  <div>
                    <p className="font-black text-indigo-900 text-sm">الربح المتوقع لكل قطعة</p>
                    <p className="text-[10px] text-indigo-500 font-bold">بناءً على التكلفة الحالية ({profitStats.lastCost} ج.م)، ربحك في القطعة الواحدة هو <span className="text-emerald-600">{profitStats.profit.toFixed(2)} ج.م</span></p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديد سعر البيع للجمهور (ج.م)</span>
                  <div className="bg-slate-900 p-4 rounded-[2rem] shadow-2xl flex items-center gap-4 min-w-[200px] border-4 border-slate-800">
                     <span className="p-3 bg-white/10 rounded-xl text-white">↕️</span>
                     <input 
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="bg-transparent border-none outline-none text-4xl font-black text-white w-full text-center" 
                      placeholder="0.00" 
                     />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ج.م</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 3. الوصف و SEO */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
         <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">وصف المنتج التسويقي</h4>
            <div className="relative group">
               <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="اكتب وصفاً جذاباً للعملاء..."
                className="w-full p-10 bg-slate-50 rounded-[2.5rem] border-none outline-none font-bold text-slate-700 min-h-[200px] focus:ring-4 focus:ring-indigo-500/5 transition-all"
               />
               <button 
                type="button" 
                onClick={handleAiDescription}
                disabled={isLoadingAi}
                className="absolute left-6 bottom-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] shadow-lg flex items-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50"
               >
                 {isLoadingAi ? 'جاري الكتابة...' : '✨ وصف ذكي بواسطة Gemini'}
               </button>
            </div>
         </div>

         <div className="pt-10 border-t border-slate-50 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-4 space-y-4">
               <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">
                  <span className="text-2xl">🌐</span> محركات البحث (SEO)
               </h4>
               <div className="space-y-4">
                  <div className="space-y-1">
                     <input 
                      value={seoData.metaTitle}
                      onChange={e => setSeoData({...seoData, metaTitle: e.target.value})}
                      placeholder="عنوان الـ (Meta Title)" 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xs" 
                     />
                  </div>
                  <div className="space-y-1">
                     <input 
                      value={seoData.slug}
                      onChange={e => setSeoData({...seoData, slug: e.target.value})}
                      placeholder="رابط المنتج (Slug)" 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xs" 
                     />
                  </div>
               </div>
            </div>

            <div className="lg:col-span-8 flex justify-end">
               <button 
                type="button" 
                onClick={handleAiSeo}
                disabled={isLoadingSeo}
                className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
               >
                 توليد بيانات SEO ذكية ✨
               </button>
            </div>
         </div>
      </section>

      {/* Final Action Button */}
      <button 
        onClick={handleFormSubmit}
        disabled={isSubmitting}
        className="w-full bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isSubmitting ? 'جاري النشر...' : 'نشر المنتج في المتجر الآن 🚀'}
      </button>

      {/* Scanner Modal */}
      {showScanner && <BarcodeScanner onScan={c => setFormData({...formData, barcode: c})} onClose={() => setShowScanner(false)} />}

      {/* PHOTO LIBRARY MODAL */}
      {showLibrary && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
           <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slideUp">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">مكتبة صور المتجر</h3>
                    <p className="text-slate-400 font-bold text-xs mt-1">اختر من الصور المرفوعة مسبقاً لمنتجاتك</p>
                 </div>
                 <button onClick={() => setShowLibrary(false)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">✕</button>
              </div>

              <div className="p-6 bg-slate-50 shrink-0">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="ابحث عن صورة باسم المنتج..." 
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      className="w-full px-12 py-4 bg-white rounded-2xl border-none outline-none font-bold shadow-sm"
                    />
                    <span className="absolute left-4 top-4 text-slate-300">🔍</span>
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
                 {isLoadingLibrary ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                       <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="font-black text-slate-400">جاري تصفح الأرشيف...</p>
                    </div>
                 ) : filteredLibrary.length === 0 ? (
                    <div className="text-center py-20">
                       <p className="text-slate-300 font-black">لم يتم العثور على صور مطابقة لبحثك</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {filteredLibrary.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                               setFormData(prev => ({...prev, images: [...prev.images, img.url]}));
                               setShowLibrary(false);
                            }}
                            className="aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-indigo-500 transition-all group relative"
                          >
                             <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <p className="text-[8px] text-white font-black truncate">{img.productName}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductForm;
