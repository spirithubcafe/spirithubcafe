import React from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart, Calendar } from 'lucide-react';

export const ReportsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? 'التقارير والتحليلات' : 'Reports & Analytics'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'رؤى الأعمال والإحصائيات' : 'Business insights and statistics'}
          </p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OMR 12,345</div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? '+20.1% من الشهر الماضي' : '+20.1% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'الطلبات' : 'Orders'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+234</div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? '+15% من الشهر الماضي' : '+15% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'المنتجات المباعة' : 'Products Sold'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+567</div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? '+12% من الشهر الماضي' : '+12% from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'عملاء جدد' : 'New Customers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+89</div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? '+25% من الشهر الماضي' : '+25% from last month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'نظرة عامة على المبيعات' : 'Sales Overview'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'رسم بياني للمبيعات سيظهر هنا' : 'Sales chart will appear here'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? 'المنتجات الأكثر مبيعاً' : 'Top Selling Products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'قائمة المنتجات ستظهر هنا' : 'Products list will appear here'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'النشاط الأخير' : 'Recent Activity'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isArabic ? 'طلب جديد تم استلامه' : 'New order received'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'منذ 5 دقائق' : '5 minutes ago'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isArabic ? 'منتج جديد تمت إضافته' : 'New product added'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'منذ 15 دقيقة' : '15 minutes ago'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isArabic ? 'طلب قيد المعالجة' : 'Order in processing'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'منذ 30 دقيقة' : '30 minutes ago'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
