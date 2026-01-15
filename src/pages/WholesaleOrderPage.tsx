import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, Loader2, CheckCircle2, Package, Mail, AlertTriangle, MessageCircle } from 'lucide-react';

import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Switch } from '../components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

import { productService, productVariantService, wholesaleCustomerLookupService, wholesaleOrderService } from '../services';
import type { Product, ProductVariant } from '../types/product';
import type { WholesaleOrder, WholesaleShippingMethod } from '../types/wholesale';

const shippingMethodSchema = z.union([z.literal(1), z.literal(2)]);

const wholesaleSchema = z
  .object({
    customerName: z.string().min(1),
    cafeName: z.string().min(1),
    customerPhone: z.string().min(7),
    customerEmail: z.string().email(),
    shippingMethod: shippingMethodSchema,
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          productVariantId: z.number().int().positive(),
          quantity: z.number().int().min(1),
        })
      )
      .min(1),
  })
  .superRefine((val, ctx) => {
    if (val.shippingMethod !== 2) return;
    if (!val.address || !val.address.trim()) {
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Address is required for Nool Delivery' });
    }
    if (!val.city || !val.city.trim()) {
      ctx.addIssue({ code: 'custom', path: ['city'], message: 'City is required for Nool Delivery' });
    }
  });

type WholesaleFormValues = z.infer<typeof wholesaleSchema>;

const defaultValues: WholesaleFormValues = {
  customerName: '',
  cafeName: '',
  customerPhone: '',
  customerEmail: '',
  shippingMethod: 1,
  address: '',
  city: '',
  notes: '',
  items: [{ productId: 0, productVariantId: 0, quantity: 1 }],
};

const formatVariantLabel = (variant: ProductVariant) => {
  const unit = (variant.weightUnit || '').trim();
  const weight = Number.isFinite(variant.weight) ? variant.weight : 0;
  const sku = variant.variantSku ? ` • ${variant.variantSku}` : '';
  return `${weight}${unit ? unit : ''}${sku}`;
};

const sanitizeWhatsappPhone = (raw: string): string => {
  // WhatsApp expects country code + number, digits only.
  // Example: +968 9xxxxxxx -> 9689xxxxxxx
  return (raw || '').replace(/[^0-9]/g, '');
};

export const WholesaleOrderPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { currentRegion } = useRegion();
  const [allowedCategoryIds, setAllowedCategoryIds] = useState<number[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoadError, setProductLoadError] = useState<string | null>(null);

  const [variantCache, setVariantCache] = useState<Record<number, ProductVariant[]>>({});
  const [variantLoading, setVariantLoading] = useState<Record<number, boolean>>({});

  const [submitLoading, setSubmitLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<WholesaleOrder | null>(null);
  const [confirmationEmailState, setConfirmationEmailState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const [returningCustomerEnabled, setReturningCustomerEnabled] = useState(false);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [lookupSummary, setLookupSummary] = useState<string | null>(null);
  const lookupSeqRef = useRef(0);
  const lastLookupKeyRef = useRef<string>('');

  const form = useForm<WholesaleFormValues>({
    resolver: zodResolver(wholesaleSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { control, handleSubmit, watch, setValue, getValues, formState } = form;
  const items = watch('items');
  const shippingMethod = watch('shippingMethod');
  const customerEmail = watch('customerEmail');
  const customerPhone = watch('customerPhone');

  const shippingLabel = shippingMethod === 2
    ? (isArabic ? 'نول للتوصيل' : 'Nool Delivery')
    : (isArabic ? 'استلام' : 'Pickup');

  const selectedItemsCount = (items || []).filter(
    (it) => Number(it?.productId) > 0 && Number(it?.productVariantId) > 0 && Number(it?.quantity) > 0
  ).length;

  const totalQuantityKg = (() => {
    let totalKg = 0;
    for (const it of items || []) {
      const productId = Number(it?.productId || 0);
      const variantId = Number(it?.productVariantId || 0);
      const quantity = Number(it?.quantity || 0);
      if (!productId || !variantId || !quantity) continue;

      const variants = variantCache[productId] || [];
      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return null; // Variant not loaded yet.

      const weight = Number(variant.weight);
      const unit = (variant.weightUnit || '').trim().toLowerCase();
      if (!Number.isFinite(weight) || weight <= 0) continue;

      let perUnitKg: number | null = null;
      if (unit === 'kg' || unit === 'kgs' || unit === 'kilogram' || unit === 'kilograms') perUnitKg = weight;
      else if (unit === 'g' || unit === 'gm' || unit === 'gr' || unit === 'gram' || unit === 'grams') perUnitKg = weight / 1000;
      else if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') perUnitKg = weight * 0.45359237;
      else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') perUnitKg = weight * 0.028349523125;
      else return null;

      totalKg += perUnitKg * quantity;
    }
    return totalKg;
  })();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const loadAllowedAndProducts = async () => {
    setProductsLoading(true);
    setProductLoadError(null);

    try {
      const ids = await wholesaleOrderService.getAllowedCategories();
      setAllowedCategoryIds(ids);

      if (!ids || ids.length === 0) {
        setProducts([]);
        return;
      }

      // Pull products for each allowed category (parallel), then merge unique by ID.
      const responses = await Promise.all(
        ids.map((categoryId) =>
          productService.getByCategory(categoryId, { page: 1, pageSize: 200 }).catch(() => ({
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize: 200,
          }))
        )
      );

      const merged = new Map<number, Product>();
      for (const res of responses) {
        for (const product of res.items || []) {
          if (product && typeof product.id === 'number') {
            merged.set(product.id, product);
          }
        }
      }

      const list = Array.from(merged.values())
        .filter((p) => p.isActive)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      setProducts(list);
    } catch (err: any) {
      console.error('Failed to load wholesale products:', err);
      setProductLoadError(err?.message || (isArabic ? 'حدث خطأ أثناء تحميل المنتجات' : 'Failed to load products'));
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    void loadAllowedAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegion.code]);

  const ensureVariants = async (productId: number) => {
    if (!productId || productId <= 0) return;
    if (variantCache[productId]) return;

    setVariantLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const variants = await productVariantService.getByProduct(productId);
      setVariantCache((prev) => ({
        ...prev,
        [productId]: (variants || []).filter((v) => v.isActive).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
      }));
    } catch (err) {
      console.error('Failed to load variants:', err);
      setVariantCache((prev) => ({ ...prev, [productId]: [] }));
    } finally {
      setVariantLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const onSubmit = async (values: WholesaleFormValues) => {
    setSubmitLoading(true);
    setConfirmationEmailState('idle');
    try {
      const order = await wholesaleOrderService.create({
        customerName: values.customerName,
        cafeName: values.cafeName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        shippingMethod: values.shippingMethod as WholesaleShippingMethod,
        address: values.shippingMethod === 2 && values.address?.trim() ? values.address.trim() : undefined,
        city: values.shippingMethod === 2 && values.city?.trim() ? values.city.trim() : undefined,
        notes: values.notes?.trim() ? values.notes : undefined,
        items: values.items,
      });

      setCreatedOrder(order);
      toast.success(isArabic ? 'تم إنشاء طلب الجملة بنجاح' : 'Wholesale order created');

      // Best-effort: trigger a customer confirmation email.
      setConfirmationEmailState('sending');
      void (async () => {
        const ok = await wholesaleOrderService.sendCustomerConfirmationEmail(order.id);
        setConfirmationEmailState(ok ? 'sent' : 'failed');
        if (ok) {
          toast.success(isArabic ? 'تم إرسال تأكيد الطلب إلى بريدك الإلكتروني' : 'Order confirmation email sent');
        } else {
          toast.message(
            isArabic
              ? 'تم إرسال الطلب. إذا لم يصلك بريد تأكيد، تواصل معنا عبر واتساب.'
              : 'Order submitted. If you don’t receive a confirmation email, please contact us on WhatsApp.'
          );
        }
      })();
    } catch (err: any) {
      console.error('Wholesale submit failed:', err);
      toast.error(err?.message || (isArabic ? 'فشل إنشاء الطلب' : 'Failed to create wholesale order'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetFlow = () => {
    setCreatedOrder(null);
    setConfirmationEmailState('idle');
    setReturningCustomerEnabled(false);
    setLookupState('idle');
    setLookupSummary(null);
    lastLookupKeyRef.current = '';
    form.reset(defaultValues);
  };

  const buildShareText = (order: WholesaleOrder): string => {
    const orderUrl = `${siteMetadata.baseUrl}/${currentRegion.code}/wholesale`;

    const shippingText = order.shippingMethod === 1
      ? (isArabic ? 'استلام (Pickup)' : 'Pickup')
      : (isArabic ? 'نول للتوصيل (Nool Delivery)' : 'Nool Delivery');

    const lines: string[] = [];
    lines.push(isArabic ? `طلب جملة رقم: ${order.wholesaleOrderNumber}` : `Wholesale order #: ${order.wholesaleOrderNumber}`);
    lines.push(isArabic ? `العميل: ${order.customerName} - ${order.cafeName}` : `Customer: ${order.customerName} - ${order.cafeName}`);
    lines.push(isArabic ? `طريقة الشحن: ${shippingText}` : `Shipping: ${shippingText}`);
    lines.push(isArabic ? 'المنتجات:' : 'Items:');

    for (const it of order.items || []) {
      const variant = it.variantInfo ? ` (${it.variantInfo})` : '';
      lines.push(`${isArabic ? '•' : '-'} ${it.productName}${variant} x ${it.quantity}`);
    }

    lines.push('');
    lines.push(orderUrl);
    return lines.join('\n');
  };

  const shareOnWhatsapp = (order: WholesaleOrder) => {
    const message = buildShareText(order);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareByEmail = (order: WholesaleOrder) => {
    const subject = isArabic
      ? `طلب جملة رقم ${order.wholesaleOrderNumber}`
      : `Wholesale order #${order.wholesaleOrderNumber}`;
    const body = buildShareText(order);
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const isPlausibleEmail = (email: string): boolean => {
    const v = email.trim();
    if (!v) return false;
    if (!v.includes('@')) return false;
    // Avoid triggering on obvious partials.
    if (v.endsWith('@') || v.startsWith('@')) return false;
    if (v.length < 6) return false;
    return true;
  };

  const isPlausiblePhone = (phone: string): boolean => {
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length >= 7;
  };

  const runCustomerLookup = async (trigger: 'debounce' | 'blur') => {
    if (!returningCustomerEnabled) return;

    const email = (getValues('customerEmail') || '').trim();
    const phone = (getValues('customerPhone') || '').trim();

    const canUseEmail = isPlausibleEmail(email);
    const canUsePhone = !canUseEmail && isPlausiblePhone(phone);

    if (!canUseEmail && !canUsePhone) {
      setLookupState('idle');
      setLookupSummary(null);
      lastLookupKeyRef.current = '';
      return;
    }

    const lookupKey = canUseEmail ? `email:${email.toLowerCase()}` : `phone:${phone}`;
    if (trigger === 'debounce' && lookupKey === lastLookupKeyRef.current) return;
    lastLookupKeyRef.current = lookupKey;

    const seq = ++lookupSeqRef.current;
    setLookupState('loading');
    setLookupSummary(null);

    try {
      const found = await wholesaleCustomerLookupService.lookup({
        email: canUseEmail ? email : undefined,
        phone: canUsePhone ? phone : undefined,
      });

      if (seq !== lookupSeqRef.current) return; // Stale response.

      if (!found) {
        setLookupState('not-found');
        setLookupSummary(null);
        return;
      }

      const dirty = formState.dirtyFields as Partial<Record<keyof WholesaleFormValues, boolean>>;
      const setIfSafe = (name: keyof WholesaleFormValues, value?: string) => {
        const next = (value || '').trim();
        if (!next) return;
        if ((dirty as any)?.[name]) return;
        setValue(name, next as any, { shouldValidate: true, shouldDirty: false, shouldTouch: false });
      };

      setIfSafe('customerName', found.customerName);
      setIfSafe('cafeName', found.cafeName);
      setIfSafe('customerPhone', found.customerPhone);
      setIfSafe('customerEmail', found.customerEmail);

      // Only fill address/city if Nool Delivery is selected (keeps UX predictable).
      if (getValues('shippingMethod') === 2) {
        setIfSafe('address', found.address);
        setIfSafe('city', found.city);
      }

      const summaryParts: string[] = [];
      if (found.customerName) summaryParts.push(found.customerName);
      if (found.cafeName) summaryParts.push(found.cafeName);
      setLookupSummary(summaryParts.length ? summaryParts.join(' • ') : null);
      setLookupState('found');
    } catch (err) {
      if (seq !== lookupSeqRef.current) return;
      console.error('Customer lookup failed:', err);
      setLookupState('error');
      setLookupSummary(null);
    }
  };

  useEffect(() => {
    if (!returningCustomerEnabled) {
      setLookupState('idle');
      setLookupSummary(null);
      lastLookupKeyRef.current = '';
      return;
    }

    const email = (customerEmail || '').trim();
    const phone = (customerPhone || '').trim();
    if (!email && !phone) {
      setLookupState('idle');
      setLookupSummary(null);
      lastLookupKeyRef.current = '';
      return;
    }

    const handle = window.setTimeout(() => {
      void runCustomerLookup('debounce');
    }, 600);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returningCustomerEnabled, customerEmail, customerPhone]);

  const title = isArabic ? 'حلول الجملة' : 'Wholesale Order';
  const seoDescription = isArabic
    ? 'حلول الجملة أصبحت أسهل، أرسل طلبك في أي وقت. واتساب: +968 72726999 / +968 91900005 · البريد الإلكتروني: info@spirithubcafe.com'
    : 'Wholesale made simple, place your order anytime. WhatsApp: +968 72726999 / +968 91900005 · Email: info@spirithubcafe.com';

  return (
    <div className="min-h-screen bg-gray-50 page-padding-top" dir={isArabic ? 'rtl' : 'ltr'}>
      <Seo
        title={title}
        description={seoDescription}
        canonical={`${siteMetadata.baseUrl}/${currentRegion.code}/wholesale`}
      />

      <div className="container mx-auto py-10 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <div className="mt-2 text-sm sm:text-base text-gray-600">
            <div>
              {isArabic
                ? 'حلول الجملة أصبحت أسهل، أرسل طلبك في أي وقت.'
                : 'Wholesale made simple, place your order anytime.'}
            </div>
            <ul className={`mt-2 list-disc space-y-1 ${isArabic ? 'pr-5' : 'pl-5'}`}>
              <li>
                {isArabic ? 'واتساب:' : 'WhatsApp:'}{' '}
                <span dir="ltr" className="whitespace-nowrap">
                  <a
                    className="text-emerald-700 hover:underline"
                    href={`https://wa.me/${sanitizeWhatsappPhone('+968 72726999')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +968 72726999
                  </a>
                  {' / '}
                  <a
                    className="text-emerald-700 hover:underline"
                    href={`https://wa.me/${sanitizeWhatsappPhone('+968 91900005')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +968 91900005
                  </a>
                </span>
              </li>
              <li>
                {isArabic ? 'البريد الإلكتروني:' : 'Email:'}{' '}
                <span dir="ltr">info@spirithubcafe.com</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {createdOrder ? (
          <Card className="border-emerald-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                {isArabic ? 'تم إرسال الطلب' : 'Order submitted'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isArabic
                  ? 'سيقوم المدير بتسجيل السعر النهائي وتحديث حالة الدفع لاحقاً.'
                  : 'Admin will set manual price and update payment status later.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="text-sm text-emerald-900">
                  <span className="font-semibold">{isArabic ? 'رقم الطلب:' : 'Order number:'}</span>{' '}
                  <span className="font-mono">{createdOrder.wholesaleOrderNumber}</span>
                </div>

                <div className="mt-2 text-sm">
                  {confirmationEmailState === 'sending' ? (
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isArabic ? 'جاري إرسال بريد التأكيد...' : 'Sending confirmation email...'}</span>
                    </div>
                  ) : null}

                  {confirmationEmailState === 'sent' ? (
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Mail className="h-4 w-4" />
                      <span>{isArabic ? 'تم إرسال بريد تأكيد الطلب.' : 'Confirmation email sent.'}</span>
                    </div>
                  ) : null}

                  {confirmationEmailState === 'failed' ? (
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {isArabic
                          ? 'لم نتمكن من إرسال بريد التأكيد. تواصل معنا عبر واتساب إذا لم يصلك شيء.'
                          : 'Couldn’t send confirmation email. Contact us on WhatsApp if you don’t receive it.'}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                    onClick={() => shareOnWhatsapp(createdOrder)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isArabic ? 'رسالة واتساب' : 'WhatsApp message'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => shareByEmail(createdOrder)}>
                    <Mail className="h-4 w-4" />
                    {isArabic ? 'إرسال بريد' : 'Send email'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}</div>
                  <div className="font-medium text-gray-900">{createdOrder.customerName}</div>
                  <div className="text-sm text-gray-600">{createdOrder.cafeName}</div>
                  {createdOrder.customerPhone ? (
                    <a
                      className="text-sm text-emerald-700 hover:underline break-words"
                      dir="ltr"
                      href={`https://wa.me/${sanitizeWhatsappPhone(createdOrder.customerPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {createdOrder.customerPhone}
                    </a>
                  ) : (
                    <div className="text-sm text-gray-600">—</div>
                  )}
                  <div className="text-sm text-gray-600">{createdOrder.customerEmail}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</div>
                  <div className="font-medium text-gray-900">{createdOrder.status} / {createdOrder.paymentStatus}</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'طريقة الشحن:' : 'Shipping method:'}{' '}
                    {createdOrder.shippingMethod === 1
                      ? (isArabic ? (
                          <>
                            استلام <span dir="ltr">(Pickup)</span>
                          </>
                        ) : (
                          'Pickup'
                        ))
                      : (isArabic ? (
                          <>
                            نول للتوصيل <span dir="ltr">(Nool Delivery)</span>
                          </>
                        ) : (
                          'Nool Delivery'
                        ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Package className="h-4 w-4 text-gray-600" />
                  <div className="font-medium text-gray-900">{isArabic ? 'المنتجات' : 'Items'}</div>
                </div>
                <div className="divide-y">
                  {createdOrder.items.map((it) => (
                    <div key={it.id} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{it.productName}</div>
                        {it.variantInfo ? (
                          <div className="text-sm text-gray-600">{it.variantInfo}</div>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-nowrap">
                        {isArabic ? 'الكمية:' : 'Qty:'} <span className="font-semibold">{it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetFlow} variant="outline">
                  {isArabic ? 'طلب جديد' : 'New order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white">
            {allowedCategoryIds && allowedCategoryIds.length === 0 ? (
              <CardHeader>
                <CardDescription>
                  {isArabic ? 'البيع بالجملة غير متاح حالياً.' : 'Wholesale ordering is not enabled right now.'}
                </CardDescription>
              </CardHeader>
            ) : null}

            <CardContent className="space-y-6">
              {productLoadError && (
                <Alert variant="destructive">
                  <AlertTitle>{isArabic ? 'خطأ' : 'Error'}</AlertTitle>
                  <AlertDescription>{productLoadError}</AlertDescription>
                </Alert>
              )}

              {allowedCategoryIds && allowedCategoryIds.length === 0 ? (
                <Alert>
                  <AlertTitle>{isArabic ? 'غير متاح' : 'Unavailable'}</AlertTitle>
                  <AlertDescription>
                    {isArabic
                      ? 'حالياً الإدارة لم تقم بتفعيل فئات البيع بالجملة.'
                      : 'Admin has not enabled any wholesale categories yet.'}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="font-semibold text-gray-900">{isArabic ? 'معلومات العميل' : 'Customer info'}</div>
                      <div className="w-full sm:w-auto">
                        <div className="flex items-center gap-3 rounded-lg border bg-gray-50 px-3 py-2">
                          <div className={`text-sm text-gray-700 min-w-0 flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {isArabic ? 'عميل موجود؟' : 'Existing Customer'}
                          </div>
                          <Switch
                          checked={returningCustomerEnabled}
                          onCheckedChange={(checked) => {
                            setReturningCustomerEnabled(!!checked);
                            setLookupState('idle');
                            setLookupSummary(null);
                            lastLookupKeyRef.current = '';
                          }}
                          aria-label={isArabic ? 'تفعيل تعبئة تلقائية' : 'Enable auto-fill'}
                          className="shrink-0"
                          />
                        </div>
                      </div>
                    </div>

                    {returningCustomerEnabled ? (
                      <div className="mb-3 text-sm">
                        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
                          <span className="font-medium">
                            {isArabic
                              ? 'أدخل البريد الإلكتروني أو رقم الهاتف وسنحاول تعبئة البيانات تلقائياً.'
                              : 'Enter email or phone and we’ll try to auto-fill your details.'}
                          </span>
                        </div>

                        {lookupState === 'loading' ? (
                          <div className="mt-2 flex items-center gap-2 text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isArabic ? 'جاري البحث عن العميل...' : 'Looking up customer...'}
                          </div>
                        ) : null}

                        {lookupState === 'found' ? (
                          <div className="mt-2 flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isArabic ? 'تم العثور على العميل وتمت تعبئة البيانات.' : 'Customer found and details filled.'}</span>
                            {lookupSummary ? <span className="text-emerald-800">({lookupSummary})</span> : null}
                          </div>
                        ) : null}

                        {lookupState === 'not-found' ? (
                          <div className="mt-2 text-amber-700">
                            {isArabic
                              ? 'لم يتم العثور على عميل بهذا البريد/الهاتف.'
                              : 'No customer found for that email/phone.'}
                          </div>
                        ) : null}

                        {lookupState === 'error' ? (
                          <div className="mt-2 text-red-700">
                            {isArabic
                              ? 'تعذّر إجراء البحث الآن. حاول لاحقاً أو أكمل التعبئة يدوياً.'
                              : 'Lookup is unavailable right now. Please continue manually.'}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'الاسم الكامل' : 'Full name'}</FormLabel>
                            <FormControl>
                              <Input placeholder={isArabic ? 'مثال: محمد أحمد' : 'e.g. Ali Reza'} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="cafeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'اسم المقهى' : 'Cafe / Company'}</FormLabel>
                            <FormControl>
                              <Input placeholder={isArabic ? 'مثال: SpiritHub Cafe' : 'e.g. Spirithub Cafe or Spirithub Trading'} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={isArabic ? '+968...' : '+968...'}
                                dir="ltr"
                                inputMode="tel"
                                className={isArabic ? 'text-right' : undefined}
                                {...field}
                                onBlur={() => {
                                  field.onBlur();
                                  void runCustomerLookup('blur');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="name@example.com"
                                {...field}
                                onBlur={() => {
                                  field.onBlur();
                                  void runCustomerLookup('blur');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4 space-y-4">
                    <div className="font-semibold text-gray-900">{isArabic ? 'الشحن' : 'Shipping'}</div>

                    <FormField
                      control={control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isArabic ? 'طريقة الشحن' : 'Shipping method'}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                              value={String(field.value)}
                              onValueChange={(v) => field.onChange(Number(v))}
                            >
                              <label
                                className={`flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer hover:bg-gray-50 ${
                                  isArabic ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <RadioGroupItem value="1" />
                                <div className={isArabic ? 'text-right' : undefined}>
                                  <div className="font-medium text-gray-900">
                                    {isArabic ? (
                                      <>
                                        استلام <span dir="ltr">(Pickup)</span>
                                      </>
                                    ) : (
                                      'Pickup'
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">{isArabic ? 'استلام من الفرع' : 'Collect from store'}</div>
                                </div>
                              </label>
                              <label
                                className={`flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer hover:bg-gray-50 ${
                                  isArabic ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <RadioGroupItem value="2" />
                                <div className={isArabic ? 'text-right' : undefined}>
                                  <div className="font-medium text-gray-900">
                                    {isArabic ? (
                                      <>
                                        نول للتوصيل <span dir="ltr">(Nool)</span>
                                      </>
                                    ) : (
                                      'Nool Delivery'
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">{isArabic ? 'توصيل عبر نول' : 'Delivery via Nool'}</div>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {shippingMethod === 2 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{isArabic ? 'العنوان' : 'Address line'}</FormLabel>
                              <FormControl>
                                <Input placeholder={isArabic ? 'مبنى / شارع' : 'Building / Street'} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{isArabic ? 'المدينة' : 'City'}</FormLabel>
                              <FormControl>
                                <Input placeholder={isArabic ? 'مثال: مسقط' : 'e.g. Muscat'} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    <FormField
                      control={control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={isArabic ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border bg-white p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{isArabic ? 'المنتجات' : 'Items'}</div>
                        <div className="text-sm text-gray-600">
                          {isArabic ? 'اختر المنتج والحجم / العبوة والكمية.' : 'Choose product, size / packaging, and quantity.'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ productId: 0, productVariantId: 0, quantity: 1 })}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" />
                        {isArabic ? 'إضافة منتج' : 'Add item'}
                      </Button>
                    </div>

                    {productsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {fields.map((f, index) => {
                        const selectedProductId = items?.[index]?.productId ?? 0;
                        const selectedVariantId = Number(items?.[index]?.productVariantId ?? 0);
                        const variants = selectedProductId ? variantCache[selectedProductId] : undefined;
                        const isVariantsLoading = selectedProductId ? !!variantLoading[selectedProductId] : false;
                        const canEditQty = selectedVariantId > 0;

                        return (
                          <div key={f.id} className="rounded-xl border bg-white p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="font-medium text-gray-900">{isArabic ? 'إضافة منتج' : 'Add Product'}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  if (fields.length === 1) {
                                    setValue(`items.${index}.productId`, 0);
                                    setValue(`items.${index}.productVariantId`, 0);
                                    setValue(`items.${index}.quantity`, 1);
                                    return;
                                  }
                                  remove(index);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <FormField
                                control={control}
                                name={`items.${index}.productId` as const}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-12 md:col-span-6">
                                    <FormLabel>{isArabic ? 'المنتج' : 'Product'}</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={String(field.value ?? 0)}
                                        onValueChange={async (val) => {
                                          const nextId = Number(val);
                                          field.onChange(nextId);
                                          setValue(`items.${index}.productVariantId`, 0);
                                          if (nextId > 0) {
                                            await ensureVariants(nextId);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-full min-w-0">
                                          <SelectValue placeholder={isArabic ? 'اختر منتجاً' : 'Select a product'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">{isArabic ? '— اختر —' : '— Select —'}</SelectItem>
                                          {products.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                              {isArabic ? (p.nameAr || p.name) : p.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={control}
                                name={`items.${index}.productVariantId` as const}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-8 md:col-span-4">
                                    <FormLabel>{isArabic ? 'الحجم / العبوة' : 'Size / Packaging'}</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={String(field.value ?? 0)}
                                        onOpenChange={async (open) => {
                                          if (!open) return;
                                          const pid = Number(selectedProductId);
                                          if (pid > 0) {
                                            await ensureVariants(pid);
                                          }
                                        }}
                                        onValueChange={(val) => field.onChange(Number(val))}
                                        disabled={!selectedProductId || isVariantsLoading}
                                      >
                                        <SelectTrigger className="w-full min-w-0">
                                          <SelectValue
                                            placeholder={
                                              !selectedProductId
                                                ? (isArabic ? 'اختر المنتج أولاً' : 'Select product first')
                                                : isVariantsLoading
                                                  ? (isArabic ? 'جاري التحميل...' : 'Loading...')
                                                  : (isArabic ? 'اختر الحجم / العبوة' : 'Select size / packaging')
                                            }
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">{isArabic ? '— اختر —' : '— Select —'}</SelectItem>
                                          {(variants || []).map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                              {formatVariantLabel(v)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={control}
                                name={`items.${index}.quantity` as const}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-4 md:col-span-2">
                                    <FormLabel>{isArabic ? 'الكمية' : 'Qty'}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        disabled={!canEditQty}
                                        value={String(field.value ?? 1)}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full sm:max-w-sm sm:ml-auto space-y-3">
                      <div className="rounded-xl border bg-white p-4">
                        <div className="font-semibold text-gray-900">{isArabic ? 'ملخص الطلب' : 'Order Summary'}</div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-gray-600">{isArabic ? 'العناصر' : 'Items'}</div>
                            <div className="font-semibold text-gray-900" dir="ltr">{selectedItemsCount}</div>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-gray-600">{isArabic ? 'إجمالي الكمية' : 'Total quantity'}</div>
                            <div className="font-semibold text-gray-900" dir="ltr">
                              {totalQuantityKg == null
                                ? '—'
                                : `${totalQuantityKg.toFixed(2)} ${isArabic ? 'كجم' : 'kg'}`}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-gray-600">{isArabic ? 'الشحن' : 'Shipping'}</div>
                            <div className="font-semibold text-gray-900">{shippingLabel}</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitLoading || productsLoading || (allowedCategoryIds?.length === 0)}
                        className="gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        {isArabic ? 'إرسال الطلب' : 'Submit Wholesale Request'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
