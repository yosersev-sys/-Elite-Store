class y{static injectStyle(t,n){this.removeStyle(t);const e=document.createElement("style");e.id=t,e.innerHTML=n,document.head.appendChild(e)}static removeStyle(t){const n=document.getElementById(t);n&&n.remove()}static injectContainer(t,n){this.removeContainer(t);const e=document.createElement("div");return e.id=t,e.innerHTML=n,document.body.appendChild(e),e}static removeContainer(t){const n=document.getElementById(t);n&&n.remove()}static async printInvoice(t){try{this.injectStyle("pos-invoice-print-style",`
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
      `);const e=Number(t.total||0),m=Number(t.subtotalBeforeDiscount!==void 0?t.subtotalBeforeDiscount:t.subtotal||0),a=Number(t.totalItemDiscounts||0),o=Number(t.discount||0),d=Number(t.deliveryFee!==void 0?t.deliveryFee:Math.max(0,e-m)),p=a+o,v=(t.items||[]).map(i=>{const s=i.discountValue?i.discountType==="percent"?i.price*i.discountValue/100:i.discountValue:0,r=i.price-s,f=r*Number(i.quantity||0);return`
          <div style="margin-bottom: 1.5mm;">
            <div class="flex-between bold">
              <span>${i.name}</span>
              <span>${f.toFixed(2)}</span>
            </div>
            <div style="font-size: 9pt; color: #555;">
              ${i.quantity} ${i.unit==="kg"?"كجم":i.unit==="gram"?"جم":"ق"} × ${r.toFixed(2)}
              ${s>0?` <span style="text-decoration: line-through; margin-right: 1mm;">(${Number(i.price).toFixed(2)})</span>`:""}
            </div>
          </div>
          <div class="thin-divider"></div>
        `}).join("");let l=`<div>طريقة الدفع: ${t.paymentMethod}</div>`;if(t.payments&&t.payments.length>0){const i=t.payments.map(s=>`
            <div class="flex-between" style="font-size: 9pt;">
              <span>${s.method==="cash"?"💵 نقدي (كاش)":s.method==="vodafone"?"📱 فودافون كاش":s.method==="instapay"?"💸 انستا باي":s.method==="visa"?"💳 فيزا":s.method}</span>
              <span>${(Number(s.amount)||0).toFixed(2)} ج.م</span>
            </div>
            ${s.reference?`<div style="font-size: 8pt; color: #555; text-align: left;">مرجع: ${s.reference}</div>`:""}
          `).join("");l+=`
          <div style="margin-top: 1.5mm; padding: 2mm; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
            <div class="text-center bold" style="font-size: 8pt; border-bottom: 1px solid #eee; padding-bottom: 1mm; margin-bottom: 1.5mm;">تفاصيل المدفوعات المستلمة</div>
            ${i}
          </div>
        `}const c=`
        <div class="text-center">
          <div class="title font-Cairo font-black">سوق العصر</div>
          <div style="font-size: 9pt; color: #555;">فاقوس - أول سوق إلكتروني</div>
          <div class="bold" style="margin-top: 2mm;">رقم الفاتورة: ${t.id}</div>
          ${t.isOffline?`
            <div style="font-size: 8pt; background: #fff8e1; border: 1px dashed #ffe082; color: #b78103; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; font-weight: 900; line-height: 1.2;">
              📡 إيصال مؤقت - فاتورة غير متزامنة أوفلاين
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        
        <div style="font-size: 9pt; line-height: 1.4;">
          <div class="flex-between">
            <span>التاريخ:</span>
            <span>${(()=>{const i=t.createdAt;if(!i)return new Date().toLocaleString("ar-EG");const s=Number(i),r=isNaN(s)?new Date(i):new Date(s);return(isNaN(r.getTime())?new Date:r).toLocaleString("ar-EG")})()}</span>
          </div>
          <div class="flex-between">
            <span>العميل:</span>
            <span>${t.customerName}</span>
          </div>
          <div class="flex-between">
            <span>الهاتف:</span>
            <span>${t.phone}</span>
          </div>
          ${t.address&&t.address!=="استلام فرع (كاشير)"?`
            <div style="font-size: 8pt; border-top: 1px solid #eee; padding-top: 1mm; margin-top: 1mm;">
              <span class="bold">العنوان:</span> ${t.address}
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 9pt; margin-bottom: 2mm;">الأصناف والمبيعات</div>
        <div class="thin-divider"></div>
        
        ${v}
        
        <div style="line-height: 1.4; margin-top: 2mm;">
          <div class="flex-between">
            <span>المجموع الفرعي:</span>
            <span>${m.toFixed(2)}</span>
          </div>
          ${a>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصومات المنتجات:</span>
              <span>-${a.toFixed(2)}</span>
            </div>
          `:""}
          ${o>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصم الفاتورة:</span>
              <span>-${o.toFixed(2)}</span>
            </div>
          `:""}
          ${d>0?`
            <div class="flex-between">
              <span>رسوم التوصيل 🚚:</span>
              <span>+${d.toFixed(2)}</span>
            </div>
          `:""}
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 12pt;">
            <span>الإجمالي الصافي:</span>
            <span>${e.toFixed(2)} ج.م</span>
          </div>
          ${p>0?`
            <div class="text-center bold" style="font-size: 9pt; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; padding: 1.5mm; margin-top: 2mm;">
              💰 إجمالي التوفير: ${p.toFixed(2)} ج.م
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9pt;">
          ${l}
          <div style="margin-top: 3mm;" class="bold">شكراً لزيارتكم!</div>
          <div class="store-link">soqelasr.com</div>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://soqelasr.com" alt="QR Code" />
          </div>
          <div style="font-size: 7pt; color: #888; margin-top: 1mm;">امسح الكود لزيارة موقعنا 🌐</div>
        </div>
      `;return this.injectContainer("pos-invoice-print-container",c),window.print(),setTimeout(()=>{this.removeStyle("pos-invoice-print-style"),this.removeContainer("pos-invoice-print-container")},1e3),!0}catch(n){return console.error("Invoice Print Error:",n),!1}}static async openDrawer(){try{return this.injectStyle("pos-drawer-print-style",`
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
      `),this.injectContainer("pos-drawer-kick-container","&nbsp;"),window.print(),setTimeout(()=>{this.removeStyle("pos-drawer-print-style"),this.removeContainer("pos-drawer-kick-container")},1e3),!0}catch(t){return console.error("Drawer Open Error:",t),!1}}static async printShift(t){try{this.injectStyle("pos-shift-print-style",`
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
      `);const e=t.shift,a=(c=>{try{return c?JSON.parse(c):null}catch{return null}})(e.snapshotData)||{cashSales:0,cashReturns:0,cardSales:0,debtSales:0,totalDeposits:0,totalWithdrawals:0,ledgerCashPayments:0,ordersCount:0,returnsCount:0},o=Number(t.totalSales||0),d=Number(t.cost||0),p=Number(t.totalExp||0),v=o-d-p,l=`
        <div class="text-center">
          <h2 class="bold" style="font-size: 12pt;">تقرير تسليم خزينة الوردية</h2>
          <p style="font-size: 9pt; color: #555;">سوق العصر - فاقوس</p>
          <div class="bold" style="background: #eee; padding: 1mm; border-radius: 4px; display: inline-block; margin-top: 1mm;">
            رقم الوردية: #${e.id}
          </div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>حالة الوردية:</span>
            <span class="bold">${e.status==="closed"?"🔒 مغلقة":"🟢 مفتوحة"}</span>
          </div>
          <div class="flex-between">
            <span>المسؤول:</span>
            <span>${e.openedByName||"أدمن"}</span>
          </div>
          ${e.closedByName?`
            <div class="flex-between">
              <span>أغلق بواسطة:</span>
              <span>${e.closedByName}</span>
            </div>
          `:""}
          <div class="flex-between">
            <span>تاريخ البدء:</span>
            <span>${new Date(e.startTime).toLocaleString("ar-EG")}</span>
          </div>
          ${e.endTime?`
            <div class="flex-between">
              <span>تاريخ الإغلاق:</span>
              <span>${new Date(e.endTime).toLocaleString("ar-EG")}</span>
            </div>
          `:""}
        </div>

        <div class="divider"></div>
        <div class="text-center bold">الملخص المالي للمبيعات</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>عدد الفواتير الصادرة:</span>
            <span>${a.ordersCount} فاتورة</span>
          </div>
          <div class="flex-between">
            <span>إجمالي المبيعات:</span>
            <span class="bold">${o.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>تكلفة البضاعة:</span>
            <span>${d.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>المصروفات:</span>
            <span>${p.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="font-size: 11pt; margin-top: 1mm;">
            <span>صافي ربح الوردية:</span>
            <span>${v.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="text-center bold">تفاصيل حركة الخزينة (الدرج)</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>نقدية البداية (الافتتاح):</span>
            <span>${Number(e.startingCash).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>المبيعات النقدية (+):</span>
            <span>${Number(a.cashSales).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>المرتجع النقدية (-):</span>
            <span>${Number(a.cashReturns).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>تحصيلات ديون (+):</span>
            <span>${Number(a.ledgerCashPayments).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>إيداعات يدوية (+):</span>
            <span>${Number(a.totalDeposits).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>سحوبات يدوية (-):</span>
            <span>${Number(a.totalWithdrawals).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="margin-top: 1mm;">
            <span>الرصيد الدفتري المتوقع:</span>
            <span>${Number(e.expectedCash||e.currentCashBalance).toLocaleString()} ج.م</span>
          </div>
          ${e.status==="closed"?`
            <div class="flex-between bold">
              <span>الرصيد الفعلي (المجرود):</span>
              <span>${Number(e.actualCash).toLocaleString()} ج.م</span>
            </div>
            <div class="flex-between bold" style="font-size: 11pt;">
              <span>فرق الجرد (عجز/زيادة):</span>
              <span style="color: ${e.difference===0?"green":"red"};">
                ${e.difference>0?"+":""}${Number(e.difference).toLocaleString()} ج.م
              </span>
            </div>
          `:""}
        </div>

        ${e.discrepancyReason?`
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px;">
            <span class="bold">سبب فرق الجرد:</span> ${e.discrepancyReason}
          </div>
        `:""}

        ${e.notes?`
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px;">
            <span class="bold">ملاحظات الوردية:</span> ${e.notes}
          </div>
        `:""}

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
      `;return this.injectContainer("pos-shift-print-container",l),window.print(),setTimeout(()=>{this.removeStyle("pos-shift-print-style"),this.removeContainer("pos-shift-print-container")},1e3),!0}catch(n){return console.error("Shift Print Error:",n),!1}}}export{y as P};
