
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
      // ننتظر لحظة للتأكد من رندر العناصر
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await (window as any).html2canvas(invoiceRef.current, {
        scale: 3, // دقة عالية للمشاركة
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 300, // عرض ثابت للصورة يشبه الورق الحراري
      });
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        const file = new File([blob], `Invoice-${order.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'فاتورة سوق العصر',
            text: `طلب رقم ${order.id}`,
          });
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Invoice-${order.id}.png`;
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
    <div className="max-w-md mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0">
      {/* ستايلات مخصصة للطباعة الحرارية 5سم */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .thermal-invoice {
            width: 58mm !important;
            padding: 2mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
          .thermal-invoice * {
            font-size: 9pt !important;
            color: black !important;
          }
          .thermal-invoice h1 {
            font-size: 14pt !important;
          }
        }
      `}</style>

      {/* حاوية الفاتورة - مصممة لتكون ضيقة */}
      <div 
        ref={invoiceRef} 
        className="thermal-invoice bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden p-6 md:p-8"
        style={{ width: '100%', maxWidth: '320px', fontFamily: 'Courier, monospace' }}
      >
        {/* رأس الفاتورة */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          <h1 className="text-2xl font-black text-slate-900 mb-1">سوق العصر</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">فاقوس - أول سوق إلكتروني</p>
          <div className="mt-2 text-[11px] font-bold text-slate-800">
            فاتورة مبيعات #{order.id}
          </div>
        </div>

        {/* بيانات العميل والتاريخ */}
        <div className="space-y-1 mb-4 text-[12px]">
          <div className="flex justify-between">
            <span className="text-gray-400">التاريخ:</span>
            <span className="font-bold">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">العميل:</span>
            <span className="font-bold truncate max-w-[120px]">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">الهاتف:</span>
            <span className="font-bold">{order.phone}</span>
          </div>
          {order.address && (
            <div className="text-[10px] text-gray-500 leading-tight mt-1 text-center">
              {order.address}
            </div>
          )}
        </div>

        {/* جدول الأصناف (مبسط للعرض الضيق) */}
        <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-4">
          <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 px-1 uppercase">
            <span>الصنف</span>
            <span>الإجمالي</span>
          </div>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-[12px]">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="truncate pr-2">{item.name}</span>
                  <span>{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  {item.quantity} {item.unit === 'kg' ? 'كجم' : item.unit === 'gram' ? 'جم' : 'ق'} × {item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ملخص الحساب */}
        <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-between text-[13px]">
            <span className="font-bold">المجموع:</span>
            <span>{order.total.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="font-bold">التوصيل:</span>
            <span className="text-emerald-600">0.00</span>
          </div>
          <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-100">
            <span>الإجمالي:</span>
            <span className="text-emerald-700">{order.total.toFixed(2)} ج.م</span>
          </div>
          <div className="text-center pt-2 text-[10px] font-bold text-gray-400 italic">
            طريقة الدفع: {order.paymentMethod}
          </div>
        </div>

        {/* التذييل */}
        <div className="mt-6 text-center border-t-2 border-dashed border-gray-300 pt-4">
          <div className="bg-slate-50 py-2 px-2 rounded-lg mb-2">
            <p className="text-[10px] font-black text-slate-800">شكراً لزيارتكم! نرجو أن نراكم قريباً</p>
          </div>
          <p className="text-[8px] text-gray-400">souqalasr.com</p>
        </div>
      </div>

      {/* أزرار التحكم - لا تظهر في الطباعة */}
      <div className="no-print mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button 
          onClick={handlePrint} 
          className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition active:scale-95 shadow-xl"
        >
          <span>🖨️</span> طباعة كاشير
        </button>
        <button 
          onClick={handleShareScreenshot} 
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition active:scale-95 shadow-xl disabled:opacity-50"
        >
          <span>📸</span> {isCapturing ? 'جاري الحفظ...' : 'مشاركة صورة'}
        </button>
        <button 
          onClick={onContinueShopping} 
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition active:scale-95 shadow-xl"
        >
          العودة للمتجر
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessView;
