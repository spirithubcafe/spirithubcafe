import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Save, 
  X, 
  Heart, 
  ShoppingBag, 
  Bell, 
  CreditCard,
  Settings,
  Shield,
  Crown,
  Coffee,
  Star,
  Clock,
  Activity,
  ArrowLeft,
  Camera
} from 'lucide-react';

interface ProfileStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  memberSince: string;
  loyaltyPoints: number;
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    email: user?.username || '',
    phone: '+968 9876 5432',
    address: 'Muscat, Oman'
  });

  if (!isAuthenticated || !user) {
    return (
      <div className={`min-h-screen bg-gray-50 pt-20 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
              <User className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {t('auth.loginRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {t('profile.loginPrompt')}
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.backHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock user stats - في الواقع هذه البيانات ستأتي من API
  const userStats: ProfileStats = {
    totalOrders: 24,
    totalSpent: 156.50,
    favoriteProducts: 8,
    memberSince: 'November 2025',
    loyaltyPoints: 1250
  };

  const tabs = [
    {
      id: 'overview',
      label: t('profile.tabs.overview'),
      labelAr: 'نظرة عامة',
      icon: Activity
    },
    {
      id: 'orders',
      label: t('profile.tabs.orders'),
      labelAr: 'الطلبات',
      icon: ShoppingBag
    },
    {
      id: 'favorites',
      label: t('profile.tabs.favorites'),
      labelAr: 'المفضلة',
      icon: Heart
    }
  ];

  const handleCancel = () => {
    setEditData({
      displayName: user?.displayName || '',
      email: user?.username || '',
      phone: '+968 9876 5432',
      address: 'Muscat, Oman'
    });
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen bg-background pt-20 pb-12 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Professional & Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 bg-card rounded-lg border shadow-sm">
            {/* User Info Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-2 ring-border shadow-md">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user.displayName || 'User'} />
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button 
                  className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                  title={t('profile.changePhoto')}
                  aria-label={t('profile.changePhoto')}
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground truncate">
                    {user.displayName || user.username}
                  </h1>
                  <Badge variant="secondary">
                    <Crown className="h-4 w-4 mr-1" />
                    {t('profile.memberSince')} {userStats.memberSince}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {user.username} • {t('profile.loyaltyPoints')}: {userStats.loyaltyPoints.toLocaleString()}
                </p>
                
                {/* Quick Stats - Mobile Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">{userStats.totalOrders}</div>
                    <div className="text-xs text-muted-foreground font-medium">{t('profile.totalOrders')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">OMR {userStats.totalSpent}</div>
                    <div className="text-xs text-muted-foreground font-medium">{t('profile.totalSpent')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">{userStats.favoriteProducts}</div>
                    <div className="text-xs text-muted-foreground font-medium">{t('profile.favorites')}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">{userStats.loyaltyPoints}</div>
                    <div className="text-xs text-muted-foreground font-medium">{t('profile.points')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 lg:flex-none min-w-[120px]"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('common.save')}
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('profile.editProfile')}
                  </>
                )}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 lg:flex-none min-w-[120px]"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Professional Tab System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-2 p-4 h-auto min-h-[80px]"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? tab.labelAr : tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profile Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('profile.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('profile.phone')}</p>
                        <p className="font-medium">{editData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('profile.address')}</p>
                        <p className="font-medium">{editData.address}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t('profile.quickActions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => navigate('/orders')}
                  >
                    <ShoppingBag className="h-4 w-4 mr-3" />
                    {t('profile.viewOrders')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => navigate('/favorites')}
                  >
                    <Heart className="h-4 w-4 mr-3" />
                    {t('profile.manageFavorites')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t('profile.orderHistory')}
                </CardTitle>
                <CardDescription>
                  {t('profile.recentOrders')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((order) => (
                    <div key={order} className="flex items-center gap-4 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Coffee className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {language === 'ar' ? `طلب #${1000 + order}` : `Order #${1000 + order}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'قهوة إسبريسو مزدوجة + كرواسون' : 'Double Espresso + Croissant'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">12.50 OMR</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {language === 'ar' ? 'تم التسليم' : 'Delivered'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {t('profile.favoriteProducts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-center gap-4 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Coffee className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {language === 'ar' ? 'قهوة أرابيكا بريميوم' : 'Premium Arabica Coffee'}
                        </p>
                        <p className="text-sm text-muted-foreground">8.50 OMR</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-primary fill-current" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('profile.accountSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/profile/notifications')}
                >
                  <Bell className="h-4 w-4 mr-3" />
                  {t('profile.notificationSettings')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/profile/payment')}
                >
                  <CreditCard className="h-4 w-4 mr-3" />
                  {t('profile.paymentMethods')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/profile/help')}
                >
                  <Shield className="h-4 w-4 mr-3" />
                  {t('profile.helpSupport')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;