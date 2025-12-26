import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Download, TrendingUp, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Order } from '../../types/order';
import {
  getSalesDataByPeriod,
  getSalesDataByDateRange,
  exportSalesToCSV,
  downloadCSV,
  type TimePeriod,
} from '../../lib/analyticsUtils';

interface SalesChartProps {
  orders: Order[];
  isArabic?: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({ orders, isArabic = false }) => {
  const [period, setPeriod] = useState<TimePeriod>('daily');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCustomRange, setIsCustomRange] = useState(false);

  const salesData = isCustomRange && dateRange.from && dateRange.to
    ? getSalesDataByDateRange(orders, dateRange.from, dateRange.to)
    : getSalesDataByPeriod(
        orders,
        period,
        period === 'daily' ? 30 : period === 'weekly' ? 12 : 12
      );

  const handleExport = () => {
    const csv = exportSalesToCSV(salesData, period);
    const filename = `sales-${isCustomRange ? 'custom' : period}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    setIsCustomRange(false);
    setDateRange({});
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      setIsCustomRange(true);
    }
  };

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isArabic ? 'نظرة عامة على المبيعات' : 'Sales Overview'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? `إجمالي الإيرادات: ${totalRevenue.toFixed(3)} ر.ع | الطلبات: ${totalOrders}`
                : `Total Revenue: OMR ${totalRevenue.toFixed(3)} | Orders: ${totalOrders}`}
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isArabic ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <Button
            variant={!isCustomRange && period === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('daily')}
          >
            {isArabic ? 'يومي' : 'Daily'}
          </Button>
          <Button
            variant={!isCustomRange && period === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('weekly')}
          >
            {isArabic ? 'أسبوعي' : 'Weekly'}
          </Button>
          <Button
            variant={!isCustomRange && period === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('monthly')}
          >
            {isArabic ? 'شهري' : 'Monthly'}
          </Button>
          
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={isCustomRange ? 'default' : 'outline'} size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM dd, yyyy')
                    )
                  ) : (
                    <span>{isArabic ? 'تاريخ مخصص' : 'Custom Date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => handleDateRangeSelect(range || {})}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{
                value: isArabic ? 'الإيرادات (ر.ع)' : 'Revenue (OMR)',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{
                value: isArabic ? 'الطلبات' : 'Orders',
                angle: 90,
                position: 'insideRight',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [`OMR ${value.toFixed(3)}`, isArabic ? 'الإيرادات' : 'Revenue'];
                }
                return [value, isArabic ? 'الطلبات' : 'Orders'];
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => {
                if (value === 'revenue') return isArabic ? 'الإيرادات' : 'Revenue';
                if (value === 'orders') return isArabic ? 'الطلبات' : 'Orders';
                return value;
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
