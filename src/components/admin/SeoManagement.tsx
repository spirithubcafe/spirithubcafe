import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle2,
  FileCode2,
  Globe,
  RefreshCw,
  Rss,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { seoService } from '../../services/seoService';
import type { SeoFileInfo, SeoOverview } from '../../types/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

type GenerationState = {
  sitemap: boolean;
  feed: boolean;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) {
    return '0 KB';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const SeoFileCard: React.FC<{
  info: SeoFileInfo;
  title: string;
  description: string;
  icon: React.ReactNode;
  statusLabel: string;
  actionLabel: string;
  loading: boolean;
  onGenerate: () => void;
  lastUpdatedLabel: string;
  neverGeneratedLabel: string;
  viewLabel: string;
  disableActions?: boolean;
  disabledMessage?: string;
}> = ({
  info,
  title,
  description,
  icon,
  statusLabel,
  actionLabel,
  loading,
  onGenerate,
  lastUpdatedLabel,
  neverGeneratedLabel,
  viewLabel,
  disableActions = false,
  disabledMessage,
}) => {
  return (
    <Card className="h-full shadow-sm border border-border/60">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {info.exists ? (
            <>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {statusLabel}
              </span>
              <span className="text-muted-foreground">
                {lastUpdatedLabel}:{' '}
                {info.lastUpdatedUtc ? (
                  <time dateTime={info.lastUpdatedUtc}>{info.lastUpdatedUtc}</time>
                ) : (
                  neverGeneratedLabel
                )}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {neverGeneratedLabel}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-dashed p-3">
            <p className="text-muted-foreground text-xs">Entries</p>
            <p className="text-lg font-semibold">{info.entryCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-dashed p-3">
            <p className="text-muted-foreground text-xs">File size</p>
            <p className="text-lg font-semibold">{formatFileSize(info.sizeInBytes)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (disableActions) {
                return;
              }
              onGenerate();
            }}
            disabled={loading || disableActions}
            className="flex-1 min-w-[150px] gap-2"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {actionLabel}
          </Button>

          {info.exists && (
            <Button variant="outline" asChild className="flex-1 min-w-[140px]">
              <a href={info.publicUrl} target="_blank" rel="noopener noreferrer">
                {viewLabel}
              </a>
            </Button>
          )}
        </div>
        {disableActions && disabledMessage && (
          <p className="text-xs text-muted-foreground mt-3">{disabledMessage}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const SeoManagement: React.FC = () => {
  const { t, language } = useApp();
  const apiEnabled = seoService.isApiEnabled;
  const [overview, setOverview] = useState<SeoOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<GenerationState>({ sitemap: false, feed: false });

  const locale = useMemo(() => (language === 'ar' ? ar : enUS), [language]);

const decorateFileInfo = (info?: SeoFileInfo | null): SeoFileInfo => {
  if (!info) {
    return {
      fileName: '',
      publicUrl: '',
      sizeInBytes: 0,
      entryCount: 0,
      exists: false,
    };
  }

  if (!info.lastUpdatedUtc) {
    return info;
  }
    const formatted = formatDistanceToNow(new Date(info.lastUpdatedUtc), {
      addSuffix: true,
      locale,
    });
    return {
      ...info,
      lastUpdatedUtc: formatted,
    };
  };

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await seoService.getOverview();
      setOverview({
        ...data,
        sitemap: decorateFileInfo(data.sitemap),
        productFeed: decorateFileInfo(data.productFeed),
      });
    } catch (err) {
      setError(
        (err as Error)?.message ??
          t('admin.seo.loadError', { defaultValue: 'Unable to load the current SEO status.' })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleGenerate = async (type: keyof GenerationState) => {
    setPending((prev) => ({ ...prev, [type]: true }));
    setError(null);
    try {
      const result =
        type === 'sitemap'
          ? await seoService.generateSitemap()
          : await seoService.generateFeed();
      const updatedInfo = decorateFileInfo(result);
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              sitemap: type === 'sitemap' ? updatedInfo : prev.sitemap,
              productFeed: type === 'feed' ? updatedInfo : prev.productFeed,
            }
          : prev
      );
    } catch (err) {
      setError(
        (err as Error)?.message ??
          t('admin.seo.error', { defaultValue: 'Unable to update SEO files right now.' })
      );
    } finally {
      setPending((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              {error ??
                t('admin.seo.loadError', {
                  defaultValue: 'Unable to load the current SEO status.',
                })}
            </p>
          </CardContent>
        </Card>
        <Button onClick={() => void loadOverview()}>{t('common.retry', { defaultValue: 'Retry' })}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('admin.manageSeo', { defaultValue: 'SEO & sitemap' })}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.seo.subtitle', {
            defaultValue: 'Generate search-friendly XML files and keep marketplaces in sync.',
          })}
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {!apiEnabled && (
        <Card className="border-amber-200 bg-amber-50 text-amber-800">
          <CardContent className="py-4 text-sm">
            {t('admin.seo.publicModeNotice', {
              defaultValue:
                'Production mode detected: displaying sitemap/feed data from published files. Regeneration is only allowed on localhost.',
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-dashed">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('admin.seo.baseUrl', { defaultValue: 'Primary domain' })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{overview.baseUrl}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-dashed">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('admin.seo.productsIndexed', { defaultValue: 'Active products' })}
            </p>
            <p className="text-2xl font-bold">{overview.activeProductCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-dashed">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('admin.seo.categoriesIndexed', { defaultValue: 'Active categories' })}
            </p>
            <p className="text-2xl font-bold">{overview.activeCategoryCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SeoFileCard
          info={overview.sitemap}
          title={t('admin.seo.sitemapTitle', { defaultValue: 'XML Sitemap' })}
          description={t('admin.seo.sitemapDescription', {
            defaultValue: 'List of crawlable pages for Google, Bing, and other engines.',
          })}
          icon={<FileCode2 className="h-6 w-6" />}
          statusLabel={t('admin.seo.statusReady', { defaultValue: 'Ready for crawlers' })}
          actionLabel={
            pending.sitemap
              ? t('admin.seo.generating', { defaultValue: 'Generating…' })
              : t('admin.seo.generateSitemap', { defaultValue: 'Generate sitemap' })
          }
          loading={pending.sitemap}
          onGenerate={() => void handleGenerate('sitemap')}
          lastUpdatedLabel={t('admin.seo.lastUpdated', { defaultValue: 'Last updated' })}
          neverGeneratedLabel={t('admin.seo.neverGenerated', { defaultValue: 'Not generated yet' })}
          viewLabel={t('admin.seo.viewFile', { defaultValue: 'Open file' })}
          disableActions={!apiEnabled}
          disabledMessage={
            apiEnabled
              ? undefined
              : t('admin.seo.localOnly', {
                  defaultValue: 'Regeneration is available only on localhost.',
                })
          }
        />

        <SeoFileCard
          info={overview.productFeed}
          title={t('admin.seo.feedTitle', { defaultValue: 'Product Feed' })}
          description={t('admin.seo.feedDescription', {
            defaultValue: 'Structured product feed for catalogs, ads, and marketplaces.',
          })}
          icon={<Rss className="h-6 w-6" />}
          statusLabel={t('admin.seo.statusReady', { defaultValue: 'Ready for crawlers' })}
          actionLabel={
            pending.feed
              ? t('admin.seo.generating', { defaultValue: 'Generating…' })
              : t('admin.seo.generateFeed', { defaultValue: 'Generate feed' })
          }
          loading={pending.feed}
          onGenerate={() => void handleGenerate('feed')}
          lastUpdatedLabel={t('admin.seo.lastUpdated', { defaultValue: 'Last updated' })}
          neverGeneratedLabel={t('admin.seo.neverGenerated', { defaultValue: 'Not generated yet' })}
          viewLabel={t('admin.seo.viewFile', { defaultValue: 'Open file' })}
          disableActions={!apiEnabled}
          disabledMessage={
            apiEnabled
              ? undefined
              : t('admin.seo.localOnly', {
                  defaultValue: 'Regeneration is available only on localhost.',
                })
          }
        />
      </div>
    </div>
  );
};
