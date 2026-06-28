import{g,a as j,R as x,j as t}from"./index-BxU6NBAZ.js";var w=j();const v=g(w),k={0:"000110100",1:"100100001",2:"001100001",3:"101100000",4:"000110001",5:"100110000",6:"001110000",7:"000100101",8:"100100100",9:"001100100",A:"100001001",B:"001001001",C:"101001000",D:"000011001",E:"100011000",F:"001011000",G:"000001101",H:"100001100",I:"001001100",J:"000011100",K:"100000011",L:"001000011",M:"101000010",N:"000010011",O:"100010010",P:"001010010",Q:"000000111",R:"100000110",S:"001000110",T:"000010110",U:"110000001",V:"011000001",W:"111000000",X:"010010001",Y:"110010000",Z:"011010000","-":"010000101",".":"110000100"," ":"011000100","*":"010010100",$:"010101000","/":"010100010","+":"010001010","%":"000101010"},N=e=>{switch(e){case"piece":return"قطعة";case"carton":return"كرتونة";case"box":return"علبة";case"bottle":return"زجاجة";case"kg":return"كجم";case"gram":return"جم";case"liter":return"لتر";case"meter":return"متر";default:return e||"قطعة"}},f=({value:e,labelWidth:h})=>{const c="*"+(e.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g,"")||"0000")+"*",p=[];for(let o=0;o<c.length;o++){const r=c[o],m=k[r];if(m){for(let d=0;d<9;d++){const a=d%2===0,b=m[d]==="1";p.push({isBar:a,isWide:b})}o<c.length-1&&p.push({isBar:!1,isWide:!1})}}const i=h<45;return t.jsx("div",{className:"flex items-stretch h-8 select-none justify-center overflow-visible",style:{width:"100%",transform:"scaleX(0.95)"},children:p.map((o,r)=>{const m=o.isWide?i?"1.1px":"1.8px":i?"0.45px":"0.7px";return t.jsx("div",{style:{width:"0px",borderLeft:`${m} solid ${o.isBar?"#000":"transparent"}`,height:"100%",flexShrink:0}},r)})})},$=({product:e,onClose:h})=>{var b;const l=x.useMemo(()=>{const n=[];return n.push({id:"base",name:e.name,unitName:e.unit||"piece",barcode:e.barcode||e.id.slice(-8),price:e.price,label:`${N(e.unit||"piece")} (الأساسية)`}),e.units&&e.units.forEach(s=>{s.isActive===1&&s.barcode&&n.push({id:s.id,name:`${e.name} (${s.unitName})`,unitName:s.unitName,barcode:s.barcode,price:s.salePrice,label:`${s.unitName}`})}),n},[e]),[c,p]=x.useState(((b=l[0])==null?void 0:b.id)||"base"),[i,o]=x.useState(38),[r,m]=x.useState(25),d=()=>{window.print()},a=x.useMemo(()=>l.find(n=>n.id===c)||l[0],[c,l]);return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"fixed inset-0 z-[11000] flex items-center justify-center p-4 animate-fadeIn no-print",children:[t.jsx("div",{className:"absolute inset-0 bg-slate-900/60 backdrop-blur-sm",onClick:h}),t.jsx("div",{className:"relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp",children:t.jsxs("div",{className:"p-8 text-center",children:[t.jsx("div",{className:"w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl",children:"🏷️"}),t.jsx("h3",{className:"text-xl font-black text-slate-800 mb-2",children:"طباعة ملصق الباركود"}),t.jsx("p",{className:"text-slate-400 font-bold text-xs mb-6",children:"اختر الوحدة ومقاس الورق الملائم لطابعتك:"}),l.length>1&&t.jsx("div",{className:"flex justify-center gap-2 mb-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full overflow-x-auto no-scrollbar",children:l.map(n=>t.jsx("button",{onClick:()=>p(n.id),className:`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${c===n.id?"bg-slate-900 text-white shadow-md":"text-slate-400 hover:text-slate-600"}`,children:n.label},n.id))}),t.jsxs("div",{className:"space-y-2 mb-6 text-right",children:[t.jsx("label",{className:"text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 block",children:"مقاس ورق ملصق الباركود (العرض × الارتفاع)"}),t.jsxs("select",{value:`${i}x${r}`,onChange:n=>{const[s,u]=n.target.value.split("x").map(Number);o(s),m(u)},className:"w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs text-slate-700 cursor-pointer",children:[t.jsx("option",{value:"38x25",children:"38mm × 25mm (مقاس صغير - شائع جداً)"}),t.jsx("option",{value:"50x25",children:"50mm × 25mm (مقاس متوسط)"}),t.jsx("option",{value:"50x30",children:"50mm × 30mm (مقاس متوسط طويل)"}),t.jsx("option",{value:"40x30",children:"40mm × 30mm (مقاس مربع)"}),t.jsx("option",{value:"60x40",children:"60mm × 40mm (مقاس كبير)"})]})]}),t.jsx("div",{className:"border-2 border-dashed border-slate-200 p-4 rounded-2xl mb-8 bg-slate-50 flex items-center justify-center min-h-[140px]",children:t.jsxs("div",{className:"bg-white p-2.5 shadow-sm flex flex-col items-center justify-between border border-black text-right transition-all overflow-hidden",style:{width:`${i}mm`,height:`${r}mm`,fontFamily:"monospace",boxSizing:"border-box"},children:[t.jsx("p",{className:"text-[7.5pt] font-black text-black truncate w-full text-center mb-0.5",children:a.name}),t.jsxs("div",{className:"flex flex-col items-center justify-center w-full my-auto overflow-hidden",children:[t.jsx(f,{value:a.barcode,labelWidth:i}),t.jsx("p",{className:"text-[6.5pt] font-bold text-black mt-0.5 font-mono tracking-wider",children:a.barcode})]}),t.jsxs("div",{className:"flex justify-between w-full text-[7.5pt] font-black text-black mt-0.5",children:[t.jsxs("span",{children:["السعر: ",a.price," ج.م"]}),t.jsx("span",{className:"font-sans text-[7pt]",children:"soqelasr.com"})]})]})}),t.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[t.jsx("button",{onClick:d,className:"bg-slate-900 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 cursor-pointer",children:"طباعة الملصق 🖨️"}),t.jsx("button",{onClick:h,className:"bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all cursor-pointer",children:"إغلاق"})]})]})})]}),v.createPortal(t.jsx("div",{className:"barcode-print-portal font-mono",children:t.jsxs("div",{className:"print-sticker-box",children:[t.jsx("p",{className:"print-sticker-title",children:a.name}),t.jsxs("div",{className:"print-sticker-barcode-box",children:[t.jsx(f,{value:a.barcode,labelWidth:i}),t.jsx("p",{className:"print-sticker-txt",children:a.barcode})]}),t.jsxs("div",{className:"print-sticker-footer",children:[t.jsxs("span",{className:"print-sticker-price",children:["السعر: ",a.price," ج.م"]}),t.jsx("span",{className:"print-sticker-link",children:"soqelasr.com"})]})]})}),document.body),t.jsx("style",{children:`
        @media print {
          @page {
            size: ${i}mm ${r}mm;
            margin: 0 !important;
          }
          html, body {
            width: ${i}mm !important;
            height: ${r}mm !important;
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
            width: ${i}mm !important;
            height: ${r}mm !important;
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
            width: ${i}mm !important;
            height: ${r}mm !important;
            padding: 1mm 1.5mm !important;
            box-sizing: border-box !important;
            background: white !important;
            overflow: hidden !important;
          }
          .print-sticker-title {
            font-size: ${i<40?"7.5pt":"8.5pt"} !important;
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
            font-size: ${i<40?"7.5pt":"8.5pt"} !important;
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
      `})]})};export{$ as default};
