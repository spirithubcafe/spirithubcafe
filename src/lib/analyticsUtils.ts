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
  avgPrice: number;
  margin?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  velocity: number; // units per day
}

export interface TopCustomer {
  userId?: string;
  customerName: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  avgOrdersPerCustomer: number;
  avgRevenuePerCustomer: number;
  topCustomers: TopCustomer[];
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
    {
      const startDaily = subDays(now, count - 1);
      intervals = eachDayOfInterval({ start: startDaily, end: now });
      formatStr = 'MMM dd';
      groupKeyFn = (date: Date) => format(startOfDay(date), 'yyyy-MM-dd');
      break;
    }

    case 'weekly':
    {
      const startWeekly = subWeeks(now, count - 1);
      intervals = eachWeekOfInterval({ start: startWeekly, end: now }, { weekStartsOn: 0 });
      formatStr = 'MMM dd';
      groupKeyFn = (date: Date) => format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      break;
    }

    case 'monthly':
    {
      const startMonthly = subMonths(now, count - 1);
      intervals = eachMonthOfInterval({ start: startMonthly, end: now });
      formatStr = 'MMM yyyy';
      groupKeyFn = (date: Date) => format(startOfMonth(date), 'yyyy-MM');
      break;
    }
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
 * Get top selling products by quantity with strategic metrics
 */
export function getTopProducts(
  orders: Order[],
  limit: number = 10
): TopProduct[] {
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  const productMap = new Map<number, { product: TopProduct; firstSaleDate: Date; lastSaleDate: Date }>();
  const now = new Date();

  paidOrders.forEach(order => {
    if (!order.items || !Array.isArray(order.items)) {
      return;
    }

    const orderDate = new Date(order.createdAt);

    order.items.forEach((item: OrderItem) => {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          product: {
            productId: item.productId,
            productName: item.productName,
            productNameAr: item.productNameAr,
            quantitySold: 0,
            revenue: 0,
            orderCount: 0,
            productImage: item.productImage,
            avgPrice: 0,
            velocity: 0,
          },
          firstSaleDate: orderDate,
          lastSaleDate: orderDate,
        });
      }

      const data = productMap.get(item.productId)!;
      data.product.quantitySold += item.quantity;
      data.product.revenue += item.totalAmount;
      data.product.orderCount += 1;
      
      // Track date range for velocity calculation
      if (orderDate < data.firstSaleDate) data.firstSaleDate = orderDate;
      if (orderDate > data.lastSaleDate) data.lastSaleDate = orderDate;
    });
  });

  // Calculate derived metrics
  const results = Array.from(productMap.values()).map(({ product, firstSaleDate }) => {
    // Calculate average price
    product.avgPrice = product.quantitySold > 0 ? product.revenue / product.quantitySold : 0;
    
    // Estimate margin (typical coffee margin is 60-70%, we'll estimate 65% as baseline)
    // In a real system, this would come from product cost data
    product.margin = 65;
    
    // Calculate velocity (units per day)
    const daysSinceLaunch = Math.max(
      1,
      Math.ceil((now.getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    product.velocity = product.quantitySold / daysSinceLaunch;
    
    return product;
  });

  // Sort by quantity sold and limit
  return results
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

/**
 * Get customer analytics with new vs returning breakdown
 */
export function getCustomerAnalytics(orders: Order[], topLimit: number = 10): CustomerAnalytics {
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  const now = new Date();
  
  // Group orders by customer (using userId or email as fallback)
  const customerMap = new Map<string, {
    userId?: string;
    customerName: string;
    email: string;
    orders: Order[];
    totalSpent: number;
  }>();

  paidOrders.forEach(order => {
    const customerId = order.userId || order.email;
    
    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        userId: order.userId,
        customerName: order.fullName || order.email,
        email: order.email,
        orders: [],
        totalSpent: 0,
      });
    }

    const customer = customerMap.get(customerId)!;
    customer.orders.push(order);
    customer.totalSpent += order.totalAmount;
  });

  // Calculate metrics
  const totalCustomers = customerMap.size;
  const returningCustomers = Array.from(customerMap.values()).filter(c => c.orders.length > 1).length;
  const newCustomers = totalCustomers - returningCustomers;
  const repeatRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
  
  const totalOrders = paidOrders.length;
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
  const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Build top customers list
  const topCustomers: TopCustomer[] = Array.from(customerMap.values())
    .map(customer => {
      const sortedOrders = customer.orders.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const firstOrder = sortedOrders[0];
      const lastOrder = sortedOrders[sortedOrders.length - 1];
      const daysSince = Math.floor((now.getTime() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      return {
        userId: customer.userId,
        customerName: customer.customerName,
        email: customer.email,
        orderCount: customer.orders.length,
        totalSpent: customer.totalSpent,
        avgOrderValue: customer.totalSpent / customer.orders.length,
        firstOrderDate: format(new Date(firstOrder.createdAt), 'MMM dd, yyyy'),
        lastOrderDate: format(new Date(lastOrder.createdAt), 'MMM dd, yyyy'),
        daysSinceLastOrder: daysSince,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, topLimit);

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    repeatRate,
    avgOrdersPerCustomer,
    avgRevenuePerCustomer,
    topCustomers,
  };
}

/**
 * Export top customers to CSV format
 */
export function exportTopCustomersToCSV(customers: TopCustomer[]): string {
  const headers = ['Customer Name', 'Email', 'Orders', 'Total Spent (OMR)', 'Avg Order Value (OMR)', 'First Order', 'Last Order', 'Days Since Last Order'];
  const rows = customers.map(c => [
    c.customerName,
    c.email,
    c.orderCount.toString(),
    c.totalSpent.toFixed(3),
    c.avgOrderValue.toFixed(3),
    c.firstOrderDate,
    c.lastOrderDate,
    c.daysSinceLastOrder.toString(),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csv;
}
