import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';

interface BarcodePrintPopupProps {
  product: Product;
  onClose: () => void;
}

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

// مكون توليد خطوط الباركود باستخدام مكتبة JsBarcode لضمان التوافق المطلق وسرعة قراءة الباركود بالقارئ الليزري
const BarcodeRenderer: React.FC<{ value: string; labelWidth: number }> = ({ value, labelWidth }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        const isNumeric = /^\d+$/.test(value);
        let format = "CODE128";
        
        // إذا كان باركوداً قياسياً دولياً مكوناً من 12 أو 13 رقماً، نرمز بتنسيق EAN13، وإلا نستخدم CODE128
        if (isNumeric && (value.length === 12 || value.length === 13)) {
          format = "EAN13";
        } else if (isNumeric && value.length === 8) {
          format = "EAN8";
        }

        JsBarcode(svgRef.current, value, {
          format: format,
          width: labelWidth < 45 ? 1.4 : 1.8, // سماكة دقيقة لمنع التداخل والتمزق في الملصقات الضيقة
          height: 40,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000'
        });
        
        // تفعيل خيار الحواف الحادة لمنع بهتان الخطوط الحرارية
        svgRef.current.setAttribute('shape-rendering', 'crispEdges');
      } catch (err) {
        console.warn("EAN13 encoding failed, falling back to CODE128:", err);
        try {
          JsBarcode(svgRef.current, value, {
            format: "CODE128",
            width: labelWidth < 45 ? 1.3 : 1.7,
            height: 40,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#000'
          });
          svgRef.current.setAttribute('shape-rendering', 'crispEdges');
        } catch (e) {
          console.error("Barcode generation failed completely:", e);
        }
      }
    }
  }, [value, labelWidth]);

  return (
    <div className="w-full flex justify-center select-none" style={{ height: '36px' }}>
      <svg 
        ref={svgRef} 
        style={{ display: 'block', maxWidth: '95%', height: '100%' }}
      />
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
  
  // مقاسات الملصق الافتراضية بالمليمتر (تم ضبطها افتراضياً على 50 مم × 35 مم بناءً على قياسات العميل الفعيلة)
  const [labelWidth, setLabelWidth] = React.useState(50); 
  const [labelHeight, setLabelHeight] = React.useState(35);
  
  // خيار تدوير الملصق 90 درجة للطباعة الرأسية/الأفقية المتوافقة مع طابعات الملصقات
  const [rotate90, setRotate90] = React.useState(false);

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
            <p className="text-slate-400 font-bold text-xs mb-6">اختر الوحدة والخصائص المناسبة لطابعتك:</p>

            {/* أزرار التبديل بين الوحدات */}
            {printableUnits.length > 1 && (
              <div className="flex justify-center gap-2 mb-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full overflow-x-auto no-scrollbar">
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

            {/* مقاس الملصق */}
            <div className="space-y-2 mb-4 text-right">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 block">مقاس ورق ملصق الباركود (العرض × الارتفاع)</label>
              <select
                value={`${labelWidth}x${labelHeight}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  setLabelWidth(w);
                  setLabelHeight(h);
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs text-slate-700 cursor-pointer"
              >
                <option value="50x35">50mm × 35mm (مقاس الملصق الحالي لديك)</option>
                <option value="38x25">38mm × 25mm (مقاس صغير - شائع جداً)</option>
                <option value="50x25">50mm × 25mm (مقاس متوسط)</option>
                <option value="50x30">50mm × 30mm (مقاس متوسط طويل)</option>
                <option value="40x30">40mm × 30mm (مقاس مربع)</option>
                <option value="60x40">60mm × 40mm (مقاس كبير)</option>
              </select>
            </div>

            {/* خيار تدوير الطباعة */}
            <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تدوير الملصق 90 درجة (للطباعة الرأسية)</span>
              <input
                type="checkbox"
                checked={rotate90}
                onChange={(e) => setRotate90(e.target.checked)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 cursor-pointer"
              />
            </div>

            {/* معاينة الملصق على الشاشة */}
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50 flex items-center justify-center min-h-[140px]">
              <div style={{ width: `${labelWidth}mm`, height: `${labelHeight}mm`, position: 'relative' }}>
                 <div 
                   className="bg-white p-2.5 shadow-sm flex flex-col items-center justify-between border border-black text-right transition-all overflow-hidden"
                   style={{ 
                     width: rotate90 ? `${labelHeight}mm` : `${labelWidth}mm`, 
                     height: rotate90 ? `${labelWidth}mm` : `${labelHeight}mm`, 
                     fontFamily: 'monospace',
                     boxSizing: 'border-box',
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     transform: rotate90 ? 'rotate(90deg) translate(0, -100%)' : 'none',
                     transformOrigin: 'top left'
                   }}
                 >
                    <p className="text-[7.5pt] font-black text-black truncate w-full text-center mb-0.5">{activeUnit.name}</p>
                    <div className="flex flex-col items-center justify-center w-full my-auto overflow-hidden">
                       <BarcodeRenderer value={activeUnit.barcode} labelWidth={labelWidth} />
                       <p className="text-[6.5pt] font-bold text-black mt-0.5 font-mono tracking-wider">{activeUnit.barcode}</p>
                    </div>
                    <div className="flex justify-between w-full text-[7.5pt] font-black text-black mt-0.5">
                       <span>السعر: {activeUnit.price} ج.م</span>
                       <span className="font-sans text-[7pt]">soqelasr.com</span>
                    </div>
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
          <div className={`print-sticker-box ${rotate90 ? 'rotate-90-print' : ''}`}>
            <p className="print-sticker-title">{activeUnit.name}</p>
            <div className="print-sticker-barcode-box">
              <BarcodeRenderer value={activeUnit.barcode} labelWidth={labelWidth} />
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
            size: ${labelWidth}mm ${labelHeight}mm;
            margin: 0 !important;
          }
          html, body {
            width: ${labelWidth}mm !important;
            height: ${labelHeight}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > :not(.barcode-print-portal) {
            display: none !important;
          }
          .barcode-print-portal {
            display: flex !important;
            width: ${labelWidth}mm !important;
            height: ${labelHeight}mm !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            background: white !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .print-sticker-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: ${labelWidth}mm !important;
            height: ${labelHeight}mm !important;
            padding: 1mm 1.5mm !important;
            box-sizing: border-box !important;
            background: white !important;
            overflow: hidden !important;
          }
          .rotate-90-print {
            width: ${labelHeight}mm !important;
            height: ${labelWidth}mm !important;
            transform: rotate(90deg) translate(0, -100%) !important;
            transform-origin: top left !important;
          }
          .print-sticker-title {
            font-size: ${labelWidth < 40 ? '7.5pt' : '8.5pt'} !important;
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
            overflow: hidden !important;
          }
          .print-sticker-txt {
            font-size: 6.5pt !important;
            font-weight: bold !important;
            text-align: center !important;
            margin: 0.5mm 0 0 0 !important;
            color: #000 !important;
            letter-spacing: 0.5px !important;
          }
          .print-sticker-footer {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .print-sticker-price {
            font-size: ${labelWidth < 40 ? '7.5pt' : '8.5pt'} !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          .print-sticker-link {
            font-size: 6.5pt !important;
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
