import React, { useRef, useState } from 'react';
import { Order } from '../types';

interface OrderSuccessViewProps {
  order: Order;
  onContinueShopping: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onContinueShopping }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShareScreenshot = async () => {
    if (!invoiceRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await (window as any).html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element: any) => element.classList.contains('no-screenshot')
      });
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        const file = new File([blob], `Souq-AlAsr-Invoice-${order.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'فاتورة مبيعات سوق العصر',
            text: `رقم الفاتورة ${order.id}`
          });
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Souq-AlAsr-Invoice-${order.id}.png`;
          link.click();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn print:m-0 print:p-0">
      <div 
        ref={invoiceRef} 
        className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none"
      >
        {/* Header Success Section */}
        <div className="bg-emerald-600 p-12 text-center text-white relative print:bg-white print:text-black print:p-6 print:border-b-2">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                <span className="print:text-emerald-600">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                    <path d="M3 9l2.44-4.91A2 2 0 0 1 7.23 3h9.54a2 2 0 0 1 1.79 1.09L21 9" />
                    <path d="M9 21V12" />
                    <path d="M15 21V12" />
                  </svg>
                </span> سوق العصر
            </h1>
            <p className="font-bold opacity-80 print:opacity-100 tracking-widest text-xs">اول سوق الكتروني بفاقوس</p>
            <div className="mt-4 no-screenshot print:hidden">
                 <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">تم تسجيل الطلب بنجاح ✅</span>
            </div>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-8 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-8">
            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">رقم الفاتورة</p>
              <p className="text-xl font-mono font-black text-gray-900">{order.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">تاريخ الإصدار</p>
              <p className="text-lg font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">طريقة الدفع</p>
              <p className="text-lg font-bold text-emerald-700">
                {order.paymentMethod}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
                العميل المستلم
              </h3>
              <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100 print:bg-white">
                <p className="font-black text-gray-800">{order.customerName}</p>
                <p className="text-gray-600 font-bold text-sm">{order.phone}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{order.city} - {order.address || 'العنوان غير محدد'}</p>
              </div>
            </div>

            {/* Summary Info */}
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 flex items-center gap-2 border-r-4 border-slate-900 pr-3">
                تفاصيل الحساب
              </h3>
              <div className="space-y-3 px-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">المجموع قبل الضريبة</span>
                  <span className="font-bold text-slate-800">{(order.subtotal || 0).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">ضريبة القيمة المضافة (15%)</span>
                  <span className="font-bold text-slate-800">{(Number(order.total) - Number(order.subtotal)).toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-5 border-t border-gray-100">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{(Number(order.total) || 0).toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="font-black text-gray-900">بنود الفاتورة</h3>
            <div className="overflow-hidden border rounded-2xl">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="px-6 py-4">المنتج</th>
                        <th className="px-6 py-4">السعر</th>
                        <th className="px-6 py-4">الكمية</th>
                        <th className="px-6 py-4">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.name}</td>
                            <td className="px-6 py-4 font-bold text-slate-500 text-sm">{item.price} ج.م</td>
                            <td className="px-6 py-4 font-black text-slate-900 text-sm">{item.quantity}</td>
                            <td className="px-6 py-4 font-black text-emerald-600 text-sm">{(item.price * item.quantity).toFixed(2)} ج.م</td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-dashed print:block hidden">
             <p className="text-[10px] font-bold text-slate-400">شكراً لتعاملكم مع سوق العصر - فاقوس</p>
          </div>

          {/* Action Buttons */}
          <div className="no-screenshot pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
            <button 
              onClick={handlePrint}
              className="bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition shadow-xl flex items-center justify-center gap-3"
            >
               🖨️ طباعة الفاتورة
            </button>
            <button 
              onClick={handleShareScreenshot}
              className="bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
               📸 مشاركة كصورة
            </button>
            <button 
              onClick={onContinueShopping}
              className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition shadow-xl sm:col-span-2 lg:col-span-1"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessView;