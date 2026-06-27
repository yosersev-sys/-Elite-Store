import React from 'react';
import ReactDOM from 'react-dom';
import { Product } from '../types';

interface BarcodePrintPopupProps {
  product: Product;
  onClose: () => void;
}

// جدول رموز ترميز Code 39 لإنشاء خطوط باركود حقيقية بدون إنترنت
const CODE39_MAP: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
  '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
};

const getUnitArabic = (u: string) => {
  switch (u) {
    case 'piece': return 'قطعة';
    case 'carton': return 'كرتونة';
    case 'box': return 'علبة';
    case 'bottle': return 'زجاجة';
    case 'kg': return 'كجم';
    case 'gram': return 'جم';
    case 'liter': return 'لتر';
    case 'meter': return 'متر';
    default: return u || 'قطعة';
  }
};

// مكون توليد خطوط الباركود (Code 39 Barcode Generator) باستخدام الحدود Borders لضمان ظهورها في الطباعة
const BarcodeRenderer: React.FC<{ value: string }> = ({ value }) => {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '');
  const cleanValue = '*' + (normalized || '0000') + '*';
  
  const bars: { isBar: boolean; isWide: boolean }[] = [];
  
  for (let i = 0; i < cleanValue.length; i++) {
    const char = cleanValue[i];
    const pattern = CODE39_MAP[char];
    if (!pattern) continue;
    
    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      bars.push({ isBar, isWide });
    }
    
    // فاصل بين الحروف
    if (i < cleanValue.length - 1) {
      bars.push({ isBar: false, isWide: false });
    }
  }
  
  return (
    <div className="flex items-stretch h-8 select-none overflow-hidden justify-center" style={{ width: '100%' }}>
      {bars.map((bar, idx) => {
        // نستخدم مقاسات دقيقة لتناسب ملصق 50 مم
        const width = bar.isWide ? '1.8px' : '0.7px';
        return (
          <div 
            key={idx} 
            style={{ 
              width: '0px', 
              borderLeft: `${width} solid ${bar.isBar ? '#000' : 'transparent'}`,
              height: '100%',
              flexShrink: 0
            }} 
          />
        );
      })}
    </div>
  );
};

const BarcodePrintPopup: React.FC<BarcodePrintPopupProps> = ({ product, onClose }) => {
  // حصر كافة وحدات المنتج الصالحة للطباعة (الأساسية + الإضافية)
  const printableUnits = React.useMemo(() => {
    const list = [];
    
    // 1. الوحدة الأساسية (مثال: قطعة)
    list.push({
      id: 'base',
      name: product.name,
      unitName: product.unit || 'piece',
      barcode: product.barcode || product.id.slice(-8),
      price: product.price,
      label: `${getUnitArabic(product.unit || 'piece')} (الأساسية)`
    });
    
    // 2. الوحدات الإضافية المفعلة ولها باركود خاص بها
    if (product.units) {
      product.units.forEach(u => {
        if (u.isActive === 1 && u.barcode) {
          list.push({
            id: u.id,
            name: `${product.name} (${u.unitName})`,
            unitName: u.unitName,
            barcode: u.barcode,
            price: u.salePrice,
            label: `${u.unitName}`
          });
        }
      });
    }
    
    return list;
  }, [product]);

  const [selectedUnitId, setSelectedUnitId] = React.useState(printableUnits[0]?.id || 'base');

  const handlePrint = () => {
    window.print();
  };

  // الوحدة النشطة حالياً للمعاينة والطباعة
  const activeUnit = React.useMemo(() => {
    return printableUnits.find(u => u.id === selectedUnitId) || printableUnits[0];
  }, [selectedUnitId, printableUnits]);

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
            <h3 className="text-xl font-black text-slate-800 mb-2">طباعة ملصق الباركود</h3>
            <p className="text-slate-400 font-bold text-xs mb-6">اختر الوحدة المراد طباعة ملصق الباركود لها:</p>

            {/* أزرار التبديل بين الوحدات */}
            {printableUnits.length > 1 && (
              <div className="flex justify-center gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full overflow-x-auto no-scrollbar">
                {printableUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${selectedUnitId === unit.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            )}

            {/* معاينة الملصق على الشاشة */}
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50">
               <div 
                 className="bg-white p-3 mx-auto shadow-sm flex flex-col items-center justify-between border border-black text-right"
                 style={{ width: '50mm', height: '25mm', fontFamily: 'monospace' }}
               >
                  <p className="text-[8pt] font-black text-black truncate w-full text-center mb-1">{activeUnit.name}</p>
                  <div className="flex flex-col items-center justify-center w-full my-auto">
                     <BarcodeRenderer value={activeUnit.barcode} />
                     <p className="text-[7pt] font-bold text-black mt-1 font-mono tracking-wider">{activeUnit.barcode}</p>
                  </div>
                  <div className="flex justify-between w-full text-[8pt] font-black text-black mt-1">
                     <span>السعر: {activeUnit.price} ج.م</span>
                     <span className="font-sans text-[7.5pt]">soqelasr.com</span>
                  </div>
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
            <p className="print-sticker-title">{activeUnit.name}</p>
            <div className="print-sticker-barcode-box">
              <BarcodeRenderer value={activeUnit.barcode} />
              <p className="print-sticker-txt">{activeUnit.barcode}</p>
            </div>
            <div className="print-sticker-footer">
              <span className="print-sticker-price">السعر: {activeUnit.price} ج.م</span>
              <span className="print-sticker-link">soqelasr.com</span>
            </div>
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
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
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
            justify-content: space-between !important;
            width: 50mm !important;
            height: 25mm !important;
            padding: 1.5mm 2mm !important;
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
            margin: 0 !important;
            color: #000 !important;
          }
          .print-sticker-barcode-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            margin: auto 0 !important;
          }
          .print-sticker-txt {
            font-size: 7.5pt !important;
            font-weight: bold !important;
            text-align: center !important;
            margin: 1mm 0 0 0 !important;
            color: #000 !important;
            letter-spacing: 1px !important;
          }
          .print-sticker-footer {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .print-sticker-price {
            font-size: 8.5pt !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          .print-sticker-link {
            font-size: 7.5pt !important;
            font-weight: 900 !important;
            color: #000 !important;
            font-family: sans-serif !important;
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
