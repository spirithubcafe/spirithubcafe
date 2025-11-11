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
import { FileText, RefreshCw, Eye, Package, DollarSign, Calendar, Edit } from 'lucide-react';
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');

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
      setOrders(Array.isArray(ordersList) ? ordersList : []);
      
      // Calculate total revenue
      if (Array.isArray(ordersList) && ordersList.length > 0) {
        const revenue = ordersList
          .filter(o => o.paymentStatus === 'Paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        setTotalRevenue(revenue);
        console.log(`💰 Total revenue: ${revenue.toFixed(3)} OMR from ${ordersList.length} orders`);
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
                    <TableHead>{isArabic ? 'العناصر' : 'Items'}</TableHead>
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
                      <TableCell>{order.items?.length || 0}</TableCell>
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
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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
    </div>
  );
};
