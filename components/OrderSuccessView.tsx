
import React, { useRef, useState, useEffect } from 'react';
import { Order } from '../types';
import { WhatsAppService } from '../services/whatsappService';

interface OrderSuccessViewProps {
  order: Order;
  adminPhone?: string;
  onContinueShopping: () => void;
}

const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, adminPhone = '201026034170', onContinueShopping }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // توليد الرابط لاستخدامه في وسم <a>
  const whatsappUrl = WhatsAppService.getOrderWhatsAppUrl(order, adminPhone);

  // محاولة الفتح التلقائي كخيار إضافي (قد يمنعه المتصفح، لذا نعتمد على الزر كحل أساسي)
  useEffect(() => {
    if (!hasAutoOpened && order) {
      const timer = setTimeout(() => {
        // نستخدم location.href للتحويل التلقائي فهو أكثر قبولاً من window.open في بعض الحالات
        // لكننا لا نعتمد عليه كلياً، الزر أدناه هو الأهم.
        setHasAutoOpened(true);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [order, adminPhone, hasAutoOpened]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareScreenshot = async () => {
    if (!invoiceRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await (window as any).html2canvas(invoiceRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${order.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'إيصال طلب سوق العصر',
            text: `إيصال الطلب رقم ${order.id}`,
          });
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt-${order.id}.png`;
          link.click();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!order) return null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: #fff !important; width: 80mm; }
          header, footer, nav, .no-print, button, .mobile-nav, .mobile-cart-btn { display: none !important; }
          .thermal-receipt { 
            width: 80mm !important; 
            max-width: 80mm !important; 
            box-shadow: none !important; 
            border: none !important;
            padding: 5mm !important;
            margin: 0 !important;
          }
        }
        .receipt-shadow { box-shadow: 0 20px 50px -10px rgba(0,0,0,0.1); }
      `}</style>

      <div className="flex flex-col items-center gap-6 mb-10 no-print">
         <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">✅</div>
         <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">تم إرسال طلبك!</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">اضغط على الزر الأخضر لتأكيد الطلب مع المدير</p>
         </div>
      </div>

      {/* زر واتساب المدير - تم تحويله لرابط صريح لضمان الفتح في كل المتصفحات */}
      <div className="no-print mb-8">
        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-green-200 flex items-center justify-center gap-3 animate-pulse active:scale-95 transition-all text-center no-underline"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.448-1.271.607-1.445.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298L11 11.23c.044.103.073.222.004.36-.069.138-.104.225-.207.346-.104.121-.219.27-.312.364-.103.104-.21.218-.091.423.119.205.529.873 1.139 1.414.785.698 1.446.915 1.652 1.018.205.103.326.087.447-.052.121-.138.52-.605.659-.812.138-.208.277-.173.466-.104.19.069 1.205.57 1.413.674.208.104.346.156.397.242.052.088.052.509-.092.914z"/>
          </svg>
          تأكيد الطلب عبر واتساب
        </a>
      </div>

      <div 
        ref={invoiceRef} 
        className="thermal-receipt bg-white receipt-shadow mx-auto overflow-hidden relative border border-slate-100"
        style={{ width: '100%', maxWidth: '350px', padding: '32px 24px' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10"></div>

        <div className="text-center mb-8 pb-6 border-b-2 border-dashed border-slate-200">
           <img src="https://soqelasr.com/shopping-bag.png" className="w-14 h-14 mx-auto mb-4 opacity-90" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 tracking-tighter">سوق العصر - فاقوس</h1>
           <p className="text-[11px] font-black text-emerald-600 mt-1 uppercase tracking-widest">soqelasr.com</p>
           <div className="mt-5 inline-block bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
             إيصال مبيعات #{order.id}
           </div>
        </div>

        <div className="space-y-2 mb-8 text-[11px] font-bold text-slate-600">
           <div className="flex justify-between">
              <span className="opacity-50">التاريخ:</span>
              <span>{new Date(order.createdAt).toLocaleDateString('ar-EG')} - {new Date(order.createdAt).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
           <div className="flex justify-between">
              <span className="opacity-50">العميل:</span>
              <span className="text-slate-800">{order.customerName}</span>
           </div>
           <div className="flex justify-between">
              <span className="opacity-50">الهاتف:</span>
              <span>{order.phone}</span>
           </div>
           <div className="flex justify-between items-start">
              <span className="opacity-50">العنوان:</span>
              <span className="text-left max-w-[180px] break-words">{order.address}</span>
           </div>
        </div>

        <div className="border-t border-slate-100 pt-5 mb-8">
           <div className="flex justify-between text-[9px] font-black text-slate-400 mb-4 px-1 uppercase tracking-[0.2em]">
              <span>الوصف</span>
              <span>الإجمالي</span>
           </div>
           <div className="space-y-5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-800 leading-tight flex-grow">{item.name}</span>
                      <span className="text-xs font-black text-slate-900 mr-4">{(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                   <div className="text-[10px] font-bold text-slate-400">
                      {item.quantity} × {item.price.toFixed(2)} ج.م
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="border-t-2 border-dashed border-slate-200 pt-6 space-y-3">
           <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>المجموع الفرعي:</span>
              <span>{order.subtotal.toFixed(2)} ج.م</span>
           </div>
           <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>مصاريف التوصيل:</span>
              <span>{(order.total - order.subtotal).toFixed(2)} ج.م</span>
           </div>
           <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-sm font-black text-slate-800">الإجمالي النهائي:</span>
              <span className="text-2xl font-black text-emerald-600">{order.total.toFixed(2)} ج.م</span>
           </div>
        </div>

        <div className="mt-12 text-center space-y-4 border-t border-slate-50 pt-8">
           <div className="flex flex-col items-center gap-1.5 opacity-60">
              <div className="text-2xl font-black tracking-[5px] text-slate-900 border-x-4 border-slate-900 px-5">
                {String(order.id).replace(/\D/g, '')}
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">شكراً لثقتكم بنا!</p>
           </div>
           <p className="text-[11px] text-emerald-600 font-black uppercase tracking-[0.4em] italic pt-2">WWW.SOQELASR.COM</p>
        </div>
      </div>

      <div className="no-print mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <button 
          onClick={handlePrint} 
          className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
        >
          🖨️ طباعة الفاتورة
        </button>
        <button 
          onClick={handleShareScreenshot} 
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4.5 rounded-2xl font-black text-sm shadow-lg disabled:opacity-50 active:scale-95 transition-all"
        >
          📸 {isCapturing ? 'جاري الحفظ...' : 'حفظ كصورة'}
        </button>
        <button 
          onClick={onContinueShopping} 
          className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-4.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
        >
          العودة للمتجر الرئيسي
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessView;
