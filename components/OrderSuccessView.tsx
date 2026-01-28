
import React, { useRef, useState } from 'react';
import { Order } from '../types';

interface OrderSuccessViewProps {
  order: Order;
  onContinueShopping: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onContinueShopping }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleShareScreenshot = async () => {
    if (!invoiceRef.current) return;
    
    setIsCapturing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await (window as any).html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f9fafb',
        ignoreElements: (element: any) => element.classList.contains('no-screenshot')
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;

        const file = new File([blob], `EliteStore-Order-${order.id}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'فاتورة طلب متجر النخبة',
              text: `لقطة شاشة لطلبي رقم ${order.id} من متجر النخبة.`
            });
          } catch (err) {
            console.log('User cancelled share or error:', err);
          }
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `EliteStore-Order-${order.id}.png`;
          link.click();
          alert('تم تحميل لقطة الشاشة لجهازك (متصفحك لا يدعم المشاركة المباشرة).');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot error:', error);
      alert('حدث خطأ أثناء التقاط الصورة.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSharePdf = async () => {
    if (!invoiceRef.current) return;

    setIsExportingPdf(true);

    try {
      const element = invoiceRef.current;
      const opt = {
        margin: [10, 10],
        filename: `EliteStore-Order-${order.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          ignoreElements: (el: any) => el.classList.contains('no-screenshot') 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // تحويل العنصر إلى Blob PDF
      const pdfBlob = await (window as any).html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], `EliteStore-Order-${order.id}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'فاتورة طلب متجر النخبة (PDF)',
            text: `ملف PDF لطلبي رقم ${order.id} من متجر النخبة.`
          });
        } catch (err) {
          console.log('User cancelled share or error:', err);
        }
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `EliteStore-Order-${order.id}.pdf`;
        link.click();
        alert('تم تحميل ملف PDF لجهازك (متصفحك لا يدعم المشاركة المباشرة).');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fadeIn">
      <div 
        ref={invoiceRef} 
        className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header Success Section */}
        <div className="bg-emerald-500 p-12 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100" fill="white" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className={`no-screenshot w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isCapturing || isExportingPdf ? '' : 'animate-bounce'}`}>
              <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black mb-2">تم استلام طلبك!</h2>
            <p className="text-emerald-100 font-bold text-lg">شكراً لتسوقك معنا، تم تسجيل طلبك بنجاح.</p>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-8 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-8">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">رقم الطلب</p>
              <p className="text-xl font-mono font-black text-gray-900">{order.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">تاريخ الطلب</p>
              <p className="text-lg font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">طريقة الدفع</p>
              <p className="text-lg font-bold text-indigo-600">
                {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Delivery Info */}
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                بيانات التوصيل
              </h3>
              <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
                <p className="font-bold text-gray-800">{order.customerName}</p>
                <p className="text-gray-600 text-sm">{order.phone}</p>
                <p className="text-gray-600 text-sm">{order.city} - {order.address}</p>
              </div>
            </div>

            {/* Summary Info */}
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                ملخص الفاتورة
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">المجموع الفرعي</span>
                  <span className="font-bold">{order.subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">الضريبة (15%)</span>
                  <span className="font-bold">{(order.total - order.subtotal).toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>الشحن</span>
                  <span>مجاني</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-4 border-t border-gray-100">
                  <span>الإجمالي</span>
                  <span className="text-indigo-600">{order.total.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-gray-900">المنتجات المطلوبة</h3>
            <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-50">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4">
                  <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover border border-white" alt="" />
                  <div className="flex-grow">
                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs font-bold">
                      الكمية: {item.quantity} | {item.selectedSize ? `المقاس: ${item.selectedSize}` : ''} {item.selectedColor ? `اللون: ${item.selectedColor}` : ''}
                    </p>
                  </div>
                  <p className="font-black text-gray-900 text-sm">{(item.price * item.quantity).toFixed(2)} ر.س</p>
                </div>
              ))}
            </div>
          </div>

          {/* أزرار الإجراءات - سيتم إخفاؤها في لقطة الشاشة والـ PDF */}
          <div className="no-screenshot pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={handleShareScreenshot}
              disabled={isCapturing || isExportingPdf}
              className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isCapturing ? 'جاري التصوير...' : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  مشاركة كصورة
                </>
              )}
            </button>
            
            <button 
              onClick={handleSharePdf}
              disabled={isCapturing || isExportingPdf}
              className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isExportingPdf ? 'جاري التحويل...' : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  مشاركة ملف PDF
                </>
              )}
            </button>

            <button 
              onClick={onContinueShopping}
              className="bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95 sm:col-span-2 lg:col-span-1"
            >
              العودة للمتجر
            </button>
          </div>
        </div>
      </div>
      
      <p className="no-screenshot text-center mt-8 text-gray-400 font-bold text-sm">
        تم إرسال نسخة من الفاتورة إلى بريدك الإلكتروني المسجل.
      </p>
    </div>
  );
};

export default OrderSuccessView;
