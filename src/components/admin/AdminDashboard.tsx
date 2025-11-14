import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { adminService, type AdminDashboardStats } from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import './AdminDashboard.css';
import {
  Users,
  Package,
  Grid3X3,
  Activity,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Eye,
  ArrowUpRight,
  Plus,
  Settings,
  BarChart3,
  Star,
  MessageSquare,
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
  onClick?: () => void;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
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

  const quickActions: QuickAction[] = [
    {
      title: t('admin.products.add'),
      description: t('admin.products.addDesc'),
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900',
      href: '/admin/products/add',
      onClick: () => navigate('/admin/products/add'),
    },
    {
      title: t('admin.categories.manage'),
      description: t('admin.categories.manageDesc'),
      icon: Grid3X3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900',
      href: '/admin/categories',
      onClick: () => navigate('/admin/categories'),
    },
    {
      title: t('admin.orders.view'),
      description: t('admin.orders.viewDesc'),
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900',
      href: '/admin/orders',
      onClick: () => navigate('/admin/orders'),
    },
    {
      title: t('admin.users.manage'),
      description: t('admin.users.manageDesc'),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900',
      href: '/admin/users',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: t('admin.reports.view'),
      description: t('admin.reports.viewDesc'),
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900',
      href: '/admin/reports',
      onClick: () => navigate('/admin/reports'),
    },
    {
      title: t('admin.settings.system'),
      description: t('admin.settings.systemDesc'),
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900',
      href: '/admin/settings',
      onClick: () => navigate('/admin/settings'),
    },
  ];

  const metricCards = stats
    ? [
        {
          title: t('admin.categories.title'),
          primary: stats.categories.total,
          secondary: `${stats.categories.active} ${t('admin.active')}`,
          icon: Grid3X3,
          accent: 'text-purple-600',
          bgAccent: 'bg-purple-100 dark:bg-purple-950',
        },
        {
          title: t('admin.products.title'),
          primary: stats.products.total,
          secondary: `${stats.products.featured} ${t('admin.featured')}, ${stats.products.active} ${t('admin.active')}`,
          icon: Package,
          accent: 'text-orange-600',
          bgAccent: 'bg-orange-100 dark:bg-orange-950',
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
          bgAccent: 'bg-emerald-100 dark:bg-emerald-950',
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
          title: t('admin.reviews.title'),
          primary: stats.reviews.pending,
          secondary: t('admin.pendingReviews'),
          icon: MessageSquare,
          accent: 'text-amber-600',
          bgAccent: 'bg-amber-100 dark:bg-amber-950',
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('admin.dashboard')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('admin.dashboardDesc')}</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{t('admin.viewAnalytics')}</span>
          <span className="sm:hidden">{t('admin.insights')}</span>
        </Button>
      </div>

      {error && (
        <Card className="border border-destructive/40 bg-destructive/5 animate-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </CardTitle>
            <CardDescription>{t('admin.dashboardError')}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`metric-skeleton-${index}`} className="border-dashed">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                  <div className="h-6 w-12 animate-pulse rounded bg-muted mb-1" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted/80" />
                </CardContent>
              </Card>
            ))
          : metricCards.map(({ title, primary, secondary, icon: Icon, accent, bgAccent, badges }, index) => (
              <Card 
                key={`${title}-${index}`}
                className="group hover:shadow-md transition-all duration-200 cursor-pointer animate-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                    <div className={`rounded-full p-2 ${bgAccent}`}>
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${accent}`} />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mb-0.5">{primary.toLocaleString()}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{secondary}</p>
                  {badges && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {badges.map((badge, badgeIndex) => (
                        <Badge 
                          key={badgeIndex} 
                          variant={badge.variant} 
                          className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4 animate-pulse"
                        >
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">{t('admin.quickActions')}</h3>
          <Badge variant="secondary">
            {quickActions.length}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-3 sm:p-4 hover:bg-accent transition-all duration-300 hover:scale-105 animate-in slide-in-from-left"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
                onClick={action.onClick}
              >
                <div className="flex w-full items-center justify-between">
                  <div className={`rounded-lg bg-background p-2 shadow-sm ${action.color}`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <ArrowUpRight className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color} opacity-50`} />
                </div>
                <div className="space-y-0.5 text-left w-full">
                  <div className="font-semibold text-sm">{action.title}</div>
                  <p className="text-xs text-muted-foreground font-normal leading-tight">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Activity Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-full bg-background p-2 shadow-sm">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              {t('admin.recentActivity')}
            </CardTitle>
            <CardDescription className="text-xs">{t('admin.recentActivityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                {t('common.loading')}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    <Grid3X3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {stats.categories.active} {t('admin.activeCategories')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.outOf')} {stats.categories.total} {t('admin.totalCategories')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {Math.round((stats.categories.active / stats.categories.total) * 100)}%
                  </Badge>
                </div>
                
                <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {stats.products.featured} {t('admin.featuredProducts')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.products.active} {t('admin.activeProducts')}
                    </p>
                  </div>
                  <Star className="h-5 w-5 shrink-0 text-orange-400 fill-orange-400" />
                </div>
                
                <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {stats.users.activeUsers} {t('admin.activeUsers')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.outOf')} {stats.users.totalUsers} {t('admin.totalUsers')}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 shrink-0 text-emerald-600" />
                </div>
                
                <div className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                    {stats.reviews.pending > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {stats.reviews.pending} {t('admin.pendingReviews')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.products.lowStock > 0
                        ? `${stats.products.lowStock} ${t('admin.productsLowStock')}`
                        : t('admin.allStockHealthy')}
                    </p>
                  </div>
                  {stats.reviews.pending > 0 && (
                    <Badge variant="destructive" className="animate-pulse shrink-0">
                      {t('admin.urgent')}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('admin.noData')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats & Insights */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-full bg-background p-2 shadow-sm">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              {t('admin.insights')}
            </CardTitle>
            <CardDescription className="text-xs">{t('admin.insightsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-full bg-muted/70 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-950 p-2">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-sm">{t('admin.products.title')}</span>
                  </div>
                  <p className="text-xl font-bold">
                    {stats.products.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.products.active} {t('admin.active')}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-950 p-2">
                      <Grid3X3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-sm">{t('admin.categories.title')}</span>
                  </div>
                  <p className="text-xl font-bold">
                    {stats.categories.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.categories.active} {t('admin.active')}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="rounded-full bg-emerald-100 dark:bg-emerald-950 p-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="font-semibold text-sm">{t('admin.users.title')}</span>
                  </div>
                  <p className="text-xl font-bold">
                    {stats.users.totalUsers}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.users.activeUsers} {t('admin.active')}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
