import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, SeoSettings, StockBatch } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { ApiService } from '../services/api';

interface LibraryImage {
  url: string;
  productName: string;
}

interface AdminProductFormProps {
  product: Product | null;
  categories: Category[];
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const AdminProductForm: React.FC<AdminProductFormProps> = ({ product, categories, onSubmit, onCancel }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  
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

  const initialSetupDone = useRef(false);
  const isSlugManuallyEdited = useRef(false);

  useEffect(() => {
    if (initialSetupDone.current && !product) return;

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
      if (product.seoSettings) {
        setSeoData(product.seoSettings);
        isSlugManuallyEdited.current = true;
      }
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId: prev.categoryId || categories[0]?.id || '',
        unit: prev.unit || 'piece',
        batches: []
      }));
    }
    initialSetupDone.current = true;
  }, [product, categories.length]);

  // تحديث إجمالي الكمية عند تغير الدفعات
  useEffect(() => {
    const total = formData.batches.reduce((sum, b) => sum + b.quantity, 0);
    setFormData(prev => ({ ...prev, stockQuantity: total }));
  }, [formData.batches]);

  const handleAddBatch = () => {
    const qty = parseFloat(newBatchQty);
    const price = parseFloat(newBatchPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
      alert("يرجى إدخال كمية وسعر جملة صحيحين");
      return;
    }

    const newBatch: StockBatch = {
      id: 'batch_' + Date.now(),
      quantity: qty,
      wholesalePrice: price,
      createdAt: Date.now()
    };

    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, newBatch],
      wholesalePrice: price.toString() // تحديث السعر الحالي لآخر سعر شراء
    }));
    setNewBatchQty('');
    setNewBatchPrice('');
  };

  const removeBatch = (id: string) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.filter(b => b.id !== id)
    }));
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fadeIn pb-20">
      {showScanner && <BarcodeScanner onScan={(code) => setFormData({...formData, barcode: code})} onClose={() => setShowScanner(false)} />}
      
      <div className="flex items-center justify-between mb-10 px-2">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            {product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">نظام الدفعات (FIFO) مفعل لضمان دقة الأرباح</p>
        </div>
        <button type="button" onClick={() => setShowCancelConfirm(true)} className="bg-white border-2 border-slate-100 text-slate-500 px-6 py-2.5 rounded-2xl font-bold">إلغاء</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        
        {/* القسم الأول: الصور والمعلومات الأساسية */}
        <section className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-indigo-600 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">01</span>
              صور المنتج واسمه
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {formData.images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 group">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index)}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 transition">
                <span className="text-2xl">+</span>
                <span className="text-[10px] font-bold">رفع صور</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">اسم المنتج</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">القسم</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 transition">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* القسم الثاني: نظام الدفعات والمخزون (FIFO System) */}
        <section className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-emerald-50 space-y-10">
          <div>
            <h3 className="text-xl font-black text-emerald-600 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">02</span>
              إدارة المخزون والدفعات (FIFO)
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-2">أضف شحنات جديدة بأسعار جملة مختلفة، سيقوم النظام بحساب الربح بدقة.</p>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
            <h4 className="font-black text-slate-700 mb-4 text-sm">إضافة شحنة (دفعة) جديدة للمخزن:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">الكمية الجديدة</label>
                <input 
                  type="number" 
                  value={newBatchQty} 
                  onChange={e => setNewBatchQty(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full px-6 py-3 bg-white border border-emerald-200 rounded-xl outline-none font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mr-2">سعر الجملة للقطعة</label>
                <input 
                  type="number" 
                  value={newBatchPrice} 
                  onChange={e => setNewBatchPrice(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full px-6 py-3 bg-white border border-emerald-200 rounded-xl outline-none font-bold" 
                />
              </div>
              <button 
                type="button" 
                onClick={handleAddBatch} 
                className="bg-emerald-600 text-white py-3 rounded-xl font-black text-sm hover:bg-emerald-700 transition"
              >
                + تأكيد إضافة الشحنة
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-slate-800 flex items-center justify-between">
              <span>الدفعات الحالية في المخزن:</span>
              <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-xs">إجمالي المخزون: {formData.stockQuantity}</span>
            </h4>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-4">تاريخ الشحنة</th>
                    <th className="px-6 py-4">الكمية المتاحة</th>
                    <th className="px-6 py-4">سعر الجملة</th>
                    <th className="px-6 py-4">الإجمالي</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {formData.batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-bold italic">لا توجد دفعات مسجلة حالياً.. يرجى إضافة شحنة</td>
                    </tr>
                  ) : (
                    formData.batches.map((batch, idx) => (
                      <tr key={batch.id} className={idx === 0 ? 'bg-emerald-50/20' : ''}>
                        <td className="px-6 py-4 font-bold text-slate-500">
                          {new Date(batch.createdAt).toLocaleDateString('ar-EG')}
                          {idx === 0 && <span className="mr-2 text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">تصرف الآن (FIFO)</span>}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-700">{batch.quantity} {formData.unit}</td>
                        <td className="px-6 py-4 font-black text-indigo-600">{batch.wholesalePrice} ج.م</td>
                        <td className="px-6 py-4 font-bold text-slate-400">{(batch.quantity * batch.wholesalePrice).toFixed(1)}</td>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => removeBatch(batch.id)} className="text-rose-400 hover:text-rose-600 font-black text-xs">حذف</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
             <div className="space-y-2 max-w-xs">
                <label className="text-sm font-bold text-slate-500">سعر البيع للجمهور (ج.م)</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-slate-900 text-emerald-400 text-2xl font-black rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/20" />
             </div>
          </div>
        </section>

        {/* القسم الثالث: الوصف والـ SEO */}
        <section className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-50 space-y-10">
           <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">وصف المنتج</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 min-h-[150px]" placeholder="اكتب وصفاً جذاباً..." />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">Slug (رابط المنتج)</label>
                <input value={seoData.slug} onChange={e => setSeoData({...seoData, slug: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-indigo-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">الباركود</label>
                <div className="flex gap-2">
                   <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" />
                   <button type="button" onClick={() => setShowScanner(true)} className="bg-slate-900 text-white px-4 rounded-2xl">📷</button>
                </div>
              </div>
           </div>
        </section>

        <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-95">
          {product ? 'حفظ كافة التعديلات 💾' : 'نشر المنتج والمخزون 🚀'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
