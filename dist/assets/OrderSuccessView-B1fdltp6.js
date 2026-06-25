import{r as x,j as e}from"./index-CpBI5-aU.js";const j=({order:t,onContinueShopping:p})=>{const n=x.useRef(null),[r,l]=x.useState(!1),c=Number(t.total||0),d=Number(t.subtotal||0),o=Math.max(0,c-d),h=()=>{window.print()},b=async()=>{if(n.current){l(!0);try{await new Promise(s=>setTimeout(s,200)),(await window.html2canvas(n.current,{scale:3,useCORS:!0,backgroundColor:"#ffffff",width:250})).toBlob(async s=>{if(!s)return;const m=new File([s],`Invoice-${t.id}.png`,{type:"image/png"});if(navigator.share&&navigator.canShare({files:[m]}))await navigator.share({files:[m],title:"فاتورة سوق العصر",text:`طلب رقم ${t.id}`});else{const i=document.createElement("a");i.href=URL.createObjectURL(s),i.download=`Invoice-${t.id}.png`,i.click()}},"image/png")}catch(a){console.error("Screenshot error:",a)}finally{l(!1)}}};return!t||!t.id?e.jsx("div",{className:"p-20 text-center font-black text-slate-400",children:"عذراً، لم يتم العثور على بيانات الفاتورة."}):e.jsxs("div",{className:"max-w-md mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{ref:n,className:"thermal-invoice bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden p-4 md:p-6",style:{width:"100%",maxWidth:"280px",fontFamily:"Courier, monospace"},children:[e.jsxs("div",{className:"text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3",children:[e.jsx("h1",{className:"text-xl font-black text-slate-900 mb-1",children:"سوق العصر"}),e.jsx("p",{className:"text-[9px] font-bold text-gray-500 uppercase tracking-tighter",children:"فاقوس - أول سوق إلكتروني"}),e.jsxs("div",{className:"mt-2 text-[10px] font-bold text-slate-800",children:["رقم الفاتورة: ",t.id]})]}),e.jsxs("div",{className:"space-y-1 mb-3 text-[11px]",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"التاريخ:"}),e.jsx("span",{className:"font-bold",children:new Date(t.createdAt).toLocaleDateString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"العميل:"}),e.jsx("span",{className:"font-bold truncate max-w-[100px]",children:t.customerName})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"الهاتف:"}),e.jsx("span",{className:"font-bold",children:t.phone})]}),t.address&&t.address!=="استلام فرع (كاشير)"&&e.jsxs("div",{className:"text-[9px] text-gray-500 mt-1 border-t border-gray-100 pt-1",children:[e.jsx("span",{className:"font-bold",children:"العنوان: "}),t.address]})]}),e.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 mb-3",children:[e.jsxs("div",{className:"flex justify-between text-[9px] font-black text-gray-400 mb-2 px-1 uppercase",children:[e.jsx("span",{children:"الصنف"}),e.jsx("span",{children:"الإجمالي"})]}),e.jsx("div",{className:"space-y-2",children:(t.items||[]).map((a,s)=>e.jsxs("div",{className:"item-row text-[11px]",children:[e.jsxs("div",{className:"flex justify-between font-bold text-slate-800",children:[e.jsx("span",{className:"truncate pr-1",children:a.name}),e.jsx("span",{children:(Number(a.price||0)*Number(a.quantity||0)).toFixed(2)})]}),e.jsxs("div",{className:"text-[9px] text-gray-400",children:[a.quantity," ",a.unit==="kg"?"كجم":a.unit==="gram"?"جم":"ق"," × ",Number(a.price||0).toFixed(2)]})]},s))})]}),e.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 space-y-1",children:[e.jsxs("div",{className:"flex justify-between text-[11px]",children:[e.jsx("span",{className:"text-gray-500",children:"المجموع الفرعي:"}),e.jsx("span",{className:"font-bold",children:d.toFixed(2)})]}),o>0&&e.jsxs("div",{className:"flex justify-between text-[11px] text-emerald-700",children:[e.jsx("span",{className:"font-bold",children:"رسوم التوصيل 🚚:"}),e.jsxs("span",{className:"font-bold",children:["+",o.toFixed(2)]})]}),e.jsxs("div",{className:"flex justify-between text-[14px] font-black pt-1 border-t border-gray-200 mt-1",children:[e.jsx("span",{children:"الإجمالي:"}),e.jsxs("span",{className:"text-slate-900",children:[c.toFixed(2)," ج.م"]})]}),e.jsxs("div",{className:"text-center pt-3 text-[9px] font-bold text-gray-400 italic",children:["طريقة الدفع: ",t.paymentMethod]}),t.status==="completed"&&t.confirmedAt&&e.jsxs("div",{className:"mt-3 pt-2 border-t border-dashed border-gray-200 space-y-1 text-[9px] text-gray-500 font-bold",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"تاريخ الإنشاء:"}),e.jsx("span",{children:new Date(t.createdAt).toLocaleString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"تاريخ التأكيد:"}),e.jsx("span",{children:new Date(t.confirmedAt).toLocaleString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"الموظف المؤكّد:"}),e.jsx("span",{children:t.confirmedByName||"الكاشير"})]}),t.confirmedShiftId&&e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"الوردية:"}),e.jsxs("span",{children:["#",t.confirmedShiftId]})]})]})]}),e.jsxs("div",{className:"mt-4 text-center border-t-2 border-dashed border-gray-300 pt-3",children:[e.jsx("p",{className:"text-[10px] font-black text-slate-800 mb-1",children:"شكراً لزيارتكم!"}),e.jsx("p",{className:"store-link text-[14px] text-emerald-600 font-black uppercase tracking-widest mt-1",children:"souqalasr.com"})]})]}),e.jsxs("div",{className:"no-print mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3",children:[e.jsxs("button",{onClick:h,className:"flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition active:scale-95 shadow-xl",children:[e.jsx("span",{children:"🖨️"})," طباعة الفاتورة"]}),e.jsxs("button",{onClick:b,disabled:r,className:"flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition active:scale-95 shadow-xl disabled:opacity-50",children:[e.jsx("span",{children:"📸"})," ",r?"جاري الحفظ...":"مشاركة صورة"]}),e.jsx("button",{onClick:p,className:"flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition active:scale-95 shadow-xl",children:"العودة للمتجر"})]})]})};export{j as default};
