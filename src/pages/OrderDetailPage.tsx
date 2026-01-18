import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { orderService } from '../services/orderService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  Mail,
  Gift,
  CreditCard,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { getProductImageUrl } from '../lib/imageUtils';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import type { Order as BackendOrder } from '../types/order';
import { productService } from '../services/productService';
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';

const statusConfig = {
  Pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  Processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
  Shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  Delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  Cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const paymentStatusConfig = {
  Paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200' },
  Unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-800 border-red-200' },
  Failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200' },
  Refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  PartiallyRefunded: { label: 'Partially Refunded', color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, user } = useAuth();
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const navigate = useNavigate();
  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isArabic = language === 'ar';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/order/' + orderId);
      return;
    }

    loadOrderDetails();
  }, [orderId, isAuthenticated, currentRegion.code]);

  const loadOrderDetails = async () => {
    if (!orderId) {
      setError('Order ID is missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading order details for ID:', orderId);
      
      // Use appropriate endpoint based on user role
      // Admin can access any order, regular users can only access their own orders
      const isAdmin = user?.roles?.includes('Admin') || false;
      const response = isAdmin
        ? await orderService.getOrderById(parseInt(orderId))
        : await orderService.getMyOrderDetails(parseInt(orderId));
      
      if (response.success && response.data) {
        console.log('✅ Order details loaded:', response.data);
        
        const orderData = response.data;
        
        // Load product images for items that don't have them
        if (orderData.items && orderData.items.length > 0) {
          console.log('🖼️ Loading product images for order items...');
          
          const itemsWithImages = await Promise.all(
            orderData.items.map(async (item) => {
              // If item already has an image, use it
              if (item.productImage) {
                console.log(`✅ Item ${item.productName} already has image: ${item.productImage}`);
                return item;
              }
              
              // Otherwise, fetch product data to get the image
              try {
                console.log(`🔍 Fetching product data for ID: ${item.productId}`);
                const product = await productService.getById(item.productId);
                console.log(`✅ Product data loaded for ${item.productName}:`, product);
                
                // Use main image or first available image
                const mainImage = product.mainImage?.imagePath;
                const firstImage = product.images?.[0]?.imagePath;
                const primaryImage = product.images?.find(img => img.isMain)?.imagePath;
                
                const imageToUse = mainImage || primaryImage || firstImage || '';
                
                return {
                  ...item,
                  productImage: imageToUse
                };
              } catch (error) {
                console.error(`❌ Failed to load product ${item.productId}:`, error);
                return item;
              }
            })
          );
          
          orderData.items = itemsWithImages;
          console.log('✅ All product images loaded');
        }
        
        setOrder(orderData);
      } else {
        console.error('❌ Failed to load order details');
        setError(isArabic ? 'فشل في تحميل تفاصيل الطلب' : 'Failed to load order details');
      }
    } catch (error: any) {
      console.error('❌ Error loading order details:', error);
      
      // Handle specific error messages
      let errorMessage = error.message || (isArabic ? 'An error occurred loading the order' : 'An error occurred loading the order');
      
      // Check for specific error conditions
      if (error.message?.includes('access')) {
        errorMessage = isArabic ? 'You do not have access to this order' : 'You do not have access to this order';
      } else if (error.message?.includes('not found')) {
        errorMessage = isArabic ? 'Order not found' : 'Order not found';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {error || (isArabic ? 'الطلب غير موجود' : 'Order Not Found')}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {isArabic ? 'لم نتمكن من العثور على هذا الطلب' : 'We could not find this order'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/orders')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 mt-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isArabic ? 'العودة للطلبات' : 'Back to Orders'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.Pending;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.Unpaid;

  const getShippingMethodLabel = (method: number) => {
    switch (method) {
      case 1:
        return isArabic ? 'استلام من المتجر' : 'Store Pickup';
      case 2:
        return 'Nool Delivery';
      case 3:
        return 'Aramex Courier';
      default:
        return isArabic ? 'غير محدد' : 'Not specified';
    }
  };

  return (
    <>
      <Seo 
        title={`${isArabic ? 'تفاصيل الطلب' : 'Order Details'} #${order.orderNumber} - ${siteMetadata.siteName}`}
        description={`${isArabic ? 'تفاصيل الطلب رقم' : 'Details for order'} ${order.orderNumber}`}
      />

      <div className="min-h-screen bg-linear-to-br from-stone-50 to-amber-50/30 pt-24 pb-12">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isArabic ? 'رجوع' : 'Back'}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
                </h1>
                <p className="text-gray-600">
                  {isArabic ? 'رقم الطلب:' : 'Order Number:'} <span className="font-semibold">{order.orderNumber}</span>
                </p>
              </div>
              
              <div className="flex gap-3">
                <Badge className={`${statusInfo.color} px-4 py-2 text-sm border`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {isArabic ? (
                    order.status === 'Pending' ? 'قيد الانتظار'
                    : order.status === 'Processing' ? 'قيد المعالجة'
                    : order.status === 'Shipped' ? 'تم الشحن'
                    : order.status === 'Delivered' ? 'تم التوصيل'
                    : order.status === 'Cancelled' ? 'ملغى'
                    : order.status
                  ) : statusInfo.label}
                </Badge>
                <Badge className={`${paymentInfo.color} px-4 py-2 text-sm border`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isArabic ? (
                    order.paymentStatus === 'Paid' ? 'مدفوع'
                    : order.paymentStatus === 'Unpaid' ? 'غير مدفوع'
                    : order.paymentStatus === 'Failed' ? 'فشل'
                    : order.paymentStatus === 'Refunded' ? 'مسترد'
                    : order.paymentStatus === 'PartiallyRefunded' ? 'مسترد جزئياً'
                    : order.paymentStatus
                  ) : paymentInfo.label}
                </Badge>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Summary */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    {isArabic ? 'منتجات الطلب' : 'Order Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={index}>
                            {index > 0 && <Separator className="my-4" />}
                            <div className="flex gap-4">
                              <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                <img
                                  src={getProductImageUrl(item.productImage)}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1 truncate">
                                  {item.productName}
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    {isArabic ? 'الكمية:' : 'Quantity:'} <span className="font-medium">{item.quantity}</span>
                                  </p>
                                  <p>
                                    {isArabic ? 'السعر:' : 'Price:'} <span className="font-medium">{item.unitPrice.toFixed(3)} {currentRegion.currencySymbol}</span>
                                  </p>
                                  {item.variantInfo && (
                                    <p className="text-xs text-gray-500">
                                      {item.variantInfo}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-amber-600">
                                  {item.totalAmount.toFixed(3)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {isArabic ? 'ر.ع' : 'OMR'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          {isArabic ? 'لا توجد منتجات في هذا الطلب' : 'No items in this order'}
                        </p>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator className="my-6" />

                  {/* Order Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                      <span className="font-medium">{order.subTotal.toFixed(3)} {currentRegion.currencySymbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{isArabic ? 'الشحن:' : 'Shipping:'}</span>
                      <span className="font-medium">{order.shippingCost.toFixed(3)} {currentRegion.currencySymbol}</span>
                    </div>
                    {order.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isArabic ? 'الضريبة:' : 'Tax:'}</span>
                        <span className="font-medium">{order.taxAmount.toFixed(3)} {currentRegion.currencySymbol}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">{isArabic ? 'الإجمالي:' : 'Total:'}</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {order.totalAmount.toFixed(3)} {currentRegion.currencySymbol}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gift Message */}
              {order.giftMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-pink-600" />
                        {isArabic ? 'رسالة الهدية' : 'Gift Message'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 italic">"{order.giftMessage}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column - Customer & Shipping Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    {isArabic ? 'معلومات العميل' : 'Customer Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    <div>
                      <Label className="text-xs text-gray-500">{isArabic ? 'الاسم' : 'Name'}</Label>
                      <p className="font-medium">{order.fullName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    <div>
                      <Label className="text-xs text-gray-500">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <p className="font-medium break-all">{order.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    <div>
                      <Label className="text-xs text-gray-500">{isArabic ? 'الهاتف' : 'Phone'}</Label>
                      <p className="font-medium" dir="ltr">{order.phone}</p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    <div>
                      <Label className="text-xs text-gray-500">{isArabic ? 'العنوان' : 'Address'}</Label>
                      <p className="font-medium text-sm leading-relaxed">
                        {order.address && order.address !== ',' && order.address.trim() !== '' ? (
                          <>
                            {order.address}
                            <br />
                            {order.city && order.city.trim() !== '' && `${order.city}, `}
                            {order.country}
                            {order.postalCode && order.postalCode.trim() !== '' && (
                              <>
                                <br />
                                {order.postalCode}
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">{isArabic ? 'غير محدد' : 'Not specified'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-purple-600" />
                    {isArabic ? 'معلومات الشحن' : 'Shipping Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">{isArabic ? 'طريقة الشحن' : 'Shipping Method'}</Label>
                    <p className="font-medium">{getShippingMethodLabel(order.shippingMethod)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">{isArabic ? 'تكلفة الشحن' : 'Shipping Cost'}</Label>
                    <p className="font-medium">{order.shippingCost.toFixed(3)} {currentRegion.currencySymbol}</p>
                  </div>

                  {order.trackingNumber && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">{isArabic ? 'رقم التتبع' : 'Tracking Number'}</Label>
                        <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded mb-2">{order.trackingNumber}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`https://www.aramex.com/track/shipments?ShipmentNumber=${order.trackingNumber}`, '_blank')}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          {isArabic ? 'تتبع الشحنة' : 'Track Shipment'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Aramex Pickup Information */}
              <AramexPickupInfo 
                order={order}
                isArabic={isArabic}
                onPickupCancelled={() => {
                  // Reload order details after pickup cancellation
                  loadOrderDetails();
                }}
              />

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                    {isArabic ? 'التسلسل الزمني' : 'Order Timeline'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{isArabic ? 'تاريخ الطلب:' : 'Order Date:'}</span>
                    <span className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{isArabic ? 'وقت الطلب:' : 'Order Time:'}</span>
                    <span className="font-medium">{format(new Date(order.createdAt), 'HH:mm')}</span>
                  </div>
                  {order.updatedAt && order.updatedAt !== order.createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{isArabic ? 'آخر تحديث:' : 'Last Updated:'}</span>
                      <span className="font-medium">{format(new Date(order.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Action */}
              {order.paymentStatus !== 'Paid' && order.status !== 'Cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                    onClick={() => {
                      const token = btoa(`${order.id}:${order.orderNumber}:${Date.now()}`);
                      navigate(`/payment?orderId=${order.id}&token=${token}`);
                    }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {isArabic ? 'دفع الآن' : 'Pay Now'}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
