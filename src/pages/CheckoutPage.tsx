import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Gift, MapPin, Package, Loader2, LogIn, Tag } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { cn } from '@/lib/utils';
import type { CheckoutOrder } from '../types/checkout';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { computeShippingMethods, calculateAramexShippingRate, GCC_LOCATIONS } from '@/lib/shipping';
import {
  getAramexCountries,
  getAramexCities,
  type AramexCountriesResponse,
  type AramexCitiesResponse,
} from '@/services/aramexService';

// Coupon definitions
interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  expiryDate?: string; // ISO date string
  description: { en: string; ar: string };
}

const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'THANKS10',
    discountType: 'percentage',
    discountValue: 10,
    description: {
      en: '10% off your order',
      ar: 'خصم 10٪ على طلبك',
    },
  },
];

const USED_COUPONS_STORAGE_KEY = 'spirithub_used_coupons';

// Helper functions for coupon tracking
const getUsedCoupons = (userId: string): string[] => {
  try {
    const stored = localStorage.getItem(USED_COUPONS_STORAGE_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored);
    return data[userId] || [];
  } catch {
    return [];
  }
};

const markCouponAsUsed = (userId: string, couponCode: string) => {
  try {
    const stored = localStorage.getItem(USED_COUPONS_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    if (!data[userId]) {
      data[userId] = [];
    }
    if (!data[userId].includes(couponCode)) {
      data[userId].push(couponCode);
    }
    localStorage.setItem(USED_COUPONS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to mark coupon as used:', error);
  }
};

// Map country ISO2 -> international dialing code for placeholders
const COUNTRY_CALLING_CODES: Record<string, string> = {
  OM: '+968',
  AE: '+971',
  SA: '+966',
  QA: '+974',
  KW: '+965',
  BH: '+973',
};

function getPhonePlaceholderForCountry(iso2?: string) {
  const code = (iso2 && COUNTRY_CALLING_CODES[iso2]) || COUNTRY_CALLING_CODES.OM;
  // Simple common placeholder pattern; callers may replace with more accurate formats later
  return `${code} 0000 0000`;
}

const GCC_PRIORITY_COUNTRY_CODES = ['OM', 'SA', 'AE', 'QA', 'KW', 'BH'] as const;
const GCC_COUNTRY_SET = new Set<string>(GCC_PRIORITY_COUNTRY_CODES);

type CheckoutCountryOption = {
  iso2: string;
  name_en: string;
  name_ar: string;
};

const gccCountryNameMap = new Map(
  GCC_LOCATIONS.map((c) => [c.iso2, { name_en: c.name_en, name_ar: c.name_ar }])
);

const buildGccCityArabicMap = () => {
  const map = new Map<string, Map<string, string>>();
  for (const c of GCC_LOCATIONS) {
    const cityMap = new Map<string, string>();
    for (const city of c.cities) {
      if (city?.name_en && city?.name_ar) {
        cityMap.set(city.name_en.trim().toLowerCase(), city.name_ar);
      }
    }
    map.set(c.iso2, cityMap);
  }
  return map;
};

const gccCityArabicMapByCountry = buildGccCityArabicMap();

const checkoutSchema = z
  .object({
    fullName: z.string().min(3, 'Please enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(6, 'Enter a valid phone number'),
    country: z.string().min(2, 'Country is required'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(4, 'Address is required'),
    notes: z.string().optional(),
    shippingMethod: z.string(),
    isGift: z.boolean(),
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    recipientCountry: z.string().optional(),
    recipientCity: z.string().optional(),
    recipientAddress: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isGift) return;

    const requiredGiftFields = [
      { key: 'recipientName', message: 'Recipient name is required' },
      { key: 'recipientPhone', message: 'Recipient phone is required' },
      { key: 'recipientCountry', message: 'Recipient country is required' },
      { key: 'recipientCity', message: 'Recipient city is required' },
      { key: 'recipientAddress', message: 'Recipient address is required' },
    ] as const;

    requiredGiftFields.forEach((field) => {
      const value = data[field.key];
      if (!value || value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: field.message,
        });
      }
    });
  });

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Dynamic shipping methods computed based on selected country/city
const formatCurrency = (value: number, label: string) => `${value.toFixed(3)} ${label}`;

const getAramexNotSupportedMessage = (isArabic: boolean) =>
  isArabic ? 'غير مدعوم حالياً من أرامكس' : 'Currently not supported by Aramex';

const looksLikeNetworkError = (msg?: string | null) => {
  const m = (msg || '').toLowerCase();
  return (
    m.includes('network') ||
    m.includes('timeout') ||
    m.includes('connect') ||
    m.includes('unavailable')
  );
};

export const CheckoutPage: React.FC = () => {
  const { language } = useApp();
  const { isAuthenticated, user } = useAuth();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      country: 'OM', // store ISO2 code
      city: '', // store city name (from Aramex cities API)
      address: '',
      notes: '',
      shippingMethod: 'pickup',
      isGift: false,
      recipientName: '',
      recipientPhone: '',
      recipientCountry: 'OM',
      recipientCity: '', // store city name (from Aramex cities API)
      recipientAddress: '',
    },
  });

  const watchCountry = form.watch('country');
  const watchCity = form.watch('city');
  const watchRecipientCountry = form.watch('recipientCountry');
  const watchRecipientCity = form.watch('recipientCity');
  const watchedShipping = form.watch('shippingMethod');
  const watchIsGift = form.watch('isGift');

  const watchCountryCode = watchCountry || '';
  const watchRecipientCountryCode = watchRecipientCountry || '';

  // Use recipient's country/city for shipping if it's a gift, otherwise use customer's
  const effectiveCountry = watchIsGift ? watchRecipientCountry : watchCountry;
  const effectiveCity = watchIsGift ? watchRecipientCity : watchCity;

  // State for dynamic Aramex rate calculation
  const [aramexRate, setAramexRate] = useState<number | null>(null);
  const [aramexCalculating, setAramexCalculating] = useState(false);
  const [aramexError, setAramexError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Countries/cities are loaded from backend and cached in localStorage.
  const [countries, setCountries] = useState<CheckoutCountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const [citiesByCountry, setCitiesByCountry] = useState<Record<string, string[]>>({});
  const [citiesLoadingByCountry, setCitiesLoadingByCountry] = useState<Record<string, boolean>>({});

  const getCityLabel = (countryIso2: string, cityName: string) => {
    if (!isArabic) return cityName;
    const cityMap = gccCityArabicMapByCountry.get(countryIso2);
    const ar = cityMap?.get(cityName.trim().toLowerCase());
    return ar || cityName;
  };

  const loadCountries = async () => {
    setCountriesLoading(true);
    setCountriesError(null);
    try {
      const data = (await getAramexCountries()) as AramexCountriesResponse;
      const byIso2 = new Map<string, CheckoutCountryOption>();

      for (const c of data?.countries ?? []) {
        const iso2 = (c?.code ?? '').toUpperCase();
        const name_en = String(c?.name ?? '').trim();
        if (!iso2 || !name_en) continue;
        if (byIso2.has(iso2)) continue;

        const gccNames = gccCountryNameMap.get(iso2);
        byIso2.set(iso2, {
          iso2,
          name_en: gccNames?.name_en || name_en,
          name_ar: gccNames?.name_ar || name_en,
        });
      }

      const list = Array.from(byIso2.values());
      list.sort((a, b) => {
        const aPriorityIdx = GCC_PRIORITY_COUNTRY_CODES.indexOf(a.iso2 as any);
        const bPriorityIdx = GCC_PRIORITY_COUNTRY_CODES.indexOf(b.iso2 as any);

        const aIsPriority = aPriorityIdx !== -1;
        const bIsPriority = bPriorityIdx !== -1;
        if (aIsPriority && bIsPriority) return aPriorityIdx - bPriorityIdx;
        if (aIsPriority) return -1;
        if (bIsPriority) return 1;

        const aIsGcc = GCC_COUNTRY_SET.has(a.iso2);
        const bIsGcc = GCC_COUNTRY_SET.has(b.iso2);
        if (aIsGcc && !bIsGcc) return -1;
        if (!aIsGcc && bIsGcc) return 1;

        return a.name_en.localeCompare(b.name_en);
      });

      setCountries(list);
    } catch (_e: any) {
      setCountriesError(_e?.message || 'Failed to load countries');
    } finally {
      setCountriesLoading(false);
    }
  };

  const loadCitiesForCountry = useCallback(async (countryIso2?: string) => {
    const cc = (countryIso2 || '').toUpperCase();
    if (!cc) return;

    // If we already have them in memory, don't do any more work.
    if (Array.isArray(citiesByCountry[cc]) && citiesByCountry[cc].length > 0) return;

    setCitiesLoadingByCountry((prev) => ({ ...prev, [cc]: true }));
    try {
      const data = (await getAramexCities(cc)) as AramexCitiesResponse;
      const cities = (data?.cities ?? [])
        .map((x) => String(x).trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setCitiesByCountry((prev) => ({ ...prev, [cc]: cities }));
    } catch (_e) {
      // Keep silent; user can still type address and proceed with pickup.
      setCitiesByCountry((prev) => ({ ...prev, [cc]: [] }));
    } finally {
      setCitiesLoadingByCountry((prev) => ({ ...prev, [cc]: false }));
    }
  }, [citiesByCountry]);

  // Load countries once (cached in localStorage for next visits)
  useEffect(() => {
    loadCountries();
  }, []);

  // Prefetch cities for selected countries (cached per-country)
  useEffect(() => {
    if (watchCountryCode) loadCitiesForCountry(watchCountryCode);
  }, [watchCountryCode, loadCitiesForCountry]);

  useEffect(() => {
    if (watchIsGift && watchRecipientCountryCode) {
      loadCitiesForCountry(watchRecipientCountryCode);
    }
  }, [watchIsGift, watchRecipientCountryCode, loadCitiesForCountry]);

  // Calculate Aramex rate when country/city or cart items change
  useEffect(() => {
    const runCalculation = async () => {
      // Only calculate if we have both country and city
      if (!effectiveCountry || !effectiveCity) {
        setAramexRate(null);
        setAramexError(null);
        return;
      }

      setAramexCalculating(true);
      setAramexError(null);

      try {
        // Calculate total weight for shipment from cart items
        // Convert all weights to KG for Aramex API
        const totalWeight = items.reduce((sum, item) => {
          let weightInKg = 0.5; // Default fallback weight per item (500g)
          
          if (item.weight && item.weightUnit) {
            const weight = item.weight;
            const unit = item.weightUnit.toLowerCase();
            
            // Convert to KG based on unit
            if (unit === 'kg') {
              weightInKg = weight;
            } else if (unit === 'g') {
              weightInKg = weight / 1000;
            } else if (unit === 'lb') {
              weightInKg = weight * 0.453592;
            } else if (unit === 'oz') {
              weightInKg = weight * 0.0283495;
            }
          }
          
          return sum + (weightInKg * item.quantity);
        }, 0);

        console.log('📦 Calculated total weight:', totalWeight, 'KG for', items.length, 'items');

        const result = await calculateAramexShippingRate(
          effectiveCountry,
          effectiveCity,
          totalWeight
        );

        if (result.success && result.price) {
          setAramexRate(result.price);
          setAramexError(null);
        } else {
          setAramexRate(null);
          // If country+city are selected but Aramex doesn't return a price,
          // treat it as unsupported (per requirements).
          const unsupportedMsg = getAramexNotSupportedMessage(isArabic);
          const fallbackMsg = looksLikeNetworkError(result.error)
            ? unsupportedMsg
            : unsupportedMsg;
          setAramexError(fallbackMsg);
        }
      } catch (error: any) {
        console.error('Error calculating Aramex rate:', error);
        setAramexRate(null);
        // Per requirements: if no price after selecting country+city, show not supported.
        setAramexError(getAramexNotSupportedMessage(isArabic));
      } finally {
        setAramexCalculating(false);
      }
    };

    const timer = setTimeout(() => {
      if (items.length > 0) {
        runCalculation();
      } else {
        setAramexRate(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [effectiveCountry, effectiveCity, items]);

  const shippingMethods = React.useMemo(() => {
    const methods = computeShippingMethods({
      countryIso2: effectiveCountry,
      city: effectiveCity,
      orderTotal: totalPrice,
    });

    // Update Aramex price with calculated rate
    return methods.map((method) => {
      if (method.id === 'aramex') {
        return {
          ...method,
          price: aramexRate ?? method.price,
          isCalculating: aramexCalculating,
          calculationError: aramexError ?? undefined,
        };
      }
      return method;
    });
  }, [effectiveCountry, effectiveCity, totalPrice, aramexRate, aramexCalculating, aramexError]);

  const selectedShipping =
    shippingMethods.find((method) => method.id === watchedShipping) ?? shippingMethods[0];

  useEffect(() => {
    // If current method not available after country/gift change, reset to first
    if (!shippingMethods.some((m) => m.id === form.getValues('shippingMethod'))) {
      form.setValue('shippingMethod', shippingMethods[0].id);
    }
    // Disallow 'nool' outside Oman
    if (effectiveCountry !== 'OM' && form.getValues('shippingMethod') === 'nool') {
      form.setValue('shippingMethod', shippingMethods[0].id);
    }
  }, [shippingMethods, effectiveCountry, form]);

  const currencyLabel = isArabic ? 'ر.ع' : 'OMR';

  const subtotal = useMemo(() => totalPrice, [totalPrice]);
  const shippingCost = selectedShipping.price;
  
  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      return appliedCoupon.discountValue;
    }
  }, [appliedCoupon, subtotal]);
  
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const aramexBlocked =
    selectedShipping.id === 'aramex' &&
    Boolean(effectiveCountry) &&
    Boolean(effectiveCity) &&
    !aramexCalculating &&
    (aramexRate === null || aramexRate <= 0);

  // Handle coupon application
  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccess(null);

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError(isArabic ? 'الرجاء إدخال رمز القسيمة' : 'Please enter a coupon code');
      return;
    }

    // Check if already applied
    if (appliedCoupon?.code === code) {
      setCouponError(isArabic ? 'القسيمة مطبقة بالفعل' : 'Coupon already applied');
      return;
    }

    // Find the coupon
    const coupon = AVAILABLE_COUPONS.find((c) => c.code === code);
    if (!coupon) {
      setCouponError(isArabic ? 'رمز القسيمة غير صالح' : 'Invalid coupon code');
      return;
    }

    // Check if user has already used this coupon
    if (user) {
      const usedCoupons = getUsedCoupons(user.id);
      if (usedCoupons.includes(code)) {
        setCouponError(
          isArabic
            ? 'لقد استخدمت هذه القسيمة من قبل'
            : 'You have already used this coupon'
        );
        return;
      }
    }

    // Check expiry date
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate);
      if (new Date() > expiry) {
        setCouponError(isArabic ? 'انتهت صلاحية القسيمة' : 'Coupon has expired');
        return;
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      setCouponError(
        isArabic
          ? `الحد الأدنى للطلب ${coupon.minOrderAmount} ريال`
          : `Minimum order amount is ${coupon.minOrderAmount} OMR`
      );
      return;
    }

    // Apply coupon
    setAppliedCoupon(coupon);
    setCouponSuccess(
      isArabic
        ? `تم تطبيق القسيمة! ${coupon.description.ar}`
        : `Coupon applied! ${coupon.description.en}`
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  const handleSubmit = (values: CheckoutFormValues) => {
    if (items.length === 0) {
      return;
    }

    // Block proceeding when Aramex is selected but no rate is available.
    if (selectedShipping.id === 'aramex' && (aramexRate === null || aramexRate <= 0)) {
      const msg = getAramexNotSupportedMessage(isArabic);
      setAramexError(msg);
      form.setError('shippingMethod', { type: 'manual', message: msg });
      return;
    }

    // Ensure user is authenticated before proceeding
    if (!isAuthenticated || !user) {
      // Save checkout data and redirect to login
      sessionStorage.setItem('spirithub_checkout_redirect', 'true');
      sessionStorage.setItem('spirithub_pending_checkout_data', JSON.stringify(values));
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Mark coupon as used before navigating
    if (appliedCoupon && user) {
      markCouponAsUsed(user.id, appliedCoupon.code);
    }

    const order: CheckoutOrder = {
      id: `SPH-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: items.map((item) => ({ ...item })),
      shippingMethod: {
        id: selectedShipping.id,
        name: selectedShipping.label.en,
        nameAr: selectedShipping.label.ar,
        eta: selectedShipping.eta.en,
        etaAr: selectedShipping.eta.ar,
        cost: selectedShipping.price,
      },
      totals: {
        subtotal,
        shipping: shippingCost,
        discount: discountAmount,
        total: grandTotal,
        couponCode: appliedCoupon?.code,
      },
      checkoutDetails: {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        country: values.country,
        city: values.city,
        address: values.address,
        notes: values.notes,
        isGift: values.isGift,
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        recipientCountry: values.recipientCountry,
        recipientCity: values.recipientCity,
        recipientAddress: values.recipientAddress,
      },
    };

    sessionStorage.setItem('spirithub_pending_checkout', JSON.stringify(order));
    navigate('/payment', { state: { order } });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-white page-padding-top">
        <Seo
          title={language === 'ar' ? 'الدفع' : 'Checkout'}
          description={
            language === 'ar'
              ? 'سلة التسوق فارغة حالياً. أضف منتجات للمتابعة إلى الدفع.'
              : 'Your cart is empty. Add products before heading to checkout.'
          }
          canonical={`${siteMetadata.baseUrl}/checkout`}
          noindex
          robots="noindex, nofollow"
        />
        <PageHeader
          title="Checkout"
          titleAr="إتمام الشراء"
          subtitle="Your cart is empty. Add products to continue."
          subtitleAr="سلة التسوق فارغة. أضف منتجات للمتابعة."
        />
        <div className="container mx-auto py-16 text-center space-y-6">
          <p className="text-lg text-gray-600">
            {isArabic ? 'لا توجد منتجات في السلة حالياً.' : 'There are no products in your cart yet.'}
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => navigate('/products')}
          >
            {isArabic ? 'تسوق المنتجات' : 'Browse Products'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white page-padding-top">
      <Seo
        title={language === 'ar' ? 'الدفع الآمن' : 'Secure checkout'}
        description={
          language === 'ar'
            ? 'أكمل طلبك من سبيريت هب كافيه في صفحة دفع آمنة وخاصة.'
            : 'Complete your Spirit Hub Cafe order on a private, secure checkout page.'
        }
        canonical={`${siteMetadata.baseUrl}/checkout`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Checkout"
        titleAr="إتمام الشراء"
        subtitle="Confirm your order details and choose how you would like to receive your coffee."
        subtitleAr="أكد تفاصيل طلبك واختر طريقة الاستلام أو الشحن المناسبة."
      />

      <div className="container mx-auto py-12">
        {/* Login Required Alert */}
        {!isAuthenticated && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <LogIn className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              {isArabic
                ? 'يجب تسجيل الدخول لإتمام الطلب. سيتم توجيهك لتسجيل الدخول عند الضغط على "متابعة للدفع".'
                : 'You must be logged in to complete your order. You will be redirected to login when you click "Continue to Payment".'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Back button at the top */}
            <div className="mb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-auto"
              >
                {isArabic ? 'العودة' : 'Back'}
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px]">
              {/* Contact & Delivery Details - Order 1 on all screens */}
              <div className="space-y-8 order-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                      <Package className="w-6 h-6 text-amber-600" />
                      {isArabic ? 'بيانات التواصل والتسليم' : 'Contact & Delivery Details'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? 'استخدم نفس المعلومات للتسليم أو أدخل بيانات الشخص الذي سيتسلم الشحنة.'
                        : 'Provide your contact details and the address where we should deliver the order.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'الاسم الكامل' : 'Full Name'}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={isArabic ? 'أدخل اسمك' : 'Enter your full name'}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="name@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'الدولة' : 'Country'}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  form.setValue('city', '');
                                }}
                              >
                                <SelectTrigger size="default" className="w-full">
                                  <SelectValue
                                    placeholder={isArabic ? 'اختر الدولة' : 'Select country'}
                                  />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {countriesLoading ? (
                                    <SelectItem value="__loading_countries__" disabled>
                                      {isArabic ? 'جاري تحميل الدول…' : 'Loading countries…'}
                                    </SelectItem>
                                  ) : countriesError ? (
                                    <SelectItem value="__countries_error__" disabled>
                                      {countriesError}
                                    </SelectItem>
                                  ) : (
                                    countries.map((c) => (
                                      <SelectItem key={c.iso2} value={c.iso2}>
                                        {isArabic ? c.name_ar : c.name_en}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isArabic ? 'المدينة' : 'City'}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!watchCountryCode || Boolean(citiesLoadingByCountry[watchCountryCode])}
                              >
                                <SelectTrigger size="default" className="w-full">
                                  <SelectValue
                                    placeholder={isArabic ? 'اختر المدينة' : 'Select city'}
                                  />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {citiesLoadingByCountry[watchCountryCode] ? (
                                    <SelectItem value="__loading_cities__" disabled>
                                      {isArabic ? 'جاري تحميل المدن…' : 'Loading cities…'}
                                    </SelectItem>
                                  ) : (
                                    (citiesByCountry[watchCountryCode] ?? []).map((cityName: string) => (
                                      <SelectItem key={cityName} value={cityName}>
                                        {getCityLabel(watchCountryCode, cityName)}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => {
                          const phonePlaceholder =
                            getPhonePlaceholderForCountry(watchCountry);
                          return (
                            <FormItem>
                              <FormLabel>
                                {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  dir="ltr"
                                  placeholder={phonePlaceholder}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isArabic ? 'العنوان الكامل' : 'Full Address'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  isArabic
                                    ? 'الشارع، المبنى، الشقة'
                                    : 'Street, building, apartment'
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-pink-50/80 border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                      <Gift className="w-6 h-6 text-amber-600" />
                      {isArabic ? 'هل هذا الطلب هدية؟' : 'Is this order a gift?'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? 'يمكنك إرسال الطلب مباشرةً إلى من تحب مع إدخال عنوانه ورقم التواصل.'
                        : 'Send this order directly to someone you love by filling in their delivery details.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="isGift"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <FormLabel className="text-base font-semibold">
                              {isArabic ? 'أرسلها كهدية' : 'Send as a gift'}
                            </FormLabel>
                            <p className="text-sm text-gray-500">
                              {isArabic
                                ? 'سندرج بطاقة صغيرة تحمل اسم المرسل والمستلم.'
                                : 'We will include a small card with sender and recipient names.'}
                            </p>
                          </div>
                          <FormControl className="shrink-0" dir="ltr">
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchIsGift && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-4"
                      >
                        <FormField
                          control={form.control}
                          name="recipientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {isArabic ? 'اسم المستلم' : 'Recipient Name'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    isArabic ? 'اسم المستلم' : "Recipient's full name"
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="recipientCountry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {isArabic ? 'دولة المستلم' : 'Recipient Country'}
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={(val) => {
                                      field.onChange(val);
                                      form.setValue('recipientCity', '');
                                    }}
                                  >
                                    <SelectTrigger size="default" className="w-full">
                                      <SelectValue
                                        placeholder={isArabic ? 'اختر الدولة' : 'Select country'}
                                      />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                      {countriesLoading ? (
                                        <SelectItem value="__loading_countries__" disabled>
                                          {isArabic ? 'جاري تحميل الدول…' : 'Loading countries…'}
                                        </SelectItem>
                                      ) : countriesError ? (
                                        <SelectItem value="__countries_error__" disabled>
                                          {countriesError}
                                        </SelectItem>
                                      ) : (
                                        countries.map((c) => (
                                          <SelectItem key={c.iso2} value={c.iso2}>
                                            {isArabic ? c.name_ar : c.name_en}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recipientCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {isArabic ? 'مدينة المستلم' : 'Recipient City'}
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!watchRecipientCountryCode || Boolean(citiesLoadingByCountry[watchRecipientCountryCode])}
                                  >
                                    <SelectTrigger size="default" className="w-full">
                                      <SelectValue
                                        placeholder={isArabic ? 'اختر المدينة' : 'Select city'}
                                      />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                      {citiesLoadingByCountry[watchRecipientCountryCode] ? (
                                        <SelectItem value="__loading_cities__" disabled>
                                          {isArabic ? 'جاري تحميل المدن…' : 'Loading cities…'}
                                        </SelectItem>
                                      ) : (
                                        (citiesByCountry[watchRecipientCountryCode] ?? []).map(
                                          (cityName: string) => (
                                            <SelectItem key={cityName} value={cityName}>
                                              {getCityLabel(watchRecipientCountryCode, cityName)}
                                            </SelectItem>
                                          )
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="recipientPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {isArabic ? 'هاتف المستلم' : 'Recipient Phone'}
                                </FormLabel>
                                <FormControl>
                                  {(() => {
                                    const rc = watchRecipientCountry || watchCountry;
                                    const recipientPlaceholder =
                                      getPhonePlaceholderForCountry(rc);
                                    return (
                                      <Input
                                        dir="ltr"
                                        placeholder={recipientPlaceholder}
                                        {...field}
                                      />
                                    );
                                  })()}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="recipientAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {isArabic ? 'عنوان المستلم' : 'Recipient Address'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={
                                      isArabic ? 'تفاصيل العنوان' : 'Full delivery address'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </motion.div>
                    )}

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder={
                                isArabic
                                  ? 'أضف تعليمات خاصة للطلب'
                                  : 'Add delivery notes or roasting preferences'
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: delivery method + order summary */}
              <div className="w-full lg:w-[400px] xl:w-[450px] space-y-6 lg:sticky lg:top-6 order-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'طريقة التسليم' : 'Delivery Method'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? 'اختر خيار التوصيل المفضل أدناه.'
                        : 'Choose your preferred delivery option below.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-3"
                            >
                              {shippingMethods.map((method) => (
                                <label
                                  key={method.id}
                                  className={cn(
                                    'flex gap-3 rounded-xl border bg-white p-3 shadow-sm transition-all cursor-pointer',
                                    isArabic && 'flex-row-reverse',
                                    field.value === method.id
                                      ? 'border-amber-500 ring-2 ring-amber-100'
                                      : 'border-gray-200 hover:border-gray-300',
                                    method.isCalculating && 'opacity-75'
                                  )}
                                >
                                  <RadioGroupItem
                                    value={method.id}
                                    className="mt-1"
                                    disabled={method.isCalculating}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={cn(
                                        'flex items-start justify-between gap-2 mb-1',
                                        isArabic && 'flex-row-reverse'
                                      )}
                                    >
                                      <p className="font-semibold text-sm">
                                        {isArabic ? method.label.ar : method.label.en}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        {method.isCalculating && method.id === 'aramex' ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                        ) : method.id === 'aramex' && !effectiveCity ? (
                                          <p className="text-xs text-gray-500 italic whitespace-nowrap">
                                            {isArabic ? 'اختر المدينة' : 'Select city'}
                                          </p>
                                        ) : method.id === 'aramex' && effectiveCity && (aramexRate === null || aramexRate <= 0) ? (
                                          <p className="text-xs text-gray-500 italic whitespace-nowrap">
                                            {isArabic ? 'غير متاح' : 'Unavailable'}
                                          </p>
                                        ) : method.id !== 'aramex' ||
                                          (method.id === 'aramex' && method.price > 0) ? (
                                          <p className="font-bold text-amber-600 text-sm whitespace-nowrap">
                                            {method.price === 0
                                              ? isArabic
                                                ? 'مجاني'
                                                : 'Free'
                                              : formatCurrency(
                                                  method.price,
                                                  currencyLabel
                                                )}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                    <p
                                      className={cn(
                                        'text-xs text-gray-600 mb-2',
                                        isArabic && 'text-right'
                                      )}
                                    >
                                      {method.id === 'pickup'
                                        ? isArabic
                                          ? (
                                              <span>
                                                يرجى جمع طلبك من فرعنا في مسقط الواقع في{' '}
                                                <strong>شارع الموج</strong>
                                                {'.\u200F'}
                                              </span>
                                            )
                                          : (
                                              <span>
                                                Please collect your order from our Muscat
                                                branch located on{' '}
                                                <strong>Al Mouj Street</strong>.
                                              </span>
                                            )
                                        : method.id === 'nool'
                                        ? isArabic
                                          ? (
                                              <span>
                                                توصيل محلي سريع داخل سلطنة عمان بواسطة فريق
                                                التوصيل الخاص بنا{'.\u200F'}
                                              </span>
                                            )
                                          : 'Fast local delivery within Oman area with our own delivery team.'
                                        : isArabic
                                        ? method.description.ar
                                        : method.description.en}
                                    </p>
                                    {method.calculationError &&
                                      method.id === 'aramex' && (
                                        <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                                          <span>ℹ️</span>
                                          <span>
                                            {isArabic
                                              ? method.calculationError.includes('API')
                                                ? 'استخدام السعر التقديري (API غير متاح)'
                                                : 'استخدام السعر الافتراضي'
                                              : method.calculationError}
                                          </span>
                                        </p>
                                      )}
                                    {method.id === 'aramex' && !method.isCalculating && method.price > 0 && (
                                      <p className="text-xs text-green-600 flex items-center gap-1 mb-2">
                                        ✓ {isArabic ? 'تم احتساب التكلفة' : 'Rate confirmed'}
                                      </p>
                                    )}
                                    <div
                                      className={cn(
                                        'flex items-center justify-between',
                                        isArabic && 'flex-row-reverse'
                                      )}
                                    >
                                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                        {isArabic ? method.badge.ar : method.badge.en}
                                      </span>
                                      {method.id === 'pickup' ? (
                                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                          {isArabic
                                            ? 'متاح يومياً من 7 صباحاً حتى 12 منتصف الليل.\u200F'
                                            : 'Available Daily 7am-12am.'}
                                        </span>
                                      ) : (
                                        <p className="text-xs text-gray-500">
                                          {isArabic ? method.eta.ar : method.eta.en}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Coupon Code Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'رمز الخصم' : 'Discount Coupon'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? 'أدخل رمز القسيمة للحصول على خصم.'
                        : 'Enter your coupon code to get a discount.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-green-800 text-sm mb-1">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-xs text-green-700">
                              {isArabic
                                ? appliedCoupon.description.ar
                                : appliedCoupon.description.en}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-green-800 hover:text-green-900 hover:bg-green-100 h-auto py-1 px-2"
                          >
                            {isArabic ? 'إزالة' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder={isArabic ? 'أدخل رمز القسيمة' : 'Enter coupon code'}
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError(null);
                              setCouponSuccess(null);
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleApplyCoupon}
                            variant="outline"
                            className="border-amber-600 text-amber-600 hover:bg-amber-50"
                          >
                            {isArabic ? 'تطبيق' : 'Apply'}
                          </Button>
                        </div>
                        {couponError && (
                          <Alert className="bg-red-50 border-red-200">
                            <AlertDescription className="text-red-800 text-sm">
                              {couponError}
                            </AlertDescription>
                          </Alert>
                        )}
                        {couponSuccess && (
                          <Alert className="bg-green-50 border-green-200">
                            <AlertDescription className="text-green-800 text-sm">
                              {couponSuccess}
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      {isArabic ? 'ملخص الطلب' : 'Order Summary'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic
                        ? 'راجع المنتجات ومجموع الطلب قبل الدفع.'
                        : 'Review your cart items and total before paying.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-b border-dashed border-gray-100 pb-4 last:border-none"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{item.name}</p>
                            {item.tastingNotes && (
                              <p className="text-xs text-amber-600">
                                {item.tastingNotes}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {isArabic ? 'الكمية' : 'Qty'}: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right font-semibold text-amber-600">
                            {formatCurrency(item.price * item.quantity, currencyLabel)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{formatCurrency(subtotal, currencyLabel)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>
                          {isArabic ? 'الشحن' : 'Shipping'} (
                          {isArabic ? selectedShipping.label.ar : selectedShipping.label.en}
                          )
                        </span>
                        <span>
                          {selectedShipping.price === 0
                            ? isArabic
                              ? 'مجاني'
                              : 'Free'
                            : formatCurrency(shippingCost, currencyLabel)}
                        </span>
                      </div>
                      {appliedCoupon && discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>
                            {isArabic ? 'الخصم' : 'Discount'} ({appliedCoupon.code})
                          </span>
                          <span>-{formatCurrency(discountAmount, currencyLabel)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold text-lg text-amber-700">
                        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                        <span>{formatCurrency(grandTotal, currencyLabel)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  size="lg"
                  disabled={aramexBlocked}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-6"
                >
                  {isArabic ? 'متابعة إلى الدفع' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CheckoutPage;
