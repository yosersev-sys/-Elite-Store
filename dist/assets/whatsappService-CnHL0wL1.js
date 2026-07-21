const l=t=>{if(!t)return"";let e=t.replace(/\D/g,"");return e.length===11&&e.startsWith("0")?"2"+e:!e.startsWith("20")&&e.length>=10?"20"+(e.startsWith("0")?e.slice(1):e):e},m={sendOrderNotification:(t,e)=>{const a=l(e),s=t.items.map(n=>`• ${n.name} (الكمية: ${n.quantity}) - ${n.price*n.quantity} ج.م`).join(`
`),o=t.total-t.subtotal>0?`*رسوم التوصيل:* ${t.total-t.subtotal} ج.م`:"*التوصيل:* استلام من الفرع",c=`
🛍️ *طلب جديد من سوق العصر*
-------------------------
*رقم الطلب:* #${t.id}
*اسم العميل:* ${t.customerName}
*رقم الهاتف:* ${t.phone}
*العنوان:* ${t.address}

*الأصناف المطلوبة:*
${s}

*المجموع الفرعي:* ${t.subtotal} ج.م
${o}
*الإجمالي النهائي:* ${t.total} ج.م
*طريقة الدفع:* ${t.paymentMethod}
-------------------------
تاريخ الطلب: ${new Date(t.createdAt).toLocaleString("ar-EG")}
    `.trim(),i=encodeURIComponent(c),$=`https://wa.me/${a}?text=${i}`;window.open($,"_blank")},sendInvoiceToCustomer:(t,e)=>{const a=l(e),s=t.items.map(n=>`• ${n.name} (${n.quantity} × ${n.price})`).join(`
`),o=t.total-t.subtotal,c=o>0?`*رسوم التوصيل:* ${o} ج.م
`:"",i=`
🧾 *فاتورة مبيعات - سوق العصر*
-------------------------
*رقم الفاتورة:* #${t.id}
*التاريخ:* ${new Date(t.createdAt).toLocaleDateString("ar-EG")}

*البيان:*
${s}

-------------------------
*المجموع:* ${t.subtotal} ج.م
${c}*الإجمالي:* ${t.total} ج.م
*الحالة:* ${t.paymentMethod}
-------------------------
شكراً لثقتكم بنا ✨
    `.trim(),$=encodeURIComponent(i);window.open(`https://wa.me/${a}?text=${$}`,"_blank")},sendDebtReminderToCustomer:t=>{const e=l(t.phone),a=`
⚠️ *تذكير بمديونية - سوق العصر*
-------------------------
عزيزنا العميل: *${t.customerName}*
نود تذكيركم بطلبكم رقم: *#${t.id}*
المسجل بتاريخ: ${new Date(t.createdAt).toLocaleDateString("ar-EG")}

*تفاصيل المديونية:*
الإجمالي: *${t.total} ج.م*
حالة الدفع: *آجل (لم يتم السداد بعد)*

يرجى التكرم بزيارة الفرع أو التواصل معنا لإتمام عملية السداد.
شاكرين لكم حسن تعاونكم ✨
    `.trim(),s=encodeURIComponent(a);window.open(`https://wa.me/${e}?text=${s}`,"_blank")}};export{m as W};
