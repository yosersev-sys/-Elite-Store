import{r as u,j as e}from"./index-CvUUpJUe.js";import{W as v}from"./whatsappService-CnHL0wL1.js";const D=({order:t,adminPhone:j,onContinueShopping:g})=>{const r=u.useRef(null),[o,d]=u.useState(!1),x=Number(t.total||0),m=Number(t.subtotalBeforeDiscount!==void 0?t.subtotalBeforeDiscount:t.subtotal||0),l=Number(t.totalItemDiscounts||0),c=Number(t.discount||0),p=Number(t.deliveryFee!==void 0?t.deliveryFee:Math.max(0,x-m)),h=l+c,N=()=>{window.print()},b=()=>{v.sendOrderNotification(t,j)},y=async()=>{if(r.current){d(!0);try{await new Promise(a=>setTimeout(a,200)),(await window.html2canvas(r.current,{scale:3,useCORS:!0,backgroundColor:"#ffffff",width:250})).toBlob(async a=>{if(!a)return;const n=new File([a],`Invoice-${t.id}.png`,{type:"image/png"});if(navigator.share&&navigator.canShare({files:[n]}))await navigator.share({files:[n],title:"فاتورة سوق العصر",text:`طلب رقم ${t.id}`});else{const i=document.createElement("a");i.href=URL.createObjectURL(a),i.download=`Invoice-${t.id}.png`,i.click()}},"image/png")}catch(s){console.error("Screenshot error:",s)}finally{d(!1)}}};return!t||!t.id?e.jsx("div",{className:"p-20 text-center font-black text-slate-400",children:"عذراً، لم يتم العثور على بيانات الفاتورة."}):e.jsxs("div",{className:"max-w-md mx-auto py-8 px-4 animate-fadeIn print:m-0 print:p-0",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"no-print bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center space-y-3 mb-6",children:[e.jsx("span",{className:"text-4xl",children:"🎉"}),e.jsx("h4",{className:"font-black text-emerald-800 text-lg",children:"تم تسجيل طلبك بنجاح!"}),e.jsx("p",{className:"text-xs font-bold text-emerald-600 leading-relaxed",children:"تم إتمام الطلب وحفظ الفاتورة بالمتجر. لتأكيد وتجهيز الطلب بشكل أسرع، يمكنك إرسال الفاتورة للإدارة عبر واتساب."}),e.jsxs("button",{onClick:b,className:"w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 px-6 rounded-2xl font-black text-sm transition active:scale-95 shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer",children:[e.jsx("span",{children:"💬"})," تأكيد الطلب عبر واتساب"]})]}),e.jsxs("div",{ref:r,className:"thermal-invoice bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden p-4 md:p-6",style:{width:"100%",maxWidth:"280px",fontFamily:"Courier, monospace"},children:[e.jsxs("div",{className:"text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3",children:[e.jsx("h1",{className:"text-xl font-black text-slate-900 mb-1",children:"سوق العصر"}),e.jsx("p",{className:"text-[9px] font-bold text-gray-500 uppercase tracking-tighter",children:"فاقوس - أول سوق إلكتروني"}),e.jsxs("div",{className:"mt-2 text-[10px] font-bold text-slate-800",children:["رقم الفاتورة: ",t.id]})]}),e.jsxs("div",{className:"space-y-1 mb-3 text-[11px]",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"التاريخ:"}),e.jsx("span",{className:"font-bold",children:new Date(t.createdAt).toLocaleDateString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"العميل:"}),e.jsx("span",{className:"font-bold truncate max-w-[100px]",children:t.customerName})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-gray-400",children:"الهاتف:"}),e.jsx("span",{className:"font-bold",children:t.phone})]}),t.address&&t.address!=="استلام فرع (كاشير)"&&e.jsxs("div",{className:"text-[9px] text-gray-500 mt-1 border-t border-gray-100 pt-1",children:[e.jsx("span",{className:"font-bold",children:"العنوان: "}),t.address]})]}),e.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 mb-3",children:[e.jsxs("div",{className:"flex justify-between text-[9px] font-black text-gray-400 mb-2 px-1 uppercase",children:[e.jsx("span",{children:"الصنف"}),e.jsx("span",{children:"الإجمالي"})]}),e.jsx("div",{className:"space-y-2",children:(t.items||[]).map((s,a)=>{const n=s.discountValue?s.discountType==="percent"?s.price*s.discountValue/100:s.discountValue:0,i=n>0,f=s.price-n;return e.jsxs("div",{className:"item-row text-[11px]",children:[e.jsxs("div",{className:"flex justify-between font-bold text-slate-800",children:[e.jsx("span",{className:"truncate pr-1",children:s.name}),e.jsx("span",{children:(f*Number(s.quantity||0)).toFixed(2)})]}),e.jsxs("div",{className:"text-[9px] text-gray-400",children:[s.quantity," ",s.unit==="kg"?"كجم":s.unit==="gram"?"جم":"ق"," × ",f.toFixed(2),i&&e.jsxs("span",{className:"text-rose-500 font-Cairo font-bold mr-1 line-through",children:["(",Number(s.price).toFixed(2),")"]})]})]},a)})})]}),e.jsxs("div",{className:"border-t-2 border-dashed border-gray-300 pt-2 space-y-1",children:[e.jsxs("div",{className:"flex justify-between text-[11px]",children:[e.jsx("span",{className:"text-gray-500",children:"المجموع الفرعي:"}),e.jsx("span",{className:"font-bold",children:m.toFixed(2)})]}),l>0&&e.jsxs("div",{className:"flex justify-between text-[11px] text-rose-600",children:[e.jsx("span",{children:"خصم المنتجات:"}),e.jsxs("span",{className:"font-bold",children:["-",l.toFixed(2)]})]}),c>0&&e.jsxs("div",{className:"flex justify-between text-[11px] text-rose-600",children:[e.jsx("span",{children:"خصم الفاتورة:"}),e.jsxs("span",{className:"font-bold",children:["-",c.toFixed(2)]})]}),p>0&&e.jsxs("div",{className:"flex justify-between text-[11px] text-slate-700",children:[e.jsx("span",{children:"رسوم التوصيل 🚚:"}),e.jsxs("span",{className:"font-bold",children:["+",p.toFixed(2)]})]}),e.jsxs("div",{className:"flex justify-between text-[13px] font-black pt-1 border-t border-gray-200 mt-1",children:[e.jsx("span",{children:"الإجمالي الصافي:"}),e.jsxs("span",{className:"text-slate-900",children:[x.toFixed(2)," ج.م"]})]}),h>0&&e.jsxs("div",{className:"bg-emerald-50 text-emerald-800 text-center p-2 rounded-xl text-[10px] font-black mt-2 border border-emerald-100 animate-pulse no-print",children:["💰 إجمالي التوفير: ",h.toFixed(2)," ج.م"]}),e.jsxs("div",{className:"text-center pt-3 text-[9px] font-bold text-gray-400 italic",children:["طريقة الدفع: ",t.paymentMethod]}),t.status==="completed"&&t.confirmedAt&&e.jsxs("div",{className:"mt-3 pt-2 border-t border-dashed border-gray-200 space-y-1 text-[9px] text-gray-500 font-bold",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"تاريخ الإنشاء:"}),e.jsx("span",{children:new Date(t.createdAt).toLocaleString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"تاريخ التأكيد:"}),e.jsx("span",{children:new Date(t.confirmedAt).toLocaleString("ar-EG")})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"الموظف المؤكّد:"}),e.jsx("span",{children:t.confirmedByName||"الكاشير"})]}),t.confirmedShiftId&&e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"الوردية:"}),e.jsxs("span",{children:["#",t.confirmedShiftId]})]})]})]}),e.jsxs("div",{className:"mt-4 text-center border-t-2 border-dashed border-gray-300 pt-3",children:[e.jsx("p",{className:"text-[10px] font-black text-slate-800 mb-1",children:"شكراً لزيارتكم!"}),e.jsx("p",{className:"store-link text-[14px] text-emerald-600 font-black uppercase tracking-widest mt-1",children:"soqelasr.com"})]})]}),e.jsxs("div",{className:"no-print mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2",children:[e.jsxs("button",{onClick:N,className:"flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition active:scale-95 shadow-xl cursor-pointer",children:[e.jsx("span",{children:"🖨️"})," طباعة الفاتورة"]}),e.jsxs("button",{onClick:y,disabled:o,className:"flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition active:scale-95 shadow-xl disabled:opacity-50 cursor-pointer",children:[e.jsx("span",{children:"📸"})," ",o?"جاري الحفظ...":"مشاركة صورة"]}),e.jsxs("button",{onClick:b,className:"flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-xl sm:col-span-2 cursor-pointer",children:[e.jsx("span",{children:"💬"})," تأكيد وإرسال عبر واتساب"]}),e.jsx("button",{onClick:g,className:"flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-250 transition active:scale-95 shadow-sm sm:col-span-2 cursor-pointer",children:"العودة للمتجر"})]})]})};export{D as default};
