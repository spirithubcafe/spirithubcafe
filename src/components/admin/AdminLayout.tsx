import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent } from '../ui/sheet';
import {
  Shield,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  TrendingUp,
  ArrowLeft,
  Grid3X3,
  Home,
  Menu,
  PanelLeft,
  Search,
  LogOut,
  ChevronDown,
  User,
  Globe,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface AdminNavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  badge?: string;
  disabled?: boolean;
}

interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

const SIDEBAR_STORAGE_KEY = 'admin.sidebar.collapsed';
const THEME_STORAGE_KEY = 'admin.theme.preference';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const {
    user,
    isAdmin,
    hasRole,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuth();
  const { t } = useApp();

  const [moduleSearch, setModuleSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('auth.loggingIn')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user && !isAdmin())) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <Shield className="h-14 w-14 text-destructive mx-auto" />
            <CardTitle className="text-2xl font-semibold">
              {t('admin.accessDenied')}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t('admin.adminRequired')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('admin.backHome')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems: AdminNavItem[] = [
    {
      id: 'dashboard',
      label: t('admin.dashboard'),
      description: t('admin.dashboardDesc'),
      icon: BarChart3,
      path: '/admin',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'categories',
      label: t('admin.manageCategories'),
      description: t('admin.categoriesDesc'),
      icon: Grid3X3,
      path: '/admin/categories',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'products',
      label: t('admin.manageProducts'),
      description: t('admin.productsDesc'),
      icon: Package,
      path: '/admin/products',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'users',
      label: t('admin.manageUsers'),
      description: t('admin.usersDesc'),
      icon: Users,
      path: '/admin/users',
      roles: ['Admin'],
    },
    {
      id: 'seo',
      label: t('admin.manageSeo'),
      description: t('admin.seoDesc'),
      icon: Globe,
      path: '/admin/seo',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'orders',
      label: t('admin.manageOrders'),
      description: t('admin.ordersDesc'),
      icon: FileText,
      path: '/admin/orders',
      roles: ['Admin', 'Manager'],
      badge: t('common.soon'),
      disabled: true,
    },
    {
      id: 'reports',
      label: t('admin.reports'),
      description: t('admin.reportsDesc'),
      icon: TrendingUp,
      path: '/admin/reports',
      roles: ['Admin', 'Manager'],
      badge: t('common.soon'),
      disabled: true,
    },
    {
      id: 'system',
      label: t('admin.systemSettings'),
      description: t('admin.systemDesc'),
      icon: Settings,
      path: '/admin/settings',
      roles: ['Admin'],
      badge: t('common.soon'),
      disabled: true,
    },
  ];

  const availableNavItems = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  const navGroups: AdminNavGroup[] = [
    {
      id: 'overview',
      label: t('admin.navGroups.overview'),
      items: availableNavItems.filter((item) => item.id === 'dashboard'),
    },
    {
      id: 'management',
      label: t('admin.navGroups.management'),
      items: availableNavItems.filter((item) =>
        ['categories', 'products', 'users'].includes(item.id)
      ),
    },
    {
      id: 'operations',
      label: t('admin.navGroups.operations'),
      items: availableNavItems.filter((item) =>
        ['orders', 'reports', 'system', 'seo'].includes(item.id)
      ),
    },
  ].filter((group) => group.items.length > 0);

  const query = moduleSearch.trim().toLowerCase();
  const filteredNavGroups = query
    ? navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            const label = item.label.toLowerCase();
            const description = item.description.toLowerCase();
            return label.includes(query) || description.includes(query);
          }),
        }))
        .filter((group) => group.items.length > 0)
    : navGroups;

  const isCurrentPath = (path: string) => {
    if (path === '/admin') {
      return (
        location.pathname === '/admin' || location.pathname === '/admin/'
      );
    }
    return location.pathname.startsWith(path);
  };

  const userName = user.displayName || user.username;
  const primaryRole = user.roles?.[0];
  const userInitial =
    userName?.charAt(0).toUpperCase() ?? user.username.charAt(0).toUpperCase();

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleLogout = async () => {
    await logout();
  };

  const translateRoleName = (roleName?: string) => {
    if (!roleName) {
      return '';
    }
    const normalized = roleName.trim().toLowerCase();
    const key = `admin.roles.${normalized}`;
    const translated = t(key);
    return translated === key ? roleName : translated;
  };

  const renderSidebar = (
    collapsed: boolean,
    onNavigate?: () => void
  ): React.ReactNode => {
    const navContent =
      filteredNavGroups.length > 0 ? (
        filteredNavGroups.map((group, index) => (
          <div key={group.id} className="space-y-2">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = !item.disabled && isCurrentPath(item.path);

                const content = (
                  <div
                    className={cn(
                      'group relative flex items-center rounded-xl px-3 py-2 text-sm transition-all duration-300 ease-out',
                      collapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      item.disabled && 'cursor-not-allowed opacity-70'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-transform duration-300',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground',
                        collapsed && isActive && 'scale-110'
                      )}
                    />
                    {!collapsed && (
                      <div className="flex flex-1 flex-col">
                        <span className="font-semibold leading-tight text-foreground">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    )}
                    {item.badge && !collapsed && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-[10px] uppercase tracking-wide"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </div>
                );

                const tooltipDescription = item.disabled
                  ? t('admin.comingSoon')
                  : item.description;

                if (item.disabled) {
                  if (collapsed) {
                    return (
                      <Tooltip key={item.id} delayDuration={50}>
                        <TooltipTrigger asChild>
                          <div aria-disabled="true">{content}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="space-y-1">
                          <p className="font-medium leading-tight">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tooltipDescription}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <div key={item.id} aria-disabled="true">
                      {content}
                    </div>
                  );
                }

                const link = (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="block"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    {content}
                  </Link>
                );

                if (!collapsed) {
                  return link;
                }

                return (
                  <Tooltip key={item.id} delayDuration={50}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="space-y-1">
                      <p className="font-medium leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {tooltipDescription}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {index < filteredNavGroups.length - 1 && (
              <Separator
                className={cn(
                  'mx-2 border-dashed border-border/50',
                  collapsed ? 'my-2' : 'my-3'
                )}
              />
            )}
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/60 px-3 py-6 text-center text-sm text-muted-foreground">
          {t('common.noResultsFound')}
        </div>
      );

    return (
      <>
        <div
          className={cn(
            'flex h-16 items-center border-b border-border/60 px-3'
          )}
        >
          <Link
            to="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted/60',
              collapsed && 'mx-auto gap-0 hover:bg-transparent'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/80">
                  {t('admin.brandName')}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {t('admin.consoleName')}
                </span>
              </div>
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 px-2 py-4">{navContent}</div>
          </ScrollArea>
        </div>
        <div className="border-t border-border/60 px-3 py-4">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl bg-muted/60 p-3 shadow-sm',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="h-10 w-10 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {userName}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {primaryRole && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-primary/10 text-primary"
                    >
                      {translateRoleName(primaryRole)}
                    </Badge>
                  )}
                  <span className="truncate">@{user.username}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={80}>
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <div className="flex min-h-screen bg-muted/30 text-sm text-foreground">
          <aside
            className={cn(
              'relative hidden border-r border-border/60 bg-card/95 text-card-foreground shadow-[0_18px_45px_-15px_rgba(15,23,42,0.4)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg transition-all duration-300 ease-in-out md:flex md:flex-col',
              isSidebarCollapsed ? 'w-20' : 'w-72'
            )}
          >
            {renderSidebar(isSidebarCollapsed)}
          </aside>

          <SheetContent
            side="left"
            className="w-72 border-border/40 p-0 md:hidden"
          >
            <div className="flex h-full flex-col bg-background">
              {renderSidebar(false, () => setIsMobileSidebarOpen(false))}
            </div>
          </SheetContent>

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
              <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    aria-label={t('admin.accessibility.openSidebar')}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      'hidden rounded-full border-border/60 md:inline-flex',
                      isSidebarCollapsed && 'bg-primary/10'
                    )}
                    onClick={handleSidebarToggle}
                    aria-label={
                      isSidebarCollapsed
                        ? t('admin.accessibility.expandSidebar')
                        : t('admin.accessibility.collapseSidebar')
                    }
                    aria-pressed={isSidebarCollapsed}
                  >
                    <PanelLeft
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        isSidebarCollapsed && 'rotate-180'
                      )}
                    />
                  </Button>
                  <div className="hidden md:flex flex-col leading-tight">
                    <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/80">
                      {t('admin.panel')}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {t('admin.welcome')} {userName}
                    </span>
                  </div>
                </div>

                <form
                  className="relative ml-auto flex-1 max-w-md"
                  onSubmit={handleSearchSubmit}
                >
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={moduleSearch}
                    onChange={(event) => setModuleSearch(event.target.value)}
                    placeholder={t('admin.modulesDesc')}
                    className="h-10 rounded-full border-border/60 bg-muted/60 pl-10 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={t('admin.accessibility.searchModules')}
                  />
                </form>

                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="hidden items-center gap-2 rounded-full border-border/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide md:inline-flex"
                  >
                    <Link to="/">
                      <Home className="h-4 w-4" />
                      {t('admin.backHome')}
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 hover:border-border/60"
                      >
                        <Avatar className="h-9 w-9 border border-border/60">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden min-w-0 flex-1 flex-col text-left sm:flex">
                          <span className="text-sm font-semibold leading-tight">
                            {userName}
                          </span>
                          {primaryRole && (
                            <span className="text-xs text-muted-foreground">
                              {translateRoleName(primaryRole)}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        {t('admin.welcome')} {userName}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          {t('nav.profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          {t('admin.dashboard')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          void handleLogout();
                        }}
                        className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('auth.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-10">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </Sheet>
    </TooltipProvider>
  );
};
