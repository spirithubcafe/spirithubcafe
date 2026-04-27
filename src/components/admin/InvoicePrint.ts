import type { Order } from '../../types/order';

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OMAN_TZ = 'Asia/Muscat';

function parseDate(v: string | number | Date): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  const n = Number(v);
  if (!Number.isNaN(n) && String(n) === v) return new Date(n);
  // Normalise: treat date-time strings with no explicit timezone as UTC (backend stores UTC without 'Z')
  const normalized = String(v).trim().replace(' ', 'T');
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(normalized);
  const startsWithIsoDate = /^\d{4}-\d{2}-\d{2}/.test(normalized);
  const hasTimePart = /T\d{2}:\d{2}/.test(normalized);
  if (!hasExplicitTimezone && startsWithIsoDate && hasTimePart) {
    return new Date(`${normalized}Z`);
  }
  return new Date(normalized);
}

function fmtDate(v: string | number | Date | undefined): string {
  if (!v) return '-';
  const d = parseDate(v);
  if (Number.isNaN(d.getTime())) return '-';
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: OMAN_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce<Record<string, string>>((a, x) => {
    if (x.type !== 'literal') a[x.type] = x.value;
    return a;
  }, {});
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

function shippingLabel(method: number, ar: boolean): string {
  if (method === 1) return ar ? 'Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ø§Ù„Ù…ØªØ¬Ø±' : 'Store Pickup';
  if (method === 2) return 'Nool Delivery';
  return 'Aramex Courier';
}

// Format an Omani phone number as +968 XXXX XXXX
function fmtPhone(raw: string | undefined): string {
  if (!raw) return '-';
  const digits = raw.replace(/\D/g, '');
  // strip leading country code 968 if present
  const local = digits.startsWith('968') ? digits.slice(3) : digits;
  if (local.length === 8) return `+968 ${local.slice(0, 4)} ${local.slice(4)}`;
  if (local.length === 7) return `+968 ${local.slice(0, 3)} ${local.slice(3)}`;
  return raw; // fallback: return as-is
}

function fmtWeight(v: string | null | undefined): string {
  if (!v) return '';
  const m = v.match(/^(\d+(?:\.\d+)?)\s*g/i);
  if (!m) return v;
  const num = parseFloat(m[1]);
  return `${Number.isInteger(num) ? num : num}g`;
}

function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// â”€â”€â”€ main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function generatePremiumInvoiceHTML(order: Order, isArabic = false): string {
  const dir = isArabic ? 'rtl' : 'ltr';
  const al = isArabic ? 'right' : 'left';
  const ar = isArabic ? 'left' : 'right';
  const currency = isArabic ? 'Ø±.Ø¹.' : 'OMR';
  const subtotal = (order.subTotal ?? order.totalAmount - (order.shippingCost ?? 0));
  const shipping = order.shippingCost ?? 0;
  const total = order.totalAmount;
  const orderDate = fmtDate(order.createdAt);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&bgcolor=f5f1ea&color=4a3728&data=${encodeURIComponent('https://spirithubcafe.com')}`;

  /* â”€â”€ item rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const itemRows = (order.items ?? []).map((item, i) => {
    const bg = i % 2 === 0 ? '#f7f6f5' : '#edecea';
    const weightLabel = fmtWeight(item.variantInfo);
    const variant = weightLabel
      ? `<span style="display:inline-block;margin-top:4px;color:#8a5b2c;font-size:10.5px;font-weight:700;letter-spacing:0.2px;white-space:nowrap;vertical-align:middle;">${esc(weightLabel)}</span>`
      : '';
    const qtyLabel  = isArabic ? 'Ø§Ù„ÙƒÙ…ÙŠØ©' : 'Qty';
    const priceLabel = isArabic ? 'Ø§Ù„Ø³Ø¹Ø±' : 'Price';
    const totalLabel = isArabic ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹' : 'Total';
    return `
      <tr class="product-row" style="background:${bg};">
        <td class="col-product" style="padding:10px 16px;border-bottom:1px solid #e0d8cc;text-align:${al};">
          <div style="font-weight:600;font-size:13px;color:#2c2c2c;">${esc(item.productName || 'Product')}</div>
          ${variant}
        </td>
        <td class="col-qty" data-label="${qtyLabel}" style="padding:10px 16px;border-bottom:1px solid #e0d8cc;text-align:center;font-size:13px;color:#555;">${item.quantity}</td>
        <td class="col-price" data-label="${priceLabel}" style="padding:10px 16px;border-bottom:1px solid #e0d8cc;text-align:${ar};font-size:13px;color:#555;white-space:nowrap;">${(item.unitPrice ?? 0).toFixed(3)} ${currency}</td>
        <td class="col-total" data-label="${totalLabel}" style="padding:10px 16px;border-bottom:1px solid #e0d8cc;text-align:${ar};font-size:13px;font-weight:600;color:#2c2c2c;white-space:nowrap;">${(item.totalAmount ?? 0).toFixed(3)} ${currency}</td>
      </tr>`;
  }).join('');

  /* â”€â”€ gift section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const giftSection = order.isGift ? `
    <div style="margin-bottom:20px;padding:16px 20px;border:1.5px solid #c8a97e;border-radius:12px;background:#fdf8f0;">
      <p style="font-size:13px;font-weight:700;color:#7a5c3a;margin:0 0 8px;">ðŸŽ ${isArabic ? 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù‡Ø¯ÙŠØ©' : 'Gift Information'}</p>
      ${order.giftRecipientName ? `<div style="display:flex;gap:6px;font-size:12px;padding:3px 0;"><span style="color:#888;min-width:100px;">${isArabic ? 'Ø§Ù„Ù…Ø³ØªÙ„Ù…' : 'Recipient'}:</span><span style="color:#2c2c2c;font-weight:500;">${esc(order.giftRecipientName)}</span></div>` : ''}
      ${order.giftRecipientPhone ? `<div style="display:flex;gap:6px;font-size:12px;padding:3px 0;"><span style="color:#888;min-width:100px;">${isArabic ? 'Ø§Ù„Ù‡Ø§ØªÙ' : 'Phone'}:</span><span style="color:#2c2c2c;font-weight:500;">${esc(order.giftRecipientPhone)}</span></div>` : ''}
      ${order.giftRecipientEmail ? `<div style="display:flex;gap:6px;font-size:12px;padding:3px 0;"><span style="color:#888;min-width:100px;">${isArabic ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯' : 'Email'}:</span><span style="color:#2c2c2c;font-weight:500;">${esc(order.giftRecipientEmail)}</span></div>` : ''}
      ${(order.giftRecipientAddress || order.giftRecipientCity || order.giftRecipientCountry) ? `<div style="display:flex;gap:6px;font-size:12px;padding:3px 0;"><span style="color:#888;min-width:100px;">${isArabic ? 'Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery Address'}:</span><span style="color:#2c2c2c;font-weight:500;">${[order.giftRecipientAddress, order.giftRecipientCity, order.giftRecipientPostalCode, order.giftRecipientCountry].filter(Boolean).map(esc).join(', ')}</span></div>` : ''}
      ${order.giftMessage ? `<div style="margin-top:8px;padding:8px 12px;background:white;border-radius:8px;font-style:italic;font-size:12px;color:#5c4226;">"${esc(order.giftMessage)}"</div>` : ''}
    </div>` : '';

  /* â”€â”€ discount row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const discountRow = (order.discountAmount ?? 0) > 0 ? `
    <div style="padding:10px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;border-bottom:1px solid #f0ebe0;">
      <span style="color:#777;">${isArabic ? 'Ø§Ù„Ø®ØµÙ…' : 'Discount'}${order.couponCode ? ` (${esc(order.couponCode)})` : ''}:</span>
      <span style="font-weight:600;color:#059669;">-${(order.discountAmount!).toFixed(3)} ${currency}</span>
    </div>` : '';

  /* â”€â”€ notes section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  // Skip notes when it's a gift order â€” the gift message is already shown in giftSection
  const notesSection = order.notes && !order.isGift ? `
    <div style="margin-bottom:20px;padding:12px 16px;background:white;border-radius:12px;border-left:4px solid #c8a97e;">
      <p style="font-size:11px;font-weight:700;color:#7a5c3a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">${isArabic ? 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª' : 'Notes'}</p>
      <p style="font-size:12px;color:#555;margin:0;">${esc(order.notes)}</p>
    </div>` : '';

  /* â”€â”€ infoRow helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const r = (label: string, value: string) =>
    `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:13px;line-height:1.4;">
       <span style="color:#888;font-weight:500;min-width:110px;flex-shrink:0;">${label}:</span>
       <span style="color:#2c2c2c;font-weight:500;">${value}</span>
     </div>`;

  /* â”€â”€ payment badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const paymentStatus = (order.paymentStatus || '').toLowerCase();
  const paymentStatusColor =
    paymentStatus === 'paid'
      ? '#0f766e'
      : paymentStatus === 'pending' || paymentStatus === 'unpaid'
        ? '#b45309'
        : paymentStatus === 'failed' || paymentStatus === 'cancelled'
          ? '#b91c1c'
          : '#2c2c2c';
  const paymentBadge = `<span style="display:inline-block;font-size:13px;font-weight:700;color:${paymentStatusColor};white-space:nowrap;vertical-align:middle;">${esc(order.paymentStatus)}</span>`;
  const shippingMethodColor =
    order.shippingMethod === 1
      ? '#2563eb' // Store Pickup
      : order.shippingMethod === 2
        ? '#8a5b2c' // Nool Delivery
        : '#7c3aed'; // Aramex Courier
  const shippingBadge = `<span style="display:inline-block;font-size:13px;font-weight:700;color:${shippingMethodColor};white-space:nowrap;vertical-align:middle;">${shippingLabel(order.shippingMethod, isArabic)}</span>`;

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${isArabic ? 'ar' : 'en'}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(order.orderNumber)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @page { size: A4 portrait; margin: 10mm 12mm; }
    @media print {
      body { margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-footer { page-break-before: avoid; page-break-inside: avoid; }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #fafafa;
      color: #2c2c2c;
      max-width: 794px;
      margin: 0 auto;
      padding: 20px 26px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid #c8a97e;
      margin-bottom: 18px;
    }
    .invoice-header-company { flex: 1; font-size: 12px; color: #555; line-height: 1.7; }
    .invoice-header-title   { flex: 1; text-align: center; }
    .invoice-header-logo    { flex: 1; text-align: ${ar}; }
    .info-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .info-card { background: #f7f6f5; border-radius: 12px; padding: 18px 20px; }
    .table-wrapper { border-radius: 12px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .summary-row { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .summary-box { min-width: 260px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .invoice-footer-bar { background: #f7f6f5; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 24px; page-break-inside: avoid; }
    @media screen and (max-width: 820px) {
      body {
        max-width: 100%;
        padding: 14px 12px;
        font-size: 12px;
      }
      .invoice-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 14px;
        border: 1px solid #e9e2d8;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 8px 18px rgba(44, 44, 44, 0.05);
        margin-bottom: 14px;
      }
      .invoice-header-company,
      .invoice-header-title,
      .invoice-header-logo {
        flex: 0 0 auto;
      }
      .invoice-header-title {
        order: 1;
        text-align: center !important;
      }
      .invoice-header-logo {
        order: 2;
        text-align: center !important;
      }
      .invoice-header-company {
        order: 3;
        text-align: ${al} !important;
        font-size: 12px;
      }
      .invoice-header-logo img {
        height: 48px !important;
      }
      .info-cards {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 14px;
      }
      .info-card {
        padding: 14px;
        border-radius: 14px;
      }
      .table-wrapper {
        overflow: visible;
        box-shadow: none;
        margin-bottom: 14px;
      }
      .product-table thead {
        display: none;
      }
      .product-table,
      .product-table tbody,
      .product-table tr,
      .product-table td {
        display: block;
        width: 100%;
      }
      .product-table tr {
        border: 1px solid #e6ddd1;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 10px;
        background: #f9f7f4 !important;
      }
      .product-table td {
        padding: 10px 12px !important;
        text-align: ${al} !important;
        border-bottom: 1px solid #e7dfd4 !important;
      }
      .product-table td:last-child {
        border-bottom: 0 !important;
      }
      .product-table td.col-product {
        padding-top: 12px !important;
        padding-bottom: 8px !important;
      }
      .product-table td.col-qty::before,
      .product-table td.col-price::before,
      .product-table td.col-total::before {
        content: attr(data-label) ": ";
        color: #8a7f73;
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.35px;
      }
      .summary-row {
        display: block;
      }
      .summary-box {
        width: 100%;
        min-width: 0;
        border-radius: 14px;
      }
      .invoice-footer-bar {
        flex-direction: column;
        align-items: ${isArabic ? 'flex-end' : 'flex-start'};
        gap: 12px;
        padding: 14px;
      }
    }
  </style>
</head>
<body>

  <!-- â•â•â•â•â•â•â•â•â•â• HEADER â•â•â•â•â•â•â•â•â•â• -->
  <div class="invoice-header">

    <!-- Left: company -->
    <div class="invoice-header-company">
      <p style="font-size:13.5px;font-weight:700;color:#2c2c2c;margin-bottom:3px;">AL JALSA RAQIA LLC</p>
      <p>Al Mouj St, Muscat, OM</p>
      <p><span style="color:#c8a97e;">&#9993;</span> info@spirithubcafe.com</p>
      <p><span style="color:#c8a97e;">&#9743;</span> +968 9190 0005</p>
      <p><span style="color:#c8a97e;">&#9743;</span> +968 7272 6999</p>
      <p><span style="color:#c8a97e;">&#9743;</span> <strong>+968 7193 6999</strong> <span style="font-size:10px;color:#aaa;">(${isArabic ? 'Ø§Ù„Ø¬Ù…Ù„Ø©' : 'Wholesale'})</span></p>
    </div>

    <!-- Center: title -->
    <div class="invoice-header-title">
      <h1 style="font-size:30px;font-weight:700;color:#2c2c2c;line-height:1.1;">${isArabic ? 'ÙØ§ØªÙˆØ±Ø©' : 'INVOICE'}</h1>
      <p style="font-size:18px;font-weight:700;color:#c8a97e;margin:6px 0 4px;">ORDER ${esc(order.orderNumber)}</p>
      <p style="font-size:12px;color:#777;">${isArabic ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø·Ù„Ø¨' : 'Order Date'}: ${orderDate}</p>
    </div>

    <!-- Right: logo + CR/VAT -->
    <div class="invoice-header-logo">
      <img src="/images/logo/logo-dark.png" alt="SpiritHub Roastery" style="height:64px;width:auto;object-fit:contain;" onerror="this.style.display='none'"/>
      <p style="font-size:11px;color:#777;margin-top:6px;">CR: <strong style="color:#2c2c2c;">1346354</strong></p>
      <p style="font-size:11px;color:#777;">VAT: <strong style="color:#2c2c2c;">OM110025057X</strong></p>
    </div>
  </div>

  <!-- â•â•â•â•â•â•â•â•â•â• INFO CARDS â•â•â•â•â•â•â•â•â•â• -->
  <div class="info-cards">

    <!-- Customer -->
    <div class="info-card">
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#2c2c2c;margin-bottom:12px;">${isArabic ? 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„' : 'Customer Information'}</h3>
      ${r(isArabic ? 'Ø§Ù„Ø§Ø³Ù…' : 'Full Name', esc(order.fullName))}
      ${r(isArabic ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯' : 'Email', esc(order.email))}
      ${r(isArabic ? 'Ø§Ù„Ù‡Ø§ØªÙ' : 'Phone', fmtPhone(order.phone))}
      ${r(isArabic ? 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©' : 'City', esc(order.city))}
      ${order.postalCode ? r(isArabic ? 'Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠ' : 'Postal Code', esc(order.postalCode)) : ''}
      ${r(isArabic ? 'Ø§Ù„Ø¯ÙˆÙ„Ø©' : 'Country', esc(order.country))}
      ${r(isArabic ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒØ§Ù…Ù„' : 'Full Address', `${esc(order.address)}, ${esc(order.city)}${order.postalCode ? ` ${esc(order.postalCode)}` : ''}, ${esc(order.country)}`)}
    </div>

    <!-- Order -->
    <div class="info-card">
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#2c2c2c;margin-bottom:12px;">${isArabic ? 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø·Ù„Ø¨' : 'Order Information'}</h3>
      ${r(isArabic ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨' : 'Order Status', esc(order.status))}
      <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:13px;line-height:1.4;">
        <span style="color:#888;font-weight:500;min-width:110px;flex-shrink:0;">${isArabic ? 'Ø§Ù„Ø¯ÙØ¹' : 'Payment Status'}:</span>
        <span style="line-height:0;">${paymentBadge}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:13px;line-height:1.4;">
        <span style="color:#888;font-weight:500;min-width:110px;flex-shrink:0;">${isArabic ? 'Ø§Ù„Ø´Ø­Ù†' : 'Shipping Method'}:</span>
        <span style="line-height:0;">${shippingBadge}</span>
      </div>
      ${order.trackingNumber ? r(isArabic ? 'Ø§Ù„ØªØªØ¨Ø¹' : 'Tracking', esc(order.trackingNumber)) : ''}
    </div>
  </div>

  <!-- â•â•â•â•â•â•â•â•â•â• GIFT â•â•â•â•â•â•â•â•â•â• -->
  ${giftSection}

  <!-- â•â•â•â•â•â•â•â•â•â• TABLE â•â•â•â•â•â•â•â•â•â• -->
  <div class="table-wrapper">
    <table class="product-table" style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#ece9e6;">
          <th style="padding:11px 16px;text-align:${al};font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#2c2c2c;">${isArabic ? 'Ø§Ù„Ù…Ù†ØªØ¬' : 'Product'}</th>
          <th style="padding:11px 16px;text-align:center;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#2c2c2c;width:70px;">${isArabic ? 'Ø§Ù„ÙƒÙ…ÙŠØ©' : 'Qty'}</th>
          <th style="padding:11px 16px;text-align:${ar};font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#2c2c2c;width:100px;">${isArabic ? 'Ø§Ù„Ø³Ø¹Ø±' : 'Price'}</th>
          <th style="padding:11px 16px;text-align:${ar};font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#2c2c2c;width:100px;">${isArabic ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- â•â•â•â•â•â•â•â•â•â• SUMMARY â•â•â•â•â•â•â•â•â•â• -->
  <div class="summary-row">
    <div class="summary-box">
      <div style="padding:10px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;border-bottom:1px solid #f0ebe0;">
        <span style="color:#777;">${isArabic ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ' : 'Subtotal'}:</span>
        <span style="font-weight:600;color:#2c2c2c;">${subtotal.toFixed(3)} ${currency}</span>
      </div>
      <div style="padding:10px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;border-bottom:1px solid #f0ebe0;">
        <span style="color:#777;">${isArabic ? 'Ø§Ù„Ø´Ø­Ù†' : 'Shipping'}:</span>
        <span style="font-weight:600;color:#2c2c2c;">${shipping.toFixed(3)} ${currency}</span>
      </div>
      ${discountRow}
      <div style="padding:12px 20px;background:#c8a97e;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px;">${isArabic ? 'Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ' : 'TOTAL'}:</span>
        <span style="font-size:18px;font-weight:700;color:#fff;">${total.toFixed(3)} ${currency}</span>
      </div>
    </div>
  </div>

  <!-- â•â•â•â•â•â•â•â•â•â• NOTES â•â•â•â•â•â•â•â•â•â• -->
  ${notesSection}

  <!-- â•â•â•â•â•â•â•â•â•â• FOOTER â•â•â•â•â•â•â•â•â•â• -->
  <hr style="border:none;border-top:1px dashed #d4c4b0;margin:12px 0 14px;"/>
  <div class="invoice-footer invoice-footer-bar">
    <div>
      <p style="font-size:14px;font-weight:700;color:#2c2c2c;margin-bottom:6px;">${isArabic ? 'Ø´ÙƒØ±Ø§Ù‹ Ù„Ø§Ø®ØªÙŠØ§Ø±Ùƒ Ø³Ø¨ÙŠØ±ÙŠØª Ù‡Ø¨' : 'Thank you for choosing SpiritHub'}</p>
      <p style="font-size:12px;color:#777;margin-bottom:2px;">${isArabic ? 'Ù…Ø­Ù…ØµØ© Ù‚Ù‡ÙˆØ© Ù…Ø®ØªØµØ© Ù…Ù…ÙŠØ²Ø© ÙÙŠ Ø¹Ù…Ø§Ù†' : 'Premium Specialty Coffee Roasted in Oman'}</p>
      <p style="font-size:12px;color:#c8a97e;font-weight:500;margin-bottom:8px;">www.spirithubcafe.com</p>
      <p style="font-size:12px;color:#555;margin-bottom:2px;">${isArabic ? 'ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨' : 'Scan to reorder your favorite coffee'}</p>
      <p style="font-size:12px;font-weight:600;color:#2c2c2c;">WhatsApp: +968 7272 6999</p>
      <p style="font-size:10.5px;color:#aaa;margin-top:10px;">${isArabic ? 'Ø±Ù…Ø² Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ù†Ø³Ù‚' : 'HS Code'}: <span style="font-weight:600;color:#888;">0901.21</span> - ${isArabic ? 'Ù‚Ù‡ÙˆØ© Ù…Ø­Ù…ØµØ© (ØºÙŠØ± Ù…Ù†Ø²ÙˆØ¹Ø© Ø§Ù„ÙƒØ§ÙÙŠÙŠÙ†)' : 'Roasted coffee, not decaffeinated'}</p>
    </div>
    <div style="text-align:center;flex-shrink:0;">
      <img src="${qrUrl}" alt="QR Code" style="width:96px;height:96px;border-radius:8px;border:1px solid #ddd;" onerror="this.style.display='none'"/>
    </div>
  </div>

</body>
</html>`;
}

