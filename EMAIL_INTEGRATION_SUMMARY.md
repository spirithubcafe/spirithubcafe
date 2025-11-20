# تغییرات Email API و Newsletter Management

## خلاصه تغییرات

این به‌روزرسانی شامل پیاده‌سازی کامل Email API و قابلیت‌های مدیریت اشتراک خبرنامه است.

---

## 1️⃣ سرویس Email API جدید

### فایل: `src/services/emailService.ts`

یک سرویس کامل برای ارسال ایمیل با قابلیت‌های زیر:

#### قابلیت‌ها:
- ✅ ارسال ایمیل تکی (`sendSingleEmail`)
- ✅ ارسال ایمیل گروهی (`sendBulkEmail`)
- ✅ ارسال ایمیل تستی (`sendTestEmail`)
- ✅ پشتیبانی از فایل‌های پیوست
- ✅ پشتیبانی از CC و BCC
- ✅ پشتیبانی از HTML و Plain Text

#### توابع کمکی:
- `fileToBase64()` - تبدیل فایل به Base64
- `isValidEmail()` - اعتبارسنجی ایمیل
- `getContentTypeFromFileName()` - تشخیص نوع MIME
- `prepareAttachments()` - آماده‌سازی فایل‌های پیوست

#### مثال استفاده:
```typescript
import { emailService } from '../services/emailService';

// ارسال ایمیل ساده
const result = await emailService.sendSingleEmail({
  toEmail: 'user@example.com',
  subject: 'خوش آمدید',
  body: '<h1>سلام!</h1>',
  isHtml: true
});

// ارسال گروهی
const bulkResult = await emailService.sendBulkEmail({
  recipients: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ],
  subject: 'خبرنامه',
  body: '<p>محتوای خبرنامه</p>',
  isHtml: true,
  delayBetweenEmailsMs: 500
});
```

---

## 2️⃣ Custom Hook: useEmailSender

### فایل: `src/hooks/useEmailSender.ts`

یک Hook React برای مدیریت وضعیت ارسال ایمیل:

#### ویژگی‌ها:
- Loading state
- Error handling
- توابع sendEmail، sendBulkEmail، sendTestEmail

#### مثال استفاده:
```typescript
const { sendEmail, loading, error } = useEmailSender();

const handleSend = async () => {
  try {
    const result = await sendEmail({
      toEmail: 'user@example.com',
      subject: 'Test',
      body: 'Hello'
    });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', error);
  }
};
```

---

## 3️⃣ به‌روزرسانی Newsletter Management

### فایل: `src/components/admin/NewsletterManagement.tsx`

تغییرات:
- ✅ استفاده از Email API به جای Newsletter API برای ارسال ایمیل
- ✅ استفاده از `useEmailSender` hook
- ✅ پشتیبانی از ارسال گروهی با تاخیر بین ایمیل‌ها
- ✅ نمایش تعداد موفق/ناموفق برای ارسال‌های گروهی
- ✅ مدیریت بهتر خطاها

#### تغییر اصلی:
```typescript
// قبل
await newsletterService.sendEmail({
  recipientEmails: selectedEmails,
  subject: subject,
  body: body
});

// بعد
const recipients = selectedEmails.map(email => ({
  email: email,
  name: subscriptions.find(s => s.email === email)?.name
}));

const result = await sendBulkEmail({
  recipients: recipients,
  subject: subject,
  body: body,
  isHtml: true,
  delayBetweenEmailsMs: 500
});
```

---

## 4️⃣ قابلیت Unsubscribe در پروفایل کاربر

### فایل: `src/pages/ProfilePage.tsx`

تغییرات:
- ✅ اضافه شدن تب "Newsletter"
- ✅ نمایش وضعیت اشتراک کاربر
- ✅ دکمه Subscribe/Unsubscribe
- ✅ پیام‌های موفقیت/خطا
- ✅ Loading state برای درخواست‌ها

#### ویژگی‌های تب Newsletter:
1. **نمایش وضعیت فعلی**: نشان می‌دهد کاربر مشترک است یا خیر
2. **اطلاعات مزایا**: لیستی از مزایای اشتراک
3. **دکمه اقدام**: Subscribe یا Unsubscribe
4. **پیام‌های بازخورد**: نمایش موفقیت یا خطا
5. **یادداشت حریم خصوصی**: اطمینان به کاربر

#### State Management:
```typescript
const [isSubscribed, setIsSubscribed] = useState(false);
const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
const [subscriptionMessage, setSubscriptionMessage] = useState(null);
```

#### توابع اصلی:
- `loadNewsletterStatus()` - بارگذاری وضعیت اشتراک
- `handleNewsletterToggle()` - تغییر وضعیت اشتراک

---

## 5️⃣ نمونه‌های کاربردی

### فایل: `src/examples/emailExamples.ts`

8 مثال کامل برای موارد استفاده مختلف:

1. **ایمیل خوش‌آمدگویی** - پس از ثبت‌نام کاربر
2. **فاکتور سفارش** - با فایل PDF پیوست
3. **کد تایید (OTP)** - برای احراز هویت
4. **تغییر وضعیت سفارش** - اعلان‌های سفارش
5. **خبرنامه** - ارسال گروهی به مشترکان
6. **ایمیل با CC/BCC** - ارسال کپی
7. **فایل‌های پیوست متعدد** - چند فایل در یک ایمیل
8. **بازیابی رمز عبور** - لینک reset password

---

## 📋 API Endpoints استفاده شده

### Email API:
- `POST /api/Email/send` - ارسال تکی
- `POST /api/Email/send-bulk` - ارسال گروهی
- `POST /api/Email/send-test` - ایمیل تستی

### Newsletter API:
- `GET /api/Newsletter/subscriptions` - دریافت لیست مشترکان
- `POST /api/Newsletter/subscribe` - اشتراک
- `POST /api/Newsletter/unsubscribe` - لغو اشتراک

---

## 🔐 احراز هویت

همه endpoint های Email API نیاز به:
- JWT Token در هدر Authorization
- نقش Admin برای دسترسی

Newsletter API:
- Subscribe/Unsubscribe: عمومی (بدون نیاز به token)
- Get Subscriptions: Admin only

---

## 🎨 UI Components استفاده شده

از shadcn/ui:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button`
- `Badge`
- `Alert`, `AlertDescription`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Loader2` (spinner)

آیکون‌ها از lucide-react:
- `Bell`, `BellOff` - وضعیت اشتراک
- `Mail` - ایمیل
- `CheckCircle` - موفقیت
- `AlertCircle` - خطا
- `Loader2` - بارگذاری

---

## 📱 پشتیبانی چند زبانه

همه متن‌ها در دو زبان:
- 🇸🇦 عربی (ar)
- 🇬🇧 انگلیسی (en)

مثال:
```typescript
{isArabic ? 'اشترك الآن' : 'Subscribe Now'}
```

---

## ✅ ویژگی‌های امنیتی

1. **Rate Limiting**: تاخیر بین ایمیل‌های گروهی (500ms)
2. **Email Validation**: بررسی فرمت ایمیل
3. **Error Handling**: مدیریت کامل خطاها
4. **Token Authentication**: احراز هویت با JWT
5. **Privacy**: پیام حریم خصوصی و قابلیت unsubscribe

---

## 🚀 نحوه استفاده

### برای Admin (ارسال خبرنامه):
1. وارد پنل ادمین شوید
2. به بخش Newsletter بروید
3. مشترکان مورد نظر را انتخاب کنید
4. محتوای ایمیل را بنویسید
5. دکمه "ارسال الآن" را بزنید

### برای کاربر (مدیریت اشتراک):
1. وارد پروفایل خود شوید
2. به تب "Newsletter" بروید
3. دکمه Subscribe یا Unsubscribe را بزنید
4. پیام تایید را مشاهده کنید

---

## 📚 مستندات کامل

برای اطلاعات بیشتر، به فایل `EMAIL_API_GUIDE.md` مراجعه کنید که شامل:
- راهنمای کامل API
- نمونه‌های کد در JavaScript و C#
- مدل‌های داده
- مدیریت خطاها
- بهترین روش‌ها

---

## 🔄 تغییرات در فایل‌ها

### فایل‌های جدید:
- ✅ `src/services/emailService.ts`
- ✅ `src/hooks/useEmailSender.ts`
- ✅ `src/examples/emailExamples.ts`

### فایل‌های به‌روزرسانی شده:
- 🔄 `src/services/index.ts` - اضافه شدن emailService
- 🔄 `src/components/admin/NewsletterManagement.tsx` - استفاده از Email API
- 🔄 `src/pages/ProfilePage.tsx` - اضافه شدن تب Newsletter

---

## 🎯 نتیجه

این به‌روزرسانی یک سیستم کامل برای:
- ✅ ارسال ایمیل‌های حرفه‌ای
- ✅ مدیریت خبرنامه توسط ادمین
- ✅ مدیریت اشتراک توسط کاربر
- ✅ مثال‌های آماده برای موارد مختلف
- ✅ UI زیبا و responsive
- ✅ پشتیبانی کامل از دو زبان

فراهم می‌کند.
