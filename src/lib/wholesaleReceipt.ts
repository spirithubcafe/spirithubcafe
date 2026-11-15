export type ReceiptPaperWidthMm = 58 | 80;

type Bilingual = { en: string; ar: string };

export interface WholesaleReceiptStoreInfo {
  name: Bilingual;
  address?: Bilingual;
  hours?: Bilingual;
  website?: string;
  instagram?: string;
  phones?: string[];
}

export interface WholesaleReceiptData {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  shippingMethod: 1 | 2;
  customerName: string;
  cafeName: string;
  customerPhone: string;
  customerEmail: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  items: Array<{ name: string; variant?: string | null; quantity: number }>;
  store?: WholesaleReceiptStoreInfo;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeReceiptHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const STATUS_AR: Record<string, string> = {
  New: 'جديد',
  Pending: 'قيد الانتظار',
  Confirmed: 'مؤكد',
  Processing: 'قيد المعالجة',
  Preparing: 'قيد التجهيز',
  Shipped: 'تم الشحن',
  Delivered: 'تم التوصيل',
  Cancelled: 'ملغي',
};

const PAYMENT_AR: Record<string, string> = {
  Pending: 'بانتظار الدفع',
  Paid: 'مدفوع',
  Failed: 'فشل الدفع',
  Refunded: 'مسترد',
};

const SHIPPING: Record<1 | 2, Bilingual> = {
  1: { en: 'Pickup', ar: 'استلام' },
  2: { en: 'Nool Delivery', ar: 'توصيل نول' },
};

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gm: 'g',
  gms: 'g',
  gr: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kgs: 'kg',
  ml: 'ml',
  l: 'L',
};

export interface ParsedVariant {
  /** Normalised weight label, e.g. "250g", "1000g", "1.5kg". */
  weight: string | null;
  /** Weight in grams when the unit is g/kg, used for the total weight. */
  grams: number | null;
  /** Remaining variant text (e.g. SKU) with the weight removed. */
  rest: string;
}

export const parseVariantWeight = (variant?: string | null): ParsedVariant => {
  const text = (variant ?? '').trim();
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kgs?|grams?|gms?|gr|g|ml|l)(?![a-z])/i);
  if (!match) return { weight: null, grams: null, rest: text };

  const amount = Number(match[1].replace(',', '.'));
  const unit = UNIT_ALIASES[match[2].toLowerCase()] ?? match[2];
  if (!Number.isFinite(amount)) return { weight: null, grams: null, rest: text };

  const rest = (text.slice(0, match.index) + text.slice((match.index ?? 0) + match[0].length))
    .replace(/^[\s•·|,/-]+|[\s•·|,/-]+$/g, '')
    .trim();
  const grams = unit === 'g' ? amount : unit === 'kg' ? amount * 1000 : null;

  return { weight: `${amount}${unit}`, grams, rest };
};

export const formatTotalWeight = (grams: number): string =>
  grams >= 1000 ? `${Number((grams / 1000).toFixed(2))} kg` : `${Number(grams.toFixed(2))} g`;

const ICONS = {
  card: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#000" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  note: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#000" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#000" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#000" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#000" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#000" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="#000"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#000" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
};

export const buildWholesaleReceiptHtml = (
  data: WholesaleReceiptData,
  options: { paperWidthMm?: ReceiptPaperWidthMm } = {},
): string => {
  const paperWidth = options.paperWidthMm ?? 80;
  // Thermal heads leave non-printable margins; keep content inside the printable area.
  const contentWidth = paperWidth === 58 ? 48 : 72;
  const e = escapeReceiptHtml;
  const has = (v?: string | null): v is string => typeof v === 'string' && v.trim() !== '';

  const label = (en: string, ar: string) => `<span class="en">${e(en)} /</span> <span class="ar">${e(ar)}</span>`;
  const stacked = (en: string, ar: string) => `<div>${e(en)}</div><div class="ar">${e(ar)}</div>`;
  const infoRow = (en: string, ar: string, value?: string | null) =>
    has(value) ? `<tr><th>${label(en, ar)}</th><td><bdi>${e(value)}</bdi></td></tr>` : '';

  const shipping = SHIPPING[data.shippingMethod] ?? SHIPPING[1];
  const statusAr = STATUS_AR[data.status];
  const paymentAr = PAYMENT_AR[data.paymentStatus];
  const address = [data.address, data.city].filter(has).join(', ');

  const parsed = data.items.map((it) => ({ ...it, ...parseVariantWeight(it.variant) }));
  const totalQty = parsed.reduce((sum, it) => sum + (Number.isFinite(it.quantity) ? it.quantity : 0), 0);
  const allWeighed = parsed.length > 0 && parsed.every((it) => it.grams !== null);
  const totalGrams = allWeighed ? parsed.reduce((sum, it) => sum + (it.grams ?? 0) * it.quantity, 0) : null;

  const itemRows = parsed
    .map(
      (it) => `<tr>
  <td class="name"><div class="pname"><bdi>${e(it.name)}</bdi></div>${has(it.rest) ? `<div class="sku"><bdi>${e(it.rest)}</bdi></div>` : ''}</td>
  <td class="w">${it.weight ? `<span class="weight">${e(it.weight)}</span>` : '—'}</td>
  <td class="q">${e(String(it.quantity))}</td>
</tr>`,
    )
    .join('');

  const store = data.store;
  const footerCols = store
    ? `<div class="store">
    <div class="col">${ICONS.pin}<div><div class="b">${e(store.name.en)}</div>${store.address ? `<div>${e(store.address.en)}</div>` : ''}</div></div>
    ${store.hours ? `<div class="col sep">${ICONS.clock}<div>${e(store.hours.en)}</div></div>` : ''}
  </div>`
    : '';

  return `<!doctype html>
<html lang="en" dir="ltr">
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
    padding: 5mm 0 6mm;
    color: #000;
    font-family: Arial, 'Helvetica Neue', Tahoma, sans-serif;
    font-size: ${paperWidth === 58 ? 9 : 11}px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ar { font-family: Tahoma, 'Segoe UI', Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; }
  .center { text-align: center; }
  .brand { font-size: 2.3em; font-weight: 800; letter-spacing: 0.18em; padding-inline-start: 0.18em; }
  .brand sup { font-size: 0.35em; letter-spacing: 0; vertical-align: super; }
  .sub { font-size: 1.15em; letter-spacing: 0.45em; padding-inline-start: 0.45em; margin-top: 0.5mm; }
  .bar { margin-top: 4mm; background: #000; color: #fff; font-weight: 800; font-size: 1.25em; letter-spacing: 0.06em; padding: 1.4mm 0; }
  .bar-ar { font-size: 1.45em; font-weight: 700; margin-top: 1.5mm; }
  .rule { border: 0; border-top: 1px dashed #000; margin: 3mm 0; }
  .rule.solid { border-top: 1.5px solid #000; }
  .info th, .info td { padding: 0.7mm 0; vertical-align: top; }
  .info th { text-align: start; font-weight: 400; white-space: nowrap; padding-inline-end: 2mm; width: 1%; }
  .info td { text-align: end; word-break: break-word; }
  .info td.strong { font-weight: 700; }
  .items thead th { font-weight: 800; font-size: 0.95em; line-height: 1.3; padding: 1.2mm 0 1.8mm; border-bottom: 1.5px solid #000; vertical-align: bottom; }
  .items thead .ar { font-weight: 700; }
  .items td { padding: 2mm 0; vertical-align: middle; border-bottom: 1px dashed #999; }
  .items tbody tr:last-child td { border-bottom: 0; }
  .items .name { text-align: start; }
  .pname { font-weight: 800; font-size: 1.12em; word-break: break-word; }
  .sku { font-size: 0.82em; margin-top: 0.4mm; word-break: break-all; }
  .items .w { width: 17mm; text-align: center; }
  .items .q { width: 10mm; text-align: end; font-size: 1.2em; font-weight: 800; }
  .items thead .q { font-size: 0.95em; }
  .weight { display: inline-flex; align-items: center; justify-content: center; height: 5mm; line-height: 1; background: #000; color: #fff; font-weight: 800; font-size: 1.05em; padding: 0 1.6mm; border-radius: 1mm; white-space: nowrap; }
  .sum td { padding: 0.8mm 0; }
  .sum td:last-child { text-align: end; font-weight: 700; }
  .total { display: flex; justify-content: space-between; align-items: center; background: #e6e6e6; border-radius: 1.5mm; padding: 2mm 2.5mm; margin-top: 2mm; }
  .total .t { font-size: 1.35em; font-weight: 800; }
  .total .v { font-size: 1.7em; font-weight: 800; }
  .pay { display: flex; justify-content: center; align-items: center; gap: 2mm; margin-top: 3mm; flex-wrap: wrap; }
  .pay .b { font-weight: 700; }
  .notes { display: flex; gap: 2.5mm; align-items: flex-start; background: #f0f0f0; border-radius: 2mm; padding: 2.5mm; margin-top: 3mm; }
  .notes .ttl { font-size: 0.9em; }
  .notes .txt { font-weight: 800; font-size: 1.15em; white-space: pre-wrap; word-break: break-word; }
  .thanks { margin-top: 4mm; font-size: 1.15em; }
  .thanks .ar { margin-top: 0.5mm; }
  .heart { margin-top: 1.5mm; }
  .store { display: flex; gap: 2mm; align-items: flex-start; font-size: 0.85em; }
  .store .col { display: flex; gap: 1.5mm; align-items: flex-start; flex: 1; }
  .store .col.sep { border-inline-start: 1px solid #000; padding-inline-start: 2mm; flex: none; }
  .store svg { flex: none; margin-top: 0.3mm; }
  .b { font-weight: 700; }
  .web { font-weight: 800; font-size: 1.1em; margin-top: 2.5mm; }
  .ig { display: flex; justify-content: center; align-items: center; gap: 1.5mm; margin-top: 1mm; }
  .phones { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.5mm; margin-top: 2.5mm; font-size: 1.05em; }
  .phones bdi { white-space: nowrap; }
  .phones .dot { margin: 0 0.5mm; }
</style>
</head>
<body>
  <div class="center">
    <div class="brand">SPIRITHUB<sup>®</sup></div>
    <div class="sub">ROASTERY</div>
    <div class="bar">WHOLESALE ORDER</div>
    <div class="bar-ar ar">طلب جملة</div>
  </div>

  <hr class="rule" />
  <table class="info">
    ${infoRow('Date', 'التاريخ', data.createdAt)}
    ${infoRow('Order No.', 'رقم الطلب', data.orderNumber)}
    ${infoRow('Status', 'الحالة', statusAr ? `${data.status} / ${statusAr}` : data.status)}
    ${infoRow('Shipping', 'الشحن', `${shipping.en} / ${shipping.ar}`)}
  </table>

  <hr class="rule" />
  <table class="info">
    ${infoRow('Customer', 'العميل', data.customerName)}
    ${infoRow('Cafe', 'المقهى', data.cafeName)}
    ${infoRow('Phone', 'الهاتف', data.customerPhone)}
    ${infoRow('Email', 'البريد', data.customerEmail)}
    ${infoRow('Address', 'العنوان', address)}
  </table>

  <hr class="rule" />
  <table class="items">
    <thead><tr>
      <th class="name">${stacked('Item', 'الصنف')}</th>
      <th class="w">${stacked('Weight', 'الوزن')}</th>
      <th class="q">${stacked('Qty', 'الكمية')}</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="rule solid" />
  <table class="sum">
    <tr><td>${label('Products', 'عدد الأصناف')}</td><td>${parsed.length}</td></tr>
    ${totalGrams !== null ? `<tr><td>${label('Total weight', 'إجمالي الوزن')}</td><td>${e(formatTotalWeight(totalGrams))}</td></tr>` : ''}
  </table>
  <div class="total"><span class="t">${label('Total Qty', 'إجمالي الكمية')}</span><span class="v">${totalQty}</span></div>

  <div class="pay">${ICONS.card}<span>Payment: <span class="b">${e(data.paymentStatus)}</span></span>${paymentAr ? `<span class="ar">الدفع: <span class="b">${e(paymentAr)}</span></span>` : ''}</div>

  ${
    has(data.notes)
      ? `<div class="notes">${ICONS.note}<div><div class="ttl">${label('Notes', 'ملاحظات')}</div><div class="txt"><bdi>${e(data.notes)}</bdi></div></div></div>`
      : ''
  }

  <div class="center thanks">
    <div>Thank you for choosing <span class="b">SpiritHub</span></div>
    <div class="ar">شكرًا لاختياركم سبيريت هب</div>
    <div class="heart">${ICONS.heart}</div>
  </div>

  ${store ? `<hr class="rule" />${footerCols}` : ''}
  ${store?.phones?.length ? `<div class="phones">${ICONS.phone}${store.phones.map((p) => `<bdi class="b">${e(p)}</bdi>`).join('<span class="dot">|</span>')}</div>` : ''}
  ${store?.website ? `<div class="center web">${e(store.website)}</div>` : ''}
  ${store?.instagram ? `<div class="ig">${ICONS.instagram}<span>@${e(store.instagram)}</span></div>` : ''}
</body>
</html>`;
};
