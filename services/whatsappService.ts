
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

const safeFixed = (num: any) => {
  const n = parseFloat(num);
  return isNaN(n) ? "0.00" : n.toFixed(2);
};

export const WhatsAppService = {
  getOrderWhatsAppUrl: (order: Order, adminPhone: string) => {
    if (!order) return '#';
    
    const targetPhone = formatWhatsAppPhone(adminPhone);
    const items = Array.isArray(order.items) ? order.items : [];
    
    const itemsList = items
      .map(item => `• ${item?.name || 'صنف'} (الكمية: ${item?.quantity || 0}) - ${safeFixed((item?.price || 0) * (item?.quantity || 0))} ج.م`)
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

*المجموع الفرعي:* ${safeFixed(order.subtotal)} ج.م
*الإجمالي النهائي:* ${safeFixed(order.total)} ج.م
*طريقة الدفع:* ${order.paymentMethod || 'عند الاستلام'}
-------------------------
تاريخ الطلب: ${new Date(order.createdAt || Date.now()).toLocaleString('ar-EG')}
    `.trim();

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  },

  sendOrderNotification: (order: Order, adminPhone: string) => {
    const url = WhatsAppService.getOrderWhatsAppUrl(order, adminPhone);
    if (url !== '#') window.open(url, '_blank');
  },

  sendInvoiceToCustomer: (order: Order, customerPhone: string) => {
    if (!order) return;
    const targetPhone = formatWhatsAppPhone(customerPhone);
    const items = Array.isArray(order.items) ? order.items : [];
    
    const itemsList = items
      .map(item => `• ${item?.name || 'صنف'} (${item?.quantity || 0} × ${item?.price || 0})`)
      .join('\n');

    const message = `
🧾 *فاتورة مبيعات - سوق العصر*
-------------------------
*رقم الفاتورة:* #${order.id || '---'}
*التاريخ:* ${new Date(order.createdAt || Date.now()).toLocaleDateString('ar-EG')}

*البيان:*
${itemsList}

*الإجمالي:* ${safeFixed(order.total)} ج.م
*الحالة:* ${order.paymentMethod || '---'}
-------------------------
شكراً لثقتكم بنا ✨
    `.trim();

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};
