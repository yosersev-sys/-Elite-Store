
import { Order } from '../types';

/**
 * وظيفة لتنسيق رقم الهاتف للتوافق مع واتساب (إضافة كود الدولة)
 */
const formatWhatsAppPhone = (phone: string) => {
  if (!phone) return '';
  // إزالة أي مسافات أو رموز
  let clean = phone.replace(/\D/g, '');
  // إذا بدأ بـ 0 وكان مصرياً (11 رقم)
  if (clean.length === 11 && clean.startsWith('0')) {
    return '2' + clean;
  }
  // إذا لم يبدأ بـ 20 (كود مصر) نضيفه افتراضياً
  if (!clean.startsWith('20') && clean.length >= 10) {
    return '20' + (clean.startsWith('0') ? clean.slice(1) : clean);
  }
  return clean;
};

export const WhatsAppService = {
  /**
   * توليد الرابط فقط (للاستخدام في وسوم <a>)
   */
  getOrderWhatsAppUrl: (order: Order, adminPhone: string) => {
    const targetPhone = formatWhatsAppPhone(adminPhone);
    const itemsList = order.items
      .map(item => `• ${item.name} (الكمية: ${item.quantity}) - ${(item.price * item.quantity).toFixed(2)} ج.م`)
      .join('\n');

    const message = `
🛍️ *طلب جديد من سوق العصر*
-------------------------
*رقم الطلب:* #${order.id}
*اسم العميل:* ${order.customerName}
*رقم الهاتف:* ${order.phone}
*العنوان:* ${order.address}

*الأصناف المطلوبة:*
${itemsList}

*المجموع الفرعي:* ${order.subtotal.toFixed(2)} ج.م
*الإجمالي النهائي:* ${order.total.toFixed(2)} ج.م
*طريقة الدفع:* ${order.paymentMethod}
-------------------------
تاريخ الطلب: ${new Date(order.createdAt).toLocaleString('ar-EG')}
    `.trim();

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * إرسال تفاصيل الطلب إلى واتساب المدير (برمجياً)
   */
  sendOrderNotification: (order: Order, adminPhone: string) => {
    const url = WhatsAppService.getOrderWhatsAppUrl(order, adminPhone);
    window.open(url, '_blank');
  },

  /**
   * إرسال نسخة من الفاتورة للعميل
   */
  sendInvoiceToCustomer: (order: Order, customerPhone: string) => {
    const targetPhone = formatWhatsAppPhone(customerPhone);
    const itemsList = order.items
      .map(item => `• ${item.name} (${item.quantity} × ${item.price})`)
      .join('\n');

    const message = `
🧾 *فاتورة مبيعات - سوق العصر*
-------------------------
*رقم الفاتورة:* #${order.id}
*التاريخ:* ${new Date(order.createdAt).toLocaleDateString('ar-EG')}

*البيان:*
${itemsList}

*الإجمالي:* ${order.total.toFixed(2)} ج.م
*الحالة:* ${order.paymentMethod}
-------------------------
شكراً لثقتكم بنا ✨
    `.trim();

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  },

  /**
   * إرسال رسالة تنبيه مديونية
   */
  sendDebtReminderToCustomer: (order: Order) => {
    const targetPhone = formatWhatsAppPhone(order.phone);
    const message = `
⚠️ *تذكير بمديونية - سوق العصر*
-------------------------
عزيزنا العميل: *${order.customerName}*
نود تذكيركم بطلبكم رقم: *#${order.id}*
المسجل بتاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}

*تفاصيل المديونية:*
الإجمالي: *${order.total.toFixed(2)} ج.م*
حالة الدفع: *آجل (لم يتم السداد بعد)*

يرجى التكرم بزيارة الفرع أو التواصل معنا لإتمام عملية السداد.
شاكرين لكم حسن تعاونكم ✨
    `.trim();

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};
