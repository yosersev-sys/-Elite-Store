class L{static injectStyle(e,s){this.removeStyle(e);const t=document.createElement("style");t.id=e,t.innerHTML=s,document.head.appendChild(t)}static removeStyle(e){const s=document.getElementById(e);s&&s.remove()}static injectContainer(e,s){this.removeContainer(e);const t=document.createElement("div");return t.id=e,t.innerHTML=s,document.body.appendChild(t),t}static removeContainer(e){const s=document.getElementById(e);s&&s.remove()}static async printInvoice(e){try{this.injectStyle("pos-invoice-print-style",`
        @media print {
          body > :not(#pos-invoice-print-container) {
            display: none !important;
          }
          #pos-invoice-print-container, #pos-invoice-print-container * {
            display: block !important;
            visibility: visible !important;
          }
          #pos-invoice-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            background: #fff !important;
            direction: rtl !important;
            text-align: right !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          #pos-invoice-print-container * {
            font-size: 10pt !important;
            line-height: 1.3 !important;
            color: #000 !important;
          }
          .text-center {
            text-align: center !important;
          }
          .flex-between {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .divider {
            border-bottom: 2px dashed #000 !important;
            margin: 2mm 0 !important;
          }
          .thin-divider {
            border-bottom: 1px dashed #000 !important;
            margin: 1.5mm 0 !important;
          }
          .bold {
            font-weight: bold !important;
          }
          .title {
            font-size: 14pt !important;
            font-weight: 900 !important;
            margin-bottom: 1mm !important;
          }
          .store-link {
            font-size: 12pt !important;
            font-weight: bold !important;
            margin-top: 1mm !important;
          }
          .qr-container {
            text-align: center !important;
            margin-top: 3mm !important;
            display: block !important;
            width: 100% !important;
          }
          .qr-container img {
            width: 80px !important;
            height: 80px !important;
            display: block !important;
            margin: 0 auto !important;
          }
        }
      `);const t=Number(e.total||0),u=Number(e.subtotalBeforeDiscount!==void 0?e.subtotalBeforeDiscount:e.subtotal||0),r=Number(e.totalItemDiscounts||0),d=Number(e.discount||0),f=Number(e.deliveryFee!==void 0?e.deliveryFee:Math.max(0,t-u)),y=r+d,b=(e.items||[]).map(n=>{const a=n.discountValue?n.discountType==="percent"?n.price*n.discountValue/100:n.discountValue:0,p=n.price-a,x=p*Number(n.quantity||0);return`
          <div style="margin-bottom: 1.5mm;">
            <div class="flex-between bold">
              <span>${n.name}</span>
              <span>${x.toFixed(2)}</span>
            </div>
            <div style="font-size: 9pt; color: #555;">
              ${n.quantity} ${n.unit==="kg"?"كجم":n.unit==="gram"?"جم":"ق"} × ${p.toFixed(2)}
              ${a>0?` <span style="text-decoration: line-through; margin-right: 1mm;">(${Number(n.price).toFixed(2)})</span>`:""}
            </div>
          </div>
          <div class="thin-divider"></div>
        `}).join("");let h=`<div>طريقة الدفع: ${e.paymentMethod}</div>`;if(e.payments&&e.payments.length>0){const n=e.payments.map(a=>`
            <div class="flex-between" style="font-size: 9pt;">
              <span>${a.method==="cash"?"💵 نقدي (كاش)":a.method==="vodafone"?"📱 فودافون كاش":a.method==="instapay"?"💸 انستا باي":a.method==="visa"?"💳 فيزا":a.method}</span>
              <span>${(Number(a.amount)||0).toFixed(2)} ج.م</span>
            </div>
            ${a.reference?`<div style="font-size: 8pt; color: #555; text-align: left;">مرجع: ${a.reference}</div>`:""}
          `).join("");h+=`
          <div style="margin-top: 1.5mm; padding: 2mm; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
            <div class="text-center bold" style="font-size: 8pt; border-bottom: 1px solid #eee; padding-bottom: 1mm; margin-bottom: 1.5mm;">تفاصيل المدفوعات المستلمة</div>
            ${n}
          </div>
        `}const g=`
        <div class="text-center">
          <div class="title font-Cairo font-black">سوق العصر</div>
          <div style="font-size: 9pt; color: #555;">فاقوس - أول سوق إلكتروني</div>
          <div class="bold" style="margin-top: 2mm;">رقم الفاتورة: ${e.id}</div>
          ${e.isOffline?`
            <div style="font-size: 8pt; background: #fff8e1; border: 1px dashed #ffe082; color: #b78103; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; font-weight: 900; line-height: 1.2;">
              📡 إيصال مؤقت - فاتورة غير متزامنة أوفلاين
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        
        <div style="font-size: 9pt; line-height: 1.4;">
          <div class="flex-between">
            <span>التاريخ:</span>
            <span>${(()=>{const n=e.createdAt;if(!n)return new Date().toLocaleString("ar-EG");const a=Number(n),p=isNaN(a)?new Date(n):new Date(a);return(isNaN(p.getTime())?new Date:p).toLocaleString("ar-EG")})()}</span>
          </div>
          <div class="flex-between">
            <span>العميل:</span>
            <span>${e.customerName}</span>
          </div>
          <div class="flex-between">
            <span>الهاتف:</span>
            <span>${e.phone}</span>
          </div>
          ${e.address&&e.address!=="استلام فرع (كاشير)"?`
            <div style="font-size: 8pt; border-top: 1px solid #eee; padding-top: 1mm; margin-top: 1mm;">
              <span class="bold">العنوان:</span> ${e.address}
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 9pt; margin-bottom: 2mm;">الأصناف والمبيعات</div>
        <div class="thin-divider"></div>
        
        ${b}
        
        <div style="line-height: 1.4; margin-top: 2mm;">
          <div class="flex-between">
            <span>المجموع الفرعي:</span>
            <span>${u.toFixed(2)}</span>
          </div>
          ${r>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصومات المنتجات:</span>
              <span>-${r.toFixed(2)}</span>
            </div>
          `:""}
          ${d>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصم الفاتورة:</span>
              <span>-${d.toFixed(2)}</span>
            </div>
          `:""}
          ${f>0?`
            <div class="flex-between">
              <span>رسوم التوصيل 🚚:</span>
              <span>+${f.toFixed(2)}</span>
            </div>
          `:""}
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 12pt;">
            <span>الإجمالي الصافي:</span>
            <span>${t.toFixed(2)} ج.م</span>
          </div>
          ${y>0?`
            <div class="text-center bold" style="font-size: 9pt; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; padding: 1.5mm; margin-top: 2mm;">
              💰 إجمالي التوفير: ${y.toFixed(2)} ج.م
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9pt;">
          ${h}
          ${e.confirmedByName||e.confirmedShiftId?`
            <div style="font-size: 8pt; color: #555; line-height: 1.4; border: 1px dashed #ccc; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; margin-bottom: 2mm; text-align: right;">
              ${e.confirmedByName?`
                <div class="flex-between">
                  <span>الكاشير:</span>
                  <span>${e.confirmedByName}</span>
                </div>
              `:""}
              ${e.confirmedShiftId?`
                <div class="flex-between">
                  <span>الوردية:</span>
                  <span>#${e.confirmedShiftId} ${e.shiftName?`(${e.shiftName})`:""}</span>
                </div>
              `:""}
            </div>
          `:""}
          <div style="margin-top: 3mm;" class="bold">شكراً لزيارتكم!</div>
          <div class="store-link">soqelasr.com</div>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://soqelasr.com" alt="QR Code" />
          </div>
          <div style="font-size: 7pt; color: #888; margin-top: 1mm;">امسح الكود لزيارة موقعنا 🌐</div>
        </div>
      `;return this.injectContainer("pos-invoice-print-container",g),window.print(),setTimeout(()=>{this.removeStyle("pos-invoice-print-style"),this.removeContainer("pos-invoice-print-container")},1e3),!0}catch(s){return console.error("Invoice Print Error:",s),!1}}static async openDrawer(){try{return this.injectStyle("pos-drawer-print-style",`
        @media print {
          body > :not(#pos-drawer-kick-container) {
            display: none !important;
          }
          #pos-drawer-kick-container {
            display: block !important;
            visibility: visible !important;
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
          }
        }
      `),this.injectContainer("pos-drawer-kick-container","&nbsp;"),window.print(),setTimeout(()=>{this.removeStyle("pos-drawer-print-style"),this.removeContainer("pos-drawer-kick-container")},1e3),!0}catch(e){return console.error("Drawer Open Error:",e),!1}}static async printShift(e){try{this.injectStyle("pos-shift-print-style",`
        @media print {
          body > :not(#pos-shift-print-container) {
            display: none !important;
          }
          #pos-shift-print-container, #pos-shift-print-container * {
            display: block !important;
            visibility: visible !important;
          }
          #pos-shift-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            background: #fff !important;
            direction: rtl !important;
            text-align: right !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          #pos-shift-print-container * {
            font-size: 10pt !important;
            line-height: 1.3 !important;
            color: #000 !important;
          }
          .text-center {
            text-align: center !important;
          }
          .flex-between {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .divider {
            border-bottom: 2px dashed #000 !important;
            margin: 2mm 0 !important;
          }
          .bold {
            font-weight: bold !important;
          }
        }
      `);const t=e.shift,r=(o=>{try{return o?JSON.parse(o):null}catch{return null}})(t.snapshotData)||{},d=(e.orders||[]).filter(o=>o.status==="completed"),f=d.reduce((o,i)=>o+Number(i.total||0),0),y=d.length;let b=0;d.forEach(o=>{(Array.isArray(o.items)?o.items:[]).forEach(l=>{b+=Number(l.actualWholesalePrice??l.wholesalePrice??0)*Number(l.quantity||0)})});const h=typeof t.cashSales=="number"?t.cashSales:r.cashSales??0,g=typeof t.cashReturns=="number"?t.cashReturns:r.cashReturns??0,n=typeof t.cardSales=="number"?t.cardSales:r.cardSales??0,a=typeof t.debtSales=="number"?t.debtSales:r.debtSales??0,p=typeof t.totalDeposits=="number"?t.totalDeposits:r.totalDeposits??0,x=typeof t.totalWithdrawals=="number"?t.totalWithdrawals:r.totalWithdrawals??0,N=typeof t.ledgerCashPayments=="number"?t.ledgerCashPayments:r.ledgerCashPayments??0,$=typeof t.shiftExpenses=="number"?t.shiftExpenses:r.shiftExpenses??r.totalExp??0,z=f-b-$;let m=r.products;if(!m||!Array.isArray(m)||m.length===0){const o={};d.forEach(i=>{(Array.isArray(i.items)?i.items:[]).forEach(c=>{if(!c||!c.id)return;const v=c.id,w=Number(c.quantity||0),k=c.unit||"piece";o[v]||(o[v]={id:v,name:c.name||"منتج غير معروف",qtySold:0,unit:k,qtyBefore:"-",qtyAfter:"-"}),o[v].qtySold+=w})}),m=Object.values(o).sort((i,l)=>l.qtySold-i.qtySold)}let S="";m&&m.length>0&&(S=`
          <div class="divider"></div>
          <div class="text-center bold" style="margin: 2mm 0 1mm;">المنتجات المباعة وحركة المخزن</div>
          <div class="divider"></div>
          <div style="margin-top: 1mm;">
            ${m.map(i=>{const l=i.unit==="kg"?"كجم":i.unit==="gram"?"جم":"ق",c=typeof i.qtyBefore=="number"?i.qtyBefore.toFixed(2).replace(/\.00$/,""):i.qtyBefore,v=typeof i.qtyAfter=="number"?i.qtyAfter.toFixed(2).replace(/\.00$/,""):i.qtyAfter,w=typeof i.qtySold=="number"?i.qtySold.toFixed(2).replace(/\.00$/,""):i.qtySold;return`
            <div style="margin-bottom: 1.5mm; font-size: 9pt;">
              <div class="bold">${i.name}</div>
              <div class="flex-between" style="color: #444; font-size: 8.5pt;">
                <span>المباع: ${w} ${l}</span>
                <span>الكمية: ${c} ➔ ${v}</span>
              </div>
            </div>
            <div style="border-bottom: 1px dotted #ccc; margin: 1mm 0;"></div>
          `}).join("")}
          </div>
        `);const q=`
        <div class="text-center">
          <h2 class="bold" style="font-size: 12pt;">تقرير تسليم خزينة الوردية</h2>
          <p style="font-size: 9pt; color: #555;">سوق العصر - فاقوس</p>
          <div class="bold" style="background: #eee; padding: 1mm; border-radius: 4px; display: inline-block; margin-top: 1mm;">
            رقم الوردية: #${t.id}
          </div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>حالة الوردية:</span>
            <span class="bold">${t.status==="closed"?"🔒 مغلقة":"🟢 مفتوحة"}</span>
          </div>
          <div class="flex-between">
            <span>المسؤول:</span>
            <span>${t.openedByName||"أدمن"}</span>
          </div>
          ${t.closedByName?`
            <div class="flex-between">
              <span>أغلق بواسطة:</span>
              <span>${t.closedByName}</span>
            </div>
          `:""}
          <div class="flex-between">
            <span>تاريخ البدء:</span>
            <span>${new Date(t.startTime).toLocaleString("ar-EG")}</span>
          </div>
          ${t.endTime?`
            <div class="flex-between">
              <span>تاريخ الإغلاق:</span>
              <span>${new Date(t.endTime).toLocaleString("ar-EG")}</span>
            </div>
          `:""}
        </div>

        <div class="divider"></div>
        <div class="text-center bold">الملخص المالي للمبيعات</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>عدد الفواتير الصادرة:</span>
            <span>${y} فاتورة</span>
          </div>
          <div class="flex-between">
            <span>إجمالي المبيعات:</span>
            <span class="bold">${f.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>تكلفة البضاعة:</span>
            <span>${b.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>المصروفات:</span>
            <span>${$.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="font-size: 11pt; margin-top: 1mm;">
            <span>صافي ربح الوردية:</span>
            <span>${z.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="text-center bold">تفاصيل حركة الخزينة (الدرج)</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>نقدية البداية (الافتتاح):</span>
            <span>${Number(t.startingCash).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>المبيعات النقدية (+):</span>
            <span>${Number(h).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>المرتجع النقدية (-):</span>
            <span>${Number(g).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>تحصيلات ديون (+):</span>
            <span>${Number(N).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>إيداعات يدوية (+):</span>
            <span>${Number(p).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>سحب نقدية لشراء بضاعة (-):</span>
            <span>${Number(x).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="margin-top: 1mm;">
            <span>الرصيد الدفتري المتوقع:</span>
            <span>${Number(t.expectedCash||t.currentCashBalance).toLocaleString()} ج.م</span>
          </div>
          ${t.status==="closed"?`
            <div class="flex-between bold">
              <span>الرصيد الفعلي (المجرود):</span>
              <span>${Number(t.actualCash).toLocaleString()} ج.م</span>
            </div>
            <div class="flex-between bold" style="font-size: 11pt;">
              <span>فرق الجرد (عجز/زيادة):</span>
              <span style="color: ${t.difference===0?"green":"red"};">
                ${t.difference>0?"+":""}${Number(t.difference).toLocaleString()} ج.م
              </span>
            </div>
          `:""}
        </div>

        ${t.discrepancyReason?`
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px;">
            <span class="bold">سبب فرق الجرد:</span> ${t.discrepancyReason}
          </div>
        `:""}

        ${t.notes?`
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px;">
            <span class="bold">ملاحظات الوردية:</span> ${t.notes}
          </div>
        `:""}

        ${S}

        <div style="margin-top: 6mm;" class="divider"></div>
        <div class="flex-between" style="font-size: 8pt; text-align: center;">
          <div style="width: 45%;">
            <span>توقيع مسؤول الوردية</span>
            <div style="margin-top: 8mm; border-top: 1px solid #ccc; padding-top: 1mm;">__________</div>
          </div>
          <div style="width: 45%;">
            <span>توقيع المستلم (المدير)</span>
            <div style="margin-top: 8mm; border-top: 1px solid #ccc; padding-top: 1mm;">__________</div>
          </div>
        </div>

        <div class="divider"></div>
        <p class="text-center" style="font-size: 8pt;">طُبع بواسطة نظام سوق العصر للمبيعات</p>
      `;return this.injectContainer("pos-shift-print-container",q),window.print(),setTimeout(()=>{this.removeStyle("pos-shift-print-style"),this.removeContainer("pos-shift-print-container")},1e3),!0}catch(s){return console.error("Shift Print Error:",s),!1}}}export{L as P};
