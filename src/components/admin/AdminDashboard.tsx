import React from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AuthDebugPanel } from '../auth/AuthDebugPanel';
import { 
  Users, 
  Package, 
  ShoppingCart,
  Grid3X3,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useApp();

  const stats = [
    {
      title: t('admin.categories.title'),
      value: '12',
      description: t('admin.categories.description'),
      icon: Grid3X3,
      color: 'purple'
    },
    {
      title: t('admin.products.title'),
      value: '48',
      description: t('admin.products.description'),
      icon: Package,
      color: 'orange'
    },
    {
      title: t('admin.users.title'),
      value: '156',
      description: t('admin.users.description'),
      icon: Users,
      color: 'green'
    },
    {
      title: t('admin.manageOrders'),
      value: '89',
      description: t('admin.ordersDesc'),
      icon: ShoppingCart,
      color: 'blue'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      green: 'text-green-600',
      blue: 'text-blue-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('admin.dashboard')}</h2>
        <p className="text-muted-foreground">{t('admin.dashboardDesc')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${getColorClasses(stat.color)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('admin.recentActivity')}
          </CardTitle>
          <CardDescription>
            {t('admin.recentActivityDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  New product added: "Ethiopian Yirgacheffe"
                </p>
                <p className="text-sm text-muted-foreground">
                  2 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  User registered: john.doe@example.com
                </p>
                <p className="text-sm text-muted-foreground">
                  15 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-2 w-2 rounded-full bg-orange-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Order completed: #12345
                </p>
                <p className="text-sm text-muted-foreground">
                  1 hour ago
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel - Remove this in production */}
      {import.meta.env.DEV && <AuthDebugPanel />}
    </div>
  );
};