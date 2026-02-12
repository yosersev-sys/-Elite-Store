
import React, { useState } from 'react';
import { CartItem } from '../types';

interface CheckoutViewProps {
  cart: CartItem[];
  onPlaceOrder: (details: any) => void;
  onBack: () => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  address?: string;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, onPlaceOrder, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    paymentMethod: 'cod'
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // ضريبة القيمة المضافة 15%
  const total = subtotal + tax;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم الكامل المستلم';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'يرجى إدخال رقم الجوال';
    } else if (!/^(01)\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'يرجى إدخال رقم جوال مصري صحيح (مثال: 01xxxxxxxxx)';
    }

    if (!formData.city) {
      newErrors.city = 'يرجى اختيار مدينة التوصيل';
    }

    if (!formData.address.trim() || formData.address.trim().length < 10) {
      newErrors.address = 'يرجى إدخال عنوان تفصيلي واضح (الحي والشارع)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند بدء الكتابة
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfirmOrder = () => {
    if (validate()) {
      onPlaceOrder(formData);
    } else {
      // التمرير لأول خطأ
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition mb-8 font-bold group"
      >
        <svg className="w-5 h-5 rotate-180 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        العودة للسلة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* نموذج البيانات */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50">
            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              بيانات الشحن والتوصيل
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* الاسم الكامل */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 mr-2 flex items-center gap-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50 focus:border-indigo-100 focus:bg-white'}`} 
                  placeholder="أدخل اسم المستلم" 
                />
                {errors.fullName && <p className="text-xs text-red-500 font-bold mr-2">{errors.fullName}</p>}
              </div>

              {/* رقم الجوال */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 mr-2 flex items-center gap-1">
                  رقم الجوال <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition text-left ${errors.phone ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50 focus:border-indigo-100 focus:bg-white'}`} 
                  placeholder="01xxxxxxxxx" 
                  dir="ltr"
                />
                {errors.phone && <p className="text-xs text-red-500 font-bold mr-2">{errors.phone}</p>}
              </div>

              {/* المدينة */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 mr-2 flex items-center gap-1">
                  المحافظة <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition appearance-none ${errors.city ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50 focus:border-indigo-100 focus:bg-white'}`}
                >
                  <option value="">اختر المحافظة</option>
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الشرقية">الشرقية</option>
                  <option value="الدقهلية">الدقهلية</option>
                  <option value="القليوبية">القليوبية</option>
                </select>
                {errors.city && <p className="text-xs text-red-500 font-bold mr-2">{errors.city}</p>}
              </div>

              {/* العنوان التفصيلي */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-500 mr-2 flex items-center gap-1">
                  العنوان بالتفصيل <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition min-h-[100px] resize-none ${errors.address ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50 focus:border-indigo-100 focus:bg-white'}`} 
                  placeholder="الحي، الشارع، رقم المنزل..."
                />
                {errors.address && <p className="text-xs text-red-500 font-bold mr-2">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50">
            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              طريقة الدفع
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-right ${formData.paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'cod' ? 'border-indigo-600' : 'border-gray-300'}`}>
                  {formData.paymentMethod === 'cod' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                </div>
                <div>
                  <p className="font-black text-gray-900">الدفع عند الاستلام</p>
                  <p className="text-xs text-gray-500">ادفع نقداً عند وصول طلبك</p>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'card'})}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-right ${formData.paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'card' ? 'border-indigo-600' : 'border-gray-300'}`}>
                  {formData.paymentMethod === 'card' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                </div>
                <div>
                  <p className="font-black text-gray-900">بطاقة ميزة / ائتمان</p>
                  <p className="text-xs text-gray-500">دفع آمن وسريع أونلاين</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ملخص الطلب */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100 sticky top-24 space-y-6">
            <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4">ملخص الفاتورة</h3>
            
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-4 items-center">
                  <img src={item.images[0]} className="w-14 h-14 rounded-xl object-cover border border-gray-50" alt="" />
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 font-bold">{item.quantity} × {item.price} ج.م</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-500 font-bold">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span>{tax.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold">
                <span>الشحن</span>
                <span className="text-emerald-600">مجاني</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-gray-900 pt-4">
                <span>الإجمالي</span>
                <span className="text-indigo-600">{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleConfirmOrder}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group"
            >
              تأكيد الطلب الآن
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed font-bold">
              بالضغط على تأكيد الطلب، فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمتجر النخبة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
