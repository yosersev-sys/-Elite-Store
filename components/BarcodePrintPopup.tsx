import React from 'react';
import ReactDOM from 'react-dom';
import { Product } from '../types';

interface BarcodePrintPopupProps {
  product: Product;
  onClose: () => void;
}

const BarcodePrintPopup: React.FC<BarcodePrintPopupProps> = ({ product, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* الواجهة الظاهرة على الشاشة */}
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 animate-fadeIn no-print">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🏷️
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">تم حفظ المنتج بنجاح!</h3>
            <p className="text-slate-400 font-bold text-xs mb-8">هل تريد طباعة ملصق الباركود الآن؟</p>

            {/* معاينة الملصق على الشاشة */}
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50">
               <div 
                 className="bg-white p-3 mx-auto shadow-sm flex flex-col items-center justify-center border border-black"
                 style={{ width: '50mm', height: '25mm', fontFamily: 'monospace' }}
               >
                  <p className="text-[8pt] font-black text-black truncate w-full text-center mb-0.5">{product.name}</p>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                     <div className="text-[12pt] font-black tracking-[2px] border-y border-black px-2">{product.barcode || product.id.slice(-8)}</div>
                     <p className="text-[6pt] font-bold text-black">{product.barcode || product.id}</p>
                  </div>
                  <p className="text-[8pt] font-black text-black mt-0.5">السعر: {product.price} ج.م</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handlePrint}
                className="bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 cursor-pointer"
              >
                طباعة الملصق 🖨️
              </button>
              <button 
                onClick={onClose}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* النسخة المخصصة للطباعة فقط باستخدام Portal خارج الـ root الرئيسي لتجنب طباعة باقي محتوى الصفحة */}
      {ReactDOM.createPortal(
        <div className="barcode-print-portal font-mono">
          <div className="print-sticker-box">
            <p className="print-sticker-title">{product.name}</p>
            <div className="print-sticker-barcode-box">
              <div className="print-sticker-val">{product.barcode || product.id.slice(-8)}</div>
              <p className="print-sticker-txt">{product.barcode || product.id}</p>
            </div>
            <p className="print-sticker-price">السعر: {product.price} ج.م</p>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @media print {
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          #root {
            display: none !important;
          }
          .barcode-print-portal {
            display: flex !important;
            width: 50mm !important;
            height: 25mm !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            background: white !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
          .print-sticker-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 50mm !important;
            height: 25mm !important;
            padding: 1.5mm !important;
            box-sizing: border-box !important;
            background: white !important;
          }
          .print-sticker-title {
            font-size: 8.5pt !important;
            font-weight: 900 !important;
            text-align: center !important;
            width: 100% !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            margin: 0 0 0.5mm 0 !important;
            color: #000 !important;
          }
          .print-sticker-barcode-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .print-sticker-val {
            font-size: 13.5pt !important;
            font-weight: 900 !important;
            letter-spacing: 2px !important;
            border-top: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            padding: 0.2mm 2mm !important;
            text-align: center !important;
            color: #000 !important;
          }
          .print-sticker-txt {
            font-size: 6.5pt !important;
            text-align: center !important;
            margin: 0.5mm 0 0 0 !important;
            color: #000 !important;
          }
          .print-sticker-price {
            font-size: 8.5pt !important;
            font-weight: 900 !important;
            margin: 0.5mm 0 0 0 !important;
            color: #000 !important;
          }
        }
        @media screen {
          .barcode-print-portal {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default BarcodePrintPopup;
