import React from 'react';
import type { Order } from '../../types/order';

// ─── helpers ──────────────────────────────────────────────────────────────────

const OMAN_TZ = 'Asia/Muscat';

function parseDate(v: string | number | Date): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  const n = Number(v);
  if (!Number.isNaN(n) && String(n) === v) return new Date(n);
  return new Date(v);
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
  if (method === 1) return ar ? 'استلام من المتجر – شارع الموج' : 'Store Pickup – Al Mouj St, Branch';
  if (method === 2) return 'Nool Delivery';
  return 'Aramex Courier';
}

// Format an Omani phone number as +968 XXXX XXXX
function fmtPhone(raw: string | undefined): string {
  if (!raw) return '-';
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('968') ? digits.slice(3) : digits;
  if (local.length === 8) return `+968 ${local.slice(0, 4)} ${local.slice(4)}`;
  if (local.length === 7) return `+968 ${local.slice(0, 3)} ${local.slice(3)}`;
  return raw;
}

// ─── sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-1 py-[3px] text-[13px] leading-snug">
    <span className="text-[#888] font-medium min-w-[110px] shrink-0">{label}:</span>
    <span className="text-[#2c2c2c] font-medium">{value}</span>
  </div>
);

const BadgePickup: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8dcc8] text-[#7a5c3a]">
    {text}
  </span>
);

const BadgePaid: React.FC<{ status: string }> = ({ status }) => {
  const isPaid = status.toLowerCase() === 'paid';
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold ${isPaid ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
      {status}
    </span>
  );
};

const VariantBadge: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ede3d5] text-[#7a5c3a]">
    <span className="text-[#c8a97e] text-[9px]">✓</span>
    {text}
  </span>
);

// ─── main component ───────────────────────────────────────────────────────────

export interface InvoiceDocumentProps {
  order: Order;
  isArabic?: boolean;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ order, isArabic = false }) => {
  const dir = isArabic ? 'rtl' : 'ltr';
  const currency = isArabic ? 'ر.ع.' : 'OMR';
  const subtotal = (order.subTotal ?? order.totalAmount - (order.shippingCost ?? 0));
  const shipping = order.shippingCost ?? 0;
  const total = order.totalAmount;
  const orderDate = fmtDate(order.createdAt);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&bgcolor=f5f1ea&color=4a3728&data=${encodeURIComponent('https://spirithubcafe.com')}`;

  return (
    <div
      dir={dir}
      className="bg-[#fafafa] min-h-screen font-sans text-[#2c2c2c]"
      style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}
    >
      {/* ── A4 wrapper ─────────────────────────────────────────────────── */}
      <div
        className="mx-auto bg-[#fafafa] px-8 py-8"
        style={{ maxWidth: '794px', minHeight: '1123px' /* A4 at 96dpi */ }}
      >

        {/* ══════════════════════════ HEADER ══════════════════════════ */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-[#c8a97e] mb-6">

          {/* Left: Company info */}
          <div className="flex-1 text-[12px] leading-relaxed text-[#555]">
            <p className="text-[13.5px] font-bold text-[#2c2c2c] mb-1">AL JALLAAL RAQIA LLC</p>
            <p>Al Mouj St, Muscat, OM</p>
            <p className="flex items-center gap-1 mt-1">
              <span className="text-[#c8a97e]">✉</span> info@spirithubcafe.com
            </p>
            <p className="flex items-center gap-1">
              <span className="text-[#c8a97e]">☏</span> +968 9190 0005
            </p>
            <p className="flex items-center gap-1">
              <span className="text-[#c8a97e]">☏</span> +968 7272 6999
            </p>
            <p className="flex items-center gap-1">
              <span className="text-[#c8a97e]">☏</span> <strong>+968 7193 6999</strong>
              <span className="text-[10px] text-[#aaa] ml-1">({isArabic ? 'الجملة' : 'Wholesale'})</span>
            </p>
          </div>

          {/* Center: Invoice title */}
          <div className="flex-1 text-center">
            <h1 className="text-[30px] font-bold text-[#2c2c2c] leading-tight">
              {isArabic ? 'فاتورة' : 'Invoice'}
            </h1>
            <p className="text-[18px] font-bold text-[#c8a97e] mt-1">ORDER {order.orderNumber}</p>
            <p className="text-[12px] text-[#777] mt-1">
              {isArabic ? 'تاريخ الطلب' : 'Order Date'}: {orderDate}
            </p>
          </div>

          {/* Right: Logo + CR/VAT */}
          <div className="flex-1 flex flex-col items-end gap-1">
            <img
              src="/images/logo/logo-dark.png"
              alt="SpiritHub Roastery"
              className="h-16 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-[11px] text-[#777] mt-1">CR: <span className="font-semibold text-[#2c2c2c]">1346354</span></p>
            <p className="text-[11px] text-[#777]">VAT: <span className="font-semibold text-[#2c2c2c]">OM110025057X</span></p>
          </div>
        </div>

        {/* ══════════════════════════ INFO CARDS ══════════════════════ */}
        <div className="grid grid-cols-2 gap-4 mb-5">

          {/* Customer Information */}
          <div className="bg-[#f7f6f5] rounded-xl p-5">
            <h3 className="text-[11px] font-bold text-[#2c2c2c] uppercase tracking-widest mb-3">
              {isArabic ? 'معلومات العميل' : 'Customer Information'}
            </h3>
            <InfoRow label={isArabic ? 'الاسم' : 'Full Name'} value={order.fullName} />
            <InfoRow label={isArabic ? 'البريد' : 'Email'} value={order.email} />
            <InfoRow label={isArabic ? 'الهاتف' : 'Phone'} value={fmtPhone(order.phone)} />
            <InfoRow label={isArabic ? 'المدينة' : 'City'} value={order.city} />
            {order.postalCode && (
              <InfoRow label={isArabic ? 'الرمز البريدي' : 'Postal Code'} value={order.postalCode} />
            )}
            <InfoRow label={isArabic ? 'الدولة' : 'Country'} value={order.country} />
            <InfoRow
              label={isArabic ? 'العنوان الكامل' : 'Full Address'}
              value={`${order.address}, ${order.city}${order.postalCode ? ` ${order.postalCode}` : ''}, ${order.country}`}
            />
          </div>

          {/* Order Information */}
          <div className="bg-[#f7f6f5] rounded-xl p-5">
            <h3 className="text-[11px] font-bold text-[#2c2c2c] uppercase tracking-widest mb-3">
              {isArabic ? 'معلومات الطلب' : 'Order Information'}
            </h3>
            <InfoRow
              label={isArabic ? 'حالة الطلب' : 'Order Status'}
              value={order.status}
            />
            <InfoRow
              label={isArabic ? 'الدفع' : 'Payment Status'}
              value={<BadgePaid status={order.paymentStatus} />}
            />
            <InfoRow
              label={isArabic ? 'الشحن' : 'Shipping Method'}
              value={<BadgePickup text={shippingLabel(order.shippingMethod, isArabic)} />}
            />
            {order.trackingNumber && (
              <InfoRow
                label={isArabic ? 'التتبع' : 'Tracking'}
                value={order.trackingNumber}
              />
            )}
          </div>
        </div>

        {/* ══════════════════════════ GIFT ════════════════════════════ */}
        {order.isGift && (
          <div className="mb-5 p-4 rounded-xl border border-[#c8a97e] bg-[#fdf8f0]">
            <p className="text-[13px] font-bold text-[#7a5c3a] mb-2">🎁 {isArabic ? 'معلومات الهدية' : 'Gift Information'}</p>
            {order.giftRecipientName && <InfoRow label={isArabic ? 'المستلم' : 'Recipient'} value={order.giftRecipientName} />}
            {order.giftRecipientPhone && <InfoRow label={isArabic ? 'الهاتف' : 'Phone'} value={order.giftRecipientPhone} />}
            {order.giftMessage && (
              <div className="mt-2 px-3 py-2 bg-white rounded-lg text-[12px] italic text-[#5c4226]">"{order.giftMessage}"</div>
            )}
          </div>
        )}

        {/* ══════════════════════════ TABLE ═══════════════════════════ */}
        <div className="rounded-xl overflow-hidden mb-4 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#ece9e6] text-[#2c2c2c]">
                <th className="px-4 py-3 text-left text-[11.5px] font-bold uppercase tracking-wide">
                  {isArabic ? 'المنتج' : 'Product'}
                </th>
                <th className="px-4 py-3 text-center text-[11.5px] font-bold uppercase tracking-wide w-24">
                  {isArabic ? 'الكمية' : 'Quantity'}
                </th>
                <th className="px-4 py-3 text-right text-[11.5px] font-bold uppercase tracking-wide w-28">
                  {isArabic ? 'السعر' : 'Price'}
                </th>
                <th className="px-4 py-3 text-right text-[11.5px] font-bold uppercase tracking-wide w-28">
                  {isArabic ? 'المجموع' : 'Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className={i % 2 === 0 ? 'bg-[#f7f6f5]' : 'bg-[#edecea]'}
                >
                  <td className="px-4 py-3 border-b border-[#e0d8cc]">
                    <p className="font-semibold text-[13px] text-[#2c2c2c]">{item.productName || 'Product'}</p>
                    {item.variantInfo && <VariantBadge text={item.variantInfo} />}
                  </td>
                  <td className="px-4 py-3 border-b border-[#e0d8cc] text-center text-[13px] text-[#555]">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 border-b border-[#e0d8cc] text-right text-[13px] text-[#555] whitespace-nowrap">
                    {(item.unitPrice ?? 0).toFixed(3)} {currency}
                  </td>
                  <td className="px-4 py-3 border-b border-[#e0d8cc] text-right text-[13px] font-semibold text-[#2c2c2c] whitespace-nowrap">
                    {(item.totalAmount ?? 0).toFixed(3)} {currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ══════════════════════════ SUMMARY ═════════════════════════ */}
        <div className="flex justify-end mb-6">
          <div className="w-64 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 flex justify-between items-center text-[13px] border-b border-[#f0ebe0]">
              <span className="text-[#777]">{isArabic ? 'المجموع الفرعي' : 'Subtotal'}:</span>
              <span className="font-semibold text-[#2c2c2c]">{subtotal.toFixed(3)} {currency}</span>
            </div>
            <div className="px-5 py-3 flex justify-between items-center text-[13px] border-b border-[#f0ebe0]">
              <span className="text-[#777]">{isArabic ? 'الشحن' : 'Shipping'}:</span>
              <span className="font-semibold text-[#2c2c2c]">{shipping.toFixed(3)} {currency}</span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="px-5 py-3 flex justify-between items-center text-[13px] border-b border-[#f0ebe0]">
                <span className="text-[#777]">
                  {isArabic ? 'الخصم' : 'Discount'}{order.couponCode ? ` (${order.couponCode})` : ''}:
                </span>
                <span className="font-semibold text-emerald-600">-{(order.discountAmount!).toFixed(3)} {currency}</span>
              </div>
            )}
            <div className="px-5 py-3 bg-[#c8a97e] flex justify-between items-center">
              <span className="text-[15px] font-bold text-white tracking-wide">
                {isArabic ? 'الإجمالي' : 'TOTAL'}:
              </span>
              <span className="text-[18px] font-bold text-white">{total.toFixed(3)} {currency}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════ NOTES ═══════════════════════════ */}
        {order.notes && (
          <div className="mb-5 px-4 py-3 bg-white rounded-xl border-l-4 border-[#c8a97e]">
            <p className="text-[11px] font-bold text-[#7a5c3a] uppercase tracking-wide mb-1">
              {isArabic ? 'ملاحظات' : 'Notes'}
            </p>
            <p className="text-[12px] text-[#555]">{order.notes}</p>
          </div>
        )}

        {/* ══════════════════════════ FOOTER ══════════════════════════ */}
        <hr className="border-dashed border-[#d4c4b0] my-5" />
        <div className="bg-[#f7f6f5] rounded-xl px-6 py-5 flex items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[14px] font-bold text-[#2c2c2c]">
              {isArabic ? 'شكراً لاختيارك سبيريت هب' : 'Thank you for choosing SpiritHub'}
            </p>
            <p className="text-[12px] text-[#777]">
              {isArabic ? 'محمصة قهوة مختصة مميزة في عمان' : 'Premium Specialty Coffee Roasted in Oman'}
            </p>
            <p className="text-[12px] text-[#c8a97e] font-medium">www.spirithubcafe.com</p>
            <p className="text-[12px] text-[#555] mt-2">
              {isArabic ? 'واتساب لإعادة الطلب' : 'Scan to reorder your favorite coffee'}
            </p>
            <p className="text-[12px] font-semibold text-[#2c2c2c]">WhatsApp: +968 7272 6999</p>
            <p className="text-[10.5px] text-[#aaa] mt-3">
              {isArabic ? 'رمز النظام المنسق' : 'HS Code'}: <span className="font-semibold text-[#888]">0901.21</span> - {isArabic ? 'قهوة محمصة (غير منزوعة الكافيين)' : 'Roasted coffee, not decaffeinated'}
            </p>
          </div>
          <div className="text-center shrink-0">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-24 h-24 rounded-lg border border-[#ddd]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── dummy data for visual preview ───────────────────────────────────────────

export const INVOICE_DUMMY_ORDER: Order = {
  id: 1001,
  orderNumber: 'SH2604101254318',
  fullName: 'Ahmed Alhinai',
  email: 'ahmed95811111@gmail.com',
  phone: '9689190005',
  address: 'Al Mouj St',
  country: 'Oman',
  city: 'Seeb',
  postalCode: '1',
  items: [
    { id: 1, productId: 1, productName: 'Yunnan - Bochang Catimor Anaerobic', variantInfo: 'Weight: TNU-EtiR-200G', quantity: 1, unitPrice: 6.5, taxAmount: 0, totalAmount: 6.5 },
    { id: 2, productId: 2, productName: 'Colombia - Aroma Nativo Aji SpiritHub Exclusive Lot', variantInfo: 'Weight: 10fg - CO-ANAF-100G', quantity: 1, unitPrice: 5.5, taxAmount: 0, totalAmount: 5.5 },
    { id: 3, productId: 3, productName: 'Panama - Pacas Anaerobic Natural', variantInfo: 'Weight: 10fg - PA-PAN-100G', quantity: 1, unitPrice: 4.4, taxAmount: 0, totalAmount: 4.4 },
    { id: 4, productId: 4, productName: 'Colombia - Laura Ilas Margaritas Natural', variantInfo: 'Weight: 105g - CO-LAIMR-100G', quantity: 1, unitPrice: 5.5, taxAmount: 0, totalAmount: 5.5 },
  ],
  itemsCount: 4,
  subTotal: 21.9,
  taxAmount: 0,
  shippingCost: 0,
  totalAmount: 21.9,
  status: 'Processing',
  paymentStatus: 'Paid',
  shippingMethod: 1,
  isGift: false,
  createdAt: '2026-04-10T13:54:00Z',
  updatedAt: '2026-04-10T13:54:00Z',
};
