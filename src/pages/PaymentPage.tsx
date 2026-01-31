import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck, Clock3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { CheckoutOrder } from '../types/checkout';
import type { CreateOrderDto } from '../types/order';
import { orderService, paymentService, productService } from '../services';
import type { PaymentRequestDto } from '../services/paymentService';
import { shippingService, type ShippingMethod } from '../services/shippingService';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { getProductImageUrl } from '../lib/imageUtils';

const PENDING_ORDER_STORAGE_KEY = 'spirithub_pending_checkout';
const LAST_SUCCESS_STORAGE_KEY = 'spirithub_last_success_order';
const ORDER_ID_KEY = 'spirithub_server_order_id';

interface PaymentLocationState {
  order?: CheckoutOrder;
  orderId?: string;
}

export const PaymentPage: React.FC = () => {
  const { language } = useApp();
  const { isAuthenticated, user } = useAuth();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentStep, setPaymentStep] = useState<'ready' | 'creating' | 'initiating' | 'redirecting'>('ready');
  const [paymentProgress, setPaymentProgress] = useState('');
  const paymentTimer = useRef<number | null>(null);

  // Load order from payment link (orderId + token)
  const loadOrderFromPaymentLink = useCallback(async (orderId: number, token: string) => {
    setIsLoadingOrder(true);
    try {
      // Verify token is valid (simple check - in production, this should be server-side)
      const decodedToken = atob(token);
      
      if (!decodedToken.includes(orderId.toString())) {
        throw new Error('Invalid payment token');
      }
      
      // Load order details from API
      // Admin can access any order, regular users can only access their own orders
      const isAdmin = user?.roles?.includes('Admin') || false;
      const response = isAdmin
        ? await orderService.getOrderById(orderId)
        : await orderService.getMyOrderDetails(orderId);
      const orderDetails = response.data!;
      
      // Check if order is already paid
      if (orderDetails.paymentStatus === 'Paid') {
        navigate(`/checkout/payment-success?orderNumber=${orderDetails.orderNumber}`, { replace: true });
        return;
      }
      
      // Load product images from product service (fetch all products in parallel)
      
      const itemsWithImages = await Promise.all(
        (orderDetails.items || []).map(async (item) => {
          let imageUrl = getProductImageUrl(item.productImage);
          
          try {
            // Try to get the actual product to get its main image
            const product = await productService.getById(item.productId);
            
            // Get main image or first image from product
            const productImagePath = product.mainImage?.imagePath || product.images?.[0]?.imagePath;
            if (productImagePath) {
              imageUrl = getProductImageUrl(productImagePath);
            }
          } catch (error) {
          }
          
          return {
            id: item.id.toString(),
            name: item.productName,
            productId: item.productId,
            productVariantId: item.productVariantId || 0,
            price: item.unitPrice,
            quantity: item.quantity,
            image: imageUrl,
            attributes: item.variantInfo ? [{ name: 'Variant', value: item.variantInfo }] : []
          };
        })
      );
      
      // Convert Order to CheckoutOrder format for payment processing
      const checkoutOrder: CheckoutOrder = {
        id: `existing-${orderDetails.id}`,
        createdAt: orderDetails.createdAt,
        items: itemsWithImages,
        checkoutDetails: {
          fullName: orderDetails.fullName,
          email: orderDetails.email,
          phone: orderDetails.phone,
          address: orderDetails.address,
          city: orderDetails.city,
          country: orderDetails.country,
          isGift: orderDetails.isGift,
          recipientName: orderDetails.giftRecipientName,
          recipientPhone: orderDetails.giftRecipientPhone,
          recipientAddress: orderDetails.giftRecipientAddress,
          recipientCity: orderDetails.giftRecipientCity,
          recipientCountry: orderDetails.giftRecipientCountry,
          notes: orderDetails.notes
        },
        shippingMethod: {
          id: orderDetails.shippingMethod === 1 ? 'pickup' : orderDetails.shippingMethod === 2 ? 'nool' : 'aramex',
          name: orderDetails.shippingMethod === 1 ? 'Store Pickup' : orderDetails.shippingMethod === 2 ? 'Nool Delivery' : 'Aramex Courier',
          nameAr: orderDetails.shippingMethod === 1 ? 'استلام من المتجر' : orderDetails.shippingMethod === 2 ? 'توصيل نول' : 'أرامكس',
          cost: orderDetails.shippingCost || 0,
          eta: orderDetails.shippingMethod === 1 ? '0 days' : orderDetails.shippingMethod === 2 ? '1-2 days' : '2-3 days',
          etaAr: orderDetails.shippingMethod === 1 ? 'فوري' : orderDetails.shippingMethod === 2 ? '1-2 أيام' : '2-3 أيام'
        },
        totals: {
          subtotal: orderDetails.totalAmount - (orderDetails.shippingCost || 0),
          shipping: orderDetails.shippingCost || 0,
          total: orderDetails.totalAmount
        }
      };
      
      setOrder(checkoutOrder);
      
    } catch (error: any) {
      alert(isArabic 
        ? 'فشل تحميل الطلب. تحقق من رابط الدفع.'
        : 'Failed to load order. Please check the payment link.'
      );
      navigate('/orders', { replace: true });
    } finally {
      setIsLoadingOrder(false);
    }
  }, [isArabic, navigate]);

  // Check authentication - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Save the current URL with params to return after login
      const orderId = searchParams.get('orderId');
      const token = searchParams.get('token');
      
      // Build return URL with params
      let returnUrl = '/payment';
      if (orderId && token) {
        returnUrl = `/payment?orderId=${orderId}&token=${encodeURIComponent(token)}`;
      }
      
      // Save the current order to return after login
      const state = (location.state as PaymentLocationState) || {};
      if (state.order) {
        sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(state.order));
      }
      
      // Redirect to login with return URL
      navigate('/login', { 
        replace: true,
        state: { 
          from: returnUrl, 
          message: isArabic ? 'يرجى تسجيل الدخول لإتمام الطلب' : 'Please login to complete your order' 
        }
      });
      return;
    }
  }, [isAuthenticated, navigate, location.state, isArabic, searchParams]);

  useEffect(() => {
    // Only proceed if authenticated
    if (!isAuthenticated) {
      return;
    }

    // Check for orderId and token in URL parameters (for payment links)
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');

    if (orderId && token) {
      loadOrderFromPaymentLink(parseInt(orderId), token);
      return;
    }

    const state = (location.state as PaymentLocationState) || {};

    if (state.order) {
      setOrder(state.order);
      sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(state.order));
      setIsLoadingOrder(false);
      return;
    }

    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CheckoutOrder = JSON.parse(stored);
        setOrder(parsed);
        setIsLoadingOrder(false);
        return;
      } catch (error) {
        sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      }
    }

    setIsLoadingOrder(false);
    navigate('/checkout', { replace: true });
  }, [location.state, navigate, isAuthenticated, searchParams, user, isArabic, loadOrderFromPaymentLink]);

  // Load shipping methods from API
  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        const methods = await shippingService.getShippingMethods();
        setShippingMethods(methods);
      } catch (error) {
        // Failed to load shipping methods
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
    setPaymentStep('creating');
    setPaymentProgress(isArabic ? 'جاري إنشاء الطلب...' : 'Creating order...');

    try {
      // Check if this is a payment for an existing order (from payment link)
      const isExistingOrder = order.id.startsWith('existing-');
      let orderNumber: string;
      let totalAmount: number;
      
      if (isExistingOrder) {
        // This is a payment link for an existing order - skip order creation
        setPaymentProgress(isArabic ? 'جاري تحميل الطلب...' : 'Loading order...');
        const existingOrderId = parseInt(order.id.replace('existing-', ''));
        
        // Get order details for payment
        // Admin can access any order, regular users can only access their own orders
        const isAdmin = user?.roles?.includes('Admin') || false;
        const response = isAdmin
          ? await orderService.getOrderById(existingOrderId)
          : await orderService.getMyOrderDetails(existingOrderId);
        const orderDetails = response.data!;
        
        // Check if already paid
        if (orderDetails.paymentStatus === 'Paid') {
          navigate(`/checkout/payment-success?orderNumber=${orderDetails.orderNumber}`, { replace: true });
          return;
        }
        
        orderNumber = orderDetails.orderNumber;
        totalAmount = orderDetails.totalAmount;
      } else {
        // This is a new order - create it first
        
        // Get full name (NEW API FORMAT - no need to split)
        const fullName = order.checkoutDetails.isGift 
          ? order.checkoutDetails.recipientName || order.checkoutDetails.fullName
          : order.checkoutDetails.fullName;

        // Map shipping method to numeric ID
        const shippingMethodId = shippingMethods.length > 0 
          ? shippingService.mapShippingMethodId(order.shippingMethod.id, shippingMethods)
          : (() => {
              // Fallback if API methods not loaded yet
              const methodId = order.shippingMethod.id === 'pickup' ? 1 
                : order.shippingMethod.id === 'nool' ? 2 
                : order.shippingMethod.id === 'aramex' ? 3 
                : 1;
              return methodId;
            })();

        // Ensure user is authenticated before creating order
        if (!isAuthenticated || !user?.id) {
          throw new Error('User must be logged in to create an order');
        }

        const createOrderDto: CreateOrderDto = {
          // Customer Information (NEW API FORMAT)
          fullName: fullName,
          email: order.checkoutDetails.email,
          phone: order.checkoutDetails.isGift 
            ? order.checkoutDetails.recipientPhone || order.checkoutDetails.phone
            : order.checkoutDetails.phone,
          
          // User ID (Required - no guest checkout)
          userId: String(user.id),
          
          // Shipping Address (NEW API FORMAT)
          address: order.checkoutDetails.isGift 
            ? order.checkoutDetails.recipientAddress || order.checkoutDetails.address
            : order.checkoutDetails.address,
          country: order.checkoutDetails.country || 'OM',
          city: order.checkoutDetails.city || 'Muscat',
          postalCode: '100', // Default postal code for Oman
          
          // Shipping Details (NEW API FORMAT)
          shippingMethod: shippingMethodId as 1 | 2 | 3,
          shippingCost: order.totals.shipping,
          
          // Coupon/Discount Information
          ...(order.totals.couponCode && { couponCode: order.totals.couponCode }),
          ...(order.totals.discount && { discountAmount: order.totals.discount }),
          
          // Gift Information (NEW API FORMAT - only include if gift)
          isGift: order.checkoutDetails.isGift || false,
          ...(order.checkoutDetails.isGift && {
            giftRecipientName: order.checkoutDetails.recipientName,
            giftRecipientPhone: order.checkoutDetails.recipientPhone,
            giftRecipientAddress: order.checkoutDetails.recipientAddress,
            giftRecipientCountry: order.checkoutDetails.recipientCountry || 'Oman',
            giftRecipientCity: order.checkoutDetails.recipientCity || 'Muscat',
          }),
          
          // Additional (only include if not empty)
          ...(order.checkoutDetails.notes && { notes: order.checkoutDetails.notes }),
          
          // Order Items - will be populated after fetching variants
          items: [], // Temporary empty array
        };

        // Fetch and populate items with variant IDs
        const itemsWithVariants = await Promise.all(
          order.items.map(async (item) => {
            
            if (!item.productId || isNaN(item.productId)) {
              console.error('❌ Invalid product ID:', item);
              throw new Error(`Invalid product ID for item: ${item.name}`);
            }
            
            let variantId = item.productVariantId;
            
            // If productVariantId is missing or null, fetch the default variant from API
            if (!variantId || variantId <= 0) {
              try {
                const product = await productService.getById(item.productId);
                
                const activeVariants = (product?.variants || []).filter(
                  (variant) => (variant as unknown as { isActive?: boolean }).isActive !== false,
                );

                if (activeVariants.length > 0) {
                  const defaultVariant =
                    activeVariants.find((variant) => (variant as any).isDefault) ?? activeVariants[0];

                  // Use default active variant
                  variantId = defaultVariant.id;
                } else {
                  throw new Error(`No variants available for item: ${item.name}`);
                }
              } catch (error) {
                throw new Error(`Could not fetch variant for item: ${item.name}`);
              }
            }
            
            if (!variantId) {
              throw new Error(`Could not determine variant ID for item: ${item.name}`);
            }
            
            return {
              productId: item.productId,
              productVariantId: variantId,
              quantity: item.quantity,
            };
          })
        );

        // Update the createOrderDto with fetched items
        createOrderDto.items = itemsWithVariants;

        // Validate required fields
        if (!fullName || fullName.trim() === '') {
          throw new Error('Full name is required');
        }
        if (!createOrderDto.email || createOrderDto.email.trim() === '') {
          throw new Error('Email is required');
        }
        if (!createOrderDto.phone || createOrderDto.phone.trim() === '') {
          throw new Error('Phone number is required');
        }
        if (!createOrderDto.address || createOrderDto.address.trim() === '') {
          throw new Error('Address is required');
        }
        if (!createOrderDto.shippingMethod || ![1, 2, 3].includes(createOrderDto.shippingMethod)) {
          throw new Error('Valid shipping method is required (1=Pickup, 2=Nool, 3=Aramex)');
        }
        if (createOrderDto.items.length === 0) {
          throw new Error('Order must contain at least one item');
        }

        setPaymentProgress(isArabic ? 'جاري حفظ الطلب في النظام...' : 'Saving order to system...');
        const orderResponse = await orderService.create(createOrderDto);
        
        orderNumber = orderResponse.orderNumber;
        totalAmount = orderResponse.totalAmount || order.totals.total;
      }

      // Store server order number
      sessionStorage.setItem(ORDER_ID_KEY, orderNumber);

      // Step 2: Initiate payment with Bank Muscat Gateway
      setPaymentStep('initiating');
      setPaymentProgress(isArabic ? 'جاري الاتصال ببوابة الدفع...' : 'Connecting to payment gateway...');
      
      const fullName = order.checkoutDetails.isGift 
        ? order.checkoutDetails.recipientName || order.checkoutDetails.fullName
        : order.checkoutDetails.fullName;
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
      setPaymentStep('redirecting');
      setPaymentProgress(isArabic ? 'جاري التوجيه إلى بوابة الدفع الآمنة...' : 'Redirecting to secure payment gateway...');
      
      clearCart();
      sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      sessionStorage.setItem(LAST_SUCCESS_STORAGE_KEY, JSON.stringify({ 
        ...order, 
        serverOrderNumber: orderNumber 
      }));

      // Small delay to show progress message
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect using form submission
      paymentService.redirectToGateway(
        paymentResponse.paymentUrl,
        paymentResponse.encryptedRequest!,
        paymentResponse.accessCode!
      );

    } catch (error: any) {
      console.error('Payment error:', error);
      
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

  if (!order || isLoadingOrder) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white page-padding-top">
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
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
          <p className="text-gray-600">
            {isArabic ? 'نقوم بإحضار تفاصيل الطلب، يرجى الانتظار...' : 'Loading order details, please wait...'}
          </p>
          {!isLoadingOrder && (
            <Button variant="outline" onClick={() => navigate('/checkout')}>
              {isArabic ? 'العودة إلى صفحة الشراء' : 'Back to Checkout'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white page-padding-top">
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
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-14 w-14 rounded-lg object-cover bg-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/products/default-product.webp';
                        }}
                      />
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
                  {order.totals.discount && order.totals.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>
                        {isArabic ? 'الخصم' : 'Discount'}
                        {order.totals.couponCode && ` (${order.totals.couponCode})`}
                      </span>
                      <span>-{formatCurrency(order.totals.discount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
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
                <div className="flex flex-col gap-3">
                  {isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {paymentStep === 'creating' && (isArabic ? '⏳ جاري إنشاء الطلب...' : '⏳ Creating order...')}
                            {paymentStep === 'initiating' && (isArabic ? '💳 جاري الاتصال ببوابة الدفع...' : '💳 Connecting to payment gateway...')}
                            {paymentStep === 'redirecting' && (isArabic ? '🔄 جاري التوجيه إلى بوابة الدفع الآمنة...' : '🔄 Redirecting to secure payment gateway...')}
                          </p>
                          {paymentProgress && (
                            <p className="text-xs text-blue-700 mt-1">{paymentProgress}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                    onClick={() => handlePayment(false)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {isArabic ? 'جاري المعالجة...' : 'Processing...'}
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 inline mr-2" />
                        {isArabic ? 'ادفع الآن' : 'Pay Securely'}
                      </>
                    )}
                  </Button>
                  {!isProcessing && (
                    <p className="text-xs text-center text-gray-500">
                      {isArabic 
                        ? '🔒 الدفع آمن ومشفر بواسطة Bank Muscat' 
                        : '🔒 Secure encrypted payment via Bank Muscat'}
                    </p>
                  )}
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
