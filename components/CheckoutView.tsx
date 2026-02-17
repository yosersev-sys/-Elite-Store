
import React, { useState, useEffect } from 'react';
import { CartItem, User } from '../types';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: User | null;
  deliveryFee: number;
  onPlaceOrder: (details: any) => void;
  onBack: () => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  address?: string;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, currentUser, deliveryFee, onPlaceOrder, onBack }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        phone: prev.phone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'يرجى إدخال اسم المستلم كاملاً';
    if (!formData.phone.trim()) {
      newErrors.phone = 'يرجى إدخال رقم الجوال';
    } else if (!/^(01)\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'يرجى إدخال رقم جوال مصري صحيح';
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      newErrors.address = 'يرجى إدخال عنوان واضح للتوصيل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfirmOrder = () => {
    if (validate()) {
      onPlaceOrder({
        ...formData,
        city: 'فاقوس',
        paymentMethod: 'الدفع عند الاستلام'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto py-4 md:py-8 px-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition mb-6 font-black text-sm group"
      >
        <svg className="w-5 h-5 rotate-180 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        العودة للسلة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">بيانات التوصيل</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">يرجى كتابة البيانات بدقة</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-600 mr-2">اسم المستلم</label>
                <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all ${errors.fullName ? 'border-rose-200 bg-rose-50' : 'border-transparent bg-slate-50 focus:bg-white focus:border-emerald-400'}`} placeholder="اكتب اسمك هنا" />
                {errors.fullName && <p className="text-xs text-rose-500 font-bold mr-2">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-600 mr-2">رقم الجوال</label>
                <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all text-left ${errors.phone ? 'border-rose-200 bg-rose-50' : 'border-transparent bg-slate-50 focus:bg-white focus:border-emerald-400'}`} placeholder="01xxxxxxxxx" dir="ltr" />
                {errors.phone && <p className="text-xs text-rose-500 font-bold mr-2">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-600 mr-2">العنوان بالتفصيل</label>
                <textarea value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all min-h-[120px] resize-none ${errors.address ? 'border-rose-200 bg-rose-50' : 'border-transparent bg-slate-50 focus:bg-white focus:border-emerald-400'}`} placeholder="اكتب الحي، الشارع، أو علامة مميزة بالقرب منك..." />
                {errors.address && <p className="text-xs text-rose-500 font-bold mr-2">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xl">🚚</div>
             <div>
                <p className="font-black text-emerald-800 text-sm">توصيل سريع لجميع انحاء فاقوس - شرقية</p>
                <p className="text-emerald-600 text-[10px] font-bold">يصلك طلبك في خلال دقائق بمجرد التأكيد.</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50 sticky top-24 space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-5">ملخص الطلب</h3>
            
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 no-scrollbar">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-4 items-center animate-fadeIn">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-50 shrink-0">
                    <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.quantity} × {item.price} ج.م</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex justify-between text-slate-400 font-black text-xs uppercase tracking-widest">
                <span>المجموع</span>
                <span>{subtotal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-500 font-black text-xs uppercase tracking-widest">
                <span>مصاريف التوصيل</span>
                <span className={deliveryFee === 0 ? 'text-emerald-600' : ''}>{deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ج.م`}</span>
              </div>
              <div className="flex justify-between text-3xl font-black text-slate-900 pt-4 border-t border-slate-50">
                <span>الإجمالي</span>
                <span className="text-emerald-600">{total.toLocaleString()} ج.م</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleConfirmOrder}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 group"
            >
              تأكيد الطلب الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
