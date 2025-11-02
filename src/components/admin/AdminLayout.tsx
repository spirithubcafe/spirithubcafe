import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
  Home
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user, isAdmin, hasRole, isLoading, isAuthenticated } = useAuth();
  const { t } = useApp();

  console.log('AdminLayout render:', { 
    isLoading, 
    isAuthenticated, 
    user: user ? { id: user.id, username: user.username, roles: user.roles } : null,
    isAdminResult: user ? isAdmin() : 'no user'
  });

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Wait for authentication to be fully resolved
  // Add a small delay to ensure auth state is fully settled
  if (!isAuthenticated || !user || (user && !isAdmin())) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">
              {t('admin.accessDenied')}
            </CardTitle>
            <CardDescription>
              {t('admin.adminRequired')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('admin.backHome')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminModules = [
    {
      id: 'dashboard',
      title: t('admin.dashboard'),
      description: t('admin.dashboardDesc'),
      icon: BarChart3,
      color: 'blue',
      path: '/admin',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'categories',
      title: t('admin.manageCategories'),
      description: t('admin.categoriesDesc'),
      icon: Grid3X3,
      color: 'purple',
      path: '/admin/categories',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'products',
      title: t('admin.manageProducts'),
      description: t('admin.productsDesc'),
      icon: Package,
      color: 'orange',
      path: '/admin/products',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'users',
      title: t('admin.manageUsers'),
      description: t('admin.usersDesc'),
      icon: Users,
      color: 'green',
      path: '/admin/users',
      roles: ['Admin']
    },
    {
      id: 'orders',
      title: t('admin.manageOrders'),
      description: t('admin.ordersDesc'),
      icon: FileText,
      color: 'indigo',
      path: '/admin/orders',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'reports',
      title: t('admin.reports'),
      description: t('admin.reportsDesc'),
      icon: TrendingUp,
      color: 'emerald',
      path: '/admin/reports',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'system',
      title: t('admin.systemSettings'),
      description: t('admin.systemDesc'),
      icon: Settings,
      color: 'gray',
      path: '/admin/settings',
      roles: ['Admin']
    }
  ];

  const availableModules = adminModules.filter(module => 
    module.roles.some(role => hasRole(role))
  );

  const getModuleColor = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const isCurrentPath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('admin.panel')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.welcome')} {user.displayName || user.username}
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                {t('admin.backHome')}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground text-right">
                <p>{user.displayName || user.username}</p>
                <p className="text-xs">{user.roles?.[0] || 'User'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user.displayName?.[0] || user.username?.[0] || 'A'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('admin.modules')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = isCurrentPath(module.path);
                  return (
                    <Link
                      key={module.id}
                      to={module.path}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isActive
                          ? getModuleColor(module.color)
                          : 'hover:bg-muted border-transparent'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">{module.title}</p>
                        <p className="text-xs opacity-70">{module.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};