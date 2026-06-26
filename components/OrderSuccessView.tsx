
import React, { useRef, useState } from 'react';
import { Order } from '../types';
import { WhatsAppService } from '../services/whatsappService';

interface OrderSuccessViewProps {
  order: Order;
  adminPhone: string;
  onContinueShopping: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, adminPhone, onContinueShopping }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // معالجة آمنة للقيم الرقمية لمنع الـ Crash
  const safeTotal = Number(order.total || 0);
  const safeSubtotal = Number(order.subtotal || 0);
  const deliveryFee = Math.max(0, safeTotal - safeSubtotal);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppConfirm = () => {
    WhatsAppService.sendOrderNotification(order, adminPhone);
  };

  const handleShareScreenshot = async () => {
    if (!invoiceRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await (window as any).html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 250,
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

  if (!order || !order.id) {
     return <div className="p-20 text-center font-black text-slate-400">عذراً، لم يتم العثور على بيانات الفاتورة.</div>;
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0">
      {/* تعليمات الطباعة الصارمة لمقاس 5 سم */}
      <style>{`
        @media print {
          @page {
            size: 50mm auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 50mm !important;
            height: auto !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, .no-print, button, .floating-btn {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .thermal-invoice {
            display: block !important;
            width: 50mm !important;
            max-width: 50mm !important;
            padding: 2mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
          }
          .thermal-invoice * {
            font-size: 8pt !important;
            line-height: 1.2 !important;
            color: #000 !important;
          }
          .thermal-invoice .store-link {
            font-size: 11pt !important;
            font-weight: 900 !important;
            margin-top: 1mm !important;
          }
          .thermal-invoice h1 {
            font-size: 12pt !important;
            margin-bottom: 2mm !important;
          }
          .item-row {
            border-bottom: 1px dashed #ccc !important;
            padding: 1mm 0 !important;
          }
        }
      `}</style>

      {/* رسالة نجاح إتمام الطلب */}
      <div className="no-print bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center space-y-3 mb-6">
        <span className="text-4xl">🎉</span>
        <h4 className="font-black text-emerald-800 text-lg">تم تسجيل طلبك بنجاح!</h4>
        <p className="text-xs font-bold text-emerald-600 leading-relaxed">
          تم إتمام الطلب وحفظ الفاتورة بالمتجر. لتأكيد وتجهيز الطلب بشكل أسرع، يمكنك إرسال الفاتورة للإدارة عبر واتساب.
        </p>
        <button
          onClick={handleWhatsAppConfirm}
          className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 px-6 rounded-2xl font-black text-sm transition active:scale-95 shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💬</span> تأكيد الطلب عبر واتساب
        </button>
      </div>

      {/* حاوية الفاتورة */}
      <div 
        ref={invoiceRef} 
        className="thermal-invoice bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden p-4 md:p-6"
        style={{ width: '100%', maxWidth: '280px', fontFamily: 'Courier, monospace' }}
      >
        {/* رأس الفاتورة */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
          <h1 className="text-xl font-black text-slate-900 mb-1">سوق العصر</h1>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">فاقوس - أول سوق إلكتروني</p>
          <div className="mt-2 text-[10px] font-bold text-slate-800">
            رقم الفاتورة: {order.id}
          </div>
        </div>

        {/* بيانات العميل */}
        <div className="space-y-1 mb-3 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-400">التاريخ:</span>
            <span className="font-bold">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">العميل:</span>
            <span className="font-bold truncate max-w-[100px]">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">الهاتف:</span>
            <span className="font-bold">{order.phone}</span>
          </div>
          {order.address && order.address !== 'استلام فرع (كاشير)' && (
             <div className="text-[9px] text-gray-500 mt-1 border-t border-gray-100 pt-1">
               <span className="font-bold">العنوان: </span>{order.address}
             </div>
          )}
        </div>

        {/* جدول الأصناف */}
        <div className="border-t-2 border-dashed border-gray-300 pt-2 mb-3">
          <div className="flex justify-between text-[9px] font-black text-gray-400 mb-2 px-1 uppercase">
            <span>الصنف</span>
            <span>الإجمالي</span>
          </div>
          <div className="space-y-2">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="item-row text-[11px]">
                <div className="flex justify-between font-bold text-slate-800">
                  <span className="truncate pr-1">{item.name}</span>
                  <span>{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                </div>
                <div className="text-[9px] text-gray-400">
                  {item.quantity} {item.unit === 'kg' ? 'كجم' : item.unit === 'gram' ? 'جم' : 'ق'} × {Number(item.price || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ملخص الحساب */}
        <div className="border-t-2 border-dashed border-gray-300 pt-2 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">المجموع الفرعي:</span>
            <span className="font-bold">{safeSubtotal.toFixed(2)}</span>
          </div>
          
          {/* بند التوصيل المطلب */}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[11px] text-emerald-700">
              <span className="font-bold">رسوم التوصيل 🚚:</span>
              <span className="font-bold">+{deliveryFee.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[14px] font-black pt-1 border-t border-gray-200 mt-1">
            <span>الإجمالي:</span>
            <span className="text-slate-900">{safeTotal.toFixed(2)} ج.م</span>
          </div>
          
          <div className="text-center pt-3 text-[9px] font-bold text-gray-400 italic">
            طريقة الدفع: {order.paymentMethod}
          </div>
          
          {order.status === 'completed' && order.confirmedAt && (
            <div className="mt-3 pt-2 border-t border-dashed border-gray-200 space-y-1 text-[9px] text-gray-500 font-bold">
              <div className="flex justify-between">
                <span>تاريخ الإنشاء:</span>
                <span>{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ التأكيد:</span>
                <span>{new Date(order.confirmedAt).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span>الموظف المؤكّد:</span>
                <span>{order.confirmedByName || 'الكاشير'}</span>
              </div>
              {order.confirmedShiftId && (
                <div className="flex justify-between">
                  <span>الوردية:</span>
                  <span>#{order.confirmedShiftId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* التذييل */}
        <div className="mt-4 text-center border-t-2 border-dashed border-gray-300 pt-3">
          <p className="text-[10px] font-black text-slate-800 mb-1">شكراً لزيارتكم!</p>
          <p className="store-link text-[14px] text-emerald-600 font-black uppercase tracking-widest mt-1">soqelasr.com</p>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="no-print mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button 
          onClick={handlePrint} 
          className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition active:scale-95 shadow-xl cursor-pointer"
        >
          <span>🖨️</span> طباعة الفاتورة
        </button>
        <button 
          onClick={handleShareScreenshot} 
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition active:scale-95 shadow-xl disabled:opacity-50 cursor-pointer"
        >
          <span>📸</span> {isCapturing ? 'جاري الحفظ...' : 'مشاركة صورة'}
        </button>
        <button 
          onClick={handleWhatsAppConfirm} 
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-xl sm:col-span-2 cursor-pointer"
        >
          <span>💬</span> تأكيد وإرسال عبر واتساب
        </button>
        <button 
          onClick={onContinueShopping} 
          className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-250 transition active:scale-95 shadow-sm sm:col-span-2 cursor-pointer"
        >
          العودة للمتجر
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessView;
