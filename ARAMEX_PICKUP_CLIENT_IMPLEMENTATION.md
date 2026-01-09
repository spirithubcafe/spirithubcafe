# راهنمای جامع مدیریت Pickup آرامکس در کلاینت

## 📋 فهرست مطالب
1. [معرفی](#معرفی)
2. [کامپوننت‌های ایجاد شده](#کامپوننت‌های-ایجاد-شده)
3. [نحوه استفاده](#نحوه-استفاده)
4. [API Endpoints](#api-endpoints)
5. [نمونه کدها](#نمونه-کدها)
6. [مدیریت خطاها](#مدیریت-خطاها)

---

## 🎯 معرفی

این سیستم امکان مدیریت کامل Pickup Requests آرامکس را فراهم می‌کند، شامل:
- ✅ نمایش اطلاعات Pickup Reference و GUID
- ✅ کپی کردن اطلاعات به کلیپبورد
- ✅ کنسل کردن Pickup
- ✅ نمایش وضعیت Pickup در لیست سفارشات
- ✅ هشدارهای هوشمند برای وضعیت‌های غیرعادی
- ✅ پشتیبانی از زبان عربی و انگلیسی

---

## 🧩 کامپوننت‌های ایجاد شده

### 1. `AramexPickupInfo` 
**مسیر:** `src/components/admin/AramexPickupInfo.tsx`

کامپوننت اصلی برای نمایش اطلاعات Pickup در صفحه جزئیات سفارش.

#### Props:
```typescript
interface AramexPickupInfoProps {
  order: Order;              // اطلاعات سفارش
  isArabic: boolean;         // زبان عربی فعال است؟
  onPickupCancelled?: () => void;  // Callback بعد از کنسل موفق
}
```

#### ویژگی‌ها:
- نمایش Pickup Reference و GUID
- دکمه کپی برای هر فیلد
- منوی Dropdown برای عملیات (کپی، کنسل)
- Dialog تأیید برای کنسل کردن
- نمایش هشدار زمانی که Shipment وجود دارد ولی Pickup ثبت نشده
- پشتیبانی کامل از RTL و زبان عربی

#### مثال استفاده:
```tsx
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';

<AramexPickupInfo 
  order={order}
  isArabic={language === 'ar'}
  onPickupCancelled={() => {
    // Reload order after cancellation
    loadOrderDetails();
  }}
/>
```

---

### 2. `PickupStatusBadge`
**مسیر:** `src/components/admin/PickupStatusBadge.tsx`

Badge کوچک برای نمایش وضعیت Pickup در لیست‌ها.

#### Props:
```typescript
interface PickupStatusBadgeProps {
  hasPickup: boolean;        // آیا Pickup ثبت شده؟
  hasTracking: boolean;      // آیا Tracking Number وجود دارد؟
  isAramex: boolean;         // آیا روش ارسال Aramex است؟
  pickupReference?: string;  // شماره Pickup
  compact?: boolean;         // نمایش فشرده؟
  isArabic?: boolean;        // زبان عربی؟
}
```

#### حالت‌های مختلف:
1. **✅ Pickup ثبت شده** (سبز): Pickup موفق ثبت شده
2. **⚠️ بدون Pickup** (نارنجی): Shipment وجود دارد ولی Pickup ثبت نشده
3. **❌ غیر منشأ** (خاکستری): هنوز Shipment ایجاد نشده

#### مثال استفاده در جدول:
```tsx
<PickupStatusBadge
  hasPickup={!!order.pickupReference}
  hasTracking={!!order.trackingNumber}
  isAramex={order.shippingMethod === 3}
  pickupReference={order.pickupReference}
  compact={true}
  isArabic={isArabic}
/>
```

---

### 3. `AramexPickupManagement`
**مسیر:** `src/components/admin/AramexPickupManagement.tsx`

صفحه مدیریت جامع برای جستجو و مدیریت Pickupها.

#### ویژگی‌ها:
- جستجوی Pickup با GUID یا Reference
- نمایش اطلاعات کامل Pickup
- کنسل کردن Pickup
- کپی کردن اطلاعات
- لینک به صفحه تتبع آرامکس
- راهنمای استفاده

#### مثال استفاده:
```tsx
import { AramexPickupManagement } from '../components/admin/AramexPickupManagement';

// در یک صفحه Admin:
<AramexPickupManagement />
```

---

## 🔌 API Endpoints

### سرویس‌های اضافه شده به `aramexService.ts`:

#### 1. کنسل کردن Pickup
```typescript
/**
 * Cancel an Aramex pickup request
 * @param pickupGUID - GUID منحصر به فرد Pickup
 */
export async function cancelAramexPickup(pickupGUID: string): Promise<{
  success: boolean;
  message?: string;
}>
```

**API Endpoint:** `POST /api/aramex/cancel-pickup`

**Request Body:**
```json
{
  "pickupGUID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response (موفق):**
```json
{
  "success": true,
  "message": "Pickup cancelled successfully"
}
```

#### 2. دریافت اطلاعات Pickup
```typescript
/**
 * Get pickup details by GUID
 * @param pickupGUID - GUID منحصر به فرد Pickup
 */
export async function getPickupDetails(pickupGUID: string): Promise<{
  success: boolean;
  data?: PickupInfo;
  message?: string;
}>
```

**API Endpoint:** `GET /api/aramex/pickup/{pickupGUID}`

**Response (موفق):**
```json
{
  "success": true,
  "data": {
    "pickupGUID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pickupReference": "PKP-12345678",
    "orderNumber": "ORD-2026-001",
    "shipmentNumber": "12345678901",
    "status": "Active",
    "createdAt": "2026-01-09T10:30:00Z"
  }
}
```

---

## 📝 نمونه کدها

### نمایش در OrderDetailPage

```tsx
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';

export const OrderDetailPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const { language } = useApp();
  const isArabic = language === 'ar';

  const loadOrderDetails = async () => {
    // ... load order
  };

  return (
    <div>
      {/* ... سایر بخش‌ها ... */}
      
      {/* Shipping Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? 'معلومات الشحن' : 'Shipping Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tracking Number */}
          {order.trackingNumber && (
            <div>
              <Label>{isArabic ? 'رقم التتبع' : 'Tracking Number'}</Label>
              <p className="font-mono">{order.trackingNumber}</p>
              <Button
                onClick={() => window.open(
                  `https://www.aramex.com/track/shipments?ShipmentNumber=${order.trackingNumber}`,
                  '_blank'
                )}
              >
                {isArabic ? 'تتبع الشحنة' : 'Track Shipment'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aramex Pickup Information */}
      <AramexPickupInfo 
        order={order}
        isArabic={isArabic}
        onPickupCancelled={() => {
          loadOrderDetails(); // Reload after cancellation
        }}
      />
    </div>
  );
};
```

---

### نمایش در لیست سفارشات

```tsx
import { PickupStatusBadge } from '../components/admin/PickupStatusBadge';

export const OrdersPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{isArabic ? 'رقم الطلب' : 'Order Number'}</TableHead>
          <TableHead>{isArabic ? 'رقم التتبع' : 'Tracking'}</TableHead>
          <TableHead>{isArabic ? 'الاستلام' : 'Pickup'}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.orderNumber}</TableCell>
            <TableCell>
              {order.trackingNumber ? (
                <span className="font-mono text-xs">
                  {order.trackingNumber}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <PickupStatusBadge
                hasPickup={!!order.pickupReference}
                hasTracking={!!order.trackingNumber}
                isAramex={order.shippingMethod === 3}
                pickupReference={order.pickupReference}
                compact={true}
                isArabic={isArabic}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

---

### استفاده مستقیم از API

```typescript
import { 
  cancelAramexPickup, 
  getPickupDetails 
} from '../services/aramexService';

// دریافت اطلاعات Pickup
const handleGetPickupInfo = async (pickupGUID: string) => {
  try {
    const response = await getPickupDetails(pickupGUID);
    
    if (response.success && response.data) {
      console.log('Pickup Info:', response.data);
      // Display pickup information
    } else {
      console.error('Error:', response.message);
    }
  } catch (error) {
    console.error('Failed to get pickup info:', error);
  }
};

// کنسل کردن Pickup
const handleCancelPickup = async (pickupGUID: string) => {
  try {
    const confirmed = confirm('Are you sure you want to cancel this pickup?');
    if (!confirmed) return;

    const response = await cancelAramexPickup(pickupGUID);
    
    if (response.success) {
      alert('Pickup cancelled successfully!');
      // Reload data
    } else {
      alert('Failed to cancel pickup: ' + response.message);
    }
  } catch (error: any) {
    alert('Error: ' + error.message);
  }
};
```

---

## 🚨 مدیریت خطاها

### خطاهای رایج و راه حل:

#### 1. Pickup GUID not found
```typescript
{
  success: false,
  message: "Pickup GUID not found"
}
```
**راه حل:** بررسی کنید که GUID صحیح وارد شده و Pickup واقعاً ثبت شده باشد.

---

#### 2. Pickup already cancelled
```typescript
{
  success: false,
  message: "Pickup has already been cancelled"
}
```
**راه حل:** این Pickup قبلاً کنسل شده است، نیازی به عملیات مجدد نیست.

---

#### 3. Order does not use Aramex shipping
```
Component returns null
```
**راه حل:** کامپوننت به صورت خودکار فقط برای سفارشات با `shippingMethod === 3` نمایش داده می‌شود.

---

#### 4. Shipment exists but no Pickup
**نمایش هشدار:**
```
⚠️ Warning: Pickup Not Registered
Shipment created with tracking number XXX but pickup request was not registered.
```

**راه حل:** 
- بررسی لاگ‌های backend برای یافتن دلیل عدم ثبت pickup
- ممکن است خطایی در API آرامکس رخ داده باشد
- تماس با پشتیبانی آرامکس

---

### نمونه کد مدیریت خطا:

```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);
  
  try {
    const response = await cancelAramexPickup(pickupGUID);
    
    if (!response.success) {
      setError(response.message || 'Operation failed');
      return;
    }
    
    // Success
    onSuccess();
  } catch (err: any) {
    console.error('Error:', err);
    
    // Display user-friendly error
    if (err.statusCode === 404) {
      setError('Pickup not found');
    } else if (err.statusCode === 400) {
      setError('Invalid pickup information');
    } else {
      setError(err.message || 'An unexpected error occurred');
    }
  }
};

// نمایش خطا در UI
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

---

## 🎨 سفارشی‌سازی استایل

### تغییر رنگ Badges:

```tsx
// در PickupStatusBadge.tsx:

// Badge سبز (موفق)
<Badge className="bg-green-100 text-green-800 border-green-200">
  <CheckCircle className="h-3 w-3 mr-1" />
  Pickup: {pickupReference}
</Badge>

// Badge نارنجی (هشدار)
<Badge className="bg-orange-100 text-orange-800 border-orange-200">
  <AlertTriangle className="h-3 w-3 mr-1" />
  No Pickup
</Badge>

// Badge خاکستری (غیرفعال)
<Badge className="bg-gray-100 text-gray-600 border-gray-200">
  <XCircle className="h-3 w-3 mr-1" />
  Not Created
</Badge>
```

### تغییر رنگ Card:

```tsx
// Card سبز (Pickup موجود)
<Card className="border-green-200 bg-green-50/30">

// Card نارنجی (هشدار)
<Card className="border-orange-200 bg-orange-50/30">
```

---

## 📊 مثال کامل: ایجاد Shipment و نمایش Pickup

```typescript
import { createShipmentForOrder } from '../services/aramexService';

const CreateShipmentButton: React.FC<{ orderId: number }> = ({ orderId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateShipment = async () => {
    setIsCreating(true);
    
    try {
      const response = await createShipmentForOrder(orderId);
      
      if (response.success) {
        console.log('✅ Shipment created successfully!');
        console.log('📦 Tracking Number:', response.trackingNumber);
        
        // بررسی Pickup
        if (response.pickupSuccess && response.pickup) {
          console.log('✅ Pickup registered successfully!');
          console.log('🎫 Pickup Reference:', response.pickup.id);
          console.log('🆔 Pickup GUID:', response.pickup.guid);
          
          setResult({
            success: true,
            trackingNumber: response.trackingNumber,
            pickupReference: response.pickup.id,
            pickupGUID: response.pickup.guid
          });
        } else {
          console.warn('⚠️ Shipment created but Pickup failed');
          setResult({
            success: true,
            trackingNumber: response.trackingNumber,
            pickupWarning: true,
            pickupErrors: response.pickupErrors
          });
        }
      } else {
        console.error('❌ Failed to create shipment');
        alert('Error: ' + (response.errors?.join(', ') || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCreateShipment}
        disabled={isCreating}
      >
        {isCreating ? 'Creating...' : 'Create Aramex Shipment'}
      </Button>
      
      {result && result.success && (
        <div className="mt-4 space-y-3">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Shipment Created!</AlertTitle>
            <AlertDescription>
              Tracking: <strong>{result.trackingNumber}</strong>
            </AlertDescription>
          </Alert>
          
          {result.pickupReference && (
            <Alert>
              <PackageCheck className="h-4 w-4" />
              <AlertTitle>Pickup Registered!</AlertTitle>
              <AlertDescription>
                Pickup ID: <strong>{result.pickupReference}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          {result.pickupWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Pickup Warning</AlertTitle>
              <AlertDescription>
                Shipment created but pickup registration failed.
                {result.pickupErrors && (
                  <ul className="mt-2 list-disc list-inside">
                    {result.pickupErrors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Workflow کامل

### 1️⃣ ایجاد سفارش
```
کاربر → ثبت سفارش → انتخاب روش ارسال Aramex
```

### 2️⃣ ایجاد Shipment
```
Admin → دکمه "Create Shipment" → API Call
↓
Backend → ایجاد Shipment در Aramex
↓
Backend → ایجاد خودکار Pickup Request
↓
Response: {
  trackingNumber: "xxx",
  pickupReference: "PKP-xxx",
  pickupGUID: "guid-xxx"
}
```

### 3️⃣ نمایش اطلاعات
```
OrderDetailPage → نمایش کارت Shipping Info
↓
AramexPickupInfo Component → نمایش Pickup Details
↓
کاربر می‌تواند:
  - Pickup Reference را ببیند
  - اطلاعات را کپی کند
  - Pickup را کنسل کند
```

### 4️⃣ مدیریت Pickup
```
Admin → صفحه Pickup Management
↓
جستجوی Pickup با GUID یا Reference
↓
نمایش اطلاعات کامل
↓
عملیات: کپی، کنسل، لینک Tracking
```

---

## 🎯 نکات مهم

### ✅ Do's (انجام دهید):
1. همیشه بررسی کنید `shippingMethod === 3` (Aramex) قبل از نمایش Pickup
2. از `pickupReference` برای نمایش به کاربران استفاده کنید
3. از `pickupGUID` برای API calls استفاده کنید
4. همیشه Confirmation Dialog برای کنسل نشان دهید
5. بعد از کنسل موفق، Order را reload کنید
6. خطاهای API را به کاربر نشان دهید

### ❌ Don'ts (انجام ندهید):
1. GUID را مستقیم به کاربران نشان ندهید (فقط برای Admin)
2. بدون تأیید Pickup را کنسل نکنید
3. Pickup Component را برای non-Aramex orders نشان ندهید
4. فراموش نکنید که بررسی کنید `order.pickupReference` وجود دارد
5. بدون مدیریت خطا API call نزنید

---

## 📞 پشتیبانی

اگر مشکلی در استفاده از این سیستم دارید:

1. **لاگ‌های Console را بررسی کنید**
   - تمام API calls لاگ می‌شوند
   - پیام‌های خطا واضح هستند

2. **Backend Logs را چک کنید**
   - خطاهای Aramex API
   - مشکلات ارتباط با سرور

3. **مستندات Aramex را مطالعه کنید**
   - [Aramex Developer Portal](https://www.aramex.com/developers)

4. **تماس با تیم توسعه**
   - گزارش باگ
   - درخواست ویژگی جدید

---

## 🎉 خلاصه

این سیستم یک راه حل کامل برای مدیریت Aramex Pickups در کلاینت است:

- **3 کامپوننت اصلی**: AramexPickupInfo, PickupStatusBadge, AramexPickupManagement
- **2 API Function جدید**: cancelAramexPickup, getPickupDetails
- **پشتیبانی کامل از RTL** و زبان عربی
- **مدیریت خطای جامع**
- **UI/UX حرفه‌ای** با Shadcn/UI
- **مستندات کامل فارسی و انگلیسی**

موفق باشید! 🚀
