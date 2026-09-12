import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Gift,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  SearchX,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  chatbotMarketingAnalyticsService,
  type ChatbotMarketingSummary,
} from '../../services/chatbotMarketingAnalyticsService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const EMPTY_SUMMARY: ChatbotMarketingSummary = {
  periodDays: 30,
  fromUtc: '',
  generatedAtUtc: '',
  totals: {
    sessions: 0,
    messages: 0,
    recommendations: 0,
    productClicks: 0,
    addToCarts: 0,
    purchases: 0,
    noResults: 0,
    giftInterest: 0,
    wholesaleInterest: 0,
  },
  funnel: {
    recommendationToClickRate: 0,
    clickToCartRate: 0,
    cartToPurchaseRate: 0,
  },
  sources: [],
  campaigns: [],
  noResultSearches: [],
};

const pct = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
const safeProgress = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export const ChatbotMarketingDashboard: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<ChatbotMarketingSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await chatbotMarketingAnalyticsService.getSummary(days);
      setSummary(result ?? { ...EMPTY_SUMMARY, periodDays: days });
    } catch {
      setError(
        isArabic
          ? 'تعذر تحميل تحليلات الشات بوت. تأكد من نشر واجهة API الجديدة ثم حاول مرة أخرى.'
          : 'Could not load chatbot marketing analytics. Make sure the new API is deployed, then try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [days, isArabic]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const totals = summary.totals ?? EMPTY_SUMMARY.totals;
  const generatedLabel = useMemo(() => {
    if (!summary.generatedAtUtc) return '';
    const date = new Date(summary.generatedAtUtc);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(isArabic ? 'ar-OM' : 'en-OM');
  }, [summary.generatedAtUtc, isArabic]);

  const metrics = [
    { labelEn: 'Chatbot Sessions', labelAr: 'جلسات الشات بوت', value: totals.sessions, icon: Users },
    { labelEn: 'Messages', labelAr: 'الرسائل', value: totals.messages, icon: MessageSquare },
    { labelEn: 'Recommendations', labelAr: 'التوصيات', value: totals.recommendations, icon: Sparkles },
    { labelEn: 'Product Clicks', labelAr: 'نقرات المنتجات', value: totals.productClicks, icon: MousePointerClick },
    { labelEn: 'Add to Cart', labelAr: 'إضافة للسلة', value: totals.addToCarts, icon: ShoppingCart },
    { labelEn: 'Attributed Purchases', labelAr: 'المشتريات المنسوبة للشات بوت', value: totals.purchases, icon: TrendingUp },
  ];

  const funnel = [
    {
      labelEn: 'Recommendation → Product click',
      labelAr: 'التوصية ← النقر على المنتج',
      value: summary.funnel?.recommendationToClickRate ?? 0,
    },
    {
      labelEn: 'Product click → Add to cart',
      labelAr: 'النقر على المنتج ← الإضافة للسلة',
      value: summary.funnel?.clickToCartRate ?? 0,
    },
    {
      labelEn: 'Add to cart → Purchase',
      labelAr: 'الإضافة للسلة ← الشراء',
      value: summary.funnel?.cartToPurchaseRate ?? 0,
    },
  ];

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isArabic ? 'تحليلات تسويق الشات بوت' : 'Chatbot Marketing Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'قياس رحلة العميل من التفاعل مع الشات بوت إلى الشراء'
                : 'Measure the customer journey from chatbot engagement to purchase'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={days === option ? 'default' : 'outline'}
              onClick={() => setDays(option)}
            >
              {option} {isArabic ? 'يوم' : 'days'}
            </Button>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => void loadSummary()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className={isArabic ? 'mr-2' : 'ml-2'}>{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.labelEn} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? metric.labelAr : metric.labelEn}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '…' : metric.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isArabic ? 'مسار التحويل' : 'Conversion Funnel'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {funnel.map((stage) => (
              <div key={stage.labelEn} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{isArabic ? stage.labelAr : stage.labelEn}</span>
                  <span className="font-semibold tabular-nums">{loading ? '…' : pct(stage.value)}</span>
                </div>
                <Progress value={safeProgress(stage.value)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'فرص التسويق' : 'Marketing Opportunities'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <span>{isArabic ? 'اهتمام بالهدايا' : 'Gift interest'}</span>
              </div>
              <span className="text-lg font-bold">{loading ? '…' : totals.giftInterest}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <span>{isArabic ? 'اهتمام بالجملة' : 'Wholesale interest'}</span>
              </div>
              <span className="text-lg font-bold">{loading ? '…' : totals.wholesaleInterest}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <SearchX className="h-4 w-4 text-muted-foreground" />
                <span>{isArabic ? 'نتائج غير موجودة' : 'No-result searches'}</span>
              </div>
              <span className="text-lg font-bold">{loading ? '…' : totals.noResults}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'مصادر الزيارات' : 'Traffic Sources'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? 'المصدر' : 'Source'}</TableHead>
                    <TableHead>{isArabic ? 'الجلسات' : 'Sessions'}</TableHead>
                    <TableHead>{isArabic ? 'النقرات' : 'Clicks'}</TableHead>
                    <TableHead>{isArabic ? 'السلة' : 'Cart'}</TableHead>
                    <TableHead>{isArabic ? 'الشراء' : 'Purchases'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.sources?.length ? summary.sources.map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium capitalize">{row.source || 'direct'}</TableCell>
                      <TableCell>{row.sessions}</TableCell>
                      <TableCell>{row.productClicks}</TableCell>
                      <TableCell>{row.addToCarts}</TableCell>
                      <TableCell>{row.purchases}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {loading ? (isArabic ? 'جاري التحميل…' : 'Loading…') : (isArabic ? 'لا توجد بيانات بعد' : 'No data yet')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'أداء الحملات' : 'Campaign Performance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? 'الحملة' : 'Campaign'}</TableHead>
                    <TableHead>{isArabic ? 'المصدر' : 'Source'}</TableHead>
                    <TableHead>{isArabic ? 'الجلسات' : 'Sessions'}</TableHead>
                    <TableHead>{isArabic ? 'السلة' : 'Cart'}</TableHead>
                    <TableHead>{isArabic ? 'الشراء' : 'Purchases'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.campaigns?.length ? summary.campaigns.map((row, index) => (
                    <TableRow key={`${row.campaign}-${row.source}-${index}`}>
                      <TableCell className="font-medium">{row.campaign || '—'}</TableCell>
                      <TableCell className="capitalize">{row.source || 'direct'}</TableCell>
                      <TableCell>{row.sessions}</TableCell>
                      <TableCell>{row.addToCarts}</TableCell>
                      <TableCell>{row.purchases}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {loading ? (isArabic ? 'جاري التحميل…' : 'Loading…') : (isArabic ? 'لا توجد حملات منسوبة بعد' : 'No attributed campaigns yet')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="h-5 w-5" />
            {isArabic ? 'ما الذي يبحث عنه العملاء ولا يجدونه؟' : 'What are customers searching for but not finding?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.noResultSearches?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.noResultSearches.map((item) => (
                <div key={item.term} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="min-w-0 truncate text-sm font-medium">{item.term}</span>
                  <span className="ml-3 rounded-full bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {loading
                ? (isArabic ? 'جاري التحميل…' : 'Loading…')
                : (isArabic ? 'لا توجد عمليات بحث بدون نتائج في هذه الفترة.' : 'No no-result searches in this period.')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isArabic
            ? `الفترة: آخر ${summary.periodDays || days} يوم`
            : `Period: last ${summary.periodDays || days} days`}
        </span>
        {generatedLabel ? (
          <span>{isArabic ? `آخر تحديث: ${generatedLabel}` : `Generated: ${generatedLabel}`}</span>
        ) : null}
      </div>
    </div>
  );
};
