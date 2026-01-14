import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RefreshCw, Eye, Loader2, Save, Settings2 } from 'lucide-react';

import { useApp } from '../../hooks/useApp';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

import { categoryService, wholesaleOrderService } from '../../services';
import type { Category } from '../../types/product';
import type { WholesaleOrder, WholesaleOrderStatus, WholesalePaymentStatus } from '../../types/wholesale';

const STATUSES: WholesaleOrderStatus[] = ['New', 'Preparing', 'Shipped'];
const PAYMENT_STATUSES: WholesalePaymentStatus[] = ['Pending', 'Paid'];

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  if (!Number.isFinite(value)) return '—';
  return String(value);
};

const safeDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'yyyy-MM-dd HH:mm');
  } catch {
    return iso;
  }
};

const statusBadgeVariant = (status: WholesaleOrderStatus) => {
  switch (status) {
    case 'New':
      return 'secondary' as const;
    case 'Preparing':
      return 'outline' as const;
    case 'Shipped':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
};

const paymentBadgeVariant = (status: WholesalePaymentStatus) => {
  switch (status) {
    case 'Pending':
      return 'secondary' as const;
    case 'Paid':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
};

export const WholesaleOrdersManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [allowedCategories, setAllowedCategories] = useState<number[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allowedCategoriesLoading, setAllowedCategoriesLoading] = useState(false);
  const [allowedCategoriesSaving, setAllowedCategoriesSaving] = useState(false);

  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState<WholesaleOrderStatus | 'All'>('All');
  const [paymentFilter, setPaymentFilter] = useState<WholesalePaymentStatus | 'All'>('All');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editStatus, setEditStatus] = useState<WholesaleOrderStatus>('New');
  const [editPaymentStatus, setEditPaymentStatus] = useState<WholesalePaymentStatus>('Pending');
  const [editManualPrice, setEditManualPrice] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadAllowedCategories = async () => {
    setAllowedCategoriesLoading(true);
    try {
      const [ids, cats] = await Promise.all([
        wholesaleOrderService.getAllowedCategories(),
        categoryService.getAll({ includeInactive: true }),
      ]);
      setAllowedCategories(ids);
      setAllCategories(cats);
    } catch (err: any) {
      console.error('Failed to load allowed categories:', err);
      toast.error(err?.message || (isArabic ? 'فشل تحميل إعدادات الجملة' : 'Failed to load wholesale settings'));
    } finally {
      setAllowedCategoriesLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await wholesaleOrderService.getAll({
        page,
        pageSize,
        status: statusFilter === 'All' ? undefined : statusFilter,
        paymentStatus: paymentFilter === 'All' ? undefined : paymentFilter,
      });

      const list = res.data ?? [];
      setOrders(list);

      const tc = res.pagination?.totalCount ?? list.length;
      const tp = res.pagination?.totalPages ?? Math.max(1, Math.ceil(tc / pageSize));
      setTotalCount(tc);
      setTotalPages(tp);
    } catch (err: any) {
      console.error('Failed to load wholesale orders:', err);
      setError(err?.message || (isArabic ? 'فشل تحميل الطلبات' : 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllowedCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, paymentFilter]);

  const sortedCategories = useMemo(() => {
    return [...allCategories]
      .filter((c) => c && typeof c.id === 'number')
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [allCategories]);

  const toggleAllowedCategory = (categoryId: number) => {
    setAllowedCategories((prev) => {
      const set = new Set(prev);
      if (set.has(categoryId)) set.delete(categoryId);
      else set.add(categoryId);
      return Array.from(set);
    });
  };

  const saveAllowedCategories = async () => {
    setAllowedCategoriesSaving(true);
    try {
      const ids = [...allowedCategories].sort((a, b) => a - b);
      await wholesaleOrderService.setAllowedCategories(ids);
      toast.success(isArabic ? 'تم حفظ إعدادات الجملة' : 'Wholesale settings saved');
    } catch (err: any) {
      console.error('Failed to save allowed categories:', err);
      toast.error(err?.message || (isArabic ? 'فشل حفظ الإعدادات' : 'Failed to save settings'));
    } finally {
      setAllowedCategoriesSaving(false);
    }
  };

  const openDetails = async (order: WholesaleOrder) => {
    setDetailsOpen(true);
    setSelectedOrder(order);
    setDetailsLoading(true);

    try {
      const fresh = await wholesaleOrderService.getById(order.id);
      setSelectedOrder(fresh);
      setEditStatus(fresh.status);
      setEditPaymentStatus(fresh.paymentStatus);
      setEditManualPrice(fresh.manualPrice === null || fresh.manualPrice === undefined ? '' : String(fresh.manualPrice));
    } catch (err: any) {
      console.error('Failed to load wholesale order details:', err);
      toast.error(err?.message || (isArabic ? 'فشل تحميل التفاصيل' : 'Failed to load details'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const applyUpdates = async () => {
    if (!selectedOrder) return;

    setUpdateLoading(true);
    try {
      const manualPrice = editManualPrice.trim() === '' ? null : Number(editManualPrice);
      if (editManualPrice.trim() !== '' && !Number.isFinite(manualPrice)) {
        toast.error(isArabic ? 'السعر غير صالح' : 'Invalid price');
        return;
      }

      await Promise.all([
        wholesaleOrderService.updateStatus(selectedOrder.id, editStatus),
        wholesaleOrderService.updatePaymentStatus(selectedOrder.id, editPaymentStatus),
        wholesaleOrderService.updateManualPrice(selectedOrder.id, manualPrice),
      ]);

      toast.success(isArabic ? 'تم تحديث الطلب' : 'Order updated');

      const fresh = await wholesaleOrderService.getById(selectedOrder.id);
      setSelectedOrder(fresh);

      // refresh list
      await loadOrders();
    } catch (err: any) {
      console.error('Failed to update wholesale order:', err);
      toast.error(err?.message || (isArabic ? 'فشل تحديث الطلب' : 'Failed to update order'));
    } finally {
      setUpdateLoading(false);
    }
  };

  const pageLabel = isArabic
    ? `الصفحة ${page} من ${totalPages}`
    : `Page ${page} of ${totalPages}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {isArabic ? 'إعدادات الجملة' : 'Wholesale Settings'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'حدد الفئات المسموحة لطلبات الجملة.'
              : 'Choose which product categories are allowed for wholesale ordering.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {allowedCategoriesLoading
                ? (isArabic ? 'جاري التحميل...' : 'Loading...')
                : isArabic
                  ? `${allowedCategories.length} فئة مفعلة`
                  : `${allowedCategories.length} categories enabled`}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={loadAllowedCategories} disabled={allowedCategoriesLoading} className="gap-2">
                <RefreshCw className={cn('h-4 w-4', allowedCategoriesLoading && 'animate-spin')} />
                {isArabic ? 'تحديث' : 'Refresh'}
              </Button>
              <Button type="button" onClick={saveAllowedCategories} disabled={allowedCategoriesSaving || allowedCategoriesLoading} className="gap-2">
                {allowedCategoriesSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isArabic ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedCategories.map((cat) => {
              const checked = allowedCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition',
                    checked ? 'border-emerald-300 bg-emerald-50/40' : 'hover:bg-muted/30'
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggleAllowedCategory(cat.id)}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{isArabic ? (cat.nameAr || cat.name) : cat.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {cat.id}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>{isArabic ? 'طلبات الجملة' : 'Wholesale Orders'}</CardTitle>
              <CardDescription>
                {isArabic
                  ? 'راجع الطلبات وحدّث الحالة وحالة الدفع والسعر اليدوي.'
                  : 'Review orders and update status, payment status, and manual price.'}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={loadOrders} disabled={loading} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>{isArabic ? 'حالة الطلب' : 'Order status'}</Label>
              <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v as any); }}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'الكل' : 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{isArabic ? 'حالة الدفع' : 'Payment status'}</Label>
              <Select value={paymentFilter} onValueChange={(v) => { setPage(1); setPaymentFilter(v as any); }}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'الكل' : 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{isArabic ? 'الكل' : 'All'}</SelectItem>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{isArabic ? 'حجم الصفحة' : 'Page size'}</Label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? 'رقم الطلب' : 'Order #'}</TableHead>
                  <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{isArabic ? 'الشحن' : 'Shipping'}</TableHead>
                  <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isArabic ? 'الدفع' : 'Payment'}</TableHead>
                  <TableHead>{isArabic ? 'السعر اليدوي' : 'Manual price'}</TableHead>
                  <TableHead>{isArabic ? 'التاريخ' : 'Created'}</TableHead>
                  <TableHead className="text-right">{isArabic ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري التحميل...' : 'Loading...'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        {isArabic ? 'لا توجد طلبات' : 'No orders found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.wholesaleOrderNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{o.customerName}</div>
                        <div className="text-xs text-muted-foreground">{o.cafeName}</div>
                      </TableCell>
                      <TableCell>
                        {o.shippingMethod === 1 ? (isArabic ? 'استلام' : 'Pickup') : (isArabic ? 'نول' : 'Nool')}
                      </TableCell>
                      <TableCell><Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell><Badge variant={paymentBadgeVariant(o.paymentStatus)}>{o.paymentStatus}</Badge></TableCell>
                      <TableCell>{formatMoney(o.manualPrice)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{safeDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void openDetails(o)}>
                          <Eye className="h-4 w-4" />
                          {isArabic ? 'عرض' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {isArabic ? `الإجمالي: ${totalCount}` : `Total: ${totalCount}`} • {pageLabel}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {isArabic ? 'السابق' : 'Prev'}
              </Button>
              <Button type="button" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {isArabic ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تفاصيل طلب الجملة' : 'Wholesale order details'}</DialogTitle>
            <DialogDescription>
              {selectedOrder ? (
                <span className="font-mono text-xs">{selectedOrder.wholesaleOrderNumber}</span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading || !selectedOrder ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isArabic ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}</div>
                    <div className="font-medium text-gray-900">{selectedOrder.customerName}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.cafeName}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs text-muted-foreground">{isArabic ? 'تحديث الحالة' : 'Update status'}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>{isArabic ? 'حالة الطلب' : 'Order status'}</Label>
                        <Select value={editStatus} onValueChange={(v) => setEditStatus(v as WholesaleOrderStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label>{isArabic ? 'حالة الدفع' : 'Payment status'}</Label>
                        <Select value={editPaymentStatus} onValueChange={(v) => setEditPaymentStatus(v as WholesalePaymentStatus)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label>{isArabic ? 'السعر اليدوي' : 'Manual price'}</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder={isArabic ? 'اتركه فارغاً لإزالة السعر' : 'Leave empty to clear'}
                          value={editManualPrice}
                          onChange={(e) => setEditManualPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="button" onClick={() => void applyUpdates()} disabled={updateLoading} className="gap-2">
                      {updateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isArabic ? 'حفظ التغييرات' : 'Save changes'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {selectedOrder.notes ? (
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'ملاحظات' : 'Notes'}</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{selectedOrder.notes}</div>
                </div>
              ) : null}

              <div className="rounded-xl border bg-white">
                <div className="px-4 py-3 border-b font-medium text-gray-900">
                  {isArabic ? 'العناصر' : 'Items'}
                </div>
                <div className="divide-y">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{it.productName}</div>
                        {it.variantInfo ? <div className="text-sm text-muted-foreground">{it.variantInfo}</div> : null}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-nowrap">
                        {isArabic ? 'الكمية:' : 'Qty:'} <span className="font-semibold">{it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {isArabic ? 'تاريخ الإنشاء:' : 'Created:'} {safeDate(selectedOrder.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
