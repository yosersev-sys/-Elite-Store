import{g as d,a as x,j as t}from"./index-BaSvYoUW.js";var h=x();const f=d(h),b={0:"000110100",1:"100100001",2:"001100001",3:"101100000",4:"000110001",5:"100110000",6:"001110000",7:"000100101",8:"100100100",9:"001100100",A:"100001001",B:"001001001",C:"101001000",D:"000011001",E:"100011000",F:"001011000",G:"000001101",H:"100001100",I:"001001100",J:"000011100",K:"100000011",L:"001000011",M:"101000010",N:"000010011",O:"100010010",P:"001010010",Q:"000000111",R:"100000110",S:"001000110",T:"000010110",U:"110000001",V:"011000001",W:"111000000",X:"010010001",Y:"110010000",Z:"011010000","-":"010000101",".":"110000100"," ":"011000100","*":"010010100",$:"010101000","/":"010100010","+":"010001010","%":"000101010"},c=({value:e})=>{const r="*"+(e.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g,"")||"0000")+"*",i=[];for(let n=0;n<r.length;n++){const l=r[n],a=b[l];if(a){for(let s=0;s<9;s++){const m=s%2===0,p=a[s]==="1";i.push({isBar:m,isWide:p})}n<r.length-1&&i.push({isBar:!1,isWide:!1})}}return t.jsx("div",{className:"flex items-stretch h-8 select-none overflow-hidden justify-center",style:{width:"100%"},children:i.map((n,l)=>{const a=n.isWide?"1.8px":"0.7px";return t.jsx("div",{style:{width:a,backgroundColor:n.isBar?"#000":"transparent",flexShrink:0}},l)})})},g=({product:e,onClose:o})=>{const r=()=>{window.print()},i=e.barcode||e.id.slice(-8);return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"fixed inset-0 z-[11000] flex items-center justify-center p-4 animate-fadeIn no-print",children:[t.jsx("div",{className:"absolute inset-0 bg-slate-900/60 backdrop-blur-sm",onClick:o}),t.jsx("div",{className:"relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp",children:t.jsxs("div",{className:"p-8 text-center",children:[t.jsx("div",{className:"w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl",children:"🏷️"}),t.jsx("h3",{className:"text-xl font-black text-slate-800 mb-2",children:"تم حفظ المنتج بنجاح!"}),t.jsx("p",{className:"text-slate-400 font-bold text-xs mb-8",children:"هل تريد طباعة ملصق الباركود الآن؟"}),t.jsx("div",{className:"border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50",children:t.jsxs("div",{className:"bg-white p-3 mx-auto shadow-sm flex flex-col items-center justify-between border border-black",style:{width:"50mm",height:"25mm",fontFamily:"monospace"},children:[t.jsx("p",{className:"text-[8pt] font-black text-black truncate w-full text-center mb-1",children:e.name}),t.jsxs("div",{className:"flex flex-col items-center justify-center w-full my-auto",children:[t.jsx(c,{value:i}),t.jsx("p",{className:"text-[7pt] font-bold text-black mt-1 font-mono tracking-wider",children:i})]}),t.jsxs("div",{className:"flex justify-between w-full text-[8pt] font-black text-black mt-1",children:[t.jsxs("span",{children:["السعر: ",e.price," ج.م"]}),t.jsx("span",{className:"font-sans text-[7.5pt]",children:"soqelasr.com"})]})]})}),t.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[t.jsx("button",{onClick:r,className:"bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 cursor-pointer",children:"طباعة الملصق 🖨️"}),t.jsx("button",{onClick:o,className:"bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all cursor-pointer",children:"إغلاق"})]})]})})]}),f.createPortal(t.jsx("div",{className:"barcode-print-portal font-mono",children:t.jsxs("div",{className:"print-sticker-box",children:[t.jsx("p",{className:"print-sticker-title",children:e.name}),t.jsxs("div",{className:"print-sticker-barcode-box",children:[t.jsx(c,{value:i}),t.jsx("p",{className:"print-sticker-txt",children:i})]}),t.jsxs("div",{className:"print-sticker-footer",children:[t.jsxs("span",{className:"print-sticker-price",children:["السعر: ",e.price," ج.م"]}),t.jsx("span",{className:"print-sticker-link",children:"soqelasr.com"})]})]})}),document.body),t.jsx("style",{children:`
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
      `})]})};export{g as default};
