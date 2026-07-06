
import React, { useRef, useState, useEffect } from 'react';
import { Order } from '../types';
import { WhatsAppService } from '../services/whatsappService';
import { POSPrintService } from '../services/posPrintService';

interface OrderSuccessViewProps {
  order: Order;
  adminPhone: string;
  postSubmitAction?: 'print_and_open' | 'open_only' | 'save_only' | null;
  onResetPostSubmitAction?: () => void;
  onContinueShopping: () => void;
}

const safeDate = (val: any): Date => {
  if (!val) return new Date();
  const num = Number(val);
  const dateObj = isNaN(num) ? new Date(val) : new Date(num);
  return isNaN(dateObj.getTime()) ? new Date() : dateObj;
};

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ 
  order, adminPhone, postSubmitAction, onResetPostSubmitAction, onContinueShopping 
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (postSubmitAction) {
      const timer = setTimeout(() => {
        if (postSubmitAction === 'print_and_open') {
          POSPrintService.printInvoice(order);
        } else if (postSubmitAction === 'open_only') {
          POSPrintService.openDrawer();
        }
        if (onResetPostSubmitAction) {
          onResetPostSubmitAction();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [postSubmitAction]);

  // معالجة آمنة للقيم الرقمية لمنع الـ Crash ودعم الخصومات
  const safeTotal = Number(order.total || 0);
  const safeSubtotal = Number(order.subtotalBeforeDiscount !== undefined ? order.subtotalBeforeDiscount : (order.subtotal || 0));
  const safeTotalItemDiscounts = Number(order.totalItemDiscounts || 0);
  const safeInvoiceDiscount = Number(order.discount || 0);
  const safeDeliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : Math.max(0, safeTotal - safeSubtotal));
  const customerSavings = safeTotalItemDiscounts + safeInvoiceDiscount;

  const handlePrint = () => {
    POSPrintService.printInvoice(order);
  };

  const handleOpenDrawerOnly = () => {
    POSPrintService.openDrawer();
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
            size: auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
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
            width: 100% !important;
            max-width: 100% !important;
            padding: 4mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            position: relative !important;
          }
          .thermal-invoice * {
            font-size: 10pt !important;
            line-height: 1.3 !important;
            color: #000 !important;
          }
          .thermal-invoice .store-link {
            font-size: 13pt !important;
            font-weight: 900 !important;
            margin-top: 2mm !important;
          }
          .thermal-invoice h1 {
            font-size: 14pt !important;
            margin-bottom: 3mm !important;
          }
          .item-row {
            border-bottom: 1px dashed #000 !important;
            padding: 1.5mm 0 !important;
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
            <span className="font-bold">{safeDate(order.createdAt).toLocaleDateString('ar-EG')}</span>
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
            {(order.items || []).map((item, idx) => {
              const itemDisc = item.discountValue ? (item.discountType === 'percent' ? (item.price * item.discountValue / 100) : item.discountValue) : 0;
              const hasDisc = itemDisc > 0;
              const priceAfterDisc = item.price - itemDisc;
              return (
                <div key={idx} className="item-row text-[11px]">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="truncate pr-1">{item.name}</span>
                    <span>{(priceAfterDisc * Number(item.quantity || 0)).toFixed(2)}</span>
                  </div>
                  <div className="text-[9px] text-gray-400">
                    {item.quantity} {item.unit === 'kg' ? 'كجم' : item.unit === 'gram' ? 'جم' : 'ق'} × {priceAfterDisc.toFixed(2)}
                    {hasDisc && (
                      <span className="text-rose-500 font-Cairo font-bold mr-1 line-through">
                        ({Number(item.price).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ملخص الحساب */}
        <div className="border-t-2 border-dashed border-gray-300 pt-2 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">المجموع الفرعي:</span>
            <span className="font-bold">{safeSubtotal.toFixed(2)}</span>
          </div>
          
          {safeTotalItemDiscounts > 0 && (
            <div className="flex justify-between text-[11px] text-rose-600">
              <span>خصم المنتجات:</span>
              <span className="font-bold">-{safeTotalItemDiscounts.toFixed(2)}</span>
            </div>
          )}

          {safeInvoiceDiscount > 0 && (
            <div className="flex justify-between text-[11px] text-rose-600">
              <span>خصم الفاتورة:</span>
              <span className="font-bold">-{safeInvoiceDiscount.toFixed(2)}</span>
            </div>
          )}

          {safeDeliveryFee > 0 && (
            <div className="flex justify-between text-[11px] text-slate-700">
              <span>رسوم التوصيل 🚚:</span>
              <span className="font-bold">+{safeDeliveryFee.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[13px] font-black pt-1 border-t border-gray-200 mt-1">
            <span>الإجمالي الصافي:</span>
            <span className="text-slate-900">{safeTotal.toFixed(2)} ج.م</span>
          </div>

          {customerSavings > 0 && (
            <div className="bg-emerald-50 text-emerald-800 text-center p-2 rounded-xl text-[10px] font-black mt-2 border border-emerald-100 animate-pulse no-print">
              💰 إجمالي التوفير: {customerSavings.toFixed(2)} ج.م
            </div>
          )}
          
          <div className="text-center pt-3 text-[10px] font-bold text-gray-500 space-y-1">
            <div>طريقة الدفع: {order.paymentMethod}</div>
            {order.payments && order.payments.length > 0 && (
              <div className="mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[9px] font-bold text-slate-600 space-y-1">
                <p className="border-b pb-1 mb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider">تفاصيل المدفوعات المستلمة</p>
                {order.payments.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between flex-row-reverse text-right">
                    <span>{(Number(p.amount) || 0).toFixed(2)} ج.م</span>
                    <span className="text-slate-700">
                      {p.method === 'cash' ? '💵 نقدي (كاش)' : 
                       p.method === 'vodafone' ? '📱 فودافون كاش' : 
                       p.method === 'instapay' ? '💸 انستا باي' : 
                       p.method === 'visa' ? '💳 فيزا' : p.method}
                      {p.reference && <span className="block text-[8px] text-slate-400 mt-0.5" dir="rtl">{p.reference}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {order.status === 'completed' && order.confirmedAt && (
            <div className="mt-3 pt-2 border-t border-dashed border-gray-200 space-y-1 text-[9px] text-gray-500 font-bold">
              <div className="flex justify-between">
                <span>تاريخ الإنشاء:</span>
                <span>{safeDate(order.createdAt).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ التأكيد:</span>
                <span>{safeDate(order.confirmedAt).toLocaleString('ar-EG')}</span>
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
        <div className="mt-4 text-center border-t-2 border-dashed border-gray-300 pt-3 flex flex-col items-center justify-center">
          <p className="text-[10px] font-black text-slate-800 mb-1">شكراً لزيارتكم!</p>
          <p className="store-link text-[13px] text-emerald-600 font-black uppercase tracking-widest mt-0.5 mb-2">soqelasr.com</p>
          
          <div className="w-20 h-20 p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm mx-auto">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://soqelasr.com" 
              alt="QR Code" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[7px] text-slate-400 font-bold mt-1">امسح الكود لزيارة موقعنا 🌐</p>
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
          onClick={handleOpenDrawerOnly} 
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition active:scale-95 shadow-xl cursor-pointer"
        >
          <span>🔓</span> فتح الدرج فقط
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
          className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-xl cursor-pointer"
        >
          <span>💬</span> تأكيد وإرسال عبر واتساب
        </button>
        <button 
          onClick={onContinueShopping} 
          className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition active:scale-95 shadow-sm sm:col-span-2 cursor-pointer"
        >
          {order.id.startsWith('INV-') || order.id.startsWith('OFF-') || order.id.startsWith('OFFLINE-') ? 'العودة للصفحة السابقة' : 'العودة للمتجر'}
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessView;
