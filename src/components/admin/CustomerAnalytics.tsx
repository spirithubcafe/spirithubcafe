import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Users, UserCheck, UserPlus, TrendingUp, Star, Clock } from 'lucide-react';
import type { Order } from '../../types/order';
import {
  getCustomerAnalytics,
  exportTopCustomersToCSV,
  downloadCSV,
} from '../../lib/analyticsUtils';

interface CustomerAnalyticsProps {
  orders: Order[];
  isArabic?: boolean;
}

export const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  orders,
  isArabic = false,
}) => {
  const analytics = getCustomerAnalytics(orders, 10);

  const handleExport = () => {
    const csv = exportTopCustomersToCSV(analytics.topCustomers);
    const filename = `top-customers-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isArabic ? 'تحليلات العملاء' : 'Customer Analytics'}
          </CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isArabic ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                {isArabic ? 'إجمالي العملاء' : 'Total'}
              </span>
            </div>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {analytics.totalCustomers}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isArabic ? 'طلبات مدفوعة' : 'Paid orders'}
            </p>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">
                {isArabic ? 'جدد' : 'New'}
              </span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              {analytics.newCustomers}
            </p>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">
                {isArabic ? 'عائدون' : 'Returning'}
              </span>
            </div>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400">
              {analytics.returningCustomers}
            </p>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">
                {isArabic ? 'معدل التكرار' : 'Repeat Rate'}
              </span>
            </div>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {analytics.repeatRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? 'متوسط الطلبات/العميل' : 'Avg Orders/Customer'}
            </p>
            <p className="text-lg font-semibold">
              {analytics.avgOrdersPerCustomer.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {isArabic ? 'متوسط الإيرادات/العميل' : 'Avg Revenue/Customer'}
            </p>
            <p className="text-lg font-semibold">
              OMR {analytics.avgRevenuePerCustomer.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Top Customers List */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            {isArabic ? 'أفضل العملاء حسب الإنفاق' : 'Top Customers by Spend'}
          </h3>
          
          {analytics.topCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isArabic ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 py-2">
              {analytics.topCustomers.map((customer, index) => (
                <div
                  key={customer.email}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className="shrink-0">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-sm font-semibold truncate">
                          {customer.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-purple-50 dark:bg-purple-950/20 rounded px-2 py-1.5">
                          <div className="text-xs text-muted-foreground mb-0.5">
                            {isArabic ? 'الإنفاق' : 'Spent'}
                          </div>
                          <div className="font-bold text-sm text-purple-700 dark:text-purple-400">
                            {customer.totalSpent.toFixed(3)}
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded px-2 py-1.5">
                          <div className="text-xs text-muted-foreground mb-0.5">
                            {isArabic ? 'الطلبات' : 'Orders'}
                          </div>
                          <div className="font-bold text-sm text-blue-700 dark:text-blue-400">
                            {customer.orderCount}
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 rounded px-2 py-1.5">
                          <div className="text-xs text-muted-foreground mb-0.5">
                            {isArabic ? 'متوسط' : 'AOV'}
                          </div>
                          <div className="font-bold text-sm text-green-700 dark:text-green-400">
                            {customer.avgOrderValue.toFixed(3)}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isArabic ? 'آخر طلب:' : 'Last:'} {customer.daysSinceLastOrder}d
                          </span>
                        </div>
                        <span>•</span>
                        <span>
                          {isArabic ? 'العضو منذ:' : 'Member since:'} {customer.firstOrderDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
