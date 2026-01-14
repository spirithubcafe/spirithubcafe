import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, Loader2, CheckCircle2, Package } from 'lucide-react';

import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
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

import { productService, productVariantService, wholesaleOrderService } from '../services';
import type { Product, ProductVariant } from '../types/product';
import type { WholesaleOrder, WholesaleShippingMethod } from '../types/wholesale';

const shippingMethodSchema = z.union([z.literal(1), z.literal(2)]);

const wholesaleSchema = z.object({
  customerName: z.string().min(1),
  cafeName: z.string().min(1),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email(),
  shippingMethod: shippingMethodSchema,
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
});

type WholesaleFormValues = z.infer<typeof wholesaleSchema>;

const defaultValues: WholesaleFormValues = {
  customerName: '',
  cafeName: '',
  customerPhone: '',
  customerEmail: '',
  shippingMethod: 1,
  notes: '',
  items: [{ productId: 0, productVariantId: 0, quantity: 1 }],
};

const formatVariantLabel = (variant: ProductVariant) => {
  const unit = (variant.weightUnit || '').trim();
  const weight = Number.isFinite(variant.weight) ? variant.weight : 0;
  const sku = variant.variantSku ? ` • ${variant.variantSku}` : '';
  return `${weight}${unit ? unit : ''}${sku}`;
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

  const form = useForm<WholesaleFormValues>({
    resolver: zodResolver(wholesaleSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { control, handleSubmit, watch, setValue } = form;
  const items = watch('items');

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
    try {
      const order = await wholesaleOrderService.create({
        customerName: values.customerName,
        cafeName: values.cafeName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        shippingMethod: values.shippingMethod as WholesaleShippingMethod,
        notes: values.notes?.trim() ? values.notes : undefined,
        items: values.items,
      });

      setCreatedOrder(order);
      toast.success(isArabic ? 'تم إنشاء طلب الجملة بنجاح' : 'Wholesale order created');
    } catch (err: any) {
      console.error('Wholesale submit failed:', err);
      toast.error(err?.message || (isArabic ? 'فشل إنشاء الطلب' : 'Failed to create wholesale order'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetFlow = () => {
    setCreatedOrder(null);
    form.reset(defaultValues);
  };

  const title = isArabic ? 'طلب جملة' : 'Wholesale Order';
  const description = isArabic
    ? 'يمكنك إنشاء طلب جملة بدون تسجيل الدخول. سيقوم المدير بتحديد السعر النهائي لاحقاً.'
    : 'Create a wholesale order without signing in. Admin will set the final price later.';

  return (
    <div className="min-h-screen bg-gray-50 page-padding-top" dir={isArabic ? 'rtl' : 'ltr'}>
      <Seo
        title={title}
        description={description}
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
          <p className="mt-2 text-sm sm:text-base text-gray-600">{description}</p>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}</div>
                  <div className="font-medium text-gray-900">{createdOrder.customerName}</div>
                  <div className="text-sm text-gray-600">{createdOrder.cafeName}</div>
                  <div className="text-sm text-gray-600">{createdOrder.customerPhone}</div>
                  <div className="text-sm text-gray-600">{createdOrder.customerEmail}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</div>
                  <div className="font-medium text-gray-900">{createdOrder.status} / {createdOrder.paymentStatus}</div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'طريقة الشحن:' : 'Shipping method:'}{' '}
                    {createdOrder.shippingMethod === 1 ? (isArabic ? 'استلام' : 'Pickup') : (isArabic ? 'نول' : 'Nool')}
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
            <CardHeader>
              <CardTitle className="text-gray-900">{isArabic ? 'إنشاء طلب جملة' : 'Create wholesale order'}</CardTitle>
              <CardDescription>
                {allowedCategoryIds && allowedCategoryIds.length === 0
                  ? (isArabic ? 'البيع بالجملة غير متاح حالياً.' : 'Wholesale ordering is not enabled right now.')
                  : (isArabic ? 'املأ المعلومات ثم أضف المنتجات بشكل ديناميكي.' : 'Fill details, then add items dynamically.')}
              </CardDescription>
            </CardHeader>

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

              <Separator />

              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold text-gray-900 mb-3">{isArabic ? 'معلومات العميل' : 'Customer info'}</div>
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
                            <FormLabel>{isArabic ? 'اسم المقهى' : 'Cafe name'}</FormLabel>
                            <FormControl>
                              <Input placeholder={isArabic ? 'مثال: SpiritHub Cafe' : 'e.g. Spirithub Cafe'} {...field} />
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
                              <Input placeholder={isArabic ? '+968...' : '+968...'} {...field} />
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
                              <Input type="email" placeholder="name@example.com" {...field} />
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
                              <label className="flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer hover:bg-gray-50">
                                <RadioGroupItem value="1" />
                                <div>
                                  <div className="font-medium text-gray-900">{isArabic ? 'استلام (Pickup)' : 'Pickup'}</div>
                                  <div className="text-xs text-gray-600">{isArabic ? 'استلام من الفرع' : 'Collect from store'}</div>
                                </div>
                              </label>
                              <label className="flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer hover:bg-gray-50">
                                <RadioGroupItem value="2" />
                                <div>
                                  <div className="font-medium text-gray-900">{isArabic ? 'نول (Nool)' : 'Nool'}</div>
                                  <div className="text-xs text-gray-600">{isArabic ? 'شحن عبر النول' : 'Ship via Nool'}</div>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={isArabic ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-xl border bg-white p-4 space-y-4">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{isArabic ? 'المنتجات' : 'Items'}</div>
                        <div className="text-sm text-gray-600">
                          {isArabic ? 'اختر المنتج والعبوة والكمية.' : 'Choose product, package (variant), and quantity.'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ productId: 0, productVariantId: 0, quantity: 1 })}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isArabic ? 'إضافة عنصر' : 'Add item'}
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
                        const variants = selectedProductId ? variantCache[selectedProductId] : undefined;
                        const isVariantsLoading = selectedProductId ? !!variantLoading[selectedProductId] : false;

                        return (
                          <div key={f.id} className="rounded-xl border bg-white p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="font-medium text-gray-900">{isArabic ? `عنصر ${index + 1}` : `Item ${index + 1}`}</div>
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

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <FormField
                                control={control}
                                name={`items.${index}.productId` as const}
                                render={({ field }) => (
                                  <FormItem className="md:col-span-6">
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
                                        <SelectTrigger>
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
                                  <FormItem className="md:col-span-4">
                                    <FormLabel>{isArabic ? 'العبوة (Variant)' : 'Package (Variant)'}</FormLabel>
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
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={
                                              !selectedProductId
                                                ? (isArabic ? 'اختر المنتج أولاً' : 'Select product first')
                                                : isVariantsLoading
                                                  ? (isArabic ? 'جاري التحميل...' : 'Loading...')
                                                  : (isArabic ? 'اختر العبوة' : 'Select package')
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
                                  <FormItem className="md:col-span-2">
                                    <FormLabel>{isArabic ? 'الكمية' : 'Qty'}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
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

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={submitLoading || productsLoading || (allowedCategoryIds?.length === 0)}
                      className="gap-2"
                    >
                      {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                      {isArabic ? 'إرسال الطلب' : 'Submit order'}
                    </Button>
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
