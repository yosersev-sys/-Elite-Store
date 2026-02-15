
import React, { useRef } from 'react';
import { Product } from '../types';

interface BarcodePrintPopupProps {
  product: Product;
  onClose: () => void;
}

const BarcodePrintPopup: React.FC<BarcodePrintPopupProps> = ({ product, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 animate-fadeIn no-print">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🏷️
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">تم حفظ المنتج بنجاح!</h3>
          <p className="text-slate-400 font-bold text-xs mb-8">هل تريد طباعة ملصق الباركود الآن؟</p>

          {/* معاينة الملصق */}
          <div className="border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50">
             <div 
               ref={printRef}
               className="barcode-sticker bg-white p-2 mx-auto shadow-sm flex flex-col items-center justify-center border border-black"
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
              className="bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              طباعة الملصق 🖨️
            </button>
            <button 
              onClick={onClose}
              className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .barcode-sticker, .barcode-sticker * {
            visibility: visible;
          }
          .barcode-sticker {
            position: fixed;
            left: 0;
            top: 0;
            width: 50mm !important;
            height: 25mm !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 2mm !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodePrintPopup;
