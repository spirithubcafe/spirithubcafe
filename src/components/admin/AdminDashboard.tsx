import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { adminService, type AdminDashboardStats } from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
  Mail,
  Sun,
  MoonStar,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  ThermometerSun,
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

const MUSCAT_WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=23.5880&longitude=58.3829&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day&timezone=Asia%2FMuscat';

const ADMIN_DASHBOARD_STYLES = `
@keyframes adminFadeIn{from{opacity:0}to{opacity:1}}
@keyframes adminSlideInFromTop{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.animate-in{animation-duration:.5s;animation-fill-mode:both}
.fade-in{animation-name:adminFadeIn}
.slide-in-from-top{animation-name:adminSlideInFromTop}
.weather-hero-card{background:radial-gradient(circle at 16% 18%,rgba(245,158,11,.16),transparent 20%),radial-gradient(circle at 84% 24%,rgba(14,165,233,.12),transparent 24%),linear-gradient(135deg,#0f172a 0%,#13253e 36%,#16344c 68%,#1c4859 100%)}
.weather-grid-pattern{background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(180deg,rgba(0,0,0,.5),transparent 88%);opacity:.24}
.weather-ambient-glow{position:absolute;border-radius:9999px;filter:blur(26px);opacity:.72}
.weather-ambient-glow-left{left:-40px;top:22px;height:180px;width:180px;background:rgba(245,158,11,.1)}
.weather-ambient-glow-right{right:8%;bottom:-32px;height:220px;width:220px;background:rgba(14,165,233,.08)}
.weather-temperature{text-shadow:0 12px 30px rgba(15,23,42,.38)}
.weather-stat-card{box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.weather-hero-icon-shell{position:relative;display:flex;align-items:center;justify-content:center;min-height:6.5rem;min-width:6.5rem;border:1px solid rgba(255,255,255,.14);border-radius:9999px;background-color:rgba(255,255,255,.07);backdrop-filter:blur(8px);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 22px 40px -28px rgba(15,23,42,.95)}
.weather-icon-panel{box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
@media (max-width:639px){.weather-hero-icon-shell{min-height:5.75rem;min-width:5.75rem}}
`;

const getWeatherPresentation = (weatherCode: number, isDay: boolean, isArabic: boolean) => {
  if (weatherCode === 0) {
    return {
      label: isArabic ? 'سماء صافية' : 'Clear sky',
      Icon: isDay ? Sun : MoonStar,
      iconClassName: isDay ? 'text-amber-300' : 'text-indigo-100',
      iconPanelClassName: isDay
        ? 'from-amber-300/28 via-orange-200/14 to-transparent text-amber-100'
        : 'from-indigo-300/24 via-sky-200/10 to-transparent text-indigo-50',
    };
  }

  if ([1, 2].includes(weatherCode)) {
    return {
      label: isArabic ? 'مشمس جزئياً' : 'Mostly sunny',
      Icon: isDay ? CloudSun : CloudMoon,
      iconClassName: isDay ? 'text-sky-200' : 'text-indigo-100',
      iconPanelClassName: isDay
        ? 'from-sky-300/22 via-cyan-200/12 to-transparent text-sky-100'
        : 'from-indigo-300/24 via-slate-200/10 to-transparent text-indigo-50',
    };
  }

  if ([3, 45, 48].includes(weatherCode)) {
    return {
      label: isArabic ? 'غائم' : 'Cloudy',
      Icon: Cloud,
      iconClassName: 'text-slate-200',
      iconPanelClassName: 'from-slate-300/20 via-slate-200/10 to-transparent text-slate-100',
    };
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return {
      label: isArabic ? 'أجواء ممطرة' : 'Rain showers',
      Icon: CloudRain,
      iconClassName: 'text-cyan-200',
      iconPanelClassName: 'from-cyan-300/24 via-sky-200/10 to-transparent text-cyan-100',
    };
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return {
      label: isArabic ? 'عواصف رعدية' : 'Thunderstorms',
      Icon: CloudLightning,
      iconClassName: 'text-fuchsia-200',
      iconPanelClassName: 'from-fuchsia-300/22 via-violet-200/10 to-transparent text-fuchsia-100',
    };
  }

  return {
    label: isArabic ? 'طقس مستقر' : 'Stable weather',
    Icon: CloudSun,
    iconClassName: 'text-sky-200',
    iconPanelClassName: 'from-sky-300/22 via-cyan-200/12 to-transparent text-sky-100',
  };
};

export const AdminDashboard: React.FC = () => {
  const { t, language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      try {
        setWeatherLoading(true);
        const response = await fetch(MUSCAT_WEATHER_URL);
        if (!response.ok) {
          throw new Error(`Weather request failed with ${response.status}`);
        }

        const payload = (await response.json()) as {
          current?: {
            temperature_2m: number;
            apparent_temperature: number;
            weather_code: number;
            wind_speed_10m: number;
            relative_humidity_2m: number;
            is_day: number;
            time: string;
          };
        };

        if (!payload.current || !isMounted) {
          return;
        }

        setWeather({
          temperature: payload.current.temperature_2m,
          apparentTemperature: payload.current.apparent_temperature,
          humidity: payload.current.relative_humidity_2m,
          windSpeed: payload.current.wind_speed_10m,
          weatherCode: payload.current.weather_code,
          isDay: payload.current.is_day === 1,
          time: payload.current.time,
        });
      } catch (weatherError) {
        console.error('Failed to load Muscat weather:', weatherError);
      } finally {
        if (isMounted) {
          setWeatherLoading(false);
        }
      }
    };

    void loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: t('admin.products.add'),
      description: t('admin.products.addDesc'),
      icon: Plus,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('products/add'),
    },
    {
      title: t('admin.categories.manage'),
      description: t('admin.categories.manageDesc'),
      icon: Grid3X3,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      onClick: () => navigate('categories'),
    },
    {
      title: t('admin.orders.view'),
      description: t('admin.orders.viewDesc'),
      icon: ShoppingCart,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      onClick: () => navigate('orders'),
    },
    {
      title: t('admin.users.manage'),
      description: t('admin.users.manageDesc'),
      icon: Users,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      onClick: () => navigate('users'),
    },
    {
      title: t('admin.reports.view'),
      description: t('admin.reports.viewDesc'),
      icon: BarChart3,
      color: 'text-sky-700',
      bgColor: 'bg-sky-50',
      onClick: () => navigate('reports'),
    },
    {
      title: t('admin.emailSettings.title') || (isArabic ? 'إعدادات البريد' : 'Email Settings'),
      description:
        t('admin.emailSettings.quickDesc') ||
        (isArabic ? 'تحديث بيانات المرسل' : 'Update sender configuration'),
      icon: Mail,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      onClick: () => navigate('email-settings'),
    },
    {
      title: t('admin.settings.system'),
      description: t('admin.settings.systemDesc'),
      icon: Settings,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      onClick: () => navigate('settings'),
    },
  ];

  const metricCards = stats
    ? [
        {
          title: t('admin.categories.title'),
          primary: stats.categories.total,
          secondary: `${stats.categories.active} ${t('admin.active')}`,
          icon: Grid3X3,
          accent: 'text-violet-700',
          bgAccent: 'bg-violet-100',
          href: 'categories',
        },
        {
          title: t('admin.products.title'),
          primary: stats.products.total,
          secondary: `${stats.products.featured} ${t('admin.featured')}, ${stats.products.active} ${t('admin.active')}`,
          icon: Package,
          accent: 'text-orange-700',
          bgAccent: 'bg-orange-100',
          href: 'products',
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
          accent: 'text-emerald-700',
          bgAccent: 'bg-emerald-100',
          href: 'users',
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
          accent: 'text-amber-700',
          bgAccent: 'bg-amber-100',
          href: 'reviews',
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

  const weatherPresentation = weather
    ? getWeatherPresentation(weather.weatherCode, weather.isDay, isArabic)
    : null;

  const weatherMeta = [
    {
      label: isArabic ? 'المحسوسة' : 'Feels like',
      value: weather ? `${Math.round(weather.apparentTemperature)}°` : '--',
      icon: ThermometerSun,
      accent: 'from-orange-400/20 to-rose-400/10 text-orange-100',
    },
    {
      label: isArabic ? 'الرطوبة' : 'Humidity',
      value: weather ? `${weather.humidity}%` : '--',
      icon: Droplets,
      accent: 'from-cyan-400/20 to-sky-400/10 text-cyan-100',
    },
    {
      label: isArabic ? 'الرياح' : 'Wind',
      value: weather ? `${Math.round(weather.windSpeed)} km/h` : '--',
      icon: Wind,
      accent: 'from-emerald-400/20 to-teal-400/10 text-emerald-100',
    },
  ];

  return (
    <>
      <style>{ADMIN_DASHBOARD_STYLES}</style>
      <div className="space-y-6 animate-in fade-in duration-500">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t('admin.dashboard')}</h2>
          <p className="text-sm text-slate-500">{t('admin.dashboardDesc')}</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-full bg-white/80" onClick={() => navigate('reports')}>
          <Eye className="h-4 w-4" />
          {t('admin.viewAnalytics')}
        </Button>
      </section>

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

      <section>
        <Card className="weather-hero-card relative overflow-hidden border-0 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]">
          <div className="weather-grid-pattern absolute inset-0 opacity-40" />
          <div className="weather-ambient-glow weather-ambient-glow-left" />
          <div className="weather-ambient-glow weather-ambient-glow-right" />
          <CardContent className="relative p-0">
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-6 xl:p-7">
              <div className="flex min-w-0 flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    {isArabic ? 'مسقط' : 'Muscat'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl xl:text-[2rem]">
                      {weatherLoading
                        ? isArabic
                          ? 'جاري تحديث الطقس'
                          : 'Refreshing weather'
                        : weatherPresentation?.label ?? (isArabic ? 'الطقس الحالي' : 'Current weather')}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
                  <div className="flex items-end gap-3">
                    <span className="weather-temperature text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl xl:text-[4.75rem]">
                      {weatherLoading ? '--' : weather ? Math.round(weather.temperature) : '--'}
                    </span>
                    <span className="pb-2 text-xl font-medium text-white/85 sm:text-2xl">°C</span>
                  </div>
                  <div className="pb-2 text-sm text-slate-200/78 sm:text-[15px]">
                    {weather?.time
                      ? isArabic
                        ? `آخر تحديث ${new Date(weather.time).toLocaleTimeString('ar-OM', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : `Updated ${new Date(weather.time).toLocaleTimeString('en-OM', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                      : isArabic
                        ? 'بيانات مباشرة'
                        : 'Live conditions'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:min-w-[31rem] lg:justify-self-end">
                <div className="weather-icon-panel flex min-h-[8.75rem] items-center justify-center rounded-[22px] border border-white/10 bg-white/6 p-3 backdrop-blur-md sm:min-h-[7.5rem]">
                  {weatherLoading ? (
                    <Loader2 className="h-14 w-14 text-cyan-100" />
                  ) : weatherPresentation ? (
                    <div className={`weather-hero-icon-shell bg-gradient-to-br ${weatherPresentation.iconPanelClassName}`}>
                      <weatherPresentation.Icon className={`h-14 w-14 sm:h-16 sm:w-16 ${weatherPresentation.iconClassName}`} />
                    </div>
                  ) : (
                    <div className="weather-hero-icon-shell bg-gradient-to-br from-amber-300/20 via-amber-200/10 to-transparent text-amber-100">
                      <AlertTriangle className="h-14 w-14 sm:h-16 sm:w-16 text-amber-100" />
                    </div>
                  )}
                </div>
                {weatherMeta.map(({ label, value, icon: Icon, accent }) => (
                  <div
                    key={label}
                    className="weather-stat-card flex min-h-[8.75rem] flex-col justify-between rounded-[22px] border border-white/10 bg-white/6 p-3.5 backdrop-blur-md sm:min-h-[7.5rem]"
                  >
                    <div className={`inline-flex rounded-2xl bg-gradient-to-br p-2 ${accent}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/62">{label}</div>
                      <div className="mt-1.5 text-xl font-semibold tracking-tight text-white">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={`metric-skeleton-${index}`} className="overflow-hidden border-dashed bg-white/80">
                  <CardContent className="p-4">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="h-3 w-16 animate-pulse rounded bg-muted" />
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                    <div className="mb-2 h-7 w-14 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted/80" />
                  </CardContent>
                </Card>
              ))
            : metricCards.map(({ title, primary, secondary, icon: Icon, accent, bgAccent, badges, href }) => (
                <Card
                  key={title}
                  className="group cursor-pointer overflow-hidden border-slate-200/80 bg-white shadow-sm transition-colors hover:border-slate-300"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(href)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(href);
                    }
                  }}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{title}</span>
                        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{primary.toLocaleString()}</div>
                      </div>
                      <div className={`rounded-2xl p-3 ${bgAccent}`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accent}`} />
                      </div>
                    </div>
                    <p className="min-h-[2.5rem] text-xs leading-5 text-slate-500 sm:text-sm">{secondary}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {badges?.map((badge) => (
                          <Badge key={badge.label} variant={badge.variant} className="rounded-full px-2 py-0.5 text-[10px]">
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{t('admin.quickActions')}</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="group h-auto flex-col items-start gap-3 rounded-[20px] border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-slate-300"
                onClick={action.onClick}
              >
                <div className="flex w-full items-center justify-between">
                  <div className={`rounded-2xl p-3 shadow-sm ${action.bgColor} ${action.color}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <ArrowUpRight className={`h-5 w-5 ${action.color} opacity-35`} />
                </div>
                <div className="w-full space-y-1 text-left">
                  <div className="text-sm font-semibold text-slate-950">{action.title}</div>
                  <p className="text-xs font-normal leading-5 text-slate-500">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-full bg-background p-2">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              {t('admin.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                {t('common.loading')}
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
                    <Grid3X3 className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{stats.categories.active} {t('admin.activeCategories')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.outOf')} {stats.categories.total} {t('admin.totalCategories')}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {Math.round((stats.categories.active / Math.max(stats.categories.total, 1)) * 100)}%
                  </Badge>
                </div>

                <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Package className="h-5 w-5 text-orange-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{stats.products.featured} {t('admin.featuredProducts')}</p>
                    <p className="text-xs text-muted-foreground">{stats.products.active} {t('admin.activeProducts')}</p>
                  </div>
                  <Star className="h-5 w-5 shrink-0 fill-orange-400 text-orange-400" />
                </div>

                <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Users className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{stats.users.activeUsers} {t('admin.activeUsers')}</p>
                    <p className="text-xs text-muted-foreground">{t('admin.outOf')} {stats.users.totalUsers} {t('admin.totalUsers')}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 shrink-0 text-emerald-700" />
                </div>

                <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    {stats.reviews.pending > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-700" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-amber-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{stats.reviews.pending} {t('admin.pendingReviews')}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.products.lowStock > 0
                        ? `${stats.products.lowStock} ${t('admin.productsLowStock')}`
                        : t('admin.allStockHealthy')}
                    </p>
                  </div>
                  {stats.reviews.pending > 0 && (
                    <Badge variant="destructive" className="shrink-0">
                      {t('admin.urgent')}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.noData')}</p>
            )}
          </CardContent>
        </Card>
      </section>
      </div>
    </>
  );
};

export default AdminDashboard;