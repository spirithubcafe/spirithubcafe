import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Download, TrendingUp, CalendarIcon, DollarSign, ShoppingCart, BarChart3, MessageSquare } from 'lucide-react';
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
  ReferenceLine,
  Label,
} from 'recharts';
import type { Order } from '../../types/order';
import {
  getSalesDataByPeriod,
  getSalesDataByDateRange,
  exportSalesToCSV,
  downloadCSV,
  type TimePeriod,
} from '../../lib/analyticsUtils';

type ChartView = 'revenue' | 'orders' | 'aov';

interface Annotation {
  date: string;
  label: string;
  color?: string;
}

interface SalesChartProps {
  orders: Order[];
  isArabic?: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({ orders, isArabic = false }) => {
  const [period, setPeriod] = useState<TimePeriod>('daily');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [chartView, setChartView] = useState<ChartView>('revenue');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const salesData = isCustomRange && dateRange.from && dateRange.to
    ? getSalesDataByDateRange(orders, dateRange.from, dateRange.to)
    : getSalesDataByPeriod(
        orders,
        period,
        period === 'daily' ? 30 : period === 'weekly' ? 12 : 12
      );

  // Calculate AOV for each data point
  const chartData = salesData.map(d => ({
    ...d,
    aov: d.orders > 0 ? d.revenue / d.orders : 0,
  }));

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
  const avgAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const getChartConfig = () => {
    switch (chartView) {
      case 'revenue':
        return {
          dataKey: 'revenue',
          label: isArabic ? 'الإيرادات (ر.ع)' : 'Revenue (OMR)',
          color: '#8b5cf6',
          formatter: (value: number) => `OMR ${value.toFixed(3)}`,
        };
      case 'orders':
        return {
          dataKey: 'orders',
          label: isArabic ? 'الطلبات' : 'Orders',
          color: '#10b981',
          formatter: (value: number) => value.toString(),
        };
      case 'aov':
        return {
          dataKey: 'aov',
          label: isArabic ? 'متوسط قيمة الطلب (ر.ع)' : 'Avg Order Value (OMR)',
          color: '#f59e0b',
          formatter: (value: number) => `OMR ${value.toFixed(3)}`,
        };
    }
  };

  const config = getChartConfig();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {isArabic ? 'نظرة عامة على المبيعات' : 'Sales Overview'}
            </CardTitle>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isArabic ? 'تصدير' : 'Export'}
          </Button>
        </div>

        {/* Total Metric Display */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {chartView === 'revenue' && (isArabic ? 'إجمالي الإيرادات' : 'Total Revenue')}
                {chartView === 'orders' && (isArabic ? 'إجمالي الطلبات' : 'Total Orders')}
                {chartView === 'aov' && (isArabic ? 'متوسط قيمة الطلب' : 'Average Order Value')}
              </p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {chartView === 'revenue' && `OMR ${totalRevenue.toFixed(3)}`}
                {chartView === 'orders' && totalOrders}
                {chartView === 'aov' && `OMR ${avgAOV.toFixed(3)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {config.dataKey === 'revenue' && <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />}
              {config.dataKey === 'orders' && <ShoppingCart className="h-8 w-8 text-green-500 opacity-50" />}
              {config.dataKey === 'aov' && <BarChart3 className="h-8 w-8 text-amber-500 opacity-50" />}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controls Row */}
        <div className="mb-4 space-y-3">
          {/* View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'عرض:' : 'View:'}
            </span>
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={chartView === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('revenue')}
                className="h-8"
              >
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                {isArabic ? 'الإيرادات' : 'Revenue'}
              </Button>
              <Button
                variant={chartView === 'orders' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('orders')}
                className="h-8"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                {isArabic ? 'الطلبات' : 'Orders'}
              </Button>
              <Button
                variant={chartView === 'aov' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('aov')}
                className="h-8"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                {isArabic ? 'متوسط' : 'AOV'}
              </Button>
            </div>
          </div>

          {/* Period Toggle & Custom Date */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isArabic ? 'الفترة:' : 'Period:'}
            </span>
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={!isCustomRange && period === 'daily' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange('daily')}
                className="h-8"
              >
                {isArabic ? 'يومي' : 'Daily'}
              </Button>
              <Button
                variant={!isCustomRange && period === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange('weekly')}
                className="h-8"
              >
                {isArabic ? 'أسبوعي' : 'Weekly'}
              </Button>
              <Button
                variant={!isCustomRange && period === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange('monthly')}
                className="h-8"
              >
                {isArabic ? 'شهري' : 'Monthly'}
              </Button>
            </div>
            
            <div className="ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant={isCustomRange ? 'default' : 'outline'} 
                    size="sm"
                    className="h-8"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />
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
        </div>

        {/* Annotations - Collapsible */}
        {annotations.length > 0 || (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 hover:text-foreground transition-colors">
              <MessageSquare className="h-3.5 w-3.5" />
              {isArabic ? 'التعليقات التوضيحية' : 'Annotations'}
            </summary>
            <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const date = prompt(isArabic ? 'أدخل التاريخ (مثال: Dec 15)' : 'Enter date (e.g., Dec 15):');
                  const label = prompt(isArabic ? 'أدخل التسمية:' : 'Enter label:');
                  if (date && label) {
                    setAnnotations([...annotations, { date, label, color: '#ef4444' }]);
                  }
                }}
              >
                + {isArabic ? 'إضافة تعليق' : 'Add Note'}
              </Button>
            </div>
          </details>
        )}
        
        {annotations.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {isArabic ? 'التعليقات' : 'Annotations'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const date = prompt(isArabic ? 'أدخل التاريخ (مثال: Dec 15)' : 'Enter date (e.g., Dec 15):');
                  const label = prompt(isArabic ? 'أدخل التسمية:' : 'Enter label:');
                  if (date && label) {
                    setAnnotations([...annotations, { date, label, color: '#ef4444' }]);
                  }
                }}
              >
                + {isArabic ? 'إضافة' : 'Add'}
              </Button>
              {annotations.map((ann, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border shadow-sm">
                  <span className="font-semibold text-red-600">{ann.date}:</span>
                  <span className="text-foreground">{ann.label}</span>
                  <button
                    onClick={() => setAnnotations(annotations.filter((_, i) => i !== idx))}
                    className="ml-1 text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              {annotations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnnotations([])}
                  className="text-xs"
                >
                  {isArabic ? 'مسح الكل' : 'Clear All'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: config.label,
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [config.formatter(value), config.label]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={() => config.label}
            />
            {/* Annotations as reference lines */}
            {annotations.map((ann, idx) => (
              <ReferenceLine
                key={idx}
                x={ann.date}
                stroke={ann.color || '#ef4444'}
                strokeDasharray="3 3"
                strokeWidth={2}
              >
                <Label
                  value={ann.label}
                  position="top"
                  fill={ann.color || '#ef4444'}
                  fontSize={11}
                  fontWeight="bold"
                />
              </ReferenceLine>
            ))}
            <Line
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.color}
              strokeWidth={3}
              dot={{ fill: config.color, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
