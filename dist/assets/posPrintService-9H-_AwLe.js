class w{static injectStyle(t,a){this.removeStyle(t);const e=document.createElement("style");e.id=t,e.innerHTML=a,document.head.appendChild(e)}static removeStyle(t){const a=document.getElementById(t);a&&a.remove()}static injectContainer(t,a){this.removeContainer(t);const e=document.createElement("div");return e.id=t,e.innerHTML=a,document.body.appendChild(e),e}static removeContainer(t){const a=document.getElementById(t);a&&a.remove()}static async printInvoice(t){try{this.injectStyle("pos-invoice-print-style",`
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
      `);const e=Number(t.total||0),y=Number(t.subtotalBeforeDiscount!==void 0?t.subtotalBeforeDiscount:t.subtotal||0),o=Number(t.totalItemDiscounts||0),r=Number(t.discount||0),c=Number(t.deliveryFee!==void 0?t.deliveryFee:Math.max(0,e-y)),m=o+r,f=(t.items||[]).map(n=>{const i=n.discountValue?n.discountType==="percent"?n.price*n.discountValue/100:n.discountValue:0,s=n.price-i,d=s*Number(n.quantity||0);return`
          <div style="margin-bottom: 1.5mm;">
            <div class="flex-between bold">
              <span>${n.name}</span>
              <span>${d.toFixed(2)}</span>
            </div>
            <div style="font-size: 9pt; color: #555;">
              ${n.quantity} ${n.unit==="kg"?"كجم":n.unit==="gram"?"جم":"ق"} × ${s.toFixed(2)}
              ${i>0?` <span style="text-decoration: line-through; margin-right: 1mm;">(${Number(n.price).toFixed(2)})</span>`:""}
            </div>
          </div>
          <div class="thin-divider"></div>
        `}).join("");let v=`<div>طريقة الدفع: ${t.paymentMethod}</div>`;if(t.payments&&t.payments.length>0){const n=t.payments.map(i=>`
            <div class="flex-between" style="font-size: 9pt;">
              <span>${i.method==="cash"?"💵 نقدي (كاش)":i.method==="vodafone"?"📱 فودافون كاش":i.method==="instapay"?"💸 انستا باي":i.method==="visa"?"💳 فيزا":i.method}</span>
              <span>${(Number(i.amount)||0).toFixed(2)} ج.م</span>
            </div>
            ${i.reference?`<div style="font-size: 8pt; color: #555; text-align: left;">مرجع: ${i.reference}</div>`:""}
          `).join("");v+=`
          <div style="margin-top: 1.5mm; padding: 2mm; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
            <div class="text-center bold" style="font-size: 8pt; border-bottom: 1px solid #eee; padding-bottom: 1mm; margin-bottom: 1.5mm;">تفاصيل المدفوعات المستلمة</div>
            ${n}
          </div>
        `}const u=`
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
            <span>${(()=>{const n=t.createdAt;if(!n)return new Date().toLocaleString("ar-EG");const i=Number(n),s=isNaN(i)?new Date(n):new Date(i);return(isNaN(s.getTime())?new Date:s).toLocaleString("ar-EG")})()}</span>
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
        
        ${f}
        
        <div style="line-height: 1.4; margin-top: 2mm;">
          <div class="flex-between">
            <span>المجموع الفرعي:</span>
            <span>${y.toFixed(2)}</span>
          </div>
          ${o>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصومات المنتجات:</span>
              <span>-${o.toFixed(2)}</span>
            </div>
          `:""}
          ${r>0?`
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصم الفاتورة:</span>
              <span>-${r.toFixed(2)}</span>
            </div>
          `:""}
          ${c>0?`
            <div class="flex-between">
              <span>رسوم التوصيل 🚚:</span>
              <span>+${c.toFixed(2)}</span>
            </div>
          `:""}
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 12pt;">
            <span>الإجمالي الصافي:</span>
            <span>${e.toFixed(2)} ج.م</span>
          </div>
          ${m>0?`
            <div class="text-center bold" style="font-size: 9pt; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; padding: 1.5mm; margin-top: 2mm;">
              💰 إجمالي التوفير: ${m.toFixed(2)} ج.م
            </div>
          `:""}
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9pt;">
          ${v}
          ${t.confirmedByName||t.confirmedShiftId?`
            <div style="font-size: 8pt; color: #555; line-height: 1.4; border: 1px dashed #ccc; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; margin-bottom: 2mm; text-align: right;">
              ${t.confirmedByName?`
                <div class="flex-between">
                  <span>الكاشير:</span>
                  <span>${t.confirmedByName}</span>
                </div>
              `:""}
              ${t.confirmedShiftId?`
                <div class="flex-between">
                  <span>الوردية:</span>
                  <span>#${t.confirmedShiftId} ${t.shiftName?`(${t.shiftName})`:""}</span>
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
      `;return this.injectContainer("pos-invoice-print-container",u),window.print(),setTimeout(()=>{this.removeStyle("pos-invoice-print-style"),this.removeContainer("pos-invoice-print-container")},1e3),!0}catch(a){return console.error("Invoice Print Error:",a),!1}}static async openDrawer(){try{return this.injectStyle("pos-drawer-print-style",`
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
      `);const e=t.shift,o=(i=>{try{return i?JSON.parse(i):null}catch{return null}})(e.snapshotData)||{cashSales:0,cashReturns:0,cardSales:0,debtSales:0,totalDeposits:0,totalWithdrawals:0,ledgerCashPayments:0,ordersCount:0,returnsCount:0};let r=o.products;if(!r||!Array.isArray(r)||r.length===0){const i={};(t.orders||[]).filter(d=>d.status==="completed").forEach(d=>{(Array.isArray(d.items)?d.items:[]).forEach(p=>{if(!p||!p.id)return;const l=p.id,g=Number(p.quantity||0),h=p.unit||"piece";i[l]||(i[l]={id:l,name:p.name||"منتج غير معروف",qtySold:0,unit:h,qtyBefore:"-",qtyAfter:"-"}),i[l].qtySold+=g})}),r=Object.values(i).sort((d,b)=>b.qtySold-d.qtySold)}let c="";r&&r.length>0&&(c=`
          <div class="divider"></div>
          <div class="text-center bold" style="margin: 2mm 0 1mm;">المنتجات المباعة وحركة المخزن</div>
          <div class="divider"></div>
          <div style="margin-top: 1mm;">
            ${r.map(s=>{const d=s.unit==="kg"?"كجم":s.unit==="gram"?"جم":"ق",b=typeof s.qtyBefore=="number"?s.qtyBefore.toFixed(2).replace(/\.00$/,""):s.qtyBefore,p=typeof s.qtyAfter=="number"?s.qtyAfter.toFixed(2).replace(/\.00$/,""):s.qtyAfter,l=typeof s.qtySold=="number"?s.qtySold.toFixed(2).replace(/\.00$/,""):s.qtySold;return`
            <div style="margin-bottom: 1.5mm; font-size: 9pt;">
              <div class="bold">${s.name}</div>
              <div class="flex-between" style="color: #444; font-size: 8.5pt;">
                <span>المباع: ${l} ${d}</span>
                <span>الكمية: ${b} ➔ ${p}</span>
              </div>
            </div>
            <div style="border-bottom: 1px dotted #ccc; margin: 1mm 0;"></div>
          `}).join("")}
          </div>
        `);const m=Number(t.totalSales||0),f=Number(t.cost||0),v=Number(t.totalExp||0),u=m-f-v,n=`
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
            <span>${o.ordersCount} فاتورة</span>
          </div>
          <div class="flex-between">
            <span>إجمالي المبيعات:</span>
            <span class="bold">${m.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>تكلفة البضاعة:</span>
            <span>${f.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>المصروفات:</span>
            <span>${v.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="font-size: 11pt; margin-top: 1mm;">
            <span>صافي ربح الوردية:</span>
            <span>${u.toLocaleString()} ج.م</span>
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
            <span>${Number(o.cashSales).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>المرتجع النقدية (-):</span>
            <span>${Number(o.cashReturns).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>تحصيلات ديون (+):</span>
            <span>${Number(o.ledgerCashPayments).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>إيداعات يدوية (+):</span>
            <span>${Number(o.totalDeposits).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>سحب نقدية لشراء بضاعة (-):</span>
            <span>${Number(o.totalWithdrawals).toLocaleString()} ج.م</span>
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

        ${c}

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
      `;return this.injectContainer("pos-shift-print-container",n),window.print(),setTimeout(()=>{this.removeStyle("pos-shift-print-style"),this.removeContainer("pos-shift-print-container")},1e3),!0}catch(a){return console.error("Shift Print Error:",a),!1}}}export{w as P};
