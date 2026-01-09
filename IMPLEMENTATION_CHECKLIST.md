# ✅ چک‌لیست پیاده‌سازی Pickup Management

## وضعیت فایل‌ها

### ✅ کامپوننت‌ها
- [x] `src/components/admin/AramexPickupInfo.tsx` - ✅ ایجاد شده
- [x] `src/components/admin/PickupStatusBadge.tsx` - ✅ ایجاد شده
- [x] `src/components/admin/AramexPickupManagement.tsx` - ✅ ایجاد شده

### ✅ صفحات
- [x] `src/pages/OrderDetailPage.tsx` - ✅ کامپوننت AramexPickupInfo اضافه شده
- [x] `src/pages/AramexPickupManagementPage.tsx` - ✅ ایجاد شده

### ✅ سرویس‌ها
- [x] `src/services/aramexService.ts` - ✅ توابع اضافه شده:
  - `cancelAramexPickup(pickupGUID)`
  - `getPickupDetails(pickupGUID)`
- [x] `src/services/index.ts` - ✅ export شده

### ✅ Type ها
- [x] `src/types/order.ts` - ✅ فیلدها اضافه شده:
  - `pickupReference?: string`
  - `pickupGUID?: string`

### ✅ مستندات
- [x] `ARAMEX_PICKUP_CLIENT_IMPLEMENTATION.md` - راهنمای کامل فارسی
- [x] `ARAMEX_PICKUP_QUICK_REFERENCE.md` - مرجع سریع انگلیسی
- [x] `ARAMEX_PICKUP_SETUP.md` - راهنمای شروع سریع

---

## نحوه تست

### 1. بازسازی پروژه
```bash
npm run build
# یا
npm run dev
```

### 2. بررسی در مرورگر
1. به صفحه جزئیات یک سفارش با `shippingMethod = 3` (Aramex) بروید
2. باید کارت "Aramex Pickup Information" را ببینید
3. اگر `pickupReference` وجود دارد، باید نمایش داده شود
4. منوی Actions (کپی و کنسل) باید کار کند

### 3. تست عملکرد
- [ ] نمایش Pickup Reference
- [ ] نمایش Pickup GUID
- [ ] کپی کردن به کلیپبورد
- [ ] باز شدن منوی Dropdown
- [ ] کنسل کردن Pickup با تأیید
- [ ] هشدار زمانی که Shipment وجود دارد ولی Pickup نیست
- [ ] عدم نمایش برای سفارشات غیر Aramex

---

## خطاهای احتمالی و راه حل

### خطا: کامپوننت نمایش داده نمی‌شود
**راه حل:**
1. مطمئن شوید سرور dev ری‌استارت شده:
   ```bash
   npm run dev
   ```
2. کش مرورگر را پاک کنید (Ctrl+Shift+R)
3. بررسی کنید `order.shippingMethod === 3` باشد

### خطا: Cannot find module 'AramexPickupInfo'
**راه حل:**
```bash
# نصب مجدد dependencies
npm install
# پاک کردن cache
rm -rf node_modules/.vite
npm run dev
```

### خطا: API endpoints کار نمی‌کنند
**راه حل:**
- مطمئن شوید backend این endpoints را دارد:
  - `POST /api/aramex/cancel-pickup`
  - `GET /api/aramex/pickup/{guid}`

---

## کد نهایی در OrderDetailPage

```tsx
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';

// در بخش Right Column بعد از Shipping Information:
<Card>
  <CardHeader>
    <CardTitle>Shipping Information</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Tracking info */}
  </CardContent>
</Card>

{/* Aramex Pickup Information */}
<AramexPickupInfo 
  order={order}
  isArabic={isArabic}
  onPickupCancelled={() => {
    loadOrderDetails();
  }}
/>
```

---

## وضعیت Import ها

### OrderDetailPage.tsx (خط 36):
```tsx
import { AramexPickupInfo } from '../components/admin/AramexPickupInfo';
```
✅ اضافه شده

### استفاده در JSX (خط 527-535):
```tsx
<AramexPickupInfo 
  order={order}
  isArabic={isArabic}
  onPickupCancelled={() => {
    loadOrderDetails();
  }}
/>
```
✅ اضافه شده

---

## دستورات مفید

### ری‌استارت Dev Server
```bash
# توقف سرور (Ctrl+C)
# سپس:
npm run dev
```

### پاک کردن Cache
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### بررسی Build
```bash
npm run build
```

---

## نتیجه نهایی

✅ **همه فایل‌ها ایجاد شده**  
✅ **همه import ها درست**  
✅ **کامپوننت در OrderDetailPage اضافه شده**  
✅ **API functions آماده**  
✅ **Types به‌روز شده**  
✅ **بدون خطای TypeScript**  

### اگر هنوز مشکل دارید:

1. **سرور را ری‌استارت کنید**
   ```bash
   npm run dev
   ```

2. **بررسی کنید که در محیط development هستید**
   ```bash
   echo $NODE_ENV
   ```

3. **Console مرورگر را چک کنید** (F12)
   - به دنبال خطاهای import یا runtime بگردید

4. **مطمئن شوید order شامل این فیلدها است:**
   - `order.shippingMethod === 3`
   - `order.trackingNumber` (optional)
   - `order.pickupReference` (optional)
   - `order.pickupGUID` (optional)

---

## پشتیبانی

اگر مشکلی دارید:
1. کنسول مرورگر را بررسی کنید
2. Network tab را برای API calls چک کنید
3. به مستندات کامل مراجعه کنید: `ARAMEX_PICKUP_CLIENT_IMPLEMENTATION.md`

---

**آخرین به‌روزرسانی:** 9 ژانویه 2026  
**وضعیت:** ✅ کامل و آماده استفاده
