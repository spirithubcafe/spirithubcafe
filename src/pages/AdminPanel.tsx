import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AdminDashboard, CategoriesManagement, ProductsManagement, UsersManagement, NewsletterManagement } from '../components/admin';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { 
  Users, 
  Package, 
  BarChart3,
  Settings,
  FileText,
  TrendingUp,
  ArrowLeft,
  Grid3X3,
  Menu,
  Mail
} from 'lucide-react';
import { OrdersManagement } from '../components/admin/OrdersManagement';

interface AdminPanelProps {
  onBack?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, isAdmin, hasRole } = useAuth();
  const { t } = useApp();
  const [selectedModule, setSelectedModule] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
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
      id: 'categories',
      title: t('admin.categories.title'),
      description: t('admin.categories.description'),
      icon: Grid3X3,
      color: 'purple',
      roles: ['Admin', 'Manager']
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
      id: 'users',
      title: t('admin.manageUsers'),
      description: t('admin.usersDesc'),
      icon: Users,
      color: 'green',
      roles: ['Admin']
    },
    {
      id: 'orders',
      title: t('admin.manageOrders'),
      description: t('admin.ordersDesc'),
      icon: FileText,
      color: 'indigo',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'newsletter',
      title: t('admin.newsletter.title') || 'Newsletter',
      description: t('admin.newsletter.description') || 'Manage newsletter subscribers',
      icon: Mail,
      color: 'cyan',
      roles: ['Admin', 'Manager']
    },
    {
      id: 'reports',
      title: t('admin.reports.title'),
      description: t('admin.reportsDesc'),
      icon: TrendingUp,
      color: 'emerald',
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
        return <AdminDashboard />;
      case 'categories':
        return <CategoriesManagement />;
      case 'products':
        return <ProductsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'orders':
        return <OrdersContent />;
      case 'newsletter':
        return <NewsletterManagement />;
      case 'reports':
        return <ReportsContent />;
      case 'system':
        return <SystemContent />;
      default:
        return <AdminDashboard />;
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <>
      {availableModules.map((module) => {
        const IconComponent = module.icon;
        return (
          <Button
            key={module.id}
            variant={selectedModule === module.id ? "default" : "ghost"}
            className="w-full justify-start h-auto p-4"
            onClick={() => handleModuleSelect(module.id)}
          >
            <div className="flex items-start space-x-3">
              <IconComponent className="h-5 w-5 mt-0.5 shrink-0" />
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
    </>
  );

  return (
    <div className="min-h-screen bg-background page-padding-top">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>{t('admin.adminPanel')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {renderSidebarContent()}
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t('admin.adminPanel')}
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {t('admin.welcomeMessage')} {user?.displayName || user?.username}
              </p>
            </div>
          </div>
          <Button onClick={handleBack} variant="outline" size="sm" className="sm:size-default">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block w-80 space-y-2">
            {renderSidebarContent()}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderModuleContent()}
          </div>
        </div>
      </div>
    </div>
  );
};



// Orders Management Content
const OrdersContent: React.FC = () => {
  return <OrdersManagement />;
};

// Reports Content
const ReportsContent: React.FC = () => {
  const { t } = useApp();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>{t('admin.reports.title')}</span>
        </CardTitle>
        <CardDescription>
          {t('admin.reportsAnalytics')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t('admin.comingSoon')}</p>
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
        <p className="text-muted-foreground">{t('admin.comingSoon')}</p>
      </CardContent>
    </Card>
  );
};