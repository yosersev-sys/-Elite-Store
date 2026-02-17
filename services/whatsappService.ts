
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
    if (!order) return '#';
    
    const targetPhone = formatWhatsAppPhone(adminPhone);
    const items = Array.isArray(order.items) ? order.items : [];
    
    const itemsList = items
      .map(item => `• ${item.name || 'صنف'} (الكمية: ${item.quantity || 0}) - ${((item.price || 0) * (item.quantity || 0)).toFixed(2)} ج.م`)
      .join('\n');

    const message = `
🛍️ *طلب جديد من سوق العصر*
-------------------------
*رقم الطلب:* #${order.id || '---'}
*اسم العميل:* ${order.customerName || '---'}
*رقم الهاتف:* ${order.phone || '---'}
*العنوان:* ${order.address || '---'}

*الأصناف المطلوبة:*
${itemsList}

*المجموع الفرعي:* ${(order.subtotal || 0).toFixed(2)} ج.م
*الإجمالي النهائي:* ${(order.total || 0).toFixed(2)} ج.م
*طريقة الدفع:* ${order.paymentMethod || 'عند الاستلام'}
-------------------------
تاريخ الطلب: ${new Date(order.createdAt || Date.now()).toLocaleString('ar-EG')}
    `.trim();

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * إرسال تفاصيل الطلب إلى واتساب المدير (برمجياً)
   */
  sendOrderNotification: (order: Order, adminPhone: string) => {
    const url = WhatsAppService.getOrderWhatsAppUrl(order, adminPhone);
    if (url !== '#') window.open(url, '_blank');
  },

  /**
   * إرسال نسخة من الفاتورة للعميل
   */
  sendInvoiceToCustomer: (order: Order, customerPhone: string) => {
    if (!order) return;
    const targetPhone = formatWhatsAppPhone(customerPhone);
    const items = Array.isArray(order.items) ? order.items : [];
    
    const itemsList = items
      .map(item => `• ${item.name} (${item.quantity} × ${item.price})`)
      .join('\n');

    const message = `
🧾 *فاتورة مبيعات - سوق العصر*
-------------------------
*رقم الفاتورة:* #${order.id}
*التاريخ:* ${new Date(order.createdAt || Date.now()).toLocaleDateString('ar-EG')}

*البيان:*
${itemsList}

*الإجمالي:* ${(order.total || 0).toFixed(2)} ج.م
*الحالة:* ${order.paymentMethod}
-------------------------
شكراً لثقتكم بنا ✨
    `.trim();

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};
