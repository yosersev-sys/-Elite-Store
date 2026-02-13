
import { Order } from '../types';

// يمكنك تغيير هذا الرقم لرقم واتساب المدير الفعلي (يجب أن يبدأ بكود الدولة بدون أصفار أو +)
const ADMIN_WHATSAPP_NUMBER = '201026034170'; 

export const WhatsAppService = {
  /**
   * إرسال تفاصيل الطلب إلى واتساب المدير
   */
  sendOrderNotification: (order: Order) => {
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
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // فتح الرابط في نافذة جديدة
    window.open(whatsappUrl, '_blank');
  },

  /**
   * إرسال نسخة من الفاتورة (للكاشير)
   */
  sendInvoiceToCustomer: (order: Order, customerPhone?: string) => {
    const phone = customerPhone ? `2${customerPhone.startsWith('0') ? customerPhone.slice(1) : customerPhone}` : ADMIN_WHATSAPP_NUMBER;
    
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
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  }
};
