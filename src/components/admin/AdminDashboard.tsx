import React, { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { adminService, type AdminDashboardStats } from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Users,
  Package,
  Grid3X3,
  Activity,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useApp();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        const result = await adminService.getDashboardStats();
        if (isMounted) {
          setStats(result);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard statistics:', err);
        if (isMounted) {
          setError(t('common.error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const metricCards = stats
    ? [
        {
          title: t('admin.categories.title'),
          primary: stats.categories.total,
          secondary: `${stats.categories.active} ${t('admin.active')}`,
          icon: Grid3X3,
          accent: 'text-purple-600',
        },
        {
          title: t('admin.products.title'),
          primary: stats.products.total,
          secondary: `${stats.products.featured} ${t('admin.featured')}, ${stats.products.active} ${t('admin.active')}`,
          icon: Package,
          accent: 'text-orange-600',
          badges: stats.products.lowStock > 0
            ? [
                {
                  label: `${stats.products.lowStock} ${t('admin.lowStock')}`,
                  variant: 'destructive' as const,
                },
              ]
            : undefined,
        },
        {
          title: t('admin.users.title'),
          primary: stats.users.totalUsers,
          secondary: `${stats.users.activeUsers} ${t('admin.active')}`,
          icon: Users,
          accent: 'text-emerald-600',
          badges:
            stats.users.adminUsers > 0
              ? [
                  {
                    label: `${stats.users.adminUsers} ${t('admin.admins')}`,
                    variant: 'outline' as const,
                  },
                ]
              : undefined,
        },
        {
          title: t('admin.reports'),
          primary: stats.reviews.pending,
          secondary: t('admin.pendingReviews'),
          icon: AlertTriangle,
          accent: 'text-amber-600',
          badges:
            stats.reviews.pending > 0
              ? [
                  {
                    label: t('admin.needsAttention'),
                    variant: 'destructive' as const,
                  },
                ]
              : undefined,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">{t('admin.dashboard')}</h2>
        <p className="text-muted-foreground">{t('admin.dashboardDesc')}</p>
      </div>

      {error && (
        <Card className="border border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </CardTitle>
            <CardDescription>{t('admin.dashboardError')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`metric-skeleton-${index}`} className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-6 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted/80" />
                </CardContent>
              </Card>
            ))
          : metricCards.map(({ title, primary, secondary, icon: Icon, accent, badges }, index) => (
              <Card key={`${title}-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{title}</CardTitle>
                  <Icon className={`h-4 w-4 ${accent}`} />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{primary.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{secondary}</p>
                  {badges && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {badges.map((badge, badgeIndex) => (
                        <Badge key={badgeIndex} variant={badge.variant} className="text-[11px]">
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('admin.recentActivity')}
          </CardTitle>
          <CardDescription>{t('admin.recentActivityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : stats ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                <div>
                  <p className="font-medium">
                    {stats.categories.active} {t('admin.activeCategories')}
                  </p>
                  <p className="text-muted-foreground">
                    {t('admin.outOf')} {stats.categories.total} {t('admin.totalCategories')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                <div>
                  <p className="font-medium">
                    {stats.products.featured} {t('admin.featuredProducts')}
                  </p>
                  <p className="text-muted-foreground">
                    {stats.products.active} {t('admin.activeProducts')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-medium">
                    {stats.users.activeUsers} {t('admin.activeUsers')}
                  </p>
                  <p className="text-muted-foreground">
                    {t('admin.outOf')} {stats.users.totalUsers} {t('admin.totalUsers')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                <div>
                  <p className="font-medium">
                    {stats.reviews.pending} {t('admin.pendingReviews')}
                  </p>
                  <p className="text-muted-foreground">
                    {stats.products.lowStock > 0
                      ? `${stats.products.lowStock} ${t('admin.productsLowStock')}`
                      : t('admin.allStockHealthy')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('admin.noData')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
