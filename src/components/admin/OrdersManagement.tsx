import React, { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  FileText, 
  RefreshCw, 
  Eye, 
  Package, 
  DollarSign, 
  Calendar, 
  Edit, 
  Link,
  Copy,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  Gift,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { orderService } from '../../services';
import type { Order, OrderStatus, PaymentStatus } from '../../types/order';

export const OrdersManagement: React.FC = () => {
  const { language } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  
  const [editLoading, setEditLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  
  // Payment link state
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  const isArabic = language === 'ar';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading orders from API...');
      console.log('📍 API Base URL:', 'https://spirithubapi.sbc.om');
      
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token exists:', !!token);
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      }
      
      // Try with minimal parameters first
      console.log('📤 Request parameters:', { page: 1, pageSize: 20 });
      
      const response = await orderService.getOrders({
        page: 1,
        pageSize: 20, // Start with smaller page size
      });
      
      console.log('✅ Orders API Response:', response);
      console.log('📊 Response structure:', {
        hasSuccess: 'success' in response,
        hasData: 'data' in response,
        hasPagination: 'pagination' in response,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 0
      });
      
      // Handle API response structure
      const ordersList = response?.data || [];
      
      // Ensure all orders have items array (handle null/undefined items)
      const ordersWithItems = Array.isArray(ordersList) 
        ? ordersList.map(order => ({
            ...order,
            items: Array.isArray(order.items) ? order.items : []
          }))
        : [];
      
      setOrders(ordersWithItems);
      
      // Debug: Check if orders have items
      if (ordersWithItems.length > 0) {
        const firstOrder = ordersWithItems[0];
        console.log('🔍 First order check:', {
          orderNumber: firstOrder.orderNumber,
          hasItems: !!firstOrder.items,
          itemsCount: firstOrder.items?.length || 0,
          userId: firstOrder.userId,
          allKeys: Object.keys(firstOrder)
        });
        
        const revenue = ordersWithItems
          .filter(o => o.paymentStatus === 'Paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        setTotalRevenue(revenue);
        console.log(`💰 Total revenue: ${revenue.toFixed(3)} OMR from ${ordersWithItems.length} orders`);
      } else {
        console.log('📦 No orders found');
      }
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      console.error('📋 Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        stack: error.stack
      });
      
      // Set user-friendly error message
      let errorMessage = isArabic ? 'فشل تحميل الطلبات: ' : 'Failed to load orders: ';
      
      if (error.statusCode === 401) {
        errorMessage += isArabic ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please login again';
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.statusCode === 403) {
        errorMessage += isArabic ? 'ليس لديك صلاحية الوصول إلى الطلبات' : 'You do not have permission to access orders';
      } else if (error.statusCode === 404) {
        errorMessage += isArabic ? 'نقطة النهاية غير موجودة' : 'Orders endpoint not found. The API may not support this feature yet.';
        console.warn('⚠️ The orders endpoint may not be implemented in the API yet.');
      } else if (error.statusCode === 500) {
        errorMessage += isArabic 
          ? 'خطأ في الخادم. قد لا يكون جدول الطلبات موجوداً في قاعدة البيانات بعد.' 
          : 'Server error. The orders table may not exist in the database yet.';
        console.error('⚠️ Server returned 500. Possible causes:');
        console.error('   1. Orders table does not exist in database');
        console.error('   2. Database connection issue');
        console.error('   3. API endpoint not implemented correctly');
        console.error('   4. Missing permissions in database');
      } else {
        errorMessage += error.message || (isArabic ? 'خطأ غير معروف' : 'Unknown error');
      }
      
      setError(errorMessage);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.paymentStatus);
    setEditTrackingNumber(order.trackingNumber || '');
    setShowEditDialog(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    setEditLoading(true);
    try {
      // Update order status
      await orderService.updateOrderStatus(selectedOrder.id, { status: editStatus });
      
      // Update payment status if changed
      if (editPaymentStatus !== selectedOrder.paymentStatus) {
        await orderService.updatePaymentStatus(selectedOrder.id, { paymentStatus: editPaymentStatus });
      }
      
      // Update tracking number if changed
      if (editTrackingNumber && editTrackingNumber !== selectedOrder.trackingNumber) {
        await orderService.updateShipping(selectedOrder.id, {
          shippingMethodId: selectedOrder.shippingMethod || selectedOrder.shippingMethodId || 1,
          trackingNumber: editTrackingNumber,
        });
      }

      // Reload orders
      await loadOrders();
      setShowEditDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update order:', error);
      alert(isArabic ? 'فشل تحديث الطلب' : 'Failed to update order');
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewDetails = async (order: Order) => {
    try {
      console.log('🔍 Loading order details for order ID:', order.id);
      
      // Get full order details including items
      const response = await orderService.getOrderById(order.id);
      
      // Extract order data from API response
      const orderDetails: Order = response.data!;
      
      console.log('✅ Order details loaded:', {
        id: orderDetails.id,
        orderNumber: orderDetails.orderNumber,
        itemsCount: orderDetails.items?.length || 0,
        items: orderDetails.items
      });
      
      setSelectedOrder(orderDetails);
      setShowDetailsDialog(true);
    } catch (error: any) {
      console.error('❌ Error loading order details:', error);
      alert(isArabic ? 'فشل تحميل تفاصيل الطلب' : 'Failed to load order details');
    }
  };

  const handleGenerateInvoice = async (order: Order) => {
    setInvoiceLoading(true);
    try {
      console.log('📄 Generating invoice for order ID:', order.id);
      
      // Get full order details including items for accurate invoice
      const response = await orderService.getOrderById(order.id);
      const orderDetails: Order = response.data!;
      
      console.log('✅ Order details for invoice loaded, items count:', orderDetails.items?.length || 0);
      
      await generateInvoicePDF(orderDetails);
      console.log('✅ Invoice generated successfully');
    } catch (error: any) {
      console.error('❌ Error generating invoice:', error);
      alert(isArabic ? 'فشل إنشاء الفاتورة' : 'Failed to generate invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleGeneratePaymentLink = async (order: Order) => {
    if (order.paymentStatus === 'Paid') {
      alert(isArabic ? 'هذا الطلب مدفوع بالفعل' : 'This order is already paid');
      return;
    }

    setSelectedOrder(order);
    setPaymentLinkLoading(true);
    try {
      const link = `${window.location.origin}/payment?orderId=${order.id}&token=${generatePaymentToken(order)}`;
      setGeneratedPaymentLink(link);
      setShowPaymentLinkDialog(true);
      console.log('✅ Payment link generated successfully');
    } catch (error: any) {
      console.error('❌ Error generating payment link:', error);
      alert(isArabic ? 'فشل إنشاء رابط الدفع' : 'Failed to generate payment link');
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  const handleCopyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedPaymentLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
    }
  };

  const generatePaymentToken = (order: Order) => {
    return btoa(`${order.id}-${order.orderNumber}-${Date.now()}`);
  };

  const generateInvoicePDF = async (order: Order) => {
    const invoiceContent = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const generateInvoiceHTML = (order: Order) => {
    const isRTL = isArabic;
    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${isRTL ? 'فاتورة' : 'Invoice'} #${order.orderNumber}</title>
        <style>
          body { font-family: ${isRTL ? '"Arial", "Tahoma"' : 'Arial, sans-serif'}; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; position: relative; min-height: 120px; }
          .header .logo { position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 0; width: 120px; height: auto; }
          .header .company-info { position: absolute; ${isRTL ? 'right' : 'left'}: 0; top: 0; text-align: ${isRTL ? 'right' : 'left'}; font-size: 12px; line-height: 1.5; }
          .header .company-info p { margin: 3px 0; }
          .header .company-info strong { font-size: 14px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: ${isRTL ? 'right' : 'left'}; }
          .items th { background-color: #f5f5f5; }
          .total { text-align: ${isRTL ? 'left' : 'right'}; font-size: 18px; font-weight: bold; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 5px; color: white; }
          .status.paid { background-color: #10b981; }
          .status.unpaid { background-color: #f59e0b; }
          .status.failed { background-color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/logo/logo-dark.png" alt="Spirit Hub Cafe Logo" class="logo" />
          <div class="company-info">
            <p><strong>AL JALSA AL RAQIA LLC</strong></p>
            <p>Al Mouj st, Muscat, OM</p>
            <p>info@spirithubcafe.com</p>
            <p>${isRTL ? 'سجل تجاري' : 'CR'}: 1346354</p>
            <p>+968 91900005</p>
            <p>+968 72726999</p>
            <p style="margin-top: 8px;">${isRTL ? 'ضريبة' : 'VAT'}: OM110025057X</p>
          </div>
          <h1>${isRTL ? 'فاتورة' : 'Invoice'}</h1>
          <h2>#${order.orderNumber}</h2>
          <p>${isRTL ? 'تاريخ الطلب' : 'Order Date'}: ${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div class="info">
          <div>
            <h3>${isRTL ? 'معلومات العميل' : 'Customer Information'}</h3>
            <p><strong>${isRTL ? 'الاسم الكامل' : 'Full Name'}:</strong> ${order.fullName}</p>
            <p><strong>${isRTL ? 'البريد الإلكتروني' : 'Email'}:</strong> ${order.email}</p>
            <p><strong>${isRTL ? 'الهاتف' : 'Phone'}:</strong> ${order.phone}</p>
            <p><strong>${isRTL ? 'المدينة' : 'City'}:</strong> ${order.city}</p>
            <p><strong>${isRTL ? 'البلد' : 'Country'}:</strong> ${order.country}</p>
            ${order.postalCode ? `<p><strong>${isRTL ? 'الرمز البريدي' : 'Postal Code'}:</strong> ${order.postalCode}</p>` : ''}
            <p><strong>${isRTL ? 'العنوان الكامل' : 'Full Address'}:</strong><br/>
               ${order.address}<br/>
               ${order.city}, ${order.country}${order.postalCode ? ` - ${order.postalCode}` : ''}
            </p>
          </div>
          <div>
            <h3>${isRTL ? 'معلومات الطلب' : 'Order Information'}</h3>
            <p><strong>${isRTL ? 'حالة الطلب' : 'Order Status'}:</strong> ${order.status}</p>
            <p><strong>${isRTL ? 'حالة الدفع' : 'Payment Status'}:</strong> ${order.paymentStatus}</p>
            <p><strong>${isRTL ? 'طريقة الشحن' : 'Shipping Method'}:</strong> <span style="background-color: #fef9c3; padding: 2px 6px; border-radius: 3px; color: #854d0e; font-weight: 500;">${order.shippingMethod === 1 ? (isRTL ? 'استلام من المتجر' : 'Store Pickup') : order.shippingMethod === 2 ? 'Nool Delivery' : 'Aramex Courier'}</span></p>
            ${order.trackingNumber ? `<p><strong>${isRTL ? 'رقم التتبع' : 'Tracking Number'}:</strong> ${order.trackingNumber}</p>` : ''}
          </div>
        </div>

        ${order.isGift ? `
        <div class="gift-section" style="margin-bottom: 30px; padding: 20px; border: 2px solid #10b981; border-radius: 8px; background-color: #f0fdf4;">
          <h3 style="color: #10b981; margin-bottom: 15px;">${isRTL ? '🎁 معلومات الهدية' : '🎁 Gift Information'}</h3>
          ${order.giftRecipientName ? `<p><strong>${isRTL ? 'اسم المستلم' : 'Recipient Name'}:</strong> ${order.giftRecipientName}</p>` : ''}
          ${order.giftRecipientPhone ? `<p><strong>${isRTL ? 'هاتف المستلم' : 'Recipient Phone'}:</strong> ${order.giftRecipientPhone}</p>` : ''}
          ${order.giftRecipientEmail ? `<p><strong>${isRTL ? 'بريد المستلم' : 'Recipient Email'}:</strong> ${order.giftRecipientEmail}</p>` : ''}
          ${order.giftRecipientAddress ? `
            <p><strong>${isRTL ? 'عنوان التسليم' : 'Delivery Address'}:</strong><br/>
               ${order.giftRecipientAddress}<br/>
               ${order.giftRecipientCity || order.city}, ${order.giftRecipientCountry || order.country}${order.giftRecipientPostalCode ? ` - ${order.giftRecipientPostalCode}` : ''}
            </p>
          ` : ''}
          ${order.giftMessage ? `
            <p><strong>${isRTL ? 'رسالة الهدية' : 'Gift Message'}:</strong></p>
            <div style="padding: 10px; background-color: white; border-radius: 4px; font-style: italic; margin-top: 5px;">
              "${order.giftMessage}"
            </div>
          ` : ''}
        </div>
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th>${isRTL ? 'المنتج' : 'Product'}</th>
              <th>${isRTL ? 'الكمية' : 'Quantity'}</th>
              <th>${isRTL ? 'السعر' : 'Price'}</th>
              <th>${isRTL ? 'المجموع' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td>
                  ${item.productName || 'Product'}
                  ${item.variantInfo ? `<br/><small style="background-color: #fef9c3; padding: 2px 6px; border-radius: 3px; color: #854d0e; font-weight: 500;">${item.variantInfo}</small>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice?.toFixed(3) || '0.000'} ${isRTL ? 'ر.ع.' : 'OMR'}</td>
                <td>${item.totalAmount?.toFixed(3) || '0.000'} ${isRTL ? 'ر.ع.' : 'OMR'}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="total">
          <p>${isRTL ? 'الشحن' : 'Shipping'}: ${order.shippingCost?.toFixed(3) || '0.000'} ${isRTL ? 'ر.ع.' : 'OMR'}</p>
          <p><strong>${isRTL ? 'المجموع الإجمالي' : 'Total Amount'}: ${order.totalAmount.toFixed(3)} ${isRTL ? 'ر.ع.' : 'OMR'}</strong></p>
        </div>

        ${order.notes ? `
          <div style="margin-top: 30px;">
            <h3>${isRTL ? 'ملاحظات' : 'Notes'}</h3>
            <p>${order.notes}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 16px; margin-bottom: 5px;">${isRTL ? 'شكراً لطلبك!' : 'Thank you for your Order!'}</p>
          <p style="margin: 0;"><a href="https://spirithubcafe.com" style="color: #333; text-decoration: none;">https://spirithubcafe.com</a></p>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'partiallyrefunded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isArabic ? 'إدارة الطلبات' : 'Orders Management'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'عرض وإدارة طلبات العملاء'
                : 'View and manage customer orders'}
            </p>
          </div>
        </div>
        <Button onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {isArabic ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الطلبات' : 'Total Orders'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'قيد الانتظار' : 'Pending'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'مكتمل' : 'Completed'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'Delivered').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              OMR {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 shrink-0">
                <Package className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  {isArabic ? 'خطأ في تحميل الطلبات' : 'Error Loading Orders'}
                </h3>
                <p className="text-sm text-red-700 mb-2">{error}</p>
                {error.includes('500') && (
                  <div className="text-xs text-red-600 bg-red-100 p-3 rounded mb-3">
                    <strong>{isArabic ? 'إجراءات مقترحة:' : 'Suggested Actions:'}</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{isArabic ? 'تحقق من أن جدول Orders موجود في قاعدة البيانات' : 'Check that Orders table exists in database'}</li>
                      <li>{isArabic ? 'راجع console للحصول على تفاصيل الخطأ' : 'Check browser console for error details'}</li>
                      <li>{isArabic ? 'تحقق من أن API endpoint مطبق بشكل صحيح' : 'Verify API endpoint is implemented correctly'}</li>
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={loadOrders} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {isArabic ? 'حاول مرة أخرى' : 'Try Again'}
                  </Button>
                  <Button 
                    onClick={() => window.open('https://spirithubapi.sbc.om/swagger', '_blank')} 
                    variant="outline" 
                    size="sm"
                  >
                    {isArabic ? 'افتح Swagger' : 'Open Swagger'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'الطلبات الأخيرة' : 'Recent Orders'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'تعذر تحميل الطلبات' : 'Could not load orders'}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد طلبات' : 'No orders found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? 'رقم الطلب' : 'Order #'}</TableHead>
                    <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
                    <TableHead>{isArabic ? 'معرف المستخدم' : 'User ID'}</TableHead>
                    <TableHead>{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                    <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isArabic ? 'الدفع' : 'Payment'}</TableHead>
                    <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead className="text-right">
                      {isArabic ? 'الإجراءات' : 'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.fullName}</div>
                          <div className="text-xs text-muted-foreground">{order.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.userId ? (
                            <span className="font-mono text-blue-600">{order.userId}</span>
                          ) : (
                            <span className="text-red-500 italic">{isArabic ? 'مفقود!' : 'Missing!'}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>OMR {order.totalAmount.toFixed(3)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            title={isArabic ? 'تعديل الطلب' : 'Edit Order'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleGenerateInvoice(order)}
                            title={isArabic ? 'طباعة الفاتورة' : 'Print Invoice'}
                            disabled={invoiceLoading}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {order.paymentStatus !== 'Paid' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleGeneratePaymentLink(order)}
                              title={isArabic ? 'إنشاء رابط دفع' : 'Generate Payment Link'}
                              disabled={paymentLinkLoading}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isArabic ? 'تعديل الطلب' : 'Edit Order'}
            </DialogTitle>
            <DialogDescription>
              {isArabic 
                ? `تعديل حالة الطلب ${selectedOrder?.orderNumber || ''}`
                : `Update order ${selectedOrder?.orderNumber || ''} status`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Order Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">
                {isArabic ? 'حالة الطلب' : 'Order Status'}
              </Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as OrderStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={isArabic ? 'اختر الحالة' : 'Select status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                  <SelectItem value="Processing">{isArabic ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                  <SelectItem value="Shipped">{isArabic ? 'تم الشحن' : 'Shipped'}</SelectItem>
                  <SelectItem value="Delivered">{isArabic ? 'تم التسليم' : 'Delivered'}</SelectItem>
                  <SelectItem value="Cancelled">{isArabic ? 'ملغي' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="grid gap-2">
              <Label htmlFor="paymentStatus">
                {isArabic ? 'حالة الدفع' : 'Payment Status'}
              </Label>
              <Select value={editPaymentStatus} onValueChange={(value) => setEditPaymentStatus(value as PaymentStatus)}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder={isArabic ? 'اختر حالة الدفع' : 'Select payment status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unpaid">{isArabic ? 'غير مدفوع' : 'Unpaid'}</SelectItem>
                  <SelectItem value="Paid">{isArabic ? 'مدفوع' : 'Paid'}</SelectItem>
                  <SelectItem value="Failed">{isArabic ? 'فشل' : 'Failed'}</SelectItem>
                  <SelectItem value="Refunded">{isArabic ? 'مسترد' : 'Refunded'}</SelectItem>
                  <SelectItem value="PartiallyRefunded">{isArabic ? 'مسترد جزئياً' : 'Partially Refunded'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tracking Number */}
            <div className="grid gap-2">
              <Label htmlFor="tracking">
                {isArabic ? 'رقم التتبع' : 'Tracking Number'}
              </Label>
              <Input
                id="tracking"
                value={editTrackingNumber}
                onChange={(e) => setEditTrackingNumber(e.target.value)}
                placeholder={isArabic ? 'أدخل رقم التتبع' : 'Enter tracking number'}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={editLoading}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={editLoading}
            >
              {editLoading 
                ? (isArabic ? 'جاري الحفظ...' : 'Saving...') 
                : (isArabic ? 'حفظ' : 'Save')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isArabic ? 'تفاصيل الطلب' : 'Order Details'} #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Order Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {isArabic ? 'حالة الطلب' : 'Order Status'}
                        </span>
                      </div>
                      <Badge className={`${getStatusColor(selectedOrder.status)} mt-2`}>
                        {selectedOrder.status}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {isArabic ? 'حالة الدفع' : 'Payment Status'}
                        </span>
                      </div>
                      <Badge className={`${getPaymentStatusColor(selectedOrder.paymentStatus)} mt-2`}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}
                        </span>
                      </div>
                      <div className="text-lg font-bold mt-1">
                        {selectedOrder.totalAmount.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {isArabic ? 'معلومات العميل' : 'Customer Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'الاسم الكامل' : 'Full Name'}
                        </Label>
                        <p className="mt-1 font-medium">{selectedOrder.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'البريد الإلكتروني' : 'Email'}
                        </Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedOrder.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                        </Label>
                        <p className="mt-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedOrder.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'المنطقة/المدينة' : 'City/Region'}
                        </Label>
                        <p className="mt-1">{selectedOrder.city}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'البلد' : 'Country'}
                        </Label>
                        <p className="mt-1">{selectedOrder.country}</p>
                      </div>
                      {selectedOrder.postalCode && (
                        <div>
                          <Label className="text-sm font-medium">
                            {isArabic ? 'الرمز البريدي' : 'Postal Code'}
                          </Label>
                          <p className="mt-1">{selectedOrder.postalCode}</p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">
                          {isArabic ? 'العنوان الكامل' : 'Full Address'}
                        </Label>
                        <p className="mt-1 p-3 bg-muted rounded-md">
                          {selectedOrder.address}
                          <br />
                          {selectedOrder.city}, {selectedOrder.country}
                          {selectedOrder.postalCode && ` - ${selectedOrder.postalCode}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {isArabic ? 'معلومات الشحن' : 'Shipping Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'طريقة الشحن' : 'Shipping Method'}
                        </Label>
                        <p className="mt-1">
                          {selectedOrder.shippingMethod === 1 
                            ? (isArabic ? 'استلام من المتجر' : 'Store Pickup')
                            : selectedOrder.shippingMethod === 2 
                            ? 'Nool Delivery'
                            : 'Aramex Courier'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          {isArabic ? 'تكلفة الشحن' : 'Shipping Cost'}
                        </Label>
                        <p className="mt-1">
                          {selectedOrder.shippingCost?.toFixed(3) || '0.000'} {isArabic ? 'ر.ع.' : 'OMR'}
                        </p>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium">
                            {isArabic ? 'رقم التتبع' : 'Tracking Number'}
                          </Label>
                          <p className="mt-1 font-mono text-sm bg-muted px-2 py-1 rounded">
                            {selectedOrder.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {isArabic ? 'عناصر الطلب' : 'Order Items'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {item.productImage && (
                              <img 
                                src={item.productImage} 
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{item.productName}</h4>
                              {item.variantInfo && (
                                <p className="text-sm text-muted-foreground">{item.variantInfo}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {isArabic ? 'الكمية' : 'Qty'}: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {item.totalAmount.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.unitPrice.toFixed(3)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-muted-foreground text-center py-4">
                          {isArabic ? 'لا توجد عناصر' : 'No items found'}
                        </p>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Order Total */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{isArabic ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                        <span>{selectedOrder.shippingCost?.toFixed(3) || '0.000'} {isArabic ? 'ر.ع.' : 'OMR'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                        <span>{selectedOrder.totalAmount.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gift Information */}
                {selectedOrder.isGift && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Gift className="h-4 w-4" />
                        {isArabic ? '🎁 تفاصيل الهدية' : '🎁 Gift Details'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedOrder.giftRecipientName && (
                          <div>
                            <Label className="text-sm font-medium text-green-800">
                              {isArabic ? 'اسم المستلم' : 'Recipient Name'}
                            </Label>
                            <p className="mt-1 font-medium">{selectedOrder.giftRecipientName}</p>
                          </div>
                        )}
                        {selectedOrder.giftRecipientPhone && (
                          <div>
                            <Label className="text-sm font-medium text-green-800">
                              {isArabic ? 'هاتف المستلم' : 'Recipient Phone'}
                            </Label>
                            <p className="mt-1 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {selectedOrder.giftRecipientPhone}
                            </p>
                          </div>
                        )}
                        {selectedOrder.giftRecipientEmail && (
                          <div>
                            <Label className="text-sm font-medium text-green-800">
                              {isArabic ? 'بريد المستلم' : 'Recipient Email'}
                            </Label>
                            <p className="mt-1 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {selectedOrder.giftRecipientEmail}
                            </p>
                          </div>
                        )}
                        {selectedOrder.giftRecipientAddress && (
                          <div>
                            <Label className="text-sm font-medium text-green-800">
                              {isArabic ? 'عنوان التسليم' : 'Delivery Address'}
                            </Label>
                            <p className="mt-1">{selectedOrder.giftRecipientAddress}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedOrder.giftRecipientCity || selectedOrder.city}, {selectedOrder.giftRecipientCountry || selectedOrder.country}
                              {selectedOrder.giftRecipientPostalCode && ` - ${selectedOrder.giftRecipientPostalCode}`}
                            </p>
                          </div>
                        )}
                        {selectedOrder.giftMessage && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-green-800">
                              {isArabic ? 'رسالة الهدية' : 'Gift Message'}
                            </Label>
                            <div className="mt-1 p-3 bg-white border border-green-200 rounded-md italic">
                              "{selectedOrder.giftMessage}"
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{isArabic ? 'ملاحظات' : 'Notes'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="p-3 bg-muted rounded-md">{selectedOrder.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Order Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {isArabic ? 'التواريخ المهمة' : 'Important Dates'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {isArabic ? 'تاريخ الإنشاء' : 'Created Date'}
                        </span>
                        <span className="text-sm">
                          {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {selectedOrder.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {isArabic ? 'آخر تحديث' : 'Last Updated'}
                          </span>
                          <span className="text-sm">
                            {format(new Date(selectedOrder.updatedAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
            <Button onClick={() => {
              if (selectedOrder) {
                handleGenerateInvoice(selectedOrder);
              }
            }}>
              <FileText className="h-4 w-4 mr-2" />
              {isArabic ? 'طباعة الفاتورة' : 'Print Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Link Dialog */}
      <Dialog open={showPaymentLinkDialog} onOpenChange={setShowPaymentLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              {isArabic ? 'رابط الدفع' : 'Payment Link'}
            </DialogTitle>
            <DialogDescription>
              {isArabic 
                ? `رابط الدفع للطلب ${selectedOrder?.orderNumber || ''}`
                : `Payment link for order ${selectedOrder?.orderNumber || ''}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentLink">
                {isArabic ? 'رابط الدفع' : 'Payment Link'}
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="paymentLink"
                  value={generatedPaymentLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPaymentLink}
                  className="shrink-0"
                >
                  {linkCopied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {linkCopied && (
                <p className="text-sm text-green-600 mt-1">
                  {isArabic ? 'تم نسخ الرابط!' : 'Link copied!'}
                </p>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">
                {isArabic ? 'كيفية الاستخدام' : 'How to use'}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  {isArabic 
                    ? '• انسخ الرابط وأرسله للعميل'
                    : '• Copy the link and send it to the customer'
                  }
                </li>
                <li>
                  {isArabic 
                    ? '• الرابط صالح لمدة 24 ساعة'
                    : '• Link is valid for 24 hours'
                  }
                </li>
                <li>
                  {isArabic 
                    ? '• بعد الدفع سيتم تحديث حالة الطلب تلقائياً'
                    : '• Order status will be updated automatically after payment'
                  }
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPaymentLinkDialog(false)}>
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
            <Button onClick={handleCopyPaymentLink}>
              <Copy className="h-4 w-4 mr-2" />
              {isArabic ? 'نسخ الرابط' : 'Copy Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
