import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  Users, 
  Package, 
  BarChart3,
  Settings,
  FileText,
  Activity,
  TrendingUp,
  UserCheck,
  ArrowLeft
} from 'lucide-react';

interface AdminPanelProps {
  onBack?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, isAdmin, hasRole } = useAuth();
  const { t } = useApp();
  const [selectedModule, setSelectedModule] = useState<string>('dashboard');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (!user || !isAdmin()) {
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
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
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
      roles: ['Admin', 'Manager']
    },
    {
      id: 'users',
      title: t('admin.manageUsers'),
      description: t('admin.usersDesc'),
      icon: Users,
      color: 'green',
      roles: ['Admin']
    },
    {
      id: 'products',
      title: t('admin.manageProducts'),
      description: t('admin.productsDesc'),
      icon: Package,
      color: 'orange',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'orders',
      title: t('admin.manageOrders'),
      description: t('admin.ordersDesc'),
      icon: FileText,
      color: 'purple',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'reports',
      title: t('admin.reports'),
      description: t('admin.reportsDesc'),
      icon: TrendingUp,
      color: 'indigo',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'system',
      title: t('admin.systemSettings'),
      description: t('admin.systemDesc'),
      icon: Settings,
      color: 'gray',
      roles: ['Admin']
    }
  ];

  const availableModules = adminModules.filter(module => 
    module.roles.some(role => hasRole(role))
  );

  const renderModuleContent = () => {
    switch (selectedModule) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UsersContent />;
      case 'products':
        return <ProductsContent />;
      case 'orders':
        return <OrdersContent />;
      case 'reports':
        return <ReportsContent />;
      case 'system':
        return <SystemContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('admin.title')}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {t('admin.subtitle')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="destructive" className="px-3 py-1">
                <UserCheck className="mr-1 h-3 w-3" />
                {user.displayName || user.username}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('admin.modules')}
                </CardTitle>
                <CardDescription>
                  {t('admin.modulesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableModules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <Button
                      key={module.id}
                      variant={selectedModule === module.id ? "default" : "ghost"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedModule(module.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`h-5 w-5 text-${module.color}-500 flex-shrink-0 mt-0.5`} />
                        <div className="text-left">
                          <div className="font-medium">{module.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {module.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderModuleContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>{t('admin.dashboard')}</span>
          </CardTitle>
          <CardDescription>
            {t('admin.dashboardOverview')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium">{t('admin.totalUsers')}</p>
                  <p className="text-2xl font-bold text-blue-800">1,234</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">{t('admin.totalOrders')}</p>
                  <p className="text-2xl font-bold text-green-800">5,678</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-medium">{t('admin.totalProducts')}</p>
                  <p className="text-2xl font-bold text-orange-800">89</p>
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Users Management Content
const UsersContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>{t('admin.manageUsers')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.usersManagement')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};

// Products Management Content
const ProductsContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>{t('admin.manageProducts')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.productsManagement')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};

// Orders Management Content
const OrdersContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{t('admin.manageOrders')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.ordersManagement')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};

// Reports Content
const ReportsContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>{t('admin.reports')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.reportsAnalytics')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};

// System Settings Content
const SystemContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>{t('admin.systemSettings')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.systemConfiguration')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};