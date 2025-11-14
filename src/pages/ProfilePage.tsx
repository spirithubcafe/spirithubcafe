import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
// import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Seo } from '../components/seo/Seo';
import { resolveAbsoluteUrl } from '../config/siteMetadata';
import { orderService } from '../services';
import type { Order } from '../types/order';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Save, 
  X, 
  ShoppingBag, 
  Shield,
  Coffee,
  Star,
  Clock,
  Activity,
  ArrowLeft,
  Camera,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  Eye,
  Globe
} from 'lucide-react';

interface ProfileStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  memberSince: string;
  loyaltyPoints: number;
}

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  bio: string;
  avatar: string;
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [stats, setStats] = useState<ProfileStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
    memberSince: new Date().toISOString(),
    loyaltyPoints: 0
  });
  
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: user?.displayName || '',
    email: user?.username || '',
    phone: '',
    address: '',
    city: '',
    country: 'عُمان',
    postalCode: '',
    bio: '',
    avatar: ''
  });
  
  const [editData, setEditData] = useState<UserProfile>(profileData);

  // Load user data and orders
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserOrders();
      
      // Update profile data with user info
      setProfileData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.username || ''
      }));
      
      setEditData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.username || ''
      }));
    }
  }, [isAuthenticated, user]);

  const loadUserOrders = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log('📦 Loading orders for user:', user.id);
      
      // Use the new user-specific endpoint
      const response = await orderService.getOrdersByUserId(
        user.id.toString(), 
        { 
          page: 1, 
          pageSize: 100 
        }
      );
      
      console.log('✅ User orders response:', response);
      
      let userOrders = response.data || [];
      console.log(`📊 Found ${userOrders.length} orders for user ${user.id}`);
      
      // Debug: Check order details
      if (userOrders.length > 0) {
        console.log('🔍 First order details:', userOrders[0]);
        console.log('🔍 Items in first order:', userOrders[0].items);
        console.log('🔍 Items count:', userOrders[0].items?.length);
        console.log('🔍 ItemsCount field:', userOrders[0].itemsCount);
        console.log('🔍 Address:', userOrders[0].address);
        console.log('🔍 City:', userOrders[0].city);
        console.log('🔍 Country:', userOrders[0].country);
        console.log('🔍 ShippingMethod:', userOrders[0].shippingMethod);
      }
      
      // Load full details for each order to get complete information
      console.log('🔄 Loading full details for all orders...');
      const ordersWithFullDetails = await Promise.all(
        userOrders.map(async (order: Order) => {
          try {
            // Get full order details
            const detailResponse = await orderService.getOrderById(order.id);
            if (detailResponse.success && detailResponse.data) {
              console.log(`✅ Loaded full details for order ${order.id}`);
              return detailResponse.data;
            } else {
              console.warn(`⚠️ Failed to load details for order ${order.id}, using summary data`);
              return order;
            }
          } catch (error) {
            console.error(`❌ Error loading details for order ${order.id}:`, error);
            return order;
          }
        })
      );
      
      console.log('✅ All order details loaded');
      setOrders(ordersWithFullDetails);
      
      // Calculate stats
      const totalOrders = userOrders.length;
      const totalSpent = userOrders
        .filter((order: Order) => order.paymentStatus === 'Paid')
        .reduce((sum: number, order: Order) => sum + order.totalAmount, 0);
      
      setStats({
        totalOrders,
        totalSpent,
        favoriteProducts: 0, // TODO: Implement favorites
        memberSince: user.lastLoggedIn || new Date().toISOString(),
        loyaltyPoints: Math.floor(totalSpent * 10) // 10 points per OMR
      });
      
    } catch (error) {
      console.error('❌ Failed to load user orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement API call to update user profile
      // await userService.updateProfile(editData);
      
      setProfileData(editData);
      setIsEditing(false);
      setSaveMessage(isArabic ? 'تم حفظ البيانات بنجاح' : 'Profile updated successfully');
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage(isArabic ? 'فشل في حفظ البيانات' : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(profileData);
    setIsEditing(false);
    setSaveMessage('');
  };

  // SEO data
  const seoTitle = isArabic ? 'الملف الشخصي - سبيريت هب كافيه' : 'Profile - Spirit Hub Cafe';
  const seoDescription = isArabic 
    ? 'إدارة الملف الشخصي ومعلومات الحساب في سبيريت هب كافيه'
    : 'Manage your profile and account information at Spirit Hub Cafe';
  const canonicalProfileUrl = resolveAbsoluteUrl('/profile');

  if (!isAuthenticated || !user) {
    return (
      <div className={`min-h-screen bg-gray-50 page-padding-top ${isArabic ? 'rtl' : 'ltr'}`}>
        <Seo
          title={seoTitle}
          description={seoDescription}
          canonical={canonicalProfileUrl}
          noindex
          robots="noindex, nofollow"
        />
        <div className="container mx-auto py-12">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
              <User className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {isArabic ? 'يرجى تسجيل الدخول' : 'Login Required'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {isArabic ? 'يرجى تسجيل الدخول لعرض الملف الشخصي' : 'Please login to view your profile'}
              </p>
              <Button onClick={() => navigate('/login')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 page-padding-top ${isArabic ? 'rtl' : 'ltr'}`}>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalProfileUrl}
        noindex
        robots="noindex, nofollow"
      />
      
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isArabic ? 'الملف الشخصي' : 'My Profile'}
            </h1>
            <p className="text-gray-600">
              {isArabic ? 'إدارة معلوماتك الشخصية وطلباتك' : 'Manage your personal information and orders'}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isArabic ? 'الرئيسية' : 'Home'}
          </Button>
        </div>

        {saveMessage && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback className="text-lg">
                        {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-semibold mt-4">{profileData.fullName}</h3>
                  <p className="text-gray-600">{profileData.email}</p>
                  {user.roles && user.roles.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      {isArabic ? 'عضو مميز' : 'Premium Member'}
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{isArabic ? 'الطلبات' : 'Orders'}</span>
                    </div>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{isArabic ? 'المجموع' : 'Total Spent'}</span>
                    </div>
                    <span className="font-semibold">{stats.totalSpent.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{isArabic ? 'النقاط' : 'Points'}</span>
                    </div>
                    <span className="font-semibold">{stats.loyaltyPoints}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{isArabic ? 'العضوية' : 'Member Since'}</span>
                    </div>
                    <span className="text-sm">{format(new Date(stats.memberSince), 'MMM yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">
                  {isArabic ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="profile">
                  {isArabic ? 'المعلومات الشخصية' : 'Personal Info'}
                </TabsTrigger>
                <TabsTrigger value="orders">
                  {isArabic ? 'الطلبات' : 'Orders'}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {isArabic ? 'نشاط الحساب' : 'Account Activity'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-900">{stats.totalOrders}</div>
                        <div className="text-sm text-blue-700">{isArabic ? 'إجمالي الطلبات' : 'Total Orders'}</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-900">
                          {stats.totalSpent.toFixed(1)} {isArabic ? 'ر.ع.' : 'OMR'}
                        </div>
                        <div className="text-sm text-green-700">{isArabic ? 'إجمالي المبلغ' : 'Total Spent'}</div>
                      </div>
                      
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-900">{stats.loyaltyPoints}</div>
                        <div className="text-sm text-yellow-700">{isArabic ? 'نقاط الولاء' : 'Loyalty Points'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {isArabic ? 'آخر الطلبات' : 'Recent Orders'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-semibold">{order.orderNumber}</div>
                              <div className="text-sm text-gray-600">
                                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {order.totalAmount.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                              </div>
                              <Badge 
                                variant={order.paymentStatus === 'Paid' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveTab('orders')}
                        >
                          {isArabic ? 'عرض جميع الطلبات' : 'View All Orders'}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {isArabic ? 'لا توجد طلبات حتى الآن' : 'No orders yet'}
                        </p>
                        <Button className="mt-4" onClick={() => navigate('/products')}>
                          {isArabic ? 'تسوق الآن' : 'Shop Now'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
                      </CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {isArabic ? 'تعديل' : 'Edit'}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="fullName">{isArabic ? 'الاسم الكامل' : 'Full Name'}</Label>
                        {isEditing ? (
                          <Input
                            id="fullName"
                            value={editData.fullName}
                            onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">{profileData.fullName}</div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          {profileData.email}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {isArabic ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="phone">{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                            placeholder="+968 9123 4567"
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {profileData.phone || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="country">{isArabic ? 'البلد' : 'Country'}</Label>
                        {isEditing ? (
                          <Select
                            value={editData.country}
                            onValueChange={(value) => setEditData({...editData, country: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="عُمان">🇴🇲 {isArabic ? 'عُمان' : 'Oman'}</SelectItem>
                              <SelectItem value="الإمارات">🇦🇪 {isArabic ? 'الإمارات' : 'UAE'}</SelectItem>
                              <SelectItem value="السعودية">🇸🇦 {isArabic ? 'السعودية' : 'Saudi Arabia'}</SelectItem>
                              <SelectItem value="الكويت">🇰🇼 {isArabic ? 'الكويت' : 'Kuwait'}</SelectItem>
                              <SelectItem value="البحرين">🇧🇭 {isArabic ? 'البحرين' : 'Bahrain'}</SelectItem>
                              <SelectItem value="قطر">🇶🇦 {isArabic ? 'قطر' : 'Qatar'}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            {profileData.country}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="city">{isArabic ? 'المدينة' : 'City'}</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            value={editData.city}
                            onChange={(e) => setEditData({...editData, city: e.target.value})}
                            placeholder={isArabic ? 'مسقط' : 'Muscat'}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {profileData.city || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="postalCode">{isArabic ? 'الرمز البريدي' : 'Postal Code'}</Label>
                        {isEditing ? (
                          <Input
                            id="postalCode"
                            value={editData.postalCode}
                            onChange={(e) => setEditData({...editData, postalCode: e.target.value})}
                            placeholder="100"
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            {profileData.postalCode || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="address">{isArabic ? 'العنوان الكامل' : 'Full Address'}</Label>
                        {isEditing ? (
                          <Textarea
                            id="address"
                            value={editData.address}
                            onChange={(e) => setEditData({...editData, address: e.target.value})}
                            placeholder={isArabic ? 'العنوان الكامل مع التفاصيل' : 'Full address with details'}
                            rows={3}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-20">
                            {profileData.address || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="bio">{isArabic ? 'نبذة شخصية' : 'Bio'}</Label>
                        {isEditing ? (
                          <Textarea
                            id="bio"
                            value={editData.bio}
                            onChange={(e) => setEditData({...editData, bio: e.target.value})}
                            placeholder={isArabic ? 'اكتب نبذة مختصرة عنك...' : 'Tell us about yourself...'}
                            rows={3}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-20">
                            {profileData.bio || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      {isArabic ? 'جميع الطلبات' : 'All Orders'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? `إجمالي ${stats.totalOrders} طلب` : `Total of ${stats.totalOrders} orders`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                          {isArabic ? 'جاري تحميل الطلبات...' : 'Loading orders...'}
                        </p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          // Status badge styling
                          const getStatusColor = (status: string) => {
                            switch(status) {
                              case 'Delivered': return 'text-green-700 bg-green-100';
                              case 'Processing': return 'text-blue-700 bg-blue-100';
                              case 'Shipped': return 'text-purple-700 bg-purple-100';
                              case 'Pending': return 'text-yellow-700 bg-yellow-100';
                              case 'Cancelled': return 'text-red-700 bg-red-100';
                              default: return 'text-gray-700 bg-gray-100';
                            }
                          };

                          const getPaymentColor = (paymentStatus: string) => {
                            switch(paymentStatus) {
                              case 'Paid': return 'text-green-700 bg-green-100';
                              case 'Unpaid': return 'text-orange-700 bg-orange-100';
                              case 'Failed': return 'text-red-700 bg-red-100';
                              case 'Refunded': return 'text-purple-700 bg-purple-100';
                              case 'PartiallyRefunded': return 'text-yellow-700 bg-yellow-100';
                              default: return 'text-gray-700 bg-gray-100';
                            }
                          };

                          return (
                          <div key={order.id} className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="font-semibold text-lg mb-1">
                                  {isArabic ? 'طلب رقم' : 'Order'} #{order.orderNumber}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {format(new Date(order.createdAt), 'MMMM dd, yyyy - HH:mm')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-xl mb-2 text-amber-700">
                                  {order.totalAmount.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                    {isArabic 
                                      ? order.status === 'Delivered' ? 'تم التوصيل'
                                        : order.status === 'Processing' ? 'قيد المعالجة'
                                        : order.status === 'Shipped' ? 'تم الشحن'
                                        : order.status === 'Pending' ? 'قيد الانتظار'
                                        : order.status === 'Cancelled' ? 'ملغي'
                                        : order.status
                                      : order.status
                                    }
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.paymentStatus)}`}>
                                    {isArabic
                                      ? order.paymentStatus === 'Paid' ? 'مدفوع'
                                        : order.paymentStatus === 'Unpaid' ? 'غير مدفوع'
                                        : order.paymentStatus === 'Failed' ? 'فشل الدفع'
                                        : order.paymentStatus === 'Refunded' ? 'مسترد'
                                        : order.paymentStatus === 'PartiallyRefunded' ? 'مسترد جزئياً'
                                        : order.paymentStatus
                                      : order.paymentStatus
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">{isArabic ? 'العناصر:' : 'Items:'}</span>
                                <span className="ml-2 font-medium">
                                  {order.itemsCount || order.items?.length || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">{isArabic ? 'الشحن:' : 'Shipping:'}</span>
                                <span className="ml-2 font-medium">
                                  {!order.shippingMethod || order.shippingMethod === 0
                                    ? (isArabic ? 'غير محدد' : 'Not specified')
                                    : order.shippingMethod === 1 
                                    ? (isArabic ? 'استلام من المتجر' : 'Store Pickup')
                                    : order.shippingMethod === 2 
                                    ? 'Nool Delivery'
                                    : order.shippingMethod === 3
                                    ? 'Aramex Courier'
                                    : (isArabic ? 'غير محدد' : 'Not specified')
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">{isArabic ? 'العنوان:' : 'Address:'}</span>
                                <span className="ml-2 font-medium">
                                  {(() => {
                                    const parts = [];
                                    // Check address
                                    if (order.address && typeof order.address === 'string' && order.address.trim() && order.address !== ',' && order.address !== 'null') {
                                      parts.push(order.address.trim());
                                    }
                                    // Check city
                                    if (order.city && typeof order.city === 'string' && order.city.trim() && order.city !== 'null') {
                                      parts.push(order.city.trim());
                                    }
                                    // Check country
                                    if (order.country && typeof order.country === 'string' && order.country.trim() && order.country !== 'null') {
                                      parts.push(order.country.trim());
                                    }
                                    
                                    return parts.length > 0 
                                      ? parts.join(', ') 
                                      : (isArabic ? 'غير محدد' : 'Not specified');
                                  })()}
                                </span>
                              </div>
                              {order.trackingNumber && order.trackingNumber.trim() && (
                                <div>
                                  <span className="text-gray-600">{isArabic ? 'رقم التتبع:' : 'Tracking:'}</span>
                                  <span className="ml-2 font-mono text-sm">{order.trackingNumber}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/order/${order.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {isArabic ? 'التفاصيل' : 'View Details'}
                              </Button>
                              {order.paymentStatus !== 'Paid' && order.status !== 'Cancelled' && (
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    // Generate payment link and navigate
                                    const token = btoa(`${order.id}:${order.orderNumber}:${Date.now()}`);
                                    navigate(`/payment?orderId=${order.id}&token=${token}`);
                                  }}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  {isArabic ? 'دفع الآن' : 'Pay Now'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {isArabic ? 'لا توجد طلبات' : 'No Orders Yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {isArabic ? 'ابدأ التسوق لإنشاء طلبك الأول' : 'Start shopping to create your first order'}
                        </p>
                        <Button onClick={() => navigate('/products')}>
                          <Coffee className="h-4 w-4 mr-2" />
                          {isArabic ? 'تسوق الآن' : 'Shop Now'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;