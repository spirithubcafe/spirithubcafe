# راهنمای کامل WhatsApp برای فرانت‌اند - Spirithub Cafe

## فهرست مطالب

1. [ورود و عضویت با شماره موبایل (OTP)](#1-ورود-و-عضویت-با-شماره-موبایل-otp)
2. [ارسال پیام و عکس توسط ادمین](#2-ارسال-پیام-و-عکس-توسط-ادمین)
3. [تنظیمات نوتیفیکیشن واتس‌اپ](#3-تنظیمات-نوتیفیکیشن-واتس‌اپ)
4. [Types و Interfaces](#4-types-و-interfaces)
5. [کامپوننت‌های React](#5-کامپوننت‌های-react)
6. [Hooks سفارشی](#6-hooks-سفارشی)
7. [مدیریت خطاها](#7-مدیریت-خطاها)

---

## 1. ورود و عضویت با شماره موبایل (OTP)

### توضیحات
- کاربر **فقط شماره موبایل** وارد می‌کند (بدون رمز عبور)
- سیستم OTP شش‌رقمی به واتس‌اپ ارسال می‌کند
- اگر کاربر جدید باشد، **خودکار ثبت‌نام** می‌شود
- اگر کاربر قبلی باشد، وارد می‌شود
- OTP پنج دقیقه اعتبار دارد
- حداقل ۶۰ ثانیه فاصله بین درخواست‌های OTP
- حداکثر ۵ تلاش برای وارد کردن OTP

### API Endpoints

#### 1.1 درخواست OTP

```http
POST /api/account/phone-otp/request
Content-Type: application/json

{
  "phoneNumber": "92506030"  // یا "96892506030" یا "+96892506030"
}
```

**Response - موفق:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "isNewUser": false  // true اگر کاربر جدید باشد
}
```

**Response - خطا:**
```json
{
  "success": false,
  "error": "Please wait 45 seconds before requesting another OTP"
}
```

#### 1.2 تایید OTP و ورود

```http
POST /api/account/phone-otp/verify
Content-Type: application/json

{
  "phoneNumber": "92506030",
  "code": "123456"
}
```

**Response - موفق:**
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "abc123...",
  "user": {
    "id": 123,
    "username": "96892506030",
    "displayName": "96892506030",
    "phoneNumber": "96892506030",
    "phoneVerified": true,
    "email": null
  }
}
```

**Response - خطا:**
```json
{
  "success": false,
  "error": "Invalid OTP. 3 attempts remaining"
}
```

### فرمت شماره موبایل
سیستم این فرمت‌ها را قبول می‌کند:
- `92506030` - شماره ۸ رقمی عمان
- `96892506030` - با کد کشور
- `+96892506030` - با + و کد کشور

همه به فرمت `96892506030` نرمال‌سازی می‌شوند.

---

## 2. ارسال پیام و عکس توسط ادمین

### 2.1 ارسال پیام متنی

```http
POST /api/whatsapp/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "phoneNumber": "92506030",
  "message": "سلام! سفارش شما آماده ارسال است. 🎉"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent"
}
```

### 2.2 ارسال عکس با کپشن

```http
POST /api/whatsapp/send-image
Authorization: Bearer {token}
Content-Type: application/json

{
  "phoneNumber": "92506030",
  "imageUrl": "https://spirithubcafe.com/images/products/coffee.jpg",
  "caption": "محصول جدید ما! ☕"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp image sent"
}
```

### نکات مهم
- این endpoint‌ها نیاز به **دسترسی ادمین** دارند
- `imageUrl` باید یک URL معتبر و قابل دسترسی باشد
- `caption` اختیاری است

---

## 3. تنظیمات نوتیفیکیشن واتس‌اپ (جداگانه)

> ⚠️ **توجه**: تنظیمات واتس‌اپ از ایمیل **کاملاً جدا** شده و endpoint مختص خودش را دارد.

### 3.1 دریافت تنظیمات واتس‌اپ

```http
GET /api/whatsapp-notification-settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isEnabled": true,
    "adminNumbers": "96892506030,96899999999",
    "supportNumber": "96892506030",
    
    "customerOrderPlacedEnabled": true,
    "customerOrderStatusChangedEnabled": true,
    "customerPaymentStatusChangedEnabled": true,
    "customerShippingUpdateEnabled": true,
    "customerOrderCancelledEnabled": true,
    "customerWelcomeEnabled": true,
    "customerLoginSuccessEnabled": false,
    "customerPasswordResetEnabled": true,
    "customerPasswordChangedEnabled": true,
    "customerOtpEnabled": true,
    
    "adminNewOrderEnabled": true,
    "adminPaymentReceivedEnabled": true,
    "adminOrderStatusChangedEnabled": true,
    "adminLowStockEnabled": true,
    "adminNewUserEnabled": true,
    
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T12:00:00Z"
  }
}
```

### 3.2 بروزرسانی تنظیمات واتس‌اپ

```http
PUT /api/whatsapp-notification-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "isEnabled": true,
  "adminNumbers": "96892506030",
  "supportNumber": "96892506030",
  
  "customerOrderPlacedEnabled": true,
  "customerOrderStatusChangedEnabled": true,
  "customerPaymentStatusChangedEnabled": true,
  "customerShippingUpdateEnabled": true,
  "customerOrderCancelledEnabled": true,
  "customerWelcomeEnabled": true,
  "customerLoginSuccessEnabled": false,
  "customerPasswordResetEnabled": true,
  "customerPasswordChangedEnabled": true,
  "customerOtpEnabled": true,
  
  "adminNewOrderEnabled": true,
  "adminPaymentReceivedEnabled": true,
  "adminOrderStatusChangedEnabled": true,
  "adminLowStockEnabled": true,
  "adminNewUserEnabled": true
}
```

### 3.3 تنظیمات ایمیل (جداگانه)

```http
GET /api/email-notification-settings
PUT /api/email-notification-settings
```

این endpoint فقط برای تنظیمات ایمیل است و شامل فیلدهای واتس‌اپ نیست.

---

## 4. Types و Interfaces

```typescript
// ==================== Phone OTP Types ====================

interface PhoneOtpRequestDto {
  phoneNumber: string;
}

interface PhoneOtpVerifyDto {
  phoneNumber: string;
  code: string;
}

interface PhoneOtpRequestResponse {
  success: boolean;
  message: string;
  isNewUser?: boolean;
  error?: string;
}

interface PhoneOtpVerifyResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: number;
    username: string;
    displayName: string;
    phoneNumber: string;
    phoneVerified: boolean;
    email: string | null;
  };
  error?: string;
}

// ==================== WhatsApp Send Types ====================

interface WhatsAppSendDto {
  phoneNumber: string;
  message: string;
}

interface WhatsAppSendImageDto {
  phoneNumber: string;
  imageUrl: string;
  caption?: string;
}

interface WhatsAppSendResponse {
  success: boolean;
  message: string;
}

// ==================== WhatsApp Notification Settings Types ====================

interface WhatsAppNotificationSettingsDto {
  // Master switch
  isEnabled: boolean;
  
  // Recipients
  adminNumbers: string | null;
  supportNumber: string | null;
  
  // Customer notifications
  customerOrderPlacedEnabled: boolean;
  customerOrderStatusChangedEnabled: boolean;
  customerPaymentStatusChangedEnabled: boolean;
  customerShippingUpdateEnabled: boolean;
  customerOrderCancelledEnabled: boolean;
  customerWelcomeEnabled: boolean;
  customerLoginSuccessEnabled: boolean;
  customerPasswordResetEnabled: boolean;
  customerPasswordChangedEnabled: boolean;
  customerOtpEnabled: boolean;
  
  // Admin notifications
  adminNewOrderEnabled: boolean;
  adminPaymentReceivedEnabled: boolean;
  adminOrderStatusChangedEnabled: boolean;
  adminLowStockEnabled: boolean;
  adminNewUserEnabled: boolean;
}

interface WhatsAppNotificationSettingsResponse extends WhatsAppNotificationSettingsDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== Email Notification Settings Types (Separate) ====================

interface EmailNotificationSettingsDto {
  isEnabled: boolean;
  adminEmails: string | null;
  supportEmail: string | null;
  
  customerOrderPlacedEnabled: boolean;
  customerOrderStatusChangedEnabled: boolean;
  customerPaymentStatusChangedEnabled: boolean;
  customerShippingUpdateEnabled: boolean;
  customerOrderCancelledEnabled: boolean;
  customerWelcomeEnabled: boolean;
  customerLoginSuccessEnabled: boolean;
  customerPasswordResetEnabled: boolean;
  customerPasswordChangedEnabled: boolean;
  
  adminNewOrderEnabled: boolean;
  adminPaymentReceivedEnabled: boolean;
  adminOrderStatusChangedEnabled: boolean;
}

interface EmailNotificationSettingsResponse extends EmailNotificationSettingsDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. کامپوننت‌های React

### 5.1 صفحه ورود با شماره موبایل

```tsx
// pages/PhoneLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type Step = 'phone' | 'otp';

export const PhoneLogin: React.FC = () => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneDisplay = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 8) {
      return `+968 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    return phone;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/account/phone-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setIsNewUser(data.isNewUser);
        setStep('otp');
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/account/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.access_token, data.refresh_token, data.user);
        navigate('/');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/account/phone-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'phone' ? 'ورود با شماره موبایل' : 'کد تایید'}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 'phone' 
              ? 'شماره موبایل خود را وارد کنید'
              : `کد ارسال شده به ${formatPhoneDisplay(phoneNumber)} را وارد کنید`
            }
          </p>
          {isNewUser && step === 'otp' && (
            <p className="mt-2 text-green-600 text-sm">
              🎉 حساب جدید برای شما ایجاد خواهد شد
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                شماره موبایل
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  +968
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="92506030"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 8}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال ارسال...
                </span>
              ) : (
                '📱 دریافت کد تایید'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                کد ۶ رقمی
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="------"
                required
                autoFocus
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال بررسی...
                </span>
              ) : (
                '✅ تایید و ورود'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-purple-600 hover:text-purple-500"
              >
                ← تغییر شماره
              </button>
              
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                className={`${
                  countdown > 0 ? 'text-gray-400' : 'text-purple-600 hover:text-purple-500'
                }`}
              >
                {countdown > 0 ? `ارسال مجدد (${countdown}s)` : '🔄 ارسال مجدد کد'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>کد تایید از طریق واتس‌اپ ارسال می‌شود</p>
          <p className="mt-1">اگر واتس‌اپ ندارید، از روش‌های دیگر استفاده کنید</p>
        </div>
      </div>
    </div>
  );
};
```

### 5.2 صفحه ارسال پیام/عکس واتس‌اپ (ادمین)

```tsx
// pages/admin/WhatsAppSend.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

type SendType = 'text' | 'image';

export const WhatsAppSend: React.FC = () => {
  const [sendType, setSendType] = useState<SendType>('text');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const { token } = useAuth();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const endpoint = sendType === 'text' ? '/api/whatsapp/send' : '/api/whatsapp/send-image';
      const body = sendType === 'text' 
        ? { phoneNumber, message }
        : { phoneNumber, imageUrl, caption: caption || undefined };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Clear form on success
        setMessage('');
        setImageUrl('');
        setCaption('');
      }
    } catch (err) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ارسال پیام واتس‌اپ</h1>

      {/* Type Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSendType('text')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
            sendType === 'text'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          💬 پیام متنی
        </button>
        <button
          onClick={() => setSendType('image')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
            sendType === 'image'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          🖼️ عکس با کپشن
        </button>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.success ? '✅' : '❌'} {result.message}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            شماره موبایل گیرنده
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="92506030 یا 96892506030"
            required
            dir="ltr"
          />
        </div>

        {sendType === 'text' ? (
          /* Text Message */
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              متن پیام
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="پیام خود را بنویسید..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {message.length}/2000 کاراکتر
            </p>
          </div>
        ) : (
          /* Image + Caption */
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                آدرس عکس (URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/image.jpg"
                required
                dir="ltr"
              />
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="border rounded-lg p-2">
                <p className="text-sm text-gray-500 mb-2">پیش‌نمایش:</p>
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="max-h-48 rounded-lg mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Invalid+URL';
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                کپشن (اختیاری)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="توضیحات عکس..."
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              در حال ارسال...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              ارسال با واتس‌اپ
            </>
          )}
        </button>
      </form>
    </div>
  );
};
```

### 5.3 صفحه تنظیمات واتس‌اپ (ادمین) - جداگانه

```tsx
// pages/admin/WhatsAppNotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { WhatsAppNotificationSettingsDto, WhatsAppNotificationSettingsResponse } from '../../types';

export const WhatsAppNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<WhatsAppNotificationSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { token } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp-notification-settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/whatsapp-notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('تنظیمات با موفقیت ذخیره شد');
        setSettings(result.data);
      } else {
        setError('خطا در ذخیره تنظیمات');
      }
    } catch (err) {
      setError('خطای شبکه');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof WhatsAppNotificationSettingsDto, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return <div className="p-6 text-center">در حال بارگذاری...</div>;
  }

  if (!settings) {
    return <div className="p-6 text-center text-red-600">خطا در بارگذاری تنظیمات</div>;
  }

  const renderToggle = (
    label: string, 
    key: keyof WhatsAppNotificationSettingsDto, 
    description?: string
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={settings[key] as boolean}
          onChange={(e) => updateSetting(key, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <h1 className="text-2xl font-bold">تنظیمات نوتیفیکیشن واتس‌اپ</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>
      )}

      <div className="space-y-6">
        {/* Master Switch */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">تنظیمات کلی</h2>
          {renderToggle('فعال‌سازی واتس‌اپ', 'isEnabled', 'کلید اصلی برای همه پیام‌های واتس‌اپ')}
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                شماره‌های ادمین (با کاما جدا کنید)
              </label>
              <input
                type="text"
                value={settings.adminNumbers || ''}
                onChange={(e) => updateSetting('adminNumbers', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="96892506030, 96899999999"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                شماره پشتیبانی
              </label>
              <input
                type="text"
                value={settings.supportNumber || ''}
                onChange={(e) => updateSetting('supportNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="96892506030"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Customer Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">نوتیفیکیشن مشتریان</h2>
          {renderToggle('ثبت سفارش', 'customerOrderPlacedEnabled')}
          {renderToggle('تغییر وضعیت سفارش', 'customerOrderStatusChangedEnabled')}
          {renderToggle('تغییر وضعیت پرداخت', 'customerPaymentStatusChangedEnabled')}
          {renderToggle('بروزرسانی ارسال', 'customerShippingUpdateEnabled')}
          {renderToggle('لغو سفارش', 'customerOrderCancelledEnabled')}
          {renderToggle('خوش‌آمدگویی', 'customerWelcomeEnabled')}
          {renderToggle('ورود موفق', 'customerLoginSuccessEnabled')}
          {renderToggle('بازیابی رمز عبور', 'customerPasswordResetEnabled')}
          {renderToggle('تغییر رمز عبور', 'customerPasswordChangedEnabled')}
          {renderToggle('کد OTP', 'customerOtpEnabled', 'ارسال کد ورود با واتس‌اپ')}
        </div>

        {/* Admin Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">نوتیفیکیشن ادمین</h2>
          {renderToggle('سفارش جدید', 'adminNewOrderEnabled')}
          {renderToggle('پرداخت دریافت شد', 'adminPaymentReceivedEnabled')}
          {renderToggle('تغییر وضعیت سفارش', 'adminOrderStatusChangedEnabled')}
          {renderToggle('موجودی کم', 'adminLowStockEnabled')}
          {renderToggle('کاربر جدید', 'adminNewUserEnabled')}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              در حال ذخیره...
            </>
          ) : (
            '💾 ذخیره تنظیمات'
          )}
        </button>
      </div>
    </div>
  );
};
```

---

## 6. Hooks سفارشی

### 6.1 usePhoneAuth Hook

```typescript
// hooks/usePhoneAuth.ts
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UsePhoneAuthReturn {
  step: 'phone' | 'otp';
  phoneNumber: string;
  otpCode: string;
  isNewUser: boolean;
  loading: boolean;
  error: string | null;
  countdown: number;
  setPhoneNumber: (phone: string) => void;
  setOtpCode: (code: string) => void;
  requestOtp: () => Promise<boolean>;
  verifyOtp: () => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  reset: () => void;
}

export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();

  const startCountdown = useCallback(() => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const requestOtp = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/phone-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setIsNewUser(data.isNewUser);
        setStep('otp');
        startCountdown();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, startCountdown]);

  const verifyOtp = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.access_token, data.refresh_token, data.user);
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, otpCode, login]);

  const resendOtp = useCallback(async (): Promise<boolean> => {
    if (countdown > 0) return false;
    return requestOtp();
  }, [countdown, requestOtp]);

  const reset = useCallback(() => {
    setStep('phone');
    setPhoneNumber('');
    setOtpCode('');
    setIsNewUser(false);
    setError(null);
    setCountdown(0);
  }, []);

  return {
    step,
    phoneNumber,
    otpCode,
    isNewUser,
    loading,
    error,
    countdown,
    setPhoneNumber,
    setOtpCode,
    requestOtp,
    verifyOtp,
    resendOtp,
    reset,
  };
};
```

### 6.2 useWhatsAppSend Hook

```typescript
// hooks/useWhatsAppSend.ts
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface SendTextParams {
  phoneNumber: string;
  message: string;
}

interface SendImageParams {
  phoneNumber: string;
  imageUrl: string;
  caption?: string;
}

interface UseWhatsAppSendReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  sendText: (params: SendTextParams) => Promise<boolean>;
  sendImage: (params: SendImageParams) => Promise<boolean>;
  reset: () => void;
}

export const useWhatsAppSend = (): UseWhatsAppSendReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { token } = useAuth();

  const sendText = useCallback(async (params: SendTextParams): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const sendImage = useCallback(async (params: SendImageParams): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/whatsapp/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        return true;
      } else {
        setError(data.message);
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    sendText,
    sendImage,
    reset,
  };
};
```

---

## 7. مدیریت خطاها

### خطاهای رایج OTP

| کد خطا | پیام | راه‌حل |
|--------|------|--------|
| `Invalid phone number` | شماره نامعتبر | فرمت صحیح: 8 رقم عمان یا با 968 |
| `Please wait X seconds` | درخواست زودهنگام | countdown نشان دهید |
| `User is inactive` | کاربر غیرفعال | تماس با پشتیبانی |
| `OTP expired or not found` | کد منقضی | دکمه ارسال مجدد |
| `Invalid OTP. X attempts remaining` | کد اشتباه | تعداد تلاش نمایش دهید |
| `Too many attempts` | بیش از حد تلاش | درخواست OTP جدید |
| `Failed to send OTP via WhatsApp` | خطای ارسال | بررسی واتس‌اپ کاربر |

### نمونه مدیریت خطا

```typescript
const handleOtpError = (error: string) => {
  if (error.includes('wait')) {
    // Extract seconds from message
    const match = error.match(/(\d+)/);
    if (match) {
      setCountdown(parseInt(match[1]));
    }
    return 'لطفاً چند لحظه صبر کنید';
  }
  
  if (error.includes('Invalid OTP')) {
    const match = error.match(/(\d+) attempts/);
    const remaining = match ? parseInt(match[1]) : 0;
    return `کد اشتباه است. ${remaining} تلاش باقی مانده`;
  }
  
  if (error.includes('expired')) {
    return 'کد منقضی شده. لطفاً کد جدید درخواست کنید';
  }
  
  if (error.includes('Too many')) {
    return 'تعداد تلاش بیش از حد مجاز. لطفاً کد جدید درخواست کنید';
  }
  
  return error;
};
```

---

## خلاصه API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/account/phone-otp/request` | ❌ | درخواست OTP |
| `POST` | `/api/account/phone-otp/verify` | ❌ | تایید OTP و ورود |
| `POST` | `/api/whatsapp/send` | ✅ Admin | ارسال پیام متنی |
| `POST` | `/api/whatsapp/send-image` | ✅ Admin | ارسال عکس با کپشن |
| `GET` | `/api/whatsapp-notification-settings` | ✅ Admin | دریافت تنظیمات واتس‌اپ |
| `PUT` | `/api/whatsapp-notification-settings` | ✅ Admin | بروزرسانی تنظیمات واتس‌اپ |
| `GET` | `/api/email-notification-settings` | ✅ Admin | دریافت تنظیمات ایمیل |
| `PUT` | `/api/email-notification-settings` | ✅ Admin | بروزرسانی تنظیمات ایمیل |

---

## نکات مهم

1. **امنیت**: هرگز OTP را در localStorage ذخیره نکنید
2. **UX**: همیشه countdown برای ارسال مجدد نمایش دهید
3. **Validation**: شماره موبایل را قبل از ارسال validate کنید
4. **Error Handling**: پیام‌های خطا را فارسی و کاربرپسند نمایش دهید
5. **Auto-focus**: بعد از ارسال OTP، فوکوس را به فیلد کد منتقل کنید
6. **RTL**: برای فیلدهای شماره و کد، `dir="ltr"` استفاده کنید
