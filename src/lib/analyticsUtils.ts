import type { Order, OrderItem } from '../types/order';
import { startOfDay, startOfWeek, startOfMonth, format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  displayDate: string;
}

export interface TopProduct {
  productId: number;
  productName: string;
  productNameAr?: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  productImage?: string;
}

/**
 * Get sales data grouped by time period
 */
export function getSalesDataByPeriod(
  orders: Order[],
  period: TimePeriod,
  count: number = 30
): SalesDataPoint[] {
  const now = new Date();
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');

  let intervals: Date[] = [];
  let formatStr = '';
  let groupKeyFn: (date: Date) => string;

  switch (period) {
    case 'daily':
      const startDaily = subDays(now, count - 1);
      intervals = eachDayOfInterval({ start: startDaily, end: now });
      formatStr = 'MMM dd';
      groupKeyFn = (date: Date) => format(startOfDay(date), 'yyyy-MM-dd');
      break;

    case 'weekly':
      const startWeekly = subWeeks(now, count - 1);
      intervals = eachWeekOfInterval({ start: startWeekly, end: now }, { weekStartsOn: 0 });
      formatStr = 'MMM dd';
      groupKeyFn = (date: Date) => format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      break;

    case 'monthly':
      const startMonthly = subMonths(now, count - 1);
      intervals = eachMonthOfInterval({ start: startMonthly, end: now });
      formatStr = 'MMM yyyy';
      groupKeyFn = (date: Date) => format(startOfMonth(date), 'yyyy-MM');
      break;
  }

  // Group orders by period
  const salesByPeriod = new Map<string, { revenue: number; orders: Order[] }>();

  paidOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const periodKey = groupKeyFn(orderDate);

    if (!salesByPeriod.has(periodKey)) {
      salesByPeriod.set(periodKey, { revenue: 0, orders: [] });
    }

    const periodData = salesByPeriod.get(periodKey)!;
    periodData.revenue += order.totalAmount;
    periodData.orders.push(order);
  });

  // Create data points for all intervals (including zero values)
  return intervals.map(date => {
    const periodKey = groupKeyFn(date);
    const data = salesByPeriod.get(periodKey) || { revenue: 0, orders: [] };

    return {
      date: periodKey,
      revenue: Math.round(data.revenue * 1000) / 1000, // Round to 3 decimal places
      orders: data.orders.length,
      displayDate: format(date, formatStr),
    };
  });
}

/**
 * Get sales data for a custom date range
 */
export function getSalesDataByDateRange(
  orders: Order[],
  startDate: Date,
  endDate: Date
): SalesDataPoint[] {
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  
  // Generate all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group orders by day
  const salesByDay = new Map<string, { revenue: number; orders: Order[] }>();
  
  paidOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate >= startDate && orderDate <= endDate) {
      const dayKey = format(startOfDay(orderDate), 'yyyy-MM-dd');
      
      if (!salesByDay.has(dayKey)) {
        salesByDay.set(dayKey, { revenue: 0, orders: [] });
      }
      
      const dayData = salesByDay.get(dayKey)!;
      dayData.revenue += order.totalAmount;
      dayData.orders.push(order);
    }
  });
  
  // Create data points for all days
  return days.map(date => {
    const dayKey = format(startOfDay(date), 'yyyy-MM-dd');
    const data = salesByDay.get(dayKey) || { revenue: 0, orders: [] };
    
    return {
      date: dayKey,
      revenue: Math.round(data.revenue * 1000) / 1000,
      orders: data.orders.length,
      displayDate: format(date, 'MMM dd'),
    };
  });
}

/**
 * Get top selling products by quantity
 */
export function getTopProducts(
  orders: Order[],
  limit: number = 10
): TopProduct[] {
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  const productMap = new Map<number, TopProduct>();

  paidOrders.forEach(order => {
    if (!order.items || !Array.isArray(order.items)) {
      return;
    }

    order.items.forEach((item: OrderItem) => {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          productNameAr: item.productNameAr,
          quantitySold: 0,
          revenue: 0,
          orderCount: 0,
          productImage: item.productImage,
        });
      }

      const product = productMap.get(item.productId)!;
      product.quantitySold += item.quantity;
      product.revenue += item.totalAmount;
      product.orderCount += 1;
    });
  });

  // Convert to array and sort by quantity sold
  return Array.from(productMap.values())
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);
}

/**
 * Export sales data to CSV format (Excel compatible)
 */
export function exportSalesToCSV(data: SalesDataPoint[], _period: TimePeriod): string {
  const headers = ['Date', 'Revenue (OMR)', 'Orders'];
  const rows = data.map(d => [
    d.displayDate,
    d.revenue.toFixed(3),
    d.orders.toString(),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export top products to CSV
 */
export function exportTopProductsToCSV(products: TopProduct[]): string {
  const headers = ['Product Name', 'Quantity Sold', 'Revenue (OMR)', 'Order Count'];
  const rows = products.map(p => [
    p.productName,
    p.quantitySold.toString(),
    p.revenue.toFixed(3),
    p.orderCount.toString(),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csv;
}
