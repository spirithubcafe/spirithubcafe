import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { formatPrice } from '../lib/regionUtils';
// import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Seo } from '../components/seo/Seo';
import { resolveAbsoluteUrl } from '../config/siteMetadata';
import { orderService } from '../services';
import type { Order } from '../types/order';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileEditForm } from '../components/pages/ProfileEditForm';
import { ProfilePictureUpload } from '../components/pages/ProfilePictureUpload';
import { ChangePasswordForm } from '../components/pages/ChangePasswordForm';
import { profileService } from '../services/profileService';
import { newsletterService } from '../services/newsletterService';
import type { UserProfile as UserProfileType } from '../services/profileService';
import { getProfilePictureUrl } from '../lib/profileUtils';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
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
  Globe,
  Lock,
  Image as ImageIcon,
  Bell,
  BellOff,
  Loader2,
  AlertCircle
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
  const { currentRegion } = useRegion();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  
  // Newsletter subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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

  // Load user profile from API
  const loadUserProfile = async () => {
    // Always create a fallback profile first from user data
    if (user) {
      const fallbackProfile: UserProfileType = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.username,
        emailVerified: false,
        totalSpent: 0,
        points: 0,
        memberSince: user.lastLoggedIn || new Date().toISOString(),
        isGoogleAccount: false,
        isActive: user.isActive,
        roles: user.roles || [],
      };
      setUserProfile(fallbackProfile);
      setProfileData({
        fullName: user.displayName || '',
        email: user.username || '',
        phone: '',
        address: '',
        city: '',
        country: 'عُمان',
        postalCode: '',
        bio: '',
        avatar: ''
      });
    }

    // Try to load from API, but don't fail if it doesn't work
    try {
      setIsLoadingProfile(true);
      const profile = await profileService.getMyProfile();
      setUserProfile(profile);
      
      // Update local profile data with API data
      setProfileData({
        fullName: profile.fullName || profile.displayName || '',
        email: profile.email || '',
        phone: profile.phoneNumber || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'عُمان',
        postalCode: profile.postalCode || '',
        bio: profile.bio || '',
        avatar: getProfilePictureUrl(profile.profilePicture) || ''
      });
    } catch (error: any) {
      console.warn('Could not load profile from API, using fallback data:', error.message);
      // Silently fail - we already have fallback data set
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load newsletter subscription status
  const loadNewsletterStatus = async () => {
    if (!user?.username) return;
    
    try {
      const status = await newsletterService.checkSubscriptionStatus(user.username);
      setIsSubscribed(status);
      
      // Update localStorage to match server status
      if (status) {
        localStorage.setItem(`newsletter_subscribed_${user.username}`, 'true');
      } else {
        localStorage.removeItem(`newsletter_subscribed_${user.username}`);
      }
    } catch (error) {
      console.error('Failed to load newsletter subscription status:', error);
      
      // Fallback to localStorage
      const localStatus = localStorage.getItem(`newsletter_subscribed_${user.username}`) === 'true';
      setIsSubscribed(localStatus);
    }
  };

  const handleNewsletterToggle = async () => {
    if (!user?.username) return;
    
    setIsLoadingSubscription(true);
    setSubscriptionMessage(null);
    
    try {
      if (isSubscribed) {
        // Unsubscribe
        await newsletterService.unsubscribe({ email: user.username });
        setIsSubscribed(false);
        localStorage.removeItem(`newsletter_subscribed_${user.username}`);
        setSubscriptionMessage({
          type: 'success',
          text: isArabic ? 'تم إلغاء الاشتراك بنجاح' : 'Successfully unsubscribed from newsletter'
        });
      } else {
        // Subscribe
        await newsletterService.subscribe({ 
          email: user.username,
          name: user.displayName || undefined
        });
        setIsSubscribed(true);
        localStorage.setItem(`newsletter_subscribed_${user.username}`, 'true');
        setSubscriptionMessage({
          type: 'success',
          text: isArabic ? 'تم الاشتراك بنجاح في النشرة الإخبارية' : 'Successfully subscribed to newsletter'
        });
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setSubscriptionMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to toggle newsletter subscription:', error);
      
      // Check if already subscribed error
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('موجود')) {
        setIsSubscribed(true);
        localStorage.setItem(`newsletter_subscribed_${user.username}`, 'true');
        setSubscriptionMessage({
          type: 'success',
          text: isArabic ? 'أنت مشترك بالفعل في النشرة الإخبارية' : 'You are already subscribed to the newsletter'
        });
      } else {
        setSubscriptionMessage({
          type: 'error',
          text: errorMessage || (isArabic ? 'حدث خطأ. حاول مرة أخرى' : 'An error occurred. Please try again')
        });
      }
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Load user data and orders
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 User authenticated, loading profile and orders...', user);
      loadUserProfile();
      loadUserOrders();
      loadNewsletterStatus();
    } else {
      console.log('❌ User not authenticated or user data missing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, currentRegion.code]);

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
      const isAdmin = user?.roles?.includes('Admin') || false;
      const ordersWithFullDetails = await Promise.all(
        userOrders.map(async (order: Order) => {
          try {
            // Get full order details
            // Admin can access any order, regular users can only access their own orders
            const detailResponse = isAdmin
              ? await orderService.getOrderById(order.id)
              : await orderService.getMyOrderDetails(order.id);
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



        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto ring-2 ring-stone-100">
                      <AvatarImage src={getProfilePictureUrl(userProfile?.profilePicture) || profileData.avatar} />
                      <AvatarFallback className="text-lg bg-stone-200 text-stone-700">
                        {(userProfile?.displayName || profileData.fullName).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
                      onClick={() => setActiveTab('picture')}
                      title={isArabic ? 'تغيير الصورة' : 'Change picture'}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-semibold mt-4">
                    {userProfile?.displayName || profileData.fullName || user?.displayName || 'User'}
                  </h3>
                  <p className="text-gray-600">{userProfile?.email || profileData.email}</p>
                  {userProfile?.membershipType && (
                    <Badge variant="secondary" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      {userProfile.membershipType}
                    </Badge>
                  )}
                  {userProfile?.points !== undefined && userProfile.points > 0 && (
                    <div className="mt-2 text-sm">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="h-3 w-3 mr-1" />
                        {userProfile.points} {isArabic ? 'نقطة' : 'points'}
                      </Badge>
                    </div>
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
                    <span className="font-semibold">
                      {formatPrice((userProfile?.totalSpent || stats.totalSpent), currentRegion.code, isArabic)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{isArabic ? 'النقاط' : 'Points'}</span>
                    </div>
                    <span className="font-semibold">{userProfile?.points || stats.loyaltyPoints}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{isArabic ? 'العضوية' : 'Member Since'}</span>
                    </div>
                    <span className="text-sm">
                      {format(new Date(userProfile?.memberSince || stats.memberSince), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
                <TabsTrigger value="overview">
                  <Activity className="h-4 w-4 mr-1" />
                  {isArabic ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-1" />
                  {isArabic ? 'المعلومات' : 'Info'}
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <Edit2 className="h-4 w-4 mr-1" />
                  {isArabic ? 'تعديل' : 'Edit'}
                </TabsTrigger>
                <TabsTrigger value="picture">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {isArabic ? 'الصورة' : 'Picture'}
                </TabsTrigger>
                <TabsTrigger value="password">
                  <Lock className="h-4 w-4 mr-1" />
                  {isArabic ? 'كلمة المرور' : 'Password'}
                </TabsTrigger>
                <TabsTrigger value="newsletter">
                  <Bell className="h-4 w-4 mr-1" />
                  {isArabic ? 'النشرة' : 'Newsletter'}
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <ShoppingBag className="h-4 w-4 mr-1" />
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
                          {stats.totalSpent.toFixed(1)} {isArabic ? currentRegion.currencySymbol : currentRegion.currency}
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
                                {formatPrice(order.totalAmount, currentRegion.code, isArabic)}
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

              {/* Profile Tab - View Only */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? 'عرض معلوماتك الشخصية' : 'View your personal information'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{isArabic ? 'الاسم المعروض' : 'Display Name'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          {userProfile?.displayName || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'الاسم الكامل' : 'Full Name'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          {userProfile?.fullName || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          {userProfile?.email}
                          {userProfile?.emailVerified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          {userProfile?.phoneNumber || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'البلد' : 'Country'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          {userProfile?.country || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'المدينة' : 'City'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {userProfile?.city || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div>
                        <Label>{isArabic ? 'الرمز البريدي' : 'Postal Code'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          {userProfile?.postalCode || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>{isArabic ? 'العنوان الكامل' : 'Full Address'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-20">
                          {userProfile?.address || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>{isArabic ? 'نبذة شخصية' : 'Bio'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md min-h-20">
                          {userProfile?.bio || (isArabic ? 'لم يتم تحديده' : 'Not provided')}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>{isArabic ? 'نوع العضوية' : 'Membership Type'}</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          {userProfile?.membershipType || (isArabic ? 'عادي' : 'Standard')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button onClick={() => setActiveTab('edit')}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {isArabic ? 'تعديل المعلومات' : 'Edit Information'}
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('picture')}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {isArabic ? 'تغيير الصورة' : 'Change Picture'}
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('password')}>
                        <Lock className="h-4 w-4 mr-2" />
                        {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edit Profile Tab */}
              <TabsContent value="edit">
                {isLoadingProfile ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                          {isArabic ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : userProfile ? (
                  <ProfileEditForm 
                    profile={userProfile} 
                    onUpdate={loadUserProfile}
                    language={language}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {isArabic ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile'}
                        </p>
                        <Button className="mt-4" onClick={loadUserProfile}>
                          {isArabic ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Profile Picture Tab */}
              <TabsContent value="picture">
                {isLoadingProfile ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                          {isArabic ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : userProfile ? (
                  <ProfilePictureUpload 
                    profile={userProfile} 
                    onUpdate={loadUserProfile}
                    language={language}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {isArabic ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile'}
                        </p>
                        <Button className="mt-4" onClick={loadUserProfile}>
                          {isArabic ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Change Password Tab */}
              <TabsContent value="password">
                <ChangePasswordForm 
                  language={language}
                  onSuccess={() => {
                    setTimeout(() => setActiveTab('overview'), 2000);
                  }}
                />
              </TabsContent>

              {/* Newsletter Tab */}
              <TabsContent value="newsletter">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      {isArabic ? 'النشرة الإخبارية' : 'Newsletter Subscription'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic 
                        ? 'إدارة اشتراكك في النشرة الإخبارية'
                        : 'Manage your newsletter subscription preferences'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Newsletter Info */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <Mail className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          {isArabic 
                            ? 'ابق على اطلاع بآخر الأخبار'
                            : 'Stay Updated with Our Newsletter'}
                        </h3>
                        <p className="text-sm text-blue-700 mb-3">
                          {isArabic 
                            ? 'احصل على آخر الأخبار والعروض الحصرية والمنتجات الجديدة مباشرة في بريدك الإلكتروني.'
                            : 'Get the latest news, exclusive offers, and new products delivered straight to your inbox.'}
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {isArabic ? 'عروض حصرية للمشتركين' : 'Exclusive subscriber offers'}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {isArabic ? 'إشعارات بالمنتجات الجديدة' : 'New product notifications'}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {isArabic ? 'نصائح وأخبار عن القهوة' : 'Coffee tips and news'}
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {isSubscribed ? (
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Bell className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <BellOff className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">
                              {isArabic ? 'حالة الاشتراك' : 'Subscription Status'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user?.username || userProfile?.email}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={isSubscribed ? 'default' : 'secondary'}
                          className={isSubscribed ? 'bg-green-500' : ''}
                        >
                          {isSubscribed 
                            ? (isArabic ? 'مشترك' : 'Subscribed')
                            : (isArabic ? 'غير مشترك' : 'Not Subscribed')}
                        </Badge>
                      </div>

                      {/* Success/Error Message */}
                      {subscriptionMessage && (
                        <div className={`p-4 rounded-lg border ${
                          subscriptionMessage.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <div className="flex items-center gap-2">
                            {subscriptionMessage.type === 'success' ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <AlertCircle className="h-5 w-5" />
                            )}
                            <p className="text-sm font-medium">
                              {subscriptionMessage.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleNewsletterToggle}
                          disabled={isLoadingSubscription}
                          variant={isSubscribed ? 'destructive' : 'default'}
                          size="lg"
                          className="min-w-[200px]"
                        >
                          {isLoadingSubscription ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {isArabic ? 'جاري المعالجة...' : 'Processing...'}
                            </>
                          ) : isSubscribed ? (
                            <>
                              <BellOff className="h-4 w-4 mr-2" />
                              {isArabic ? 'إلغاء الاشتراك' : 'Unsubscribe'}
                            </>
                          ) : (
                            <>
                              <Bell className="h-4 w-4 mr-2" />
                              {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="text-xs text-gray-500 text-center pt-4 border-t">
                      {isArabic 
                        ? 'نحن نحترم خصوصيتك. يمكنك إلغاء الاشتراك في أي وقت.'
                        : 'We respect your privacy. You can unsubscribe at any time.'}
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
                                  {formatPrice(order.totalAmount, currentRegion.code, isArabic)}
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