
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
   * إرسال تفاصيل الطلب إلى واتساب المدير
   */
  sendOrderNotification: (order: Order, adminPhone: string) => {
    const targetPhone = formatWhatsAppPhone(adminPhone);
    const itemsList = order.items
      .map(item => `• ${item.name} (الكمية: ${item.quantity}) - ${item.price * item.quantity} ج.م`)
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

*المجموع الفرعي:* ${order.subtotal} ج.م
*الإجمالي النهائي:* ${order.total} ج.م
*طريقة الدفع:* ${order.paymentMethod}
-------------------------
تاريخ الطلب: ${new Date(order.createdAt).toLocaleString('ar-EG')}
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  },

  /**
   * إرسال نسخة من الفاتورة (للكاشير)
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

*الإجمالي:* ${order.total} ج.م
*الحالة:* ${order.paymentMethod}
-------------------------
شكراً لثقتكم بنا ✨
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank');
  }
};
