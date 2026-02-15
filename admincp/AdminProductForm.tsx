
import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, SeoSettings, StockBatch } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { ApiService } from '../services/api';
import { generateProductDescription, generateSeoData } from '../services/geminiService';

interface AdminProductFormProps {
  product: Product | null;
  categories: Category[];
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ product, categories, onSubmit, onCancel }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<{url: string, productName: string}[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // حقول إضافة دفعة جديدة
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchPrice, setNewBatchPrice] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    wholesalePrice: '',
    categoryId: '',
    stockQuantity: 0,
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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        wholesalePrice: (product.wholesalePrice || 0).toString(),
        categoryId: product.categoryId,
        stockQuantity: product.stockQuantity || 0,
        barcode: product.barcode || '',
        unit: product.unit || 'piece', 
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        images: product.images || [],
        batches: product.batches || []
      });
      if (product.seoSettings) setSeoData(product.seoSettings);
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId: categories[0]?.id || '',
        unit: 'piece',
        batches: []
      }));
    }
  }, [product, categories]);

  // تحديث إجمالي الكمية عند تغير الدفعات
  useEffect(() => {
    const total = formData.batches.reduce((sum, b) => sum + b.quantity, 0);
    setFormData(prev => ({ ...prev, stockQuantity: total }));
  }, [formData.batches]);

  const openLibrary = async () => {
    setShowLibrary(true);
    setIsLoadingLibrary(true);
    try {
      const items = await ApiService.getAllImages();
      setLibraryImages(items || []);
    } catch (err) {
      console.error("Error loading library:", err);
      setLibraryImages([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const filteredLibrary = libraryImages.filter(img => 
    img.productName.toLowerCase().includes(librarySearch.toLowerCase())
  );

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

  const handleAddBatch = () => {
    const qty = parseFloat(newBatchQty);
    const price = parseFloat(newBatchPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return alert("بيانات الشحنة غير صحيحة");

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
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل');

    const productData: Product = {
      id: product ? product.id : Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
      categoryId: formData.categoryId,
      stockQuantity: formData.stockQuantity,
      barcode: formData.barcode,
      unit: formData.unit,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : undefined,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c !== '') : undefined,
      images: formData.images,
      batches: formData.batches,
      createdAt: product ? product.createdAt : Date.now(),
      salesCount: product ? product.salesCount : 0,
      seoSettings: seoData
    };
    onSubmit(productData);
  };

  const getUnitAr = (u: string) => {
    if (u === 'kg') return 'كيلو';
    if (u === 'gram') return 'جرام';
    return 'وحدة';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fadeIn pb-32">
      {showScanner && <BarcodeScanner onScan={(code) => setFormData({...formData, barcode: code})} onClose={() => setShowScanner(false)} />}
      
      {/* مكتبة الصور */}
      {showLibrary && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-800">مكتبة صور المتجر 📸</h3>
                  <p className="text-slate-400 font-bold text-xs mt-1">ابحث عن صور المنتجات السابقة لاستخدامها</p>
               </div>
               <div className="relative flex-grow max-w-md">
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="ابحث باسم المنتج (مثال: طماطم)..." 
                   value={librarySearch}
                   onChange={e => setLibrarySearch(e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-sm shadow-inner"
                 />
                 <span className="absolute left-4 top-4 text-slate-300 text-lg">🔍</span>
               </div>
               <button onClick={() => setShowLibrary(false)} className="hidden md:block bg-slate-100 p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition">✕</button>
            </div>
            
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {isLoadingLibrary ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-bold text-slate-400">جاري تجميع الصور من الأرشيف...</p>
                 </div>
              ) : filteredLibrary.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <span className="text-6xl mb-4">🖼️</span>
                    <p className="font-bold">لا توجد صور تطابق بحثك حالياً</p>
                    <p className="text-xs">جرب البحث بكلمة أخرى أو ارفع صورة جديدة</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
                    {filteredLibrary.map((item, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => { 
                          if (!formData.images.includes(item.url)) {
                            setFormData(prev => ({...prev, images: [...prev.images, item.url]})); 
                          }
                          setShowLibrary(false); 
                          setLibrarySearch('');
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-4 border-transparent hover:border-emerald-500 transition-all shadow-sm bg-slate-50"
                      >
                        <img src={item.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <p className="text-[9px] text-white font-black truncate text-center">{item.productName}</p>
                        </div>
                      </button>
                    ))}
                 </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">إجمالي المكتشف: {filteredLibrary.length} صورة</p>
               <button onClick={() => setShowLibrary(false)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition shadow-lg active:scale-95">إغلاق المكتبة</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{product ? 'تعديل بيانات المنتج' : 'إضافة صنف للمخزن'}</h2>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">إدارة متكاملة للمنتجات والمخزون</p>
        </div>
        <button type="button" onClick={onCancel} className="bg-white border-2 border-slate-100 text-slate-400 px-8 py-3 rounded-2xl font-bold hover:bg-rose-50 hover:text-rose-500 transition">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        {/* القسم الأول: الصور والمعلومات الأساسية */}
        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-indigo-600 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">01</span>
                المعلومات الأساسية والمعرض
              </h3>
              <button type="button" onClick={openLibrary} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">استخدام من المكتبة 📸</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 group">
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
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 mr-2">التصنيف</label>
              <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <label className="text-sm font-bold text-slate-500 mr-2">الباركود</label>
              <div className="flex gap-2">
                 <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
                 <button type="button" onClick={() => setShowScanner(true)} className="bg-slate-900 text-white px-5 rounded-2xl">📷</button>
              </div>
            </div>
          </div>
        </section>

        {/* القسم الثاني: نظام الدفعات (FIFO) المطور */}
        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-emerald-50 space-y-10 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-xl font-black text-emerald-600 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">02</span>
              إدارة المخزون والدفعات (FIFO)
            </h3>
            <div className="flex gap-4">
              <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الكمية القديمة</p>
                 <p className="text-lg font-black text-slate-600">{(product?.stockQuantity || 0)} {getUnitAr(formData.unit)}</p>
              </div>
              <div className="bg-emerald-600 px-6 py-3 rounded-2xl border border-emerald-500 text-center shadow-lg shadow-emerald-200">
                 <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">إجمالي المخزون الجديد</p>
                 <p className="text-lg font-black text-white">{formData.stockQuantity} {getUnitAr(formData.unit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white p-8 md:p-10 rounded-[2.5rem] border border-emerald-100 relative">
            <div className="absolute top-0 left-10 transform -translate-y-1/2">
               <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-black">توريد جديد +</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2 block tracking-widest">الكمية الواردة</label>
                <div className="relative">
                  <input type="number" value={newBatchQty} onChange={e => setNewBatchQty(e.target.value)} placeholder="0.00" className="w-full px-6 py-4 bg-white border-2 border-emerald-100 rounded-2xl outline-none font-black text-emerald-700 text-lg focus:border-emerald-500 transition-all shadow-sm" />
                  <span className="absolute left-4 top-4 text-emerald-300 font-bold">{getUnitAr(formData.unit)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2 block tracking-widest">سعر الجملة للوحدة</label>
                <div className="relative">
                  <input type="number" value={newBatchPrice} onChange={e => setNewBatchPrice(e.target.value)} placeholder="0.00" className="w-full px-6 py-4 bg-white border-2 border-emerald-100 rounded-2xl outline-none font-black text-emerald-700 text-lg focus:border-emerald-500 transition-all shadow-sm" />
                  <span className="absolute left-4 top-4 text-emerald-300 font-bold text-xs">ج.م</span>
                </div>
              </div>
              <button type="button" onClick={handleAddBatch} className="bg-emerald-600 text-white py-5 rounded-2xl font-black text-base hover:bg-slate-900 transition-all shadow-xl shadow-emerald-200 active:scale-95">تأكيد الإضافة للمخزن</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-slate-700 px-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              سجل الدفعات الحالية (أولاً بأول)
            </h4>
            {formData.batches.length > 0 ? (
              <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                      <tr>
                        <th className="px-8 py-5">تاريخ التوريد</th>
                        <th className="px-8 py-5">الكمية</th>
                        <th className="px-8 py-5">سعر الجملة</th>
                        <th className="px-8 py-5">القيمة الإجمالية</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {formData.batches.map(batch => (
                        <tr key={batch.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-4 font-bold text-slate-500">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                               {new Date(batch.createdAt).toLocaleDateString('ar-EG')}
                             </div>
                          </td>
                          <td className="px-8 py-4 font-black text-slate-700">{batch.quantity} {getUnitAr(formData.unit)}</td>
                          <td className="px-8 py-4 font-black text-indigo-600">{batch.wholesalePrice} ج.م</td>
                          <td className="px-8 py-4 font-bold text-slate-400">{(batch.quantity * batch.wholesalePrice).toFixed(2)} ج.م</td>
                          <td className="px-8 py-4 text-left">
                            <button type="button" onClick={() => setFormData(prev => ({...prev, batches: prev.batches.filter(b => b.id !== batch.id)}))} className="text-rose-400 font-black opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600">حذف الشحنة ×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                 <p className="text-slate-300 font-black text-sm">لا توجد دفعات مسجلة.. قم بإضافة أول شحنة أعلاه</p>
              </div>
            )}
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row gap-10 items-end">
             <div className="w-full md:w-80 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-4 block tracking-widest">تحديد سعر البيع للجمهور (ج.م)</label>
                <div className="relative">
                   <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-10 py-6 bg-slate-900 text-emerald-400 text-3xl font-black rounded-[2.5rem] outline-none shadow-2xl border-4 border-slate-800 focus:border-emerald-500/30 transition-all" />
                   <span className="absolute left-6 top-7 text-emerald-400/50 font-black text-xs uppercase">ج.م</span>
                </div>
             </div>
             
             <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-5">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">📦</div>
                   <div>
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">المخزون الكلي</p>
                     <p className="text-2xl font-black text-slate-800 leading-none mt-1">{formData.stockQuantity} <small className="text-xs">{getUnitAr(formData.unit)}</small></p>
                   </div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-center gap-5">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">💰</div>
                   <div>
                     <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">آخر تكلفة توريد</p>
                     <p className="text-2xl font-black text-slate-800 leading-none mt-1">{formData.wholesalePrice || 0} <small className="text-xs">ج.م</small></p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* القسم الثالث: الذكاء الاصطناعي والـ SEO */}
        <section className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
           <div className="space-y-2 relative">
              <label className="text-sm font-bold text-slate-500 mr-2">وصف المنتج</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-8 bg-slate-50 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-400 min-h-[180px]" placeholder="اكتب وصفاً جذاباً أو استخدم الذكاء الاصطناعي..." />
              <button type="button" onClick={handleAiDescription} disabled={isLoadingAi} className="absolute left-6 bottom-6 bg-indigo-600 text-white px-5 py-2 rounded-xl font-black text-[10px] shadow-lg hover:bg-slate-900 transition disabled:opacity-50">
                {isLoadingAi ? 'جاري التوليد...' : '✨ وصف ذكي (Gemini)'}
              </button>
           </div>

           <div className="pt-10 border-t border-slate-50 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">تحسين محركات البحث (SEO)</h3>
                <button type="button" onClick={handleAiSeo} disabled={isLoadingSeo} className="text-[10px] font-black bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 transition shadow-lg disabled:opacity-50">توليد بيانات SEO ✨</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">Meta Title</label>
                  <input value={seoData.metaTitle} onChange={e => setSeoData({...seoData, metaTitle: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">Slug (رابط المنتج)</label>
                  <input value={seoData.slug} onChange={e => setSeoData({...seoData, slug: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 font-bold text-sm text-indigo-600" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mr-2">Meta Description</label>
                  <textarea value={seoData.metaDescription} onChange={e => setSeoData({...seoData, metaDescription: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-300 text-sm font-bold min-h-[100px]" />
                </div>
              </div>
           </div>
        </section>

        <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-slate-900 transition-all transform hover:-translate-y-2 active:scale-95">
           {product ? 'حفظ التغييرات 💾' : 'نشر المنتج والمخزون 🚀'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
