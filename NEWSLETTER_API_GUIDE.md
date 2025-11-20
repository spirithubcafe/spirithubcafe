# راهنمای استفاده از API خبرنامه (Newsletter API)

## فهرست مطالب
1. [معرفی](#معرفی)
2. [نقاط پایانی (Endpoints)](#نقاط-پایانی-endpoints)
3. [مدل‌های داده](#مدلهای-داده)
4. [نمونه‌های کد](#نمونههای-کد)
5. [مدیریت خطاها](#مدیریت-خطاها)

---

## معرفی

API خبرنامه به شما امکان می‌دهد تا مشترکان خبرنامه را مدیریت کنید. این API شامل قابلیت‌های زیر است:
- ✅ ثبت‌نام در خبرنامه (عمومی)
- ✅ لغو اشتراک خبرنامه (عمومی)
- ✅ مشاهده لیست مشترکان (فقط ادمین)
- ✅ فیلتر و جستجوی مشترکان
- ✅ Pagination برای لیست مشترکان

**Base URL:** `https://your-domain.com/api/Newsletter`

---

## نقاط پایانی (Endpoints)

### 1. ثبت‌نام در خبرنامه (Subscribe)

**Endpoint:** `POST /api/Newsletter/subscribe`  
**نوع دسترسی:** عمومی (بدون نیاز به احراز هویت)  
**توضیحات:** این endpoint به کاربران اجازه می‌دهد در خبرنامه ثبت‌نام کنند.

#### درخواست (Request)

```http
POST /api/Newsletter/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "نام کاربر (اختیاری)"
}
```

#### پاسخ موفق (200 OK)

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "نام کاربر",
  "isActive": true,
  "subscribedAt": "2025-11-20T10:30:00Z",
  "unsubscribedAt": null,
  "metadata": null
}
```

#### پاسخ خطا (400 Bad Request)

```json
{
  "message": "This email is already subscribed to our newsletter"
}
```

---

### 2. لغو اشتراک خبرنامه (Unsubscribe)

**Endpoint:** `POST /api/Newsletter/unsubscribe`  
**نوع دسترسی:** عمومی (بدون نیاز به احراز هویت)  
**توضیحات:** این endpoint به کاربران اجازه می‌دهد اشتراک خود را لغو کنند.

#### درخواست (Request)

```http
POST /api/Newsletter/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### پاسخ موفق (200 OK)

```json
{
  "message": "Successfully unsubscribed from newsletter"
}
```

#### پاسخ خطا (404 Not Found)

```json
{
  "message": "Email not found in newsletter subscriptions"
}
```

---

### 3. دریافت لیست مشترکان (Get Subscriptions)

**Endpoint:** `GET /api/Newsletter/subscriptions`  
**نوع دسترسی:** فقط ادمین (نیاز به احراز هویت)  
**توضیحات:** این endpoint لیست تمام مشترکان را با قابلیت فیلتر و جستجو برمی‌گرداند.

#### پارامترهای Query String

| پارامتر | نوع | پیش‌فرض | توضیحات |
|---------|-----|---------|---------|
| `page` | int | 1 | شماره صفحه |
| `pageSize` | int | 20 | تعداد نتایج در هر صفحه (حداکثر: 100) |
| `isActive` | bool? | null | فیلتر براساس وضعیت فعال/غیرفعال |
| `searchTerm` | string? | null | جستجو در ایمیل‌ها |

#### درخواست (Request)

```http
GET /api/Newsletter/subscriptions?page=1&pageSize=20&isActive=true&searchTerm=gmail
Authorization: Bearer YOUR_JWT_TOKEN
```

#### پاسخ موفق (200 OK)

```json
{
  "items": [
    {
      "id": 1,
      "email": "user1@gmail.com",
      "name": "کاربر اول",
      "isActive": true,
      "subscribedAt": "2025-11-20T10:30:00Z",
      "unsubscribedAt": null,
      "metadata": null
    },
    {
      "id": 2,
      "email": "user2@gmail.com",
      "name": "کاربر دوم",
      "isActive": true,
      "subscribedAt": "2025-11-19T15:20:00Z",
      "unsubscribedAt": null,
      "metadata": null
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20
}
```

---

## مدل‌های داده

### NewsletterSubscribeDto (ورودی)

```csharp
public class NewsletterSubscribeDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(400)]
    public string Email { get; set; }
    
    [MaxLength(200)]
    public string? Name { get; set; }  // اختیاری
}
```

### NewsletterSubscriptionDto (خروجی)

```csharp
public class NewsletterSubscriptionDto
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string? Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime SubscribedAt { get; set; }
    public DateTime? UnsubscribedAt { get; set; }
    public string? Metadata { get; set; }
}
```

### NewsletterQueryParameters (پارامترهای جستجو)

```csharp
public class NewsletterQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;  // حداکثر: 100
    public bool? IsActive { get; set; }
    public string? SearchTerm { get; set; }
}
```

---

## نمونه‌های کد

### JavaScript / TypeScript

#### 1. ثبت‌نام در خبرنامه

```javascript
async function subscribeNewsletter(email, name = null) {
  try {
    const response = await fetch('https://your-domain.com/api/Newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: name
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('اشتراک موفق:', data);
    return data;
  } catch (error) {
    console.error('خطا در ثبت‌نام:', error.message);
    throw error;
  }
}

// مثال استفاده
subscribeNewsletter('user@example.com', 'نام کاربر');
```

#### 2. لغو اشتراک خبرنامه

```javascript
async function unsubscribeNewsletter(email) {
  try {
    const response = await fetch('https://your-domain.com/api/Newsletter/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('لغو اشتراک موفق:', data.message);
    return data;
  } catch (error) {
    console.error('خطا در لغو اشتراک:', error.message);
    throw error;
  }
}

// مثال استفاده
unsubscribeNewsletter('user@example.com');
```

#### 3. دریافت لیست مشترکان (فقط ادمین)

```javascript
async function getSubscriptions(page = 1, pageSize = 20, isActive = null, searchTerm = '') {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    if (isActive !== null) {
      params.append('isActive', isActive.toString());
    }

    if (searchTerm) {
      params.append('searchTerm', searchTerm);
    }

    const response = await fetch(
      `https://your-domain.com/api/Newsletter/subscriptions?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_JWT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('خطا در دریافت لیست مشترکان');
    }

    const data = await response.json();
    console.log(`تعداد کل: ${data.totalCount}`);
    console.log(`صفحه ${data.page} از ${Math.ceil(data.totalCount / data.pageSize)}`);
    return data;
  } catch (error) {
    console.error('خطا:', error.message);
    throw error;
  }
}

// مثال استفاده
getSubscriptions(1, 20, true, 'gmail');
```

---

### C# / .NET

#### 1. ثبت‌نام در خبرنامه

```csharp
using System.Net.Http;
using System.Net.Http.Json;

public class NewsletterClient
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://your-domain.com/api/Newsletter";

    public NewsletterClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<NewsletterSubscriptionDto> SubscribeAsync(string email, string? name = null)
    {
        var dto = new NewsletterSubscribeDto
        {
            Email = email,
            Name = name
        };

        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/subscribe", dto);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"خطا در ثبت‌نام: {error}");
        }

        return await response.Content.ReadFromJsonAsync<NewsletterSubscriptionDto>();
    }
}

// مثال استفاده
var client = new NewsletterClient(new HttpClient());
var subscription = await client.SubscribeAsync("user@example.com", "نام کاربر");
Console.WriteLine($"اشتراک موفق: {subscription.Email}");
```

#### 2. لغو اشتراک خبرنامه

```csharp
public async Task<bool> UnsubscribeAsync(string email)
{
    var dto = new NewsletterSubscribeDto { Email = email };
    
    var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/unsubscribe", dto);
    
    return response.IsSuccessStatusCode;
}

// مثال استفاده
var success = await client.UnsubscribeAsync("user@example.com");
if (success)
{
    Console.WriteLine("لغو اشتراک موفق");
}
```

#### 3. دریافت لیست مشترکان (فقط ادمین)

```csharp
public async Task<(List<NewsletterSubscriptionDto> Items, int TotalCount)> GetSubscriptionsAsync(
    int page = 1,
    int pageSize = 20,
    bool? isActive = null,
    string? searchTerm = null,
    string jwtToken = null)
{
    // اضافه کردن توکن احراز هویت
    _httpClient.DefaultRequestHeaders.Authorization = 
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwtToken);

    var queryParams = new List<string>
    {
        $"page={page}",
        $"pageSize={pageSize}"
    };

    if (isActive.HasValue)
        queryParams.Add($"isActive={isActive.Value}");

    if (!string.IsNullOrEmpty(searchTerm))
        queryParams.Add($"searchTerm={Uri.EscapeDataString(searchTerm)}");

    var url = $"{BaseUrl}/subscriptions?{string.Join("&", queryParams)}";
    
    var response = await _httpClient.GetAsync(url);
    response.EnsureSuccessStatusCode();

    var result = await response.Content.ReadFromJsonAsync<SubscriptionsResponse>();
    
    return (result.Items, result.TotalCount);
}

// کلاس کمکی برای دریافت پاسخ
public class SubscriptionsResponse
{
    public List<NewsletterSubscriptionDto> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// مثال استفاده
var (items, totalCount) = await client.GetSubscriptionsAsync(
    page: 1,
    pageSize: 20,
    isActive: true,
    searchTerm: "gmail",
    jwtToken: "YOUR_JWT_TOKEN"
);

Console.WriteLine($"تعداد کل مشترکان: {totalCount}");
foreach (var item in items)
{
    Console.WriteLine($"{item.Email} - {item.Name}");
}
```

---

### React Hook نمونه

```typescript
import { useState } from 'react';

interface NewsletterSubscribeDto {
  email: string;
  name?: string;
}

interface NewsletterSubscriptionDto {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  metadata?: string;
}

export const useNewsletter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (email: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/Newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ثبت‌نام');
      }

      const data: NewsletterSubscriptionDto = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/Newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در لغو اشتراک');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribe,
    unsubscribe,
    loading,
    error,
  };
};

// مثال استفاده در کامپوننت
function NewsletterForm() {
  const { subscribe, loading, error } = useNewsletter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscribe(email, name);
      alert('ثبت‌نام موفق!');
      setEmail('');
      setName('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="نام (اختیاری)"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'در حال ثبت...' : 'عضویت در خبرنامه'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

## مدیریت خطاها

### کدهای وضعیت HTTP

| کد | توضیحات |
|----|---------|
| 200 | درخواست موفق |
| 400 | خطای اعتبارسنجی (Validation Error) |
| 401 | عدم احراز هویت (Unauthorized) |
| 403 | عدم دسترسی (Forbidden) |
| 404 | یافت نشد (Not Found) |
| 500 | خطای سرور (Internal Server Error) |

### نمونه پاسخ‌های خطا

#### 400 - خطای اعتبارسنجی

```json
{
  "message": "This email is already subscribed to our newsletter"
}
```

یا

```json
{
  "errors": {
    "Email": ["The Email field is required."],
    "Email": ["Invalid email format"]
  }
}
```

#### 401 - عدم احراز هویت

```json
{
  "message": "Unauthorized"
}
```

#### 404 - یافت نشد

```json
{
  "message": "Email not found in newsletter subscriptions"
}
```

#### 500 - خطای سرور

```json
{
  "message": "An error occurred while subscribing to newsletter"
}
```

---

## نکات مهم

### 1. اعتبارسنجی ایمیل
- ایمیل باید فرمت معتبر داشته باشد
- حداکثر طول ایمیل: 400 کاراکتر
- ایمیل به صورت case-insensitive ذخیره می‌شود

### 2. رفتار در ثبت‌نام مجدد
- اگر ایمیل قبلاً ثبت‌نام کرده و فعال باشد، خطا برمی‌گردد
- اگر ایمیل قبلاً ثبت‌نام کرده اما غیرفعال باشد، دوباره فعال می‌شود

### 3. امنیت
- endpoint های عمومی نیاز به احراز هویت ندارند
- endpoint لیست مشترکان فقط برای ادمین قابل دسترسی است
- از CORS Policy استفاده می‌شود
- از Anti-forgery Token معاف است

### 4. Pagination
- حداکثر تعداد نتایج در هر صفحه: 100
- پیش‌فرض تعداد نتایج: 20
- نتایج براساس تاریخ ثبت‌نام (جدیدترین اول) مرتب می‌شوند

### 5. جستجو
- جستجو در فیلد ایمیل انجام می‌شود
- جستجو case-insensitive است
- از Contains برای جستجو استفاده می‌شود

---

## تست API با cURL

### 1. ثبت‌نام

```bash
curl -X POST https://your-domain.com/api/Newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### 2. لغو اشتراک

```bash
curl -X POST https://your-domain.com/api/Newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 3. لیست مشترکان (با توکن)

```bash
curl -X GET "https://your-domain.com/api/Newsletter/subscriptions?page=1&pageSize=20&isActive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## تست API با Postman

### Collection برای Postman

```json
{
  "info": {
    "name": "Newsletter API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Subscribe",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"name\": \"Test User\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/Newsletter/subscribe",
          "host": ["{{baseUrl}}"],
          "path": ["api", "Newsletter", "subscribe"]
        }
      }
    },
    {
      "name": "Unsubscribe",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/Newsletter/unsubscribe",
          "host": ["{{baseUrl}}"],
          "path": ["api", "Newsletter", "unsubscribe"]
        }
      }
    },
    {
      "name": "Get Subscriptions",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/Newsletter/subscriptions?page=1&pageSize=20&isActive=true",
          "host": ["{{baseUrl}}"],
          "path": ["api", "Newsletter", "subscriptions"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "pageSize",
              "value": "20"
            },
            {
              "key": "isActive",
              "value": "true"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-domain.com"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN"
    }
  ]
}
```

---

## سوالات متداول (FAQ)

### 1. آیا می‌توانم یک ایمیل را چندین بار ثبت‌نام کنم؟
خیر، هر ایمیل فقط یک‌بار می‌تواند ثبت‌نام کند. اگر ایمیل قبلاً ثبت‌نام کرده باشد، خطا دریافت می‌کنید.

### 2. اگر کاربر لغو اشتراک کند، می‌تواند دوباره ثبت‌نام کند؟
بله، اگر کاربر لغو اشتراک کند (IsActive = false)، می‌تواند دوباره با همان ایمیل ثبت‌نام کند و اشتراکش دوباره فعال می‌شود.

### 3. آیا فیلد Name اجباری است؟
خیر، فیلد Name اختیاری است و می‌توانید فقط با ایمیل ثبت‌نام کنید.

### 4. چگونه می‌توانم لیست مشترکان را دریافت کنم؟
فقط کاربران با نقش Admin می‌توانند لیست مشترکان را مشاهده کنند و نیاز به JWT Token دارند.

### 5. آیا API از CORS پشتیبانی می‌کند؟
بله، API از CORS با پالیسی "CorsPolicy" پشتیبانی می‌کند.

---

## پشتیبانی

برای گزارش مشکلات یا سوالات:
- ایمیل: support@spirithubcafe.com
- GitHub Issues: https://github.com/spirithubcafe/spirithubcafe-api/issues

---

**نسخه API:** 1.0  
**تاریخ به‌روزرسانی:** 20 نوامبر 2025  
**وضعیت:** فعال ✅
