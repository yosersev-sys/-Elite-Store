
import { Order } from '../types';

/**
 * وظيفة لتنسيق رقم الهاتف للتوافق مع واتساب (إضافة كود الدولة)
 */
const formatWhatsAppPhone = (phone: string) => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('0')) {
    return '2' + clean;
  }
  if (!clean.startsWith('20') && clean.length >= 10) {
    return '20' + (clean.startsWith('0') ? clean.slice(1) : clean);
  }
  return clean;
};

export const WhatsAppService = {
  /**
   * توليد نص رسالة الطلب
   */
  getOrderMessage: (order: Order) => {
    const itemsList = order.items
      .map(item => `• ${item.name} (الكمية: ${item.quantity}) - ${(item.price * item.quantity).toFixed(2)} ج.م`)
      .join('\n');

    return `
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
  },

  /**
   * الحصول على رابط واتساب المدير
   */
  getOrderWhatsAppUrl: (order: Order, adminPhone: string) => {
    const targetPhone = formatWhatsAppPhone(adminPhone);
    const message = WhatsAppService.getOrderMessage(order);
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * إرسال تفاصيل الطلب (الطريقة القديمة - للاحتياط)
   */
  sendOrderNotification: (order: Order, adminPhone: string) => {
    const url = WhatsAppService.getOrderWhatsAppUrl(order, adminPhone);
    window.location.href = url;
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

    window.location.href = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  }
};
