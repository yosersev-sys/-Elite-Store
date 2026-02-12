
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
    
    const h2c = (window as any).html2canvas;
    if (!h2c) {
      alert('مكتبة التقاط الصور غير محملة بعد، يرجى المحاولة مرة أخرى');
      return;
    }

    setIsCapturing(true);
    try {
      // إخفاء الأزرار قبل التقاط الصورة
      const canvas = await h2c(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        const file = new File([blob], `invoice-${order.id}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'فاتورة فاقوس ستور',
            text: `رقم الفاتورة: ${order.id}`
          });
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Faqous-Store-${order.id}.png`;
          link.click();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot error:', error);
      alert('فشل التقاط صورة الفاتورة');
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
        <div className="bg-green-600 p-12 text-center text-white relative print:bg-white print:text-black print:p-6 print:border-b-2">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl font-black mb-2 flex items-center gap-2">
                <span className="print:text-green-600">🛍️</span> فاقوس ستور
            </h1>
            <p className="font-bold opacity-80 print:opacity-100">فاتورة مبيعات معتمدة</p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-8 text-right">
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
              <p className="text-lg font-bold text-green-700">{order.paymentMethod}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-right">
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 border-r-4 border-green-600 pr-3">المستلم</h3>
              <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
                <p className="font-black text-gray-800">{order.customerName}</p>
                <p className="text-gray-600 font-bold text-sm">{order.phone}</p>
                <p className="text-gray-500 text-sm">{order.city} - {order.address}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-gray-900 border-r-4 border-slate-900 pr-3">الحساب</h3>
              <div className="space-y-3 px-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">المجموع الفرعي</span>
                  <span className="font-bold text-slate-800">{order.subtotal?.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-5 border-t border-gray-100">
                  <span>الإجمالي</span>
                  <span className="text-green-600">{order.total?.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-right">
            <h3 className="font-black text-gray-900">البنود</h3>
            <div className="overflow-hidden border rounded-2xl">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                    <tr>
                        <th className="px-6 py-4">المنتج</th>
                        <th className="px-6 py-4">الكمية</th>
                        <th className="px-6 py-4">الإجمالي</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.name}</td>
                            <td className="px-6 py-4 font-black text-slate-900 text-sm">{item.quantity}</td>
                            <td className="px-6 py-4 font-black text-green-600 text-sm">{(item.price * item.quantity).toFixed(2)} ر.س</td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
            <button onClick={handlePrint} className="bg-slate-900 text-white py-4 rounded-2xl font-black">🖨️ طباعة</button>
            <button onClick={handleShareScreenshot} disabled={isCapturing} className="bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50">
              {isCapturing ? 'جاري التحضير...' : '📸 مشاركة'}
            </button>
            <button onClick={onContinueShopping} className="bg-green-600 text-white py-4 rounded-2xl font-black">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessView;
