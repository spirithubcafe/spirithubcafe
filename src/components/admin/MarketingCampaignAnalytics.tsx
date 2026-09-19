import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { marketingCampaignService } from '../../services/marketingCampaignService';
import type { MarketingCampaignAnalytics as Analytics } from '../../types/marketingCampaign';
import { getApiErrorMessage } from '../../lib/marketingCampaignUtils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function MarketingCampaignAnalytics({ campaignId }: { campaignId: number }) {
  const { t, language } = useApp();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAnalytics(await marketingCampaignService.getAnalytics(campaignId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('admin.marketingCampaigns.analyticsLoadError')));
    } finally {
      setLoading(false);
    }
  }, [campaignId, t]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (error) return (
    <Alert variant="destructive">
      <BarChart3 className="h-4 w-4" />
      <AlertTitle>{t('admin.marketingCampaigns.analyticsLoadError')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{error}</span><Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.retry')}</Button>
      </AlertDescription>
    </Alert>
  );
  if (!analytics) return null;

  const metrics = [
    [t('admin.marketingCampaigns.views'), analytics.views],
    [t('admin.marketingCampaigns.uniqueViews'), analytics.uniqueViews],
    [t('admin.marketingCampaigns.submissions'), analytics.submissions],
    [t('admin.marketingCampaigns.submissionRate'), `${analytics.submissionRate.toFixed(2)}%`],
    [t('admin.marketingCampaigns.ctaClicks'), analytics.ctaClicks],
    [t('admin.marketingCampaigns.discountReveals'), analytics.discountReveals],
    [t('admin.marketingCampaigns.closes'), analytics.closes],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('admin.marketingCampaigns.analyticsDescription')}</p>
        <Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.refresh')}</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString(language === 'ar' ? 'ar-OM' : 'en-OM') : value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
