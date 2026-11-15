export type ReceiptPaperWidthMm = 58 | 80;

export interface WholesaleReceiptData {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  cafeName: string;
  customerPhone: string;
  customerEmail: string;
  shippingLabel: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  manualPrice?: string | null;
  items: Array<{ name: string; variant?: string | null; quantity: number }>;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeReceiptHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const LABELS = {
  en: {
    title: 'WHOLESALE ORDER',
    orderNo: 'Order No.',
    date: 'Date',
    status: 'Status',
    payment: 'Payment',
    shipping: 'Shipping',
    customer: 'Customer',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    item: 'Item',
    qty: 'Qty',
    lines: 'Products',
    totalQty: 'Total qty',
    price: 'Price',
    notes: 'Notes',
    thanks: 'Thank you for your order',
  },
  ar: {
    title: 'طلب جملة',
    orderNo: 'رقم الطلب',
    date: 'التاريخ',
    status: 'الحالة',
    payment: 'الدفع',
    shipping: 'الشحن',
    customer: 'العميل',
    phone: 'الهاتف',
    email: 'البريد',
    address: 'العنوان',
    item: 'المنتج',
    qty: 'الكمية',
    lines: 'عدد المنتجات',
    totalQty: 'إجمالي الكمية',
    price: 'السعر',
    notes: 'ملاحظات',
    thanks: 'شكراً لطلبكم',
  },
} as const;

export const buildWholesaleReceiptHtml = (
  data: WholesaleReceiptData,
  options: { isArabic?: boolean; paperWidthMm?: ReceiptPaperWidthMm } = {},
): string => {
  const isArabic = options.isArabic === true;
  const paperWidth = options.paperWidthMm ?? 80;
  // Thermal heads leave non-printable margins; keep content inside the printable area.
  const contentWidth = paperWidth === 58 ? 48 : 72;
  const L = isArabic ? LABELS.ar : LABELS.en;
  const e = escapeReceiptHtml;
  const has = (v?: string | null): v is string => typeof v === 'string' && v.trim() !== '';

  const infoRow = (label: string, value?: string | null) =>
    has(value) ? `<tr><th>${e(label)}</th><td><bdi>${e(value)}</bdi></td></tr>` : '';

  const address = [data.address, data.city].filter(has).join(', ');
  const totalQty = data.items.reduce((sum, it) => sum + (Number.isFinite(it.quantity) ? it.quantity : 0), 0);

  const itemRows = data.items
    .map(
      (it, i) => `<tr>
  <td class="n">${i + 1}</td>
  <td class="name"><div><bdi>${e(it.name)}</bdi></div>${has(it.variant) ? `<div class="variant"><bdi>${e(it.variant)}</bdi></div>` : ''}</td>
  <td class="q">${e(String(it.quantity))}</td>
</tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<title>${e(data.orderNumber)}</title>
<style>
  @page { size: ${paperWidth}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: ${contentWidth}mm;
    margin: 0 auto;
    padding: 4mm 0 8mm;
    color: #000;
    font-family: ${isArabic ? "Tahoma, 'Segoe UI'" : "Arial, 'Helvetica Neue'"}, sans-serif;
    font-size: ${paperWidth === 58 ? 10 : 12}px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { width: 100%; border-collapse: collapse; }
  .head { text-align: center; }
  .brand { font-size: 1.9em; font-weight: 800; letter-spacing: 0.12em; }
  .sub { font-size: 0.85em; letter-spacing: 0.2em; margin-top: 0.5mm; }
  .title { display: inline-block; margin-top: 2.5mm; padding: 1mm 3mm; background: #000; color: #fff; font-weight: 700; letter-spacing: 0.08em; }
  .order-no { margin-top: 2mm; font-size: 0.85em; }
  .order-no strong { display: block; font-size: 1.35em; letter-spacing: 0.04em; word-break: break-all; }
  .rule { border: 0; border-top: 2px solid #000; margin: 3mm 0; }
  .rule.thin { border-top: 1px dashed #000; }
  .section { font-weight: 800; font-size: 0.95em; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 1.5mm; }
  .info th, .info td { padding: 0.8mm 0; vertical-align: top; }
  .info th { text-align: start; font-weight: 400; white-space: nowrap; padding-inline-end: 3mm; width: 1%; }
  .info td { text-align: end; font-weight: 700; word-break: break-word; }
  .cust-name { font-size: 1.15em; font-weight: 800; }
  .cust-cafe { font-weight: 700; margin-bottom: 1.5mm; }
  .items thead th { font-size: 0.85em; font-weight: 800; text-transform: uppercase; padding: 1mm 0; border-top: 2px solid #000; border-bottom: 2px solid #000; }
  .items td { padding: 1.8mm 0; vertical-align: top; border-bottom: 1px solid #000; }
  .items tbody tr:last-child td { border-bottom: 0; }
  .items .n { width: 6mm; text-align: start; font-weight: 700; }
  .items .name { text-align: start; font-weight: 700; word-break: break-word; }
  .items .variant { font-weight: 400; font-size: 0.9em; margin-top: 0.5mm; }
  .items .q { width: 12mm; text-align: end; font-size: 1.25em; font-weight: 800; white-space: nowrap; }
  .items thead .q { font-size: 0.85em; }
  .totals { border: 2px solid #000; padding: 1.5mm 2mm; }
  .totals .row { display: flex; justify-content: space-between; gap: 2mm; padding: 0.5mm 0; }
  .totals .big { font-size: 1.3em; font-weight: 800; }
  .notes { border: 1px dashed #000; padding: 2mm; white-space: pre-wrap; word-break: break-word; font-weight: 700; }
  .foot { text-align: center; margin-top: 4mm; }
  .foot .thanks { font-weight: 700; }
  .foot .site { font-size: 0.85em; margin-top: 0.5mm; }
  /* Letter-spacing breaks Arabic letter joining. */
  [dir="rtl"] .title, [dir="rtl"] .section, [dir="rtl"] .items thead th { letter-spacing: 0; }
  .info + .items { margin-top: 3mm; }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">SPIRITHUB</div>
    <div class="sub">ROASTERY</div>
    <div class="title">${e(L.title)}</div>
    <div class="order-no">${e(L.orderNo)}<strong>${e(data.orderNumber)}</strong></div>
  </div>

  <hr class="rule" />
  <table class="info">
    ${infoRow(L.date, data.createdAt)}
    ${infoRow(L.status, data.status)}
    ${infoRow(L.payment, data.paymentStatus)}
    ${infoRow(L.shipping, data.shippingLabel)}
  </table>

  <hr class="rule thin" />
  <div class="section">${e(L.customer)}</div>
  ${has(data.customerName) ? `<div class="cust-name">${e(data.customerName)}</div>` : ''}
  ${has(data.cafeName) ? `<div class="cust-cafe">${e(data.cafeName)}</div>` : ''}
  <table class="info">
    ${infoRow(L.phone, data.customerPhone)}
    ${infoRow(L.email, data.customerEmail)}
    ${infoRow(L.address, address)}
  </table>

  <table class="items">
    <thead><tr><th class="n">#</th><th class="name">${e(L.item)}</th><th class="q">${e(L.qty)}</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>${e(L.lines)}</span><span>${data.items.length}</span></div>
    <div class="row big"><span>${e(L.totalQty)}</span><span>${totalQty}</span></div>
    ${has(data.manualPrice) ? `<div class="row big"><span>${e(L.price)}</span><span>${e(data.manualPrice)}</span></div>` : ''}
  </div>

  ${has(data.notes) ? `<hr class="rule thin" /><div class="section">${e(L.notes)}</div><div class="notes">${e(data.notes)}</div>` : ''}

  <hr class="rule" />
  <div class="foot">
    <div class="thanks">${e(L.thanks)}</div>
    <div class="site">spirithubcafe.com</div>
  </div>
</body>
</html>`;
};