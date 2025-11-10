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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<OrderStatus>('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Pending');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');

  const isArabic = language === 'ar';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAll({
        page: 1,
        pageSize: 50,
      });
      
      // Handle different response structures
      const ordersList = response?.items || response || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
      
      // Calculate total revenue
      if (Array.isArray(ordersList) && ordersList.length > 0) {
        const revenue = ordersList
          .filter(o => o.paymentStatus === 'Paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        setTotalRevenue(revenue);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
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
          shippingMethodId: selectedOrder.shippingMethodId || 1,
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
      case 'completed':
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
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
                      <TableCell>{`${order.firstName} ${order.lastName}`}</TableCell>
                      <TableCell>{order.items?.length || 0}</TableCell>
                      <TableCell>OMR {order.totalAmount.toFixed(2)}</TableCell>
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
                  <SelectItem value="Refunded">{isArabic ? 'مسترد' : 'Refunded'}</SelectItem>
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
                  <SelectItem value="Pending">{isArabic ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                  <SelectItem value="Paid">{isArabic ? 'مدفوع' : 'Paid'}</SelectItem>
                  <SelectItem value="Failed">{isArabic ? 'فشل' : 'Failed'}</SelectItem>
                  <SelectItem value="Refunded">{isArabic ? 'مسترد' : 'Refunded'}</SelectItem>
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
