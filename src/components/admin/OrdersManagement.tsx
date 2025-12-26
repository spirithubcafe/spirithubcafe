import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
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
  MoreHorizontal,
  Bell,
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
  CreditCard,
  PackagePlus,
  XCircle,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight
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

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<number>>(new Set());
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const highlightTimeoutsRef = useRef<Map<number, number>>(new Map());
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  const [showShipmentConfirmDialog, setShowShipmentConfirmDialog] = useState(false);
  const [showShipmentResultDialog, setShowShipmentResultDialog] = useState(false);
  
  const [editLoading, setEditLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState<number | null>(null);
  const [printLabelLoading, setPrintLabelLoading] = useState<number | null>(null);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  
  // Payment link state
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Shipment state
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [shipmentError, setShipmentError] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const isArabic = language === 'ar';

  const getRegionLoginPath = (): string => {
    const regionFromPath = window.location.pathname.match(/^\/(om|sa)(\/|$)/)?.[1] as
      | 'om'
      | 'sa'
      | undefined;
    const region = regionFromPath || (localStorage.getItem('spirithub-region') as 'om' | 'sa' | null) || 'om';
    return `/${region}/login`;
  };

  const markAllSeen = () => {
    // Clear any highlights and persist "seen" marker.
    for (const timeoutId of highlightTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    highlightTimeoutsRef.current.clear();
    setHighlightedOrderIds(new Set());
    localStorage.setItem('spirithub_admin_orders_last_seen', new Date().toISOString());
  };

  const notifyNewOrders = async (newOrders: Order[]) => {
    if (!notificationsEnabled || newOrders.length === 0) return;

    const count = newOrders.length;
    const newest = newOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    toast(
      isArabic
        ? `طلب جديد (${count}) — ${newest?.orderNumber ?? ''}`
        : `New order (${count}) — ${newest?.orderNumber ?? ''}`,
      {
        description: newest
          ? isArabic
            ? `${newest.fullName || newest.customerName || newest.userName || newest.email || 'عميل'} • OMR ${newest.totalAmount.toFixed(3)}`
            : `${newest.fullName || newest.customerName || newest.userName || newest.email || 'Customer'} • OMR ${newest.totalAmount.toFixed(3)}`
          : undefined,
        duration: 6000,
      },
    );

    // Browser notifications (optional, permission-based)
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        const title = isArabic ? 'طلب جديد' : 'New Order';
        const customerName = newest?.fullName || newest?.customerName || newest?.userName || newest?.email || (isArabic ? 'عميل' : 'Customer');
        const body = newest
          ? `${newest.orderNumber} • ${customerName} • OMR ${newest.totalAmount.toFixed(3)}`
          : isArabic
            ? 'وصلت طلبات جديدة'
            : 'New orders arrived';
        new Notification(title, { body });
      }
    } catch {
      // Ignore notification errors
    }
  };

  useEffect(() => {
    // Initialize known order IDs from localStorage
    try {
      const savedOrderIds = localStorage.getItem('spirithub_admin_known_order_ids');
      if (savedOrderIds) {
        const parsedIds = JSON.parse(savedOrderIds);
        knownOrderIdsRef.current = new Set(parsedIds);
        console.log('📋 Restored known order IDs:', parsedIds.length);
      }
    } catch (error) {
      console.error('Failed to restore known order IDs:', error);
    }
    
    loadOrders();
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const intervalId = window.setInterval(() => {
      loadOrders({ silent: true });
    }, 30_000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled]);

  const loadOrders = async ({ silent = false, page, size }: { silent?: boolean; page?: number; size?: number } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    
    const targetPage = page ?? currentPage;
    const targetSize = size ?? pageSize;
    
    try {
      console.log('🔄 Loading orders from API...');
      console.log('📍 API Base URL:', 'https://api.spirithubcafe.com');
      
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token exists:', !!token);
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      }
      
      console.log('📤 Request parameters:', { page: targetPage, pageSize: targetSize });
      
      const response = await orderService.getOrders({
        page: targetPage,
        pageSize: targetSize,
      });
      
      console.log('✅ Orders API Response:', response);
      console.log('📊 Response structure:', {
        hasSuccess: 'success' in response,
        hasData: 'data' in response,
        hasPagination: 'pagination' in response,
        dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 0
      });
      
      // Update pagination info
      if (response.pagination) {
        setTotalCount(response.pagination.totalCount);
        setTotalPages(Math.ceil(response.pagination.totalCount / targetSize));
        setCurrentPage(targetPage);
        setPageSize(targetSize);
      }
      
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

      // Get last seen timestamp
      const lastSeenStr = localStorage.getItem('spirithub_admin_orders_last_seen');
      const lastSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
      
      // Detect and highlight new orders (orders created after last seen time AND not in known IDs)
      const newOrders = ordersWithItems.filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime > lastSeenTime && !knownOrderIdsRef.current.has(o.id);
      });
      
      if (newOrders.length > 0 && !silent) {
        // Update highlights (auto-expire)
        setHighlightedOrderIds((prev) => {
          const next = new Set(prev);
          for (const o of newOrders) {
            next.add(o.id);

            const existingTimeout = highlightTimeoutsRef.current.get(o.id);
            if (existingTimeout) window.clearTimeout(existingTimeout);
            const timeoutId = window.setTimeout(() => {
              setHighlightedOrderIds((current) => {
                const updated = new Set(current);
                updated.delete(o.id);
                return updated;
              });
              highlightTimeoutsRef.current.delete(o.id);
            }, 5 * 60_000);
            highlightTimeoutsRef.current.set(o.id, timeoutId);
          }
          return next;
        });

        // Notify admin
        await notifyNewOrders(newOrders);
      }

      // Update known order ids and persist to localStorage
      knownOrderIdsRef.current = new Set(ordersWithItems.map((o) => o.id));
      try {
        localStorage.setItem('spirithub_admin_known_order_ids', JSON.stringify(Array.from(knownOrderIdsRef.current)));
      } catch (error) {
        console.error('Failed to save known order IDs:', error);
      }
      
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
          window.location.href = getRegionLoginPath();
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
      if (!silent) setLoading(false);
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const paidOrders = useMemo(() => {
    return sortedOrders.filter((o) => String(o.paymentStatus).toLowerCase() === 'paid');
  }, [sortedOrders]);

  const otherOrders = useMemo(() => {
    return sortedOrders.filter((o) => String(o.paymentStatus).toLowerCase() !== 'paid');
  }, [sortedOrders]);

  const newOrdersCount = highlightedOrderIds.size;

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(isArabic ? 'تم النسخ' : 'Copied', {
        description: `${label}: ${value}`,
        duration: 2500,
      });
    } catch {
      toast(isArabic ? 'فشل النسخ' : 'Copy failed', {
        description: label,
        duration: 2500,
      });
    }
  };

  const OrderActionsMenu = ({ order, triggerVariant }: { order: Order; triggerVariant: 'icon' | 'button' }) => {
    const trigger =
      triggerVariant === 'icon' ? (
        <Button variant="ghost" size="icon" aria-label={isArabic ? 'الإجراءات' : 'Actions'} title={isArabic ? 'الإجراءات' : 'Actions'}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" aria-label={isArabic ? 'الإجراءات' : 'Actions'} title={isArabic ? 'الإجراءات' : 'Actions'}>
          <MoreHorizontal className="h-4 w-4 mr-2" />
          {isArabic ? 'الإجراءات' : 'Actions'}
        </Button>
      );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
            <Eye className="h-4 w-4" />
            {isArabic ? 'التفاصيل' : 'Details'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleEditOrder(order)}>
            <Edit className="h-4 w-4" />
            {isArabic ? 'تعديل' : 'Edit'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleGenerateInvoice(order)} disabled={invoiceLoading}>
            <FileText className="h-4 w-4" />
            {isArabic ? 'فاتورة' : 'Invoice'}
          </DropdownMenuItem>
          {String(order.paymentStatus).toLowerCase() !== 'paid' && (
            <DropdownMenuItem onSelect={() => handleGeneratePaymentLink(order)} disabled={paymentLinkLoading}>
              <CreditCard className="h-4 w-4" />
              {isArabic ? 'رابط دفع' : 'Pay link'}
            </DropdownMenuItem>
          )}

          {order.shippingMethod === 3 && !order.trackingNumber && (
            <DropdownMenuItem
              onSelect={() => handleCreateShipment(order)}
              disabled={shipmentLoading === order.id}
              className="text-red-700 focus:text-red-700"
            >
              {shipmentLoading === order.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}
              {isArabic ? 'شحنة أرامكس' : 'Create Aramex'}
            </DropdownMenuItem>
          )}

          {order.shippingMethod === 3 && order.trackingNumber && (
            <>
              <DropdownMenuItem
                onSelect={() => handlePrintLabel(order)}
                disabled={printLabelLoading === order.id}
                className="text-green-700 focus:text-green-700"
              >
                {printLabelLoading === order.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isArabic ? 'ملصق الشحن' : 'Print Label'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => window.open(`https://www.aramex.com/om/en/track/shipments?ShipmentNumber=${order.trackingNumber}`, '_blank', 'noopener,noreferrer')}
              >
                <Truck className="h-4 w-4" />
                {isArabic ? 'تتبع أرامكس' : 'Track Aramex'}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => copyToClipboard(order.orderNumber, isArabic ? 'رقم الطلب' : 'Order #')}>
            <Copy className="h-4 w-4" />
            {isArabic ? 'نسخ رقم الطلب' : 'Copy order #'}
          </DropdownMenuItem>
          {order.email && (
            <DropdownMenuItem onSelect={() => copyToClipboard(order.email, isArabic ? 'البريد' : 'Email')}>
              <Mail className="h-4 w-4" />
              {isArabic ? 'نسخ البريد' : 'Copy email'}
            </DropdownMenuItem>
          )}
          {order.phone && (
            <>
              <DropdownMenuItem onSelect={() => copyToClipboard(order.phone, isArabic ? 'الهاتف' : 'Phone')}>
                <Phone className="h-4 w-4" />
                {isArabic ? 'نسخ الهاتف' : 'Copy phone'}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {
                const phoneNumber = order.phone.replace(/[^0-9+]/g, '');
                const customerName = order.customerName || (isArabic ? 'العميل' : 'Customer');
                const orderAmount = `${order.totalAmount.toFixed(3)} OMR`;
                
                // Create a professional message template with branding
                const message = isArabic 
                  ? `*SpiritHub Roastery*\n\nمرحباً ${customerName}،\n\nشكراً لك على تقديم طلبك لدى SpiritHub Roastery.\n\n*تفاصيل الطلب:*\nرقم الطلب: ${order.orderNumber}\nالمبلغ الإجمالي: ${orderAmount}\n\nسيتواصل معك فريقنا قريباً لتأكيد تفاصيل الطلب.\n\nشكراً لاختيارك SpiritHub Roastery، نحن نقدر دعمك حقاً.\n\nمع أطيب التحيات،\nSpiritHub Roastery\n\nhttps://spirithubcafe.com/products/`
                  : `*SpiritHub Roastery*\n\nHello ${customerName},\n\nThank you for placing your order with SpiritHub Roastery.\n\n*Order Details:*\nOrder Number: ${order.orderNumber}\nTotal Amount: ${orderAmount}\n\nOur team will be in touch shortly to confirm the order details.\n\nThank you for choosing SpiritHub Roastery, we truly appreciate your support.\n\nWarm regards,\nSpiritHub Roastery\n\nhttps://spirithubcafe.com/products/`;
                
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
              }}>
                <Phone className="h-4 w-4 text-green-600" />
                {isArabic ? 'واتساب العميل' : 'WhatsApp customer'}
              </DropdownMenuItem>
            </>
          )}
          {order.trackingNumber ? (
            <DropdownMenuItem
              onSelect={() => copyToClipboard(order.trackingNumber!, isArabic ? 'رقم التتبع' : 'Tracking')}
            >
              <Truck className="h-4 w-4" />
              {isArabic ? 'نسخ رقم التتبع' : 'Copy tracking'}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
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

  const handleCreateShipment = async (order: Order) => {
    if (order.shippingMethod !== 3) {
      setShipmentError(isArabic ? 'هذا الطلب ليس من نوع أرامكس' : 'This order is not an Aramex order');
      setShowShipmentResultDialog(true);
      return;
    }

    if (order.trackingNumber) {
      setShipmentError(isArabic ? 'هذا الطلب لديه رقم تتبع بالفعل' : 'This order already has a tracking number');
      setShowShipmentResultDialog(true);
      return;
    }

    setSelectedOrder(order);
    setShowShipmentConfirmDialog(true);
  };

  const confirmCreateShipment = async () => {
    if (!selectedOrder) return;
    
    setShowShipmentConfirmDialog(false);
    setShipmentLoading(selectedOrder.id);
    
    try {
      const { createShipmentForOrder } = await import('../../services');
      const response = await createShipmentForOrder(selectedOrder.id);
      
      console.log('📥 Response from API:', response);
      
      if (response.success) {
        setShipmentResult(response);
        setShipmentError('');
        
        // Reload orders to get updated tracking number
        await loadOrders();
        
        console.log('✅ Aramex shipment created successfully');
      } else {
        const errorMsg = response.error || response.errors?.join('\n') || 'Failed to create shipment';
        setShipmentError(errorMsg);
        setShipmentResult(null);
      }
    } catch (error: any) {
      console.error('❌ Error creating Aramex shipment:', error);
      
      let errorMessage = error?.message || 'Unknown error';
      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors.join('\n');
      } else if (error?.errors && typeof error.errors === 'string') {
        errorMessage = error.errors;
      }
      
      setShipmentError(errorMessage);
      setShipmentResult(null);
    } finally {
      setShipmentLoading(null);
      setShowShipmentResultDialog(true);
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

  const handlePrintLabel = async (order: Order) => {
    if (!order.trackingNumber) {
      alert(isArabic ? 'لا يوجد رقم تتبع لهذا الطلب' : 'No tracking number for this order');
      return;
    }

    setPrintLabelLoading(order.id);
    
    try {
      const { printLabel } = await import('../../services');
      await printLabel(order.trackingNumber);
      console.log('✅ Label downloaded successfully');
    } catch (error: any) {
      console.error('❌ Error downloading label:', error);
      alert(isArabic ? 'فشل تحميل الملصق' : 'Failed to download label');
    } finally {
      setPrintLabelLoading(null);
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
          @page { size: portrait; margin: 15mm; }
          @media print {
            body { margin: 0; }
            .page-break { page-break-after: always; }
          }
          body { font-family: ${isRTL ? '"Arial", "Tahoma"' : 'Arial, sans-serif'}; margin: 20px; max-width: 210mm; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; position: relative; min-height: 120px; }
          .header .logo { position: absolute; ${isRTL ? 'left' : 'right'}: 0; top: 0; width: 100px; height: auto; }
          .header .company-info { position: absolute; ${isRTL ? 'right' : 'left'}: 0; top: 0; text-align: ${isRTL ? 'right' : 'left'}; font-size: 11px; line-height: 1.4; }
          .header .company-info p { margin: 2px 0; }
          .header .company-info strong { font-size: 13px; }
          .header h1 { margin: 5px 0; font-size: 24px; }
          .header h2 { margin: 5px 0; font-size: 20px; }
          .header p { margin: 5px 0; font-size: 13px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info h3 { font-size: 14px; margin-bottom: 8px; }
          .info p { font-size: 12px; margin: 4px 0; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: ${isRTL ? 'right' : 'left'}; }
          .items th { background-color: #f5f5f5; font-size: 13px; }
          .total { text-align: ${isRTL ? 'left' : 'right'}; font-size: 14px; font-weight: bold; }
          .total p { margin: 5px 0; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 5px; color: white; }
          .status.paid { background-color: #10b981; }
          .status.unpaid { background-color: #f59e0b; }
          .status.failed { background-color: #ef4444; }
          .gift-section { margin-bottom: 20px; padding: 15px; border: 2px solid #10b981; border-radius: 8px; background-color: #f0fdf4; }
          .gift-section h3 { font-size: 14px; margin-bottom: 10px; }
          .gift-section p { font-size: 12px; margin: 4px 0; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; }
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
            <p style="margin-top: 6px; margin-bottom: 18px;">${isRTL ? 'ضريبة' : 'VAT'}: OM110025057X</p>
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
        <div class="gift-section">
          <h3 style="color: #10b981;">${isRTL ? '🎁 معلومات الهدية' : '🎁 Gift Information'}</h3>
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
            <div style="padding: 8px; background-color: white; border-radius: 4px; font-style: italic; margin-top: 5px; font-size: 11px;">
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
          <div style="margin-top: 20px;">
            <h3 style="font-size: 14px; margin-bottom: 8px;">${isRTL ? 'ملاحظات' : 'Notes'}</h3>
            <p style="font-size: 12px; margin: 0;">${order.notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p style="font-size: 14px; margin-bottom: 5px; font-weight: 500;">${isRTL ? 'شكراً لطلبك!' : 'Thank you for your Order!'}</p>
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

  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Order #',
        'Customer Name',
        'Email',
        'Phone',
        'Amount (OMR)',
        'Status',
        'Payment Status',
        'Shipping Method',
        'Tracking Number',
        'Address',
        'City',
        'Country',
        'Postal Code',
        'Date',
        'Items',
        'Is Gift',
        'Gift Recipient',
        'Gift Message',
        'Notes'
      ];

      const rows = sortedOrders.map(order => {
        const shippingMethod = 
          order.shippingMethod === 1 ? 'Store Pickup' :
          order.shippingMethod === 2 ? 'Nool Delivery' :
          order.shippingMethod === 3 ? 'Aramex Courier' : 'Unknown';
        
        const itemsList = order.items?.map(item => 
          `${item.productName}${item.variantInfo ? ` (${item.variantInfo})` : ''} x${item.quantity}`
        ).join('; ') || '';

        return [
          order.orderNumber,
          order.fullName,
          order.email,
          order.phone,
          order.totalAmount.toFixed(3),
          order.status,
          order.paymentStatus,
          shippingMethod,
          order.trackingNumber || '',
          order.address,
          order.city,
          order.country,
          order.postalCode || '',
          format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          itemsList,
          order.isGift ? 'Yes' : 'No',
          order.giftRecipientName || '',
          order.giftMessage || '',
          order.notes || ''
        ];
      });

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape cells containing commas, quotes, or newlines
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast(isArabic ? 'تم التصدير بنجاح' : 'Export successful', {
        description: isArabic ? `تم تصدير ${orders.length} طلب` : `Exported ${orders.length} orders`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast(isArabic ? 'فشل التصدير' : 'Export failed', {
        description: isArabic ? 'حدث خطأ أثناء التصدير' : 'An error occurred during export',
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 rounded-md border bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <Switch checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
              <span className="text-xs text-muted-foreground">{isArabic ? 'تحديث تلقائي' : 'Auto refresh'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              <span className="text-xs text-muted-foreground">{isArabic ? 'تنبيه' : 'Notify'}</span>
            </div>
          </div>
          <Button onClick={exportToExcel} disabled={loading || orders.length === 0} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            {isArabic ? 'تصدير إلى Excel' : 'Export to Excel'}
          </Button>
          <Button onClick={() => loadOrders()} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-medium">
              {isArabic ? 'إجمالي الطلبات' : 'Total Orders'}
            </CardTitle>
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-medium">
              {isArabic ? 'طلبات جديدة' : 'New Orders'}
            </CardTitle>
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {newOrdersCount}
            </div>
            {newOrdersCount > 0 ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={markAllSeen}
              >
                {isArabic ? 'تمت المراجعة' : 'Mark seen'}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-medium">
              {isArabic ? 'قيد الانتظار' : 'Pending'}
            </CardTitle>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">
              {orders.filter((o) => o.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-medium">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg font-bold">
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
                    onClick={() => loadOrders()} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {isArabic ? 'حاول مرة أخرى' : 'Try Again'}
                  </Button>
                  <Button 
                    onClick={() => window.open('https://api.spirithubcafe.com/swagger', '_blank')} 
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

      {/* Orders Tables */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>{isArabic ? 'الطلبات' : 'Orders'}</CardTitle>
            <div className="text-xs text-muted-foreground">
              {isArabic ? 'المدفوع في الأعلى، وباقي الطلبات في الأسفل' : 'Paid orders on top, other orders below'}
            </div>
          </div>
          {newOrdersCount > 0 ? (
            <Badge variant="outline" className="border-amber-400 text-amber-700 w-fit">
              {isArabic ? `جديد: ${newOrdersCount}` : `New: ${newOrdersCount}`}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-8">
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
            <>
              {/* Paid Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    {isArabic ? 'طلبات مدفوعة' : 'Paid Orders'}
                  </h2>
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {paidOrders.length}
                  </Badge>
                </div>

                {paidOrders.length === 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {isArabic ? 'لا توجد طلبات مدفوعة بعد' : 'No paid orders yet'}
                  </div>
                ) : (
                  <>
                    {/* Mobile list */}
                    <div className="md:hidden space-y-3">
                      {paidOrders.map((order) => (
                        <div
                          key={order.id}
                          className={cn(
                            'rounded-lg border bg-card p-4',
                            highlightedOrderIds.has(order.id) && 'border-amber-300 bg-amber-50/60',
                          )}
                        >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold">
                          {order.shippingMethod === 1 && (
                            <div className="h-2 w-2 rounded-full bg-pink-300 shrink-0" title={isArabic ? 'استلام من المتجر' : 'Store Pickup'} />
                          )}
                          {order.shippingMethod === 2 && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Nool Delivery" />
                          )}
                          {order.shippingMethod === 3 && (
                            <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" title={isArabic ? 'شحن أرامكس' : 'Aramex Shipping'} />
                          )}
                          <span className="truncate">{order.orderNumber}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {order.fullName} • {order.email}
                        </div>
                        {order.trackingNumber && (
                          <a
                            href={`https://www.aramex.com/om/en/track/shipments?ShipmentNumber=${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-mono hover:underline"
                            title={isArabic ? 'تتبع الشحنة على أرامكس' : 'Track on Aramex'}
                          >
                            <Truck className="h-3 w-3" />
                            {order.trackingNumber}
                          </a>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-semibold">OMR {order.totalAmount.toFixed(3)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>

                          <div className="mt-3 flex items-center justify-end">
                            <OrderActionsMenu order={order} triggerVariant="button" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block w-full min-w-0 max-w-full rounded-md border">
                      <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isArabic ? 'رقم الطلب' : 'Order #'}</TableHead>
                      <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
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
                    {paidOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={cn(highlightedOrderIds.has(order.id) && 'bg-amber-50/60')}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {/* Shipping Method Indicator */}
                            {order.shippingMethod === 1 && (
                              <div className="h-2 w-2 rounded-full bg-pink-300 shrink-0" title={isArabic ? 'استلام من المتجر' : 'Store Pickup'} />
                            )}
                            {order.shippingMethod === 2 && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Nool Delivery" />
                            )}
                            {order.shippingMethod === 3 && (
                              <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" title={isArabic ? 'شحن أرامكس' : 'Aramex Shipping'} />
                            )}
                            <div>
                              <div>{order.orderNumber}</div>
                              {order.trackingNumber && (
                                <a 
                                  href={`https://www.aramex.com/om/en/track/shipments?ShipmentNumber=${order.trackingNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 font-mono mt-0.5 flex items-center gap-1 hover:underline"
                                  title={isArabic ? 'تتبع الشحنة على أرامكس' : 'Track on Aramex'}
                                >
                                  <Truck className="h-3 w-3" />
                                  {order.trackingNumber}
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.fullName}</div>
                            <div className="text-xs text-muted-foreground">{order.email}</div>
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
                          <OrderActionsMenu order={order} triggerVariant="icon" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Other Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    {isArabic ? 'باقي الطلبات' : 'Other Orders'}
                  </h2>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {otherOrders.length}
                  </Badge>
                </div>

                {otherOrders.length === 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {isArabic ? 'لا توجد طلبات أخرى' : 'No other orders'}
                  </div>
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {otherOrders.map((order) => (
                        <div
                          key={order.id}
                          className={cn(
                            'rounded-lg border bg-card p-4',
                            highlightedOrderIds.has(order.id) && 'border-amber-300 bg-amber-50/60',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-semibold">
                                {order.shippingMethod === 1 && (
                                  <div className="h-2 w-2 rounded-full bg-pink-300 shrink-0" title={isArabic ? 'استلام من المتجر' : 'Store Pickup'} />
                                )}
                                {order.shippingMethod === 2 && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Nool Delivery" />
                                )}
                                {order.shippingMethod === 3 && (
                                  <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" title={isArabic ? 'شحن أرامكس' : 'Aramex Shipping'} />
                                )}
                                <span className="truncate">{order.orderNumber}</span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground truncate">
                                {order.fullName} • {order.email}
                              </div>
                              {order.trackingNumber && (
                                <a
                                  href={`https://www.aramex.com/om/en/track/shipments?ShipmentNumber=${order.trackingNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-mono hover:underline"
                                  title={isArabic ? 'تتبع الشحنة على أرامكس' : 'Track on Aramex'}
                                >
                                  <Truck className="h-3 w-3" />
                                  {order.trackingNumber}
                                </a>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="font-semibold">OMR {order.totalAmount.toFixed(3)}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                          </div>

                          <div className="mt-3 flex items-center justify-end">
                            <OrderActionsMenu order={order} triggerVariant="button" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block w-full min-w-0 max-w-full rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{isArabic ? 'رقم الطلب' : 'Order #'}</TableHead>
                            <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
                            <TableHead>{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{isArabic ? 'الدفع' : 'Payment'}</TableHead>
                            <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                            <TableHead className="text-right">{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {otherOrders.map((order) => (
                            <TableRow
                              key={order.id}
                              className={cn(highlightedOrderIds.has(order.id) && 'bg-amber-50/60')}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {order.shippingMethod === 1 && (
                                    <div className="h-2 w-2 rounded-full bg-pink-300 shrink-0" title={isArabic ? 'استلام من المتجر' : 'Store Pickup'} />
                                  )}
                                  {order.shippingMethod === 2 && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Nool Delivery" />
                                  )}
                                  {order.shippingMethod === 3 && (
                                    <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" title={isArabic ? 'شحن أرامكس' : 'Aramex Shipping'} />
                                  )}
                                  <div>
                                    <div>{order.orderNumber}</div>
                                    {order.trackingNumber && (
                                      <a
                                        href={`https://www.aramex.com/om/en/track/shipments?ShipmentNumber=${order.trackingNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 font-mono mt-0.5 flex items-center gap-1 hover:underline"
                                        title={isArabic ? 'تتبع الشحنة على أرامكس' : 'Track on Aramex'}
                                      >
                                        <Truck className="h-3 w-3" />
                                        {order.trackingNumber}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{order.fullName}</div>
                                  <div className="text-xs text-muted-foreground">{order.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>OMR {order.totalAmount.toFixed(3)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                              </TableCell>
                              <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <OrderActionsMenu order={order} triggerVariant="icon" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {/* Shipping Method Legend */}
                {orders.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="text-sm font-medium mb-2">
                      {isArabic ? 'دليل طرق الشحن:' : 'Shipping Method Legend:'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-pink-300 shrink-0" />
                        <span className="text-muted-foreground">
                          {isArabic ? 'استلام من المتجر' : 'Store Pickup'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-muted-foreground">Nool Delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                        <span className="text-muted-foreground">
                          {isArabic ? 'شحن أرامكس' : 'Aramex Courier'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {!loading && orders.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">
                        {isArabic ? 'عدد السجلات:' : 'Records per page:'}
                      </Label>
                      <Select value={String(pageSize)} onValueChange={(value) => {
                        setPageSize(Number(value));
                        loadOrders({ page: 1, size: Number(value) });
                      }}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isArabic 
                        ? `عرض ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount)} من ${totalCount}`
                        : `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}`
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadOrders({ page: currentPage - 1 })}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {isArabic ? 'السابق' : 'Previous'}
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-9 h-9 p-0"
                            onClick={() => loadOrders({ page: pageNum })}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadOrders({ page: currentPage + 1 })}
                      disabled={currentPage === totalPages || loading}
                    >
                      {isArabic ? 'التالي' : 'Next'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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

      {/* Shipment Confirmation Dialog */}
      <Dialog open={showShipmentConfirmDialog} onOpenChange={setShowShipmentConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-red-600" />
              {isArabic ? 'تأكيد إنشاء الشحنة' : 'Confirm Shipment Creation'}
            </DialogTitle>
            <DialogDescription>
              {isArabic 
                ? 'هل أنت متأكد من إنشاء شحنة أرامكس لهذا الطلب؟'
                : 'Are you sure you want to create an Aramex shipment for this order?'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {isArabic ? 'رقم الطلب:' : 'Order #:'}
                  </span>
                  <span className="text-sm">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {isArabic ? 'العميل:' : 'Customer:'}
                  </span>
                  <span className="text-sm">{selectedOrder.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {isArabic ? 'المبلغ:' : 'Amount:'}
                  </span>
                  <span className="text-sm">OMR {selectedOrder.totalAmount.toFixed(3)}</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {isArabic 
                    ? '⚠️ سيتم إرسال بيانات الطلب إلى أرامكس وسيتم الحصول على رقم تتبع.'
                    : '⚠️ Order data will be sent to Aramex and a tracking number will be generated.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowShipmentConfirmDialog(false)}
              disabled={shipmentLoading !== null}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={confirmCreateShipment}
              disabled={shipmentLoading !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {shipmentLoading !== null ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isArabic ? 'جاري الإنشاء...' : 'Creating...'}
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  {isArabic ? 'تأكيد الإنشاء' : 'Confirm Create'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Result Dialog */}
      <Dialog open={showShipmentResultDialog} onOpenChange={setShowShipmentResultDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {shipmentResult ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {isArabic ? 'تم إنشاء الشحنة بنجاح' : 'Shipment Created Successfully'}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  {isArabic ? 'فشل إنشاء الشحنة' : 'Shipment Creation Failed'}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {shipmentResult ? (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex justify-between py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-green-900">
                      {isArabic ? 'رقم الطلب:' : 'Order Number:'}
                    </span>
                    <span className="text-sm text-green-800 font-mono">
                      {shipmentResult.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-green-900">
                      {isArabic ? 'رقم الشحنة:' : 'Shipment Number:'}
                    </span>
                    <span className="text-sm text-green-800 font-mono">
                      {shipmentResult.shipmentNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-green-900">
                      {isArabic ? 'رقم AWB:' : 'AWB Number:'}
                    </span>
                    <span className="text-sm text-green-800 font-mono font-bold">
                      {shipmentResult.awbNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-green-900">
                      {isArabic ? 'التحذيرات:' : 'Warnings:'}
                    </span>
                    <span className="text-sm text-green-800">
                      {shipmentResult.hasWarnings 
                        ? (isArabic ? 'يوجد' : 'Yes') 
                        : (isArabic ? 'لا يوجد' : 'None')}
                    </span>
                  </div>
                </div>

                {shipmentResult.trackingUrl && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <a 
                      href={shipmentResult.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-blue-700 hover:text-blue-800 font-medium"
                    >
                      <Truck className="h-4 w-4" />
                      {isArabic ? 'تتبع الشحنة على موقع أرامكس' : 'Track Shipment on Aramex'}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 whitespace-pre-wrap">
                  {shipmentError}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setShowShipmentResultDialog(false);
                setShipmentResult(null);
                setShipmentError('');
              }}
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
