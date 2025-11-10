import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck, Clock3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useApp } from '../hooks/useApp';
import { useCart } from '../hooks/useCart';
import type { CheckoutOrder } from '../types/checkout';
import type { CreateOrderDto } from '../types/order';
import { orderService, paymentService } from '../services';
import type { PaymentRequestDto } from '../services/paymentService';
import { shippingService, type ShippingMethod } from '../services/shippingService';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

const PENDING_ORDER_STORAGE_KEY = 'spirithub_pending_checkout';
const LAST_SUCCESS_STORAGE_KEY = 'spirithub_last_success_order';
const ORDER_ID_KEY = 'spirithub_server_order_id';

interface PaymentLocationState {
  order?: CheckoutOrder;
  orderId?: string;
}

export const PaymentPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const paymentTimer = useRef<number | null>(null);

  useEffect(() => {
    const state = (location.state as PaymentLocationState) || {};

    if (state.order) {
      setOrder(state.order);
      sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(state.order));
      return;
    }

    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CheckoutOrder = JSON.parse(stored);
        setOrder(parsed);
        return;
      } catch {
        sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      }
    }

    navigate('/checkout', { replace: true });
  }, [location.state, navigate]);

  // Load shipping methods from API
  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        const methods = await shippingService.getShippingMethods();
        setShippingMethods(methods);
        console.log('📦 Loaded shipping methods:', methods);
      } catch (error) {
        console.error('❌ Failed to load shipping methods:', error);
      }
    };

    loadShippingMethods();
  }, []);

  const currencyLabel = isArabic ? 'ر.ع' : 'OMR';
  const formatCurrency = (value: number) => `${value.toFixed(3)} ${currencyLabel}`;

  const recipientLabel = useMemo(() => {
    if (!order) return '';
    if (order.checkoutDetails.isGift) {
      return order.checkoutDetails.recipientName || (isArabic ? 'المُستلِم' : 'Recipient');
    }
    return order.checkoutDetails.fullName;
  }, [order, isArabic]);

  const handlePayment = async (simulateFailure = false) => {
    if (!order) return;

    if (simulateFailure) {
      navigate('/payment/failure', { state: { orderId: order.id } });
      return;
    }

    setIsProcessing(true);

    try {
      // Split full name into first and last name
      const fullName = order.checkoutDetails.isGift 
        ? order.checkoutDetails.recipientName || order.checkoutDetails.fullName
        : order.checkoutDetails.fullName;
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Step 1: Create order in server
      const createOrderDto: CreateOrderDto = {
        // Customer Information
        firstName,
        lastName,
        email: order.checkoutDetails.email,
        phone: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientPhone || order.checkoutDetails.phone
          : order.checkoutDetails.phone,
        
        // Shipping Address
        addressLine1: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientAddress || order.checkoutDetails.address
          : order.checkoutDetails.address,
        country: order.checkoutDetails.country || 'Oman',
        city: order.checkoutDetails.city || 'Muscat',
        
        // Shipping Details
        // Map string shipping method IDs to numeric IDs from API
        shippingMethodId: shippingMethods.length > 0 
          ? shippingService.mapShippingMethodId(order.shippingMethod.id, shippingMethods)
          : (() => {
              // Fallback if API methods not loaded yet
              console.warn('⚠️ Shipping methods not loaded, using fallback mapping');
              const methodId = order.shippingMethod.id === 'pickup' ? 1 
                : order.shippingMethod.id === 'nool' ? 2 
                : order.shippingMethod.id === 'aramex' ? 3 
                : 1;
              console.log(`🚚 Fallback mapping: ${order.shippingMethod.id} -> ${methodId}`);
              return methodId;
            })(),
        shippingCost: order.totals.shipping,
        
        // Gift Information (only include if gift)
        ...(order.checkoutDetails.isGift && {
          isGift: true,
          giftRecipientName: order.checkoutDetails.recipientName,
          giftRecipientPhone: order.checkoutDetails.recipientPhone,
          giftRecipientAddressLine1: order.checkoutDetails.recipientAddress,
          giftRecipientCountry: order.checkoutDetails.recipientCountry || 'Oman',
          giftRecipientCity: order.checkoutDetails.recipientCity || 'Muscat',
        }),
        
        // Additional (only include if not empty)
        ...(order.checkoutDetails.notes && { notes: order.checkoutDetails.notes }),
        
        // Order Items
        items: order.items.map((item) => {
          const [productId, variantId] = item.id.split('-');
          const parsedProductId = parseInt(productId, 10);
          const parsedVariantId = variantId ? parseInt(variantId, 10) : undefined;
          
          console.log('Processing item:', {
            id: item.id,
            productId: parsedProductId,
            variantId: parsedVariantId,
            quantity: item.quantity,
          });
          
          if (isNaN(parsedProductId)) {
            throw new Error(`Invalid product ID: ${item.id}`);
          }
          
          // Build order item - always include productVariantId (can be undefined)
          return {
            productId: parsedProductId,
            productVariantId: parsedVariantId && !isNaN(parsedVariantId) ? parsedVariantId : undefined,
            quantity: item.quantity,
          };
        }),
      };

      // Validate required fields
      if (!firstName || !lastName) {
        throw new Error('First name and last name are required');
      }
      if (!order.checkoutDetails.email) {
        throw new Error('Email is required');
      }
      if (!order.checkoutDetails.phone && !order.checkoutDetails.recipientPhone) {
        throw new Error('Phone number is required');
      }
      if (!order.checkoutDetails.address && !order.checkoutDetails.recipientAddress) {
        throw new Error('Address is required');
      }
      if (createOrderDto.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      console.log('📦 Sending order data:', JSON.stringify(createOrderDto, null, 2));
      const orderResponse = await orderService.create(createOrderDto);
      console.log('✅ Received order response:', orderResponse);
      
      if (!orderResponse || !orderResponse.orderNumber) {
        throw new Error('Failed to create order - invalid response');
      }

      const { orderNumber, totalAmount } = orderResponse;
      
      // Store server order number
      sessionStorage.setItem(ORDER_ID_KEY, orderNumber);

      // Step 2: Initiate payment with Bank Muscat Gateway
      const paymentRequest: PaymentRequestDto = {
        orderId: orderNumber,
        amount: totalAmount,
        currency: 'OMR',
        
        // Billing Information
        billingName: fullName,
        billingEmail: order.checkoutDetails.email,
        billingTel: order.checkoutDetails.phone,
        billingAddress: order.checkoutDetails.address,
        billingCity: order.checkoutDetails.city,
        billingState: order.checkoutDetails.city,
        billingCountry: order.checkoutDetails.country,
        
        // Delivery Information
        deliveryName: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientName || fullName
          : fullName,
        deliveryAddress: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientAddress || order.checkoutDetails.address
          : order.checkoutDetails.address,
        deliveryCity: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientCity || order.checkoutDetails.city
          : order.checkoutDetails.city,
        deliveryCountry: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientCountry || order.checkoutDetails.country
          : order.checkoutDetails.country,
        deliveryTel: order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientPhone || order.checkoutDetails.phone
          : order.checkoutDetails.phone,
        
        language: isArabic ? 'AR' : 'EN',
      };

      const paymentResponse = await paymentService.initiatePayment(paymentRequest);

      if (!paymentResponse.success || !paymentResponse.paymentUrl) {
        throw new Error(paymentResponse.errorMessage || 'Failed to initiate payment');
      }

      // Step 3: Redirect to Bank Muscat Gateway
      clearCart();
      sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      sessionStorage.setItem(LAST_SUCCESS_STORAGE_KEY, JSON.stringify({ 
        ...order, 
        serverOrderNumber: orderNumber 
      }));

      // Redirect using form submission
      paymentService.redirectToGateway(
        paymentResponse.paymentUrl,
        paymentResponse.encryptedRequest!,
        paymentResponse.accessCode!
      );

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      console.error('📋 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Log full error response if available
      if (error.response?.data) {
        console.error('📋 Full API Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      
      setIsProcessing(false);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.title
        || error.response?.data?.errors 
        || error.message 
        || (isArabic 
          ? 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' 
          : 'Failed to create order. Please try again.');
      
      // If errors object exists, format it
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(isArabic ? `أخطاء في البيانات:\n${errorList}` : `Validation errors:\n${errorList}`);
      } else if (typeof errorMessage === 'string') {
        // Show user-friendly message for shipping method error
        if (errorMessage.includes('shipping method')) {
          console.error('🚨 SHIPPING METHOD ERROR - Please check backend configuration');
          console.error('📋 Current shipping methods:', shippingMethods);
          console.error('📋 Selected method:', order?.shippingMethod);
          
          alert(isArabic 
            ? `طريقة الشحن المحددة غير متاحة.\n\nيرجى الاتصال بالدعم الفني.\n\nالطريقة المحددة: ${order?.shippingMethod.id}` 
            : `Selected shipping method is not available.\n\nPlease contact technical support.\n\nSelected method: ${order?.shippingMethod.id}`);
        } else {
          alert(errorMessage);
        }
      } else {
        alert(isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (paymentTimer.current) {
        window.clearTimeout(paymentTimer.current);
      }
    };
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
        <Seo
          title={language === 'ar' ? 'الدفع' : 'Payment'}
          description={
            language === 'ar'
              ? 'نقوم بإعداد تفاصيل الدفع الخاصة بك.'
              : 'Preparing your secure payment session.'
          }
          canonical={`${siteMetadata.baseUrl}/payment`}
          noindex
          robots="noindex, nofollow"
        />
        <PageHeader
          title="Payment"
          titleAr="الدفع"
          subtitle="Fetching your order details..."
          subtitleAr="جاري تحميل تفاصيل الطلب..."
        />
        <div className="container mx-auto py-16 text-center space-y-6">
          <p className="text-gray-600">
            {isArabic ? 'نقوم بإحضار تفاصيل الطلب، يرجى الانتظار أو العودة إلى صفحة الشراء.' : 'We are preparing your payment details. Please wait or return to checkout.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/checkout')}>
            {isArabic ? 'العودة إلى صفحة الشراء' : 'Back to Checkout'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <Seo
        title={language === 'ar' ? 'الدفع' : 'Payment'}
        description={
          language === 'ar'
            ? 'أكمل عملية الدفع لطلب سبيريت هب كافيه.'
            : 'Complete the secure payment for your Spirit Hub Cafe order.'
        }
        canonical={`${siteMetadata.baseUrl}/payment`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment"
        titleAr="الدفع"
        subtitle="Complete your secure payment to confirm the order."
        subtitleAr="قم بإكمال عملية الدفع الآمنة لتأكيد الطلب."
      />

      <div className="container mx-auto py-12 space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.7fr,1fr]">
          <div className="space-y-6">
            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                  {isArabic ? 'ملخص الدفع' : 'Payment Overview'}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? 'نقوم بحماية بياناتك باستخدام بوابة دفع مشفرة بنسبة 256 بت.'
                    : 'We protect your data with 256-bit encrypted payment gateways.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border bg-gray-50/80 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {isArabic ? 'رقم الطلب' : 'Order ID'}: {order.id}
                  </p>
                  <p>
                    {isArabic ? 'سيتم توصيل الطلب إلى' : 'Deliver to'}: {recipientLabel}
                  </p>
                  <p>
                    {isArabic ? 'طريقة الشحن' : 'Shipping'}: {isArabic ? order.shippingMethod.nameAr : order.shippingMethod.name} —{' '}
                    {isArabic ? order.shippingMethod.etaAr : order.shippingMethod.eta}
                  </p>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                      <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'الكمية' : 'Qty'}: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
                    <span>
                      {order.totals.shipping === 0
                        ? isArabic ? 'مجاني' : 'Free'
                        : formatCurrency(order.totals.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>{isArabic ? 'المجموع الكلي' : 'Total'}</span>
                    <span>{formatCurrency(order.totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  {isArabic ? 'اختر وسيلة الدفع' : 'Choose payment method'}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? 'حالياً نقبل الدفع عبر البطاقات البنكية والتحويل البنكي. سيتم إضافة مزيد من الخيارات قريباً.'
                    : 'We currently accept card payments and bank transfers. More options are coming soon.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{isArabic ? 'بطاقة بنكية (فيزا/ماستركارد)' : 'Debit/Credit Card'}</p>
                      <p className="text-sm text-gray-500">
                        {isArabic ? 'دفع آمن فوري مع تأكيد لحظي.' : 'Instant secure payment with immediate confirmation.'}
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-200 p-4">
                  <p className="font-semibold">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</p>
                  <p className="text-sm text-gray-500">
                    {isArabic ? 'سنتواصل معك لإرسال بيانات الحساب عند اختيار هذا الخيار.' : 'We will share our bank details after you confirm this option.'}
                  </p>
                </div>
                <div className="flex flex-col">
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                    onClick={() => handlePayment(false)}
                    disabled={isProcessing}
                  >
                    {isArabic ? 'ادفع الآن' : 'Pay Securely'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Truck className="w-5 h-5 text-amber-600" />
                  {isArabic ? 'عنوان التوصيل' : 'Delivery Address'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p>{order.checkoutDetails.isGift ? order.checkoutDetails.recipientName : order.checkoutDetails.fullName}</p>
                <p>{order.checkoutDetails.isGift ? order.checkoutDetails.recipientPhone : order.checkoutDetails.phone}</p>
                <p>
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientAddress : order.checkoutDetails.address}
                </p>
                <p>
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientCity : order.checkoutDetails.city}, {' '}
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientCountry : order.checkoutDetails.country}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-100 bg-amber-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Clock3 className="w-5 h-5" />
                  {isArabic ? 'وقت التسليم المتوقع' : 'Estimated delivery'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-900">
                <p>{isArabic ? order.shippingMethod.etaAr : order.shippingMethod.eta}</p>
                {order.checkoutDetails.isGift && (
                  <p className="mt-2">
                    {isArabic
                      ? 'سنخبر المستلم بأن الطلب هدية ولن نذكر الأسعار في الفاتورة.'
                      : 'We will let the recipient know it is a gift and hide prices on the slip.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-red-100 bg-red-50/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  {isArabic ? 'مشكلة في الدفع؟' : 'Having trouble paying?'}
                </CardTitle>
                <CardDescription className="text-red-900/80">
                  {isArabic
                    ? 'إذا واجهت أي مشكلة في عملية الدفع يمكنك العودة لتعديل بيانات الطلب.'
                    : 'If something goes wrong you can return to checkout and adjust your order.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/checkout')}>
                  {isArabic ? 'العودة إلى صفحة الشراء' : 'Return to Checkout'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
