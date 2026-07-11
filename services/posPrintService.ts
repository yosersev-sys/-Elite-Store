import { Order } from '../types';

export class POSPrintService {
  private static injectStyle(id: string, css: string) {
    this.removeStyle(id);
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  private static removeStyle(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  private static injectContainer(id: string, htmlContent: string) {
    this.removeContainer(id);
    const container = document.createElement('div');
    container.id = id;
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    return container;
  }

  private static removeContainer(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  public static async printInvoice(order: Order): Promise<boolean> {
    try {
      const printStyles = `
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
      `;

      this.injectStyle('pos-invoice-print-style', printStyles);

      // حسابات الإجماليات والخصومات
      const safeTotal = Number(order.total || 0);
      const safeSubtotal = Number(order.subtotalBeforeDiscount !== undefined ? order.subtotalBeforeDiscount : (order.subtotal || 0));
      const safeTotalItemDiscounts = Number(order.totalItemDiscounts || 0);
      const safeInvoiceDiscount = Number(order.discount || 0);
      const safeDeliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : Math.max(0, safeTotal - safeSubtotal));
      const totalSavings = safeTotalItemDiscounts + safeInvoiceDiscount;

      // بناء جدول الأصناف
      const itemsHtml = (order.items || []).map(item => {
        const itemDisc = item.discountValue ? (item.discountType === 'percent' ? (item.price * item.discountValue / 100) : item.discountValue) : 0;
        const priceAfterDisc = item.price - itemDisc;
        const totalItemPrice = priceAfterDisc * Number(item.quantity || 0);
        return `
          <div style="margin-bottom: 1.5mm;">
            <div class="flex-between bold">
              <span>${item.name}</span>
              <span>${totalItemPrice.toFixed(2)}</span>
            </div>
            <div style="font-size: 9pt; color: #555;">
              ${item.quantity} ${item.unit === 'kg' ? 'كجم' : item.unit === 'gram' ? 'جم' : 'ق'} × ${priceAfterDisc.toFixed(2)}
              ${itemDisc > 0 ? ` <span style="text-decoration: line-through; margin-right: 1mm;">(${Number(item.price).toFixed(2)})</span>` : ''}
            </div>
          </div>
          <div class="thin-divider"></div>
        `;
      }).join('');

      // بناء تفاصيل طرق الدفع والآجل
      let paymentsHtml = `<div>طريقة الدفع: ${order.paymentMethod}</div>`;
      if (order.payments && order.payments.length > 0) {
        const payList = order.payments.map((p: any) => {
          const methodLabel = p.method === 'cash' ? '💵 نقدي (كاش)' : 
                              p.method === 'vodafone' ? '📱 فودافون كاش' : 
                              p.method === 'instapay' ? '💸 انستا باي' : 
                              p.method === 'visa' ? '💳 فيزا' : p.method;
          return `
            <div class="flex-between" style="font-size: 9pt;">
              <span>${methodLabel}</span>
              <span>${(Number(p.amount) || 0).toFixed(2)} ج.م</span>
            </div>
            ${p.reference ? `<div style="font-size: 8pt; color: #555; text-align: left;">مرجع: ${p.reference}</div>` : ''}
          `;
        }).join('');
        
        paymentsHtml += `
          <div style="margin-top: 1.5mm; padding: 2mm; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
            <div class="text-center bold" style="font-size: 8pt; border-bottom: 1px solid #eee; padding-bottom: 1mm; margin-bottom: 1.5mm;">تفاصيل المدفوعات المستلمة</div>
            ${payList}
          </div>
        `;
      }

      const invoiceHtml = `
        <div class="text-center">
          <div class="title font-Cairo font-black">سوق العصر</div>
          <div style="font-size: 9pt; color: #555;">فاقوس - أول سوق إلكتروني</div>
          <div class="bold" style="margin-top: 2mm;">رقم الفاتورة: ${order.id}</div>
          ${order.isOffline ? `
            <div style="font-size: 8pt; background: #fff8e1; border: 1px dashed #ffe082; color: #b78103; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; font-weight: 900; line-height: 1.2;">
              📡 إيصال مؤقت - فاتورة غير متزامنة أوفلاين
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div style="font-size: 9pt; line-height: 1.4;">
          <div class="flex-between">
            <span>التاريخ:</span>
            <span>${(() => {
              const val = order.createdAt;
              if (!val) return new Date().toLocaleString('ar-EG');
              const num = Number(val);
              const dateObj = isNaN(num) ? new Date(val) : new Date(num);
              return (isNaN(dateObj.getTime()) ? new Date() : dateObj).toLocaleString('ar-EG');
            })()}</span>
          </div>
          <div class="flex-between">
            <span>العميل:</span>
            <span>${order.customerName}</span>
          </div>
          <div class="flex-between">
            <span>الهاتف:</span>
            <span>${order.phone}</span>
          </div>
          ${order.address && order.address !== 'استلام فرع (كاشير)' ? `
            <div style="font-size: 8pt; border-top: 1px solid #eee; padding-top: 1mm; margin-top: 1mm;">
              <span class="bold">العنوان:</span> ${order.address}
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 9pt; margin-bottom: 2mm;">الأصناف والمبيعات</div>
        <div class="thin-divider"></div>
        
        ${itemsHtml}
        
        <div style="line-height: 1.4; margin-top: 2mm;">
          <div class="flex-between">
            <span>المجموع الفرعي:</span>
            <span>${safeSubtotal.toFixed(2)}</span>
          </div>
          ${safeTotalItemDiscounts > 0 ? `
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصومات المنتجات:</span>
              <span>-${safeTotalItemDiscounts.toFixed(2)}</span>
            </div>
          ` : ''}
          ${safeInvoiceDiscount > 0 ? `
            <div class="flex-between" style="color: #d32f2f;">
              <span>خصم الفاتورة:</span>
              <span>-${safeInvoiceDiscount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${safeDeliveryFee > 0 ? `
            <div class="flex-between">
              <span>رسوم التوصيل 🚚:</span>
              <span>+${safeDeliveryFee.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 12pt;">
            <span>الإجمالي الصافي:</span>
            <span>${safeTotal.toFixed(2)} ج.م</span>
          </div>
          ${totalSavings > 0 ? `
            <div class="text-center bold" style="font-size: 9pt; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; padding: 1.5mm; margin-top: 2mm;">
              💰 إجمالي التوفير: ${totalSavings.toFixed(2)} ج.م
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9pt;">
          ${paymentsHtml}
          ${(order.confirmedByName || order.confirmedShiftId) ? `
            <div style="font-size: 8pt; color: #555; line-height: 1.4; border: 1px dashed #ccc; padding: 1.5mm; border-radius: 4px; margin-top: 2mm; margin-bottom: 2mm; text-align: right;">
              ${order.confirmedByName ? `
                <div class="flex-between">
                  <span>الكاشير:</span>
                  <span>${order.confirmedByName}</span>
                </div>
              ` : ''}
              ${order.confirmedShiftId ? `
                <div class="flex-between">
                  <span>الوردية:</span>
                  <span>#${order.confirmedShiftId} ${(order as any).shiftName ? `(${(order as any).shiftName})` : ''}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          <div style="margin-top: 3mm;" class="bold">شكراً لزيارتكم!</div>
          <div class="store-link">soqelasr.com</div>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://soqelasr.com" alt="QR Code" />
          </div>
          <div style="font-size: 7pt; color: #888; margin-top: 1mm;">امسح الكود لزيارة موقعنا 🌐</div>
        </div>
      `;

      this.injectContainer('pos-invoice-print-container', invoiceHtml);
      window.print();
      
      // التنظيف بعد ثانية
      setTimeout(() => {
        this.removeStyle('pos-invoice-print-style');
        this.removeContainer('pos-invoice-print-container');
      }, 1000);
      
      return true;
    } catch (err) {
      console.error('Invoice Print Error:', err);
      return false;
    }
  }

  public static async openDrawer(): Promise<boolean> {
    try {
      const drawerStyles = `
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
      `;

      this.injectStyle('pos-drawer-print-style', drawerStyles);
      this.injectContainer('pos-drawer-kick-container', '&nbsp;');
      
      window.print();

      setTimeout(() => {
        this.removeStyle('pos-drawer-print-style');
        this.removeContainer('pos-drawer-kick-container');
      }, 1000);
      
      return true;
    } catch (err) {
      console.error('Drawer Open Error:', err);
      return false;
    }
  }

  public static async printShift(shiftDetails: any): Promise<boolean> {
    try {
      const shiftStyles = `
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
      `;

      this.injectStyle('pos-shift-print-style', shiftStyles);

      const shift = shiftDetails.shift;
      const parsedSnapshot = (data: string | undefined) => {
        try {
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
      };

      const snap = parsedSnapshot(shift.snapshotData) || {
        cashSales: 0,
        cashReturns: 0,
        cardSales: 0,
        debtSales: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        ledgerCashPayments: 0,
        ordersCount: 0,
        returnsCount: 0
      };

      // Extract products from snapshot or fallback to calculating them from orders
      let productsList = (snap as any).products;
      if (!productsList || !Array.isArray(productsList) || productsList.length === 0) {
        const productStats: Record<string, { id: string; name: string; qtySold: number; unit: string; qtyBefore: any; qtyAfter: any }> = {};
        const completedOrders = (shiftDetails.orders || []).filter((o: any) => o.status === 'completed');
        completedOrders.forEach((order: any) => {
          const items = Array.isArray(order.items) ? order.items : [];
          items.forEach((item: any) => {
            if (!item || !item.id) return;
            const key = item.id;
            const qty = Number(item.quantity || 0);
            const unit = item.unit || 'piece';
            if (!productStats[key]) {
              productStats[key] = {
                id: key,
                name: item.name || 'منتج غير معروف',
                qtySold: 0,
                unit: unit,
                qtyBefore: '-',
                qtyAfter: '-'
              };
            }
            productStats[key].qtySold += qty;
          });
        });
        productsList = Object.values(productStats).sort((a, b) => b.qtySold - a.qtySold);
      }

      let productsHtml = '';
      if (productsList && productsList.length > 0) {
        const rows = productsList.map((p: any) => {
          const formattedUnit = p.unit === 'kg' ? 'كجم' : p.unit === 'gram' ? 'جم' : 'ق';
          const qtyBeforeStr = typeof p.qtyBefore === 'number' ? p.qtyBefore.toFixed(2).replace(/\.00$/, '') : p.qtyBefore;
          const qtyAfterStr = typeof p.qtyAfter === 'number' ? p.qtyAfter.toFixed(2).replace(/\.00$/, '') : p.qtyAfter;
          const qtySoldStr = typeof p.qtySold === 'number' ? p.qtySold.toFixed(2).replace(/\.00$/, '') : p.qtySold;
          return `
            <div style="margin-bottom: 1.5mm; font-size: 9pt;">
              <div class="bold">${p.name}</div>
              <div class="flex-between" style="color: #444; font-size: 8.5pt;">
                <span>المباع: ${qtySoldStr} ${formattedUnit}</span>
                <span>الكمية: ${qtyBeforeStr} ➔ ${qtyAfterStr}</span>
              </div>
            </div>
            <div style="border-bottom: 1px dotted #ccc; margin: 1mm 0;"></div>
          `;
        }).join('');

        productsHtml = `
          <div class="divider"></div>
          <div class="text-center bold" style="margin: 2mm 0 1mm;">المنتجات المباعة وحركة المخزن</div>
          <div class="divider"></div>
          <div style="margin-top: 1mm;">
            ${rows}
          </div>
        `;
      }

      const totalSales = Number(shiftDetails.totalSales || 0);
      const cost = Number(shiftDetails.cost || 0);
      const totalExp = Number(shiftDetails.totalExp || 0);
      const netProfit = totalSales - cost - totalExp;

      const shiftHtml = `
        <div class="text-center">
          <h2 class="bold" style="font-size: 12pt;">تقرير تسليم خزينة الوردية</h2>
          <p style="font-size: 9pt; color: #555;">سوق العصر - فاقوس</p>
          <div class="bold" style="background: #eee; padding: 1mm; border-radius: 4px; display: inline-block; margin-top: 1mm;">
            رقم الوردية: #${shift.id}
          </div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>حالة الوردية:</span>
            <span class="bold">${shift.status === 'closed' ? '🔒 مغلقة' : '🟢 مفتوحة'}</span>
          </div>
          <div class="flex-between">
            <span>المسؤول:</span>
            <span>${shift.openedByName || 'أدمن'}</span>
          </div>
          ${shift.closedByName ? `
            <div class="flex-between">
              <span>أغلق بواسطة:</span>
              <span>${shift.closedByName}</span>
            </div>
          ` : ''}
          <div class="flex-between">
            <span>تاريخ البدء:</span>
            <span>${new Date(shift.startTime).toLocaleString('ar-EG')}</span>
          </div>
          ${shift.endTime ? `
            <div class="flex-between">
              <span>تاريخ الإغلاق:</span>
              <span>${new Date(shift.endTime).toLocaleString('ar-EG')}</span>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>
        <div class="text-center bold">الملخص المالي للمبيعات</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>عدد الفواتير الصادرة:</span>
            <span>${snap.ordersCount} فاتورة</span>
          </div>
          <div class="flex-between">
            <span>إجمالي المبيعات:</span>
            <span class="bold">${totalSales.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>تكلفة البضاعة:</span>
            <span>${cost.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between">
            <span>المصروفات:</span>
            <span>${totalExp.toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="font-size: 11pt; margin-top: 1mm;">
            <span>صافي ربح الوردية:</span>
            <span>${netProfit.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="text-center bold">تفاصيل حركة الخزينة (الدرج)</div>
        <div class="divider"></div>

        <div style="font-size: 9pt;">
          <div class="flex-between">
            <span>نقدية البداية (الافتتاح):</span>
            <span>${Number(shift.startingCash).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>المبيعات النقدية (+):</span>
            <span>${Number(snap.cashSales).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>المرتجع النقدية (-):</span>
            <span>${Number(snap.cashReturns).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>تحصيلات ديون (+):</span>
            <span>${Number(snap.ledgerCashPayments).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: green;">
            <span>إيداعات يدوية (+):</span>
            <span>${Number(snap.totalDeposits).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between" style="color: red;">
            <span>سحب نقدية لشراء بضاعة (-):</span>
            <span>${Number(snap.totalWithdrawals).toLocaleString()} ج.م</span>
          </div>
          <div class="flex-between bold" style="margin-top: 1mm;">
            <span>الرصيد الدفتري المتوقع:</span>
            <span>${Number(shift.expectedCash || shift.currentCashBalance).toLocaleString()} ج.م</span>
          </div>
          ${shift.status === 'closed' ? `
            <div class="flex-between bold">
              <span>الرصيد الفعلي (المجرود):</span>
              <span>${Number(shift.actualCash).toLocaleString()} ج.م</span>
            </div>
            <div class="flex-between bold" style="font-size: 11pt;">
              <span>فرق الجرد (عجز/زيادة):</span>
              <span style="color: ${shift.difference === 0 ? 'green' : 'red'};">
                ${shift.difference > 0 ? '+' : ''}${Number(shift.difference).toLocaleString()} ج.م
              </span>
            </div>
          ` : ''}
        </div>

        ${shift.discrepancyReason ? `
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px;">
            <span class="bold">سبب فرق الجرد:</span> ${shift.discrepancyReason}
          </div>
        ` : ''}

        ${shift.notes ? `
          <div class="divider"></div>
          <div style="font-size: 9pt; padding: 1.5mm; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px;">
            <span class="bold">ملاحظات الوردية:</span> ${shift.notes}
          </div>
        ` : ''}

        ${productsHtml}

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
      `;

      this.injectContainer('pos-shift-print-container', shiftHtml);
      window.print();

      setTimeout(() => {
        this.removeStyle('pos-shift-print-style');
        this.removeContainer('pos-shift-print-container');
      }, 1000);

      return true;
    } catch (err) {
      console.error('Shift Print Error:', err);
      return false;
    }
  }
}
