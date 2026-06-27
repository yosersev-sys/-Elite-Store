import{r as l,j as e}from"./index-BEwjB8vr.js";const r=({product:t,onClose:s})=>{const i=l.useRef(null),a=()=>{window.print()};return e.jsxs("div",{className:"fixed inset-0 z-[11000] flex items-center justify-center p-4 animate-fadeIn no-print",children:[e.jsx("div",{className:"absolute inset-0 bg-slate-900/60 backdrop-blur-sm",onClick:s}),e.jsx("div",{className:"relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp",children:e.jsxs("div",{className:"p-8 text-center",children:[e.jsx("div",{className:"w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl",children:"🏷️"}),e.jsx("h3",{className:"text-xl font-black text-slate-800 mb-2",children:"تم حفظ المنتج بنجاح!"}),e.jsx("p",{className:"text-slate-400 font-bold text-xs mb-8",children:"هل تريد طباعة ملصق الباركود الآن؟"}),e.jsx("div",{className:"border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50",children:e.jsxs("div",{ref:i,className:"barcode-sticker bg-white p-2 mx-auto shadow-sm flex flex-col items-center justify-center border border-black",style:{width:"50mm",height:"25mm",fontFamily:"monospace"},children:[e.jsx("p",{className:"text-[8pt] font-black text-black truncate w-full text-center mb-0.5",children:t.name}),e.jsxs("div",{className:"flex flex-col items-center justify-center gap-0.5",children:[e.jsx("div",{className:"text-[12pt] font-black tracking-[2px] border-y border-black px-2",children:t.barcode||t.id.slice(-8)}),e.jsx("p",{className:"text-[6pt] font-bold text-black",children:t.barcode||t.id})]}),e.jsxs("p",{className:"text-[8pt] font-black text-black mt-0.5",children:["السعر: ",t.price," ج.م"]})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx("button",{onClick:a,className:"bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200",children:"طباعة الملصق 🖨️"}),e.jsx("button",{onClick:s,className:"bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all",children:"إغلاق"})]})]})}),e.jsx("style",{children:`
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
      `})]})};export{r as default};
