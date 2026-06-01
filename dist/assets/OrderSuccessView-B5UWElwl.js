import{r as x,j as t}from"./index-CIjmLrYE.js";const g=({order:e,onContinueShopping:p})=>{const n=x.useRef(null),[r,l]=x.useState(!1),o=Number(e.total||0),c=Number(e.subtotal||0),d=Math.max(0,o-c),h=()=>{window.print()},b=async()=>{if(n.current){l(!0);try{await new Promise(s=>setTimeout(s,200)),(await window.html2canvas(n.current,{scale:3,useCORS:!0,backgroundColor:"#ffffff",width:250})).toBlob(async s=>{if(!s)return;const m=new File([s],`Invoice-${e.id}.png`,{type:"image/png"});if(navigator.share&&navigator.canShare({files:[m]}))await navigator.share({files:[m],title:"فاتورة سوق العصر",text:`طلب رقم ${e.id}`});else{const i=document.createElement("a");i.href=URL.createObjectURL(s),i.download=`Invoice-${e.id}.png`,i.click()}},"image/png")}catch(a){console.error("Screenshot error:",a)}finally{l(!1)}}};return!e||!e.id?t.jsx("div",{className:"p-20 text-center font-black text-slate-400",children:"عذراً، لم يتم العثور على بيانات الفاتورة."}):t.jsxs("div",{className:"max-w-md mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0",children:[t.jsx("style",{children:`
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
      `}),t.jsxs("div",{ref:n,className:"thermal-invoice bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden p-4 md:p-6",style:{width:"100%",maxWidth:"280px",fontFamily:"Courier, monospace"},children:[t.jsxs("div",{className:"text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3",children:[t.jsx("h1",{className:"text-xl font-black text-slate-900 mb-1",children:"سوق العصر"}),t.jsx("p",{className:"text-[9px] font-bold text-gray-500 uppercase tracking-tighter",children:"فاقوس - أول سوق إلكتروني"}),t.jsxs("div",{className:"mt-2 text-[10px] font-bold text-slate-800",children:["رقم الفاتورة: ",e.id]})]}),t.jsxs("div",{className:"space-y-1 mb-3 text-[11px]",children:[t.jsxs("div",{className:"flex justify-between",children:[t.jsx("span",{className:"text-gray-400",children:"التاريخ:"}),t.jsx("span",{className:"font-bold",children:new Date(e.createdAt).toLocaleDateString("ar-EG")})]}),t.jsxs("div",{className:"flex justify-between",children:[t.jsx("span",{className:"text-gray-400",children:"العميل:"}),t.jsx("span",{className:"font-bold truncate max-w-[100px]",children:e.customerName})]}),t.jsxs("div",{className:"flex justify-between",children:[t.jsx("span",{className:"text-gray-400",children:"الهاتف:"}),t.jsx("span",{className:"font-bold",children:e.phone})]}),e.address&&e.address!=="استلام فرع (كاشير)"&&t.jsxs("div",{className:"text-[9px] text-gray-500 mt-1 border-t border-gray-100 pt-1",children:[t.jsx("span",{className:"font-bold",children:"العنوان: "}),e.address]})]}),t.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 mb-3",children:[t.jsxs("div",{className:"flex justify-between text-[9px] font-black text-gray-400 mb-2 px-1 uppercase",children:[t.jsx("span",{children:"الصنف"}),t.jsx("span",{children:"الإجمالي"})]}),t.jsx("div",{className:"space-y-2",children:(e.items||[]).map((a,s)=>t.jsxs("div",{className:"item-row text-[11px]",children:[t.jsxs("div",{className:"flex justify-between font-bold text-slate-800",children:[t.jsx("span",{className:"truncate pr-1",children:a.name}),t.jsx("span",{children:(Number(a.price||0)*Number(a.quantity||0)).toFixed(2)})]}),t.jsxs("div",{className:"text-[9px] text-gray-400",children:[a.quantity," ",a.unit==="kg"?"كجم":a.unit==="gram"?"جم":"ق"," × ",Number(a.price||0).toFixed(2)]})]},s))})]}),t.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 space-y-1",children:[t.jsxs("div",{className:"flex justify-between text-[11px]",children:[t.jsx("span",{className:"text-gray-500",children:"المجموع الفرعي:"}),t.jsx("span",{className:"font-bold",children:c.toFixed(2)})]}),d>0&&t.jsxs("div",{className:"flex justify-between text-[11px] text-emerald-700",children:[t.jsx("span",{className:"font-bold",children:"رسوم التوصيل 🚚:"}),t.jsxs("span",{className:"font-bold",children:["+",d.toFixed(2)]})]}),t.jsxs("div",{className:"flex justify-between text-[14px] font-black pt-1 border-t border-gray-200 mt-1",children:[t.jsx("span",{children:"الإجمالي:"}),t.jsxs("span",{className:"text-slate-900",children:[o.toFixed(2)," ج.م"]})]}),t.jsxs("div",{className:"text-center pt-3 text-[9px] font-bold text-gray-400 italic",children:["طريقة الدفع: ",e.paymentMethod]})]}),t.jsxs("div",{className:"mt-4 text-center border-t-2 border-dashed border-gray-300 pt-3",children:[t.jsx("p",{className:"text-[10px] font-black text-slate-800 mb-1",children:"شكراً لزيارتكم!"}),t.jsx("p",{className:"store-link text-[14px] text-emerald-600 font-black uppercase tracking-widest mt-1",children:"souqalasr.com"})]})]}),t.jsxs("div",{className:"no-print mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3",children:[t.jsxs("button",{onClick:h,className:"flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition active:scale-95 shadow-xl",children:[t.jsx("span",{children:"🖨️"})," طباعة الفاتورة"]}),t.jsxs("button",{onClick:b,disabled:r,className:"flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition active:scale-95 shadow-xl disabled:opacity-50",children:[t.jsx("span",{children:"📸"})," ",r?"جاري الحفظ...":"مشاركة صورة"]}),t.jsx("button",{onClick:p,className:"flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition active:scale-95 shadow-xl",children:"العودة للمتجر"})]})]})};export{g as default};
