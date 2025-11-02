import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { PageHeader } from '../components/layout/PageHeader';
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
  Shield,
  Crown,
  Coffee,
  Star,
  Clock
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    email: user?.username || '',
    phone: '+968 9876 5432',
    address: 'Muscat, Oman'
  });

  if (!isAuthenticated || !user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <PageHeader
          title="Profile"
          titleAr="الملف الشخصي"
          subtitle="Access your account information"
          subtitleAr="الوصول إلى معلومات حسابك"
        />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'لم يتم تسجيل الدخول' : 'Not authenticated'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى ملفك الشخصي' : 'Please login to access your profile'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user.displayName || user.username || 'User';
  const userStats = {
    totalOrders: 24,
    favoriteItems: 8,
    loyaltyPoints: 1250,
    memberSince: '2025'
  };

  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <PageHeader
        title="My Profile"
        titleAr="ملفي الشخصي"
        subtitle="Manage your account and preferences"
        subtitleAr="إدارة حسابك وتفضيلاتك"
      />

      <div className="container mx-auto px-4 py-16 space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
        >
          <div className="bg-stone-700 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white/20">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-stone-600 text-white font-bold text-2xl">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Crown className="h-8 w-8 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>
              
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{userName}</h1>
                  <Badge className="bg-yellow-400 text-yellow-900 font-semibold">
                    <Crown className="h-4 w-4 mr-1" />
                    VIP Member
                  </Badge>
                </div>
                <p className="text-white/80 mb-1">{user.username}</p>
                <p className="text-white/70 text-sm">
                  {language === 'ar' ? `عضو منذ ${userStats.memberSince}` : `Member since ${userStats.memberSince}`}
                </p>
              </div>

              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalOrders}</p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.favoriteItems}</p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'المفضلة' : 'Favorites'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userStats.loyaltyPoints}</p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Coffee className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'أكواب القهوة' : 'Cups Enjoyed'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white rounded-2xl p-2 shadow-sm">
              <TabsTrigger value="personal" className="rounded-xl">
                <User className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'شخصي' : 'Personal'}
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-xl">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'الطلبات' : 'Orders'}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-xl">
                <Heart className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'المفضلة' : 'Favorites'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl">
                <Bell className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'إدارة بياناتك الشخصية' : 'Manage your personal data'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">
                        {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="displayName"
                            value={editData.displayName}
                            onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                          />
                        ) : (
                          <span className="flex-1 p-2">{userName}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                          />
                        ) : (
                          <span className="flex-1 p-2">{user.username}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          />
                        ) : (
                          <span className="flex-1 p-2">{editData.phone}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {language === 'ar' ? 'العنوان' : 'Address'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {isEditing ? (
                          <Input
                            id="address"
                            value={editData.address}
                            onChange={(e) => setEditData({...editData, address: e.target.value})}
                          />
                        ) : (
                          <span className="flex-1 p-2">{editData.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'حفظ' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    {language === 'ar' ? 'تاريخ الطلبات' : 'Order History'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Recent Orders */}
                    {[1, 2, 3].map((order) => (
                      <div key={order} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Coffee className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {language === 'ar' ? `طلب #${1000 + order}` : `Order #${1000 + order}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'قهوة إسبريسو + كرواسون' : 'Espresso Coffee + Croissant'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">12.50 OMR</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">
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

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    {language === 'ar' ? 'المنتجات المفضلة' : 'Favorite Products'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Favorite Items */}
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                        <div className="w-16 h-16 bg-amber-200 rounded-xl flex items-center justify-center">
                          <Coffee className="h-8 w-8 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {language === 'ar' ? 'قهوة أرابيكا بريميوم' : 'Premium Arabica Coffee'}
                          </p>
                          <p className="text-sm text-gray-600">8.50 OMR</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">4.8</span>
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

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? 'إشعارات الطلبات' : 'Order Notifications'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'تلقي تحديثات حول طلباتك' : 'Receive updates about your orders'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {language === 'ar' ? 'تفعيل' : 'Enable'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'إدارة بطاقاتك المحفوظة' : 'Manage your saved cards'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {language === 'ar' ? 'إدارة' : 'Manage'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">
                            {language === 'ar' ? 'الأمان والخصوصية' : 'Security & Privacy'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'إعدادات الأمان وكلمة المرور' : 'Security settings and password'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {language === 'ar' ? 'تحديث' : 'Update'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-600">
                        {language === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {language === 'ar' ? 'حذف حسابك نهائياً' : 'Permanently delete your account'}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;