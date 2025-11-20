# راهنمای کامل ارسال ایمیل (Email API Guide)

## فهرست مطالب
1. [معرفی](#معرفی)
2. [پیش‌نیازها](#پیشنیازها)
3. [نقاط پایانی (Endpoints)](#نقاط-پایانی-endpoints)
4. [مدل‌های داده](#مدلهای-داده)
5. [نمونه‌های کد](#نمونههای-کد)
6. [سناریوهای کاربردی](#سناریوهای-کاربردی)
7. [مدیریت خطاها](#مدیریت-خطاها)
8. [بهترین روش‌ها](#بهترین-روشها)

---

## معرفی

API ارسال ایمیل به شما امکان می‌دهد از طریق سرویس SMTP پیکربندی شده، ایمیل‌های مختلف ارسال کنید. این API شامل قابلیت‌های زیر است:

### قابلیت‌ها
- ✅ ارسال ایمیل تکی
- ✅ ارسال ایمیل گروهی (Bulk Email)
- ✅ ارسال ایمیل تستی
- ✅ پشتیبانی از HTML و Plain Text
- ✅ پشتیبانی از فایل‌های پیوست (Attachments)
- ✅ CC و BCC
- ✅ تنظیمات چندگانه SMTP
- ✅ Rate Limiting برای جلوگیری از اسپم

**Base URL:** `https://your-domain.com/api/Email`

**⚠️ نکته مهم:** تمام endpoint های این API فقط برای کاربران با نقش **Admin** قابل دسترسی هستند و نیاز به JWT Token دارند.

---

## پیش‌نیازها

### 1. احراز هویت (Authentication)

برای استفاده از Email API باید:
1. ابتدا از طریق `/api/Account/login` وارد شوید
2. JWT Token دریافت کنید
3. Token را در هدر Authorization ارسال کنید

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. پیکربندی تنظیمات ایمیل

قبل از ارسال ایمیل، باید حداقل یک تنظیمات ایمیل (Email Settings) پیکربندی شده داشته باشید که شامل:
- اطلاعات سرور SMTP
- نام کاربری و رمز عبور
- پورت و تنظیمات SSL/TLS

---

## نقاط پایانی (Endpoints)

### 1. ارسال ایمیل تکی (Send Single Email)

**Endpoint:** `POST /api/Email/send`  
**نوع دسترسی:** فقط Admin  
**توضیحات:** ارسال یک ایمیل به یک گیرنده

#### درخواست (Request)

```http
POST /api/Email/send
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "toEmail": "recipient@example.com",
  "toName": "نام گیرنده",
  "subject": "موضوع ایمیل",
  "body": "<h1>سلام</h1><p>این یک ایمیل تستی است.</p>",
  "isHtml": true,
  "ccEmails": ["cc1@example.com", "cc2@example.com"],
  "bccEmails": ["bcc@example.com"],
  "attachments": [
    {
      "fileName": "document.pdf",
      "fileContent": "base64_encoded_content",
      "contentType": "application/pdf"
    }
  ],
  "emailSettingsId": 1
}
```

#### فیلدهای اجباری:
- `toEmail`: ایمیل گیرنده
- `subject`: موضوع ایمیل
- `body`: محتوای ایمیل

#### فیلدهای اختیاری:
- `toName`: نام گیرنده
- `isHtml`: آیا محتوا HTML است؟ (پیش‌فرض: true)
- `ccEmails`: لیست ایمیل‌های CC
- `bccEmails`: لیست ایمیل‌های BCC
- `attachments`: لیست فایل‌های پیوست
- `emailSettingsId`: شناسه تنظیمات ایمیل (اگر خالی باشد، از تنظیمات پیش‌فرض استفاده می‌شود)

#### پاسخ موفق (200 OK)

```json
{
  "success": true,
  "message": "Email sent successfully",
  "successfulCount": 1,
  "failedCount": 0,
  "errors": null,
  "sentAt": "2025-11-20T10:30:00Z"
}
```

#### پاسخ خطا (400 Bad Request)

```json
{
  "success": false,
  "message": "Failed to send email: SMTP connection failed",
  "successfulCount": 0,
  "failedCount": 1,
  "errors": ["SMTP connection failed"],
  "sentAt": "2025-11-20T10:30:00Z"
}
```

---

### 2. ارسال ایمیل گروهی (Send Bulk Email)

**Endpoint:** `POST /api/Email/send-bulk`  
**نوع دسترسی:** فقط Admin  
**توضیحات:** ارسال یک ایمیل به چندین گیرنده

#### درخواست (Request)

```http
POST /api/Email/send-bulk
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "recipients": [
    {
      "email": "user1@example.com",
      "name": "کاربر اول"
    },
    {
      "email": "user2@example.com",
      "name": "کاربر دوم"
    },
    {
      "email": "user3@example.com",
      "name": "کاربر سوم"
    }
  ],
  "subject": "خبرنامه هفتگی",
  "body": "<h1>سلام {{Name}}</h1><p>این ایمیل برای شما ارسال شده است.</p>",
  "isHtml": true,
  "attachments": [
    {
      "fileName": "newsletter.pdf",
      "fileContent": "base64_encoded_content",
      "contentType": "application/pdf"
    }
  ],
  "emailSettingsId": 1,
  "delayBetweenEmailsMs": 500
}
```

#### فیلدهای اجباری:
- `recipients`: لیست گیرندگان (حداقل یک نفر)
  - `email`: ایمیل گیرنده
- `subject`: موضوع ایمیل
- `body`: محتوای ایمیل

#### فیلدهای اختیاری:
- `isHtml`: آیا محتوا HTML است؟ (پیش‌فرض: true)
- `attachments`: لیست فایل‌های پیوست
- `emailSettingsId`: شناسه تنظیمات ایمیل
- `delayBetweenEmailsMs`: تاخیر بین هر ایمیل به میلی‌ثانیه (پیش‌فرض: 100ms)

#### پاسخ موفق (200 OK)

```json
{
  "success": true,
  "message": "3 out of 3 emails sent successfully",
  "successfulCount": 3,
  "failedCount": 0,
  "errors": null,
  "sentAt": "2025-11-20T10:30:00Z"
}
```

#### پاسخ جزئی موفق (200 OK با خطا)

```json
{
  "success": false,
  "message": "2 out of 3 emails sent successfully",
  "successfulCount": 2,
  "failedCount": 1,
  "errors": [
    "Failed to send to user3@example.com: Invalid email address"
  ],
  "sentAt": "2025-11-20T10:30:00Z"
}
```

---

### 3. ارسال ایمیل تستی (Send Test Email)

**Endpoint:** `POST /api/Email/send-test`  
**نوع دسترسی:** فقط Admin  
**توضیحات:** ارسال ایمیل تستی برای بررسی تنظیمات SMTP

#### درخواست (Request)

```http
POST /api/Email/send-test
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "emailSettingsId": 1,
  "testRecipientEmail": "test@example.com"
}
```

#### پاسخ موفق (200 OK)

```json
{
  "success": true,
  "message": "Test email sent successfully",
  "successfulCount": 1,
  "failedCount": 0,
  "errors": null,
  "sentAt": "2025-11-20T10:30:00Z"
}
```

---

## مدل‌های داده

### SendEmailDto (ارسال تکی)

```typescript
interface SendEmailDto {
  toEmail: string;              // اجباری
  toName?: string;              // اختیاری
  subject: string;              // اجباری
  body: string;                 // اجباری
  isHtml?: boolean;             // پیش‌فرض: true
  ccEmails?: string[];          // اختیاری
  bccEmails?: string[];         // اختیاری
  attachments?: EmailAttachmentDto[];  // اختیاری
  emailSettingsId?: number;     // اختیاری (null = default)
}
```

### SendBulkEmailDto (ارسال گروهی)

```typescript
interface SendBulkEmailDto {
  recipients: EmailRecipientDto[];  // حداقل 1 نفر
  subject: string;                  // اجباری
  body: string;                     // اجباری
  isHtml?: boolean;                 // پیش‌فرض: true
  attachments?: EmailAttachmentDto[];  // اختیاری
  emailSettingsId?: number;         // اختیاری
  delayBetweenEmailsMs?: number;    // پیش‌فرض: 100ms (حداکثر: 60000ms)
}
```

### EmailRecipientDto

```typescript
interface EmailRecipientDto {
  email: string;    // اجباری
  name?: string;    // اختیاری
}
```

### EmailAttachmentDto

```typescript
interface EmailAttachmentDto {
  fileName: string;       // اجباری - نام فایل
  fileContent: string;    // اجباری - محتوای فایل به صورت Base64
  contentType?: string;   // اختیاری - پیش‌فرض: application/octet-stream
}
```

### EmailSendResponseDto

```typescript
interface EmailSendResponseDto {
  success: boolean;
  message: string;
  successfulCount: number;
  failedCount: number;
  errors?: string[];
  sentAt: string;  // ISO 8601 format
}
```

### TestEmailSettingsDto

```typescript
interface TestEmailSettingsDto {
  emailSettingsId: number;
  testRecipientEmail: string;
}
```

---

## نمونه‌های کد

### JavaScript / TypeScript

#### 1. ارسال ایمیل ساده

```javascript
async function sendEmail(toEmail, subject, body, token) {
  try {
    const response = await fetch('https://your-domain.com/api/Email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toEmail: toEmail,
        subject: subject,
        body: body,
        isHtml: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ایمیل با موفقیت ارسال شد');
      return result;
    } else {
      console.error('❌ خطا در ارسال ایمیل:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('خطا:', error.message);
    throw error;
  }
}

// مثال استفاده
sendEmail(
  'user@example.com',
  'خوش آمدید',
  '<h1>سلام!</h1><p>به سرویس ما خوش آمدید.</p>',
  'YOUR_JWT_TOKEN'
);
```

#### 2. ارسال ایمیل با فایل پیوست

```javascript
async function sendEmailWithAttachment(toEmail, subject, body, file, token) {
  try {
    // تبدیل فایل به Base64
    const fileContent = await fileToBase64(file);

    const response = await fetch('https://your-domain.com/api/Email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toEmail: toEmail,
        subject: subject,
        body: body,
        isHtml: true,
        attachments: [
          {
            fileName: file.name,
            fileContent: fileContent,
            contentType: file.type
          }
        ]
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('خطا در ارسال ایمیل:', error);
    throw error;
  }
}

// تابع کمکی برای تبدیل فایل به Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // حذف prefix data:*/*;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// مثال استفاده در React
function EmailForm() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (file) {
      await sendEmailWithAttachment(
        'user@example.com',
        'فاکتور خرید',
        '<p>فاکتور خرید شما در فایل پیوست است.</p>',
        file,
        'YOUR_JWT_TOKEN'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit">ارسال ایمیل</button>
    </form>
  );
}
```

#### 3. ارسال ایمیل گروهی

```javascript
async function sendBulkEmail(recipients, subject, body, token) {
  try {
    const response = await fetch('https://your-domain.com/api/Email/send-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
        isHtml: true,
        delayBetweenEmailsMs: 500  // تاخیر 500ms بین هر ایمیل
      })
    });

    const result = await response.json();
    
    console.log(`✅ ${result.successfulCount} ایمیل ارسال شد`);
    console.log(`❌ ${result.failedCount} ایمیل ناموفق بود`);
    
    if (result.errors && result.errors.length > 0) {
      console.error('خطاها:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('خطا در ارسال گروهی:', error);
    throw error;
  }
}

// مثال استفاده
const recipients = [
  { email: 'user1@example.com', name: 'کاربر اول' },
  { email: 'user2@example.com', name: 'کاربر دوم' },
  { email: 'user3@example.com', name: 'کاربر سوم' }
];

sendBulkEmail(
  recipients,
  'خبرنامه هفتگی',
  '<h1>سلام</h1><p>اخبار هفته...</p>',
  'YOUR_JWT_TOKEN'
);
```

#### 4. ارسال ایمیل با CC و BCC

```javascript
async function sendEmailWithCcBcc(data, token) {
  try {
    const response = await fetch('https://your-domain.com/api/Email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toEmail: data.toEmail,
        toName: data.toName,
        subject: data.subject,
        body: data.body,
        isHtml: true,
        ccEmails: data.ccEmails || [],
        bccEmails: data.bccEmails || []
      })
    });

    return await response.json();
  } catch (error) {
    console.error('خطا:', error);
    throw error;
  }
}

// مثال استفاده
sendEmailWithCcBcc({
  toEmail: 'customer@example.com',
  toName: 'مشتری',
  subject: 'تایید سفارش',
  body: '<h1>سفارش شما تایید شد</h1>',
  ccEmails: ['manager@example.com'],
  bccEmails: ['archive@example.com']
}, 'YOUR_JWT_TOKEN');
```

---

### React Hook کامل برای ارسال ایمیل

```typescript
import { useState } from 'react';

interface SendEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  ccEmails?: string[];
  bccEmails?: string[];
  attachments?: File[];
  emailSettingsId?: number;
}

interface EmailResult {
  success: boolean;
  message: string;
  successfulCount: number;
  failedCount: number;
  errors?: string[];
}

export const useEmailSender = (token: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const sendEmail = async (options: SendEmailOptions): Promise<EmailResult> => {
    setLoading(true);
    setError(null);

    try {
      let attachments = undefined;

      if (options.attachments && options.attachments.length > 0) {
        attachments = await Promise.all(
          options.attachments.map(async (file) => ({
            fileName: file.name,
            fileContent: await fileToBase64(file),
            contentType: file.type
          }))
        );
      }

      const response = await fetch('/api/Email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: options.toEmail,
          toName: options.toName,
          subject: options.subject,
          body: options.body,
          isHtml: options.isHtml ?? true,
          ccEmails: options.ccEmails,
          bccEmails: options.bccEmails,
          attachments: attachments,
          emailSettingsId: options.emailSettingsId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EmailResult = await response.json();
      
      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'خطا در ارسال ایمیل';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEmail = async (
    recipients: { email: string; name?: string }[],
    subject: string,
    body: string,
    options?: {
      isHtml?: boolean;
      attachments?: File[];
      emailSettingsId?: number;
      delayBetweenEmailsMs?: number;
    }
  ): Promise<EmailResult> => {
    setLoading(true);
    setError(null);

    try {
      let attachments = undefined;

      if (options?.attachments && options.attachments.length > 0) {
        attachments = await Promise.all(
          options.attachments.map(async (file) => ({
            fileName: file.name,
            fileContent: await fileToBase64(file),
            contentType: file.type
          }))
        );
      }

      const response = await fetch('/api/Email/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
          isHtml: options?.isHtml ?? true,
          attachments: attachments,
          emailSettingsId: options?.emailSettingsId,
          delayBetweenEmailsMs: options?.delayBetweenEmailsMs ?? 100
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EmailResult = await response.json();
      
      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'خطا در ارسال ایمیل گروهی';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    sendBulkEmail,
    loading,
    error
  };
};

// مثال استفاده در کامپوننت
function EmailForm() {
  const token = 'YOUR_JWT_TOKEN'; // از context یا state بگیرید
  const { sendEmail, loading, error } = useEmailSender(token);
  
  const [formData, setFormData] = useState({
    toEmail: '',
    subject: '',
    body: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await sendEmail({
        toEmail: formData.toEmail,
        subject: formData.subject,
        body: formData.body,
        isHtml: true
      });

      if (result.success) {
        alert('ایمیل با موفقیت ارسال شد!');
        setFormData({ toEmail: '', subject: '', body: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.toEmail}
        onChange={(e) => setFormData({...formData, toEmail: e.target.value})}
        placeholder="ایمیل گیرنده"
        required
      />
      <input
        type="text"
        value={formData.subject}
        onChange={(e) => setFormData({...formData, subject: e.target.value})}
        placeholder="موضوع"
        required
      />
      <textarea
        value={formData.body}
        onChange={(e) => setFormData({...formData, body: e.target.value})}
        placeholder="متن ایمیل"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'در حال ارسال...' : 'ارسال ایمیل'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

### C# / .NET

#### 1. ارسال ایمیل ساده

```csharp
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

public class EmailClient
{
    private readonly HttpClient _httpClient;
    private readonly string _token;
    private const string BaseUrl = "https://your-domain.com/api/Email";

    public EmailClient(HttpClient httpClient, string token)
    {
        _httpClient = httpClient;
        _token = token;
        
        _httpClient.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    public async Task<EmailSendResponseDto> SendEmailAsync(SendEmailDto dto)
    {
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/send", dto);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"خطا در ارسال ایمیل: {error}");
        }

        return await response.Content.ReadFromJsonAsync<EmailSendResponseDto>();
    }
}

// مثال استفاده
var client = new EmailClient(new HttpClient(), "YOUR_JWT_TOKEN");

var emailDto = new SendEmailDto
{
    ToEmail = "user@example.com",
    ToName = "نام کاربر",
    Subject = "خوش آمدید",
    Body = "<h1>سلام!</h1><p>به سرویس ما خوش آمدید.</p>",
    IsHtml = true
};

var result = await client.SendEmailAsync(emailDto);

if (result.Success)
{
    Console.WriteLine("✅ ایمیل با موفقیت ارسال شد");
}
else
{
    Console.WriteLine($"❌ خطا: {result.Message}");
}
```

#### 2. ارسال ایمیل با فایل پیوست

```csharp
public async Task<EmailSendResponseDto> SendEmailWithAttachmentAsync(
    string toEmail,
    string subject,
    string body,
    string filePath)
{
    // خواندن فایل و تبدیل به Base64
    byte[] fileBytes = await File.ReadAllBytesAsync(filePath);
    string base64Content = Convert.ToBase64String(fileBytes);
    string fileName = Path.GetFileName(filePath);
    string contentType = GetContentType(fileName);

    var dto = new SendEmailDto
    {
        ToEmail = toEmail,
        Subject = subject,
        Body = body,
        IsHtml = true,
        Attachments = new List<EmailAttachmentDto>
        {
            new EmailAttachmentDto
            {
                FileName = fileName,
                FileContent = base64Content,
                ContentType = contentType
            }
        }
    };

    return await SendEmailAsync(dto);
}

private string GetContentType(string fileName)
{
    var extension = Path.GetExtension(fileName).ToLowerInvariant();
    return extension switch
    {
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls" => "application/vnd.ms-excel",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".txt" => "text/plain",
        _ => "application/octet-stream"
    };
}

// مثال استفاده
var result = await client.SendEmailWithAttachmentAsync(
    "user@example.com",
    "فاکتور خرید",
    "<p>فاکتور خرید شما در فایل پیوست است.</p>",
    "/path/to/invoice.pdf"
);
```

#### 3. ارسال ایمیل گروهی

```csharp
public async Task<EmailSendResponseDto> SendBulkEmailAsync(
    List<EmailRecipientDto> recipients,
    string subject,
    string body,
    int? emailSettingsId = null,
    int delayMs = 100)
{
    var dto = new SendBulkEmailDto
    {
        Recipients = recipients,
        Subject = subject,
        Body = body,
        IsHtml = true,
        EmailSettingsId = emailSettingsId,
        DelayBetweenEmailsMs = delayMs
    };

    var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/send-bulk", dto);
    response.EnsureSuccessStatusCode();

    var result = await response.Content.ReadFromJsonAsync<EmailSendResponseDto>();
    
    Console.WriteLine($"✅ {result.SuccessfulCount} ایمیل موفق");
    Console.WriteLine($"❌ {result.FailedCount} ایمیل ناموفق");
    
    if (result.Errors != null && result.Errors.Any())
    {
        Console.WriteLine("خطاها:");
        foreach (var error in result.Errors)
        {
            Console.WriteLine($"  - {error}");
        }
    }

    return result;
}

// مثال استفاده
var recipients = new List<EmailRecipientDto>
{
    new() { Email = "user1@example.com", Name = "کاربر اول" },
    new() { Email = "user2@example.com", Name = "کاربر دوم" },
    new() { Email = "user3@example.com", Name = "کاربر سوم" }
};

var result = await client.SendBulkEmailAsync(
    recipients,
    "خبرنامه هفتگی",
    "<h1>سلام</h1><p>اخبار هفته...</p>",
    emailSettingsId: 1,
    delayMs: 500
);
```

#### 4. کلاس کامل EmailClient

```csharp
using System.Net.Http;
using System.Net.Http.Json;

public class EmailClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private const string BaseUrl = "https://your-domain.com/api/Email";

    public EmailClient(string token)
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// ارسال ایمیل تکی
    /// </summary>
    public async Task<EmailSendResponseDto> SendEmailAsync(SendEmailDto dto)
    {
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/send", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<EmailSendResponseDto>();
    }

    /// <summary>
    /// ارسال ایمیل گروهی
    /// </summary>
    public async Task<EmailSendResponseDto> SendBulkEmailAsync(SendBulkEmailDto dto)
    {
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/send-bulk", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<EmailSendResponseDto>();
    }

    /// <summary>
    /// ارسال ایمیل تستی
    /// </summary>
    public async Task<EmailSendResponseDto> SendTestEmailAsync(int emailSettingsId, string testEmail)
    {
        var dto = new TestEmailSettingsDto
        {
            EmailSettingsId = emailSettingsId,
            TestRecipientEmail = testEmail
        };

        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/send-test", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<EmailSendResponseDto>();
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}

// DTOs
public class SendEmailDto
{
    public string ToEmail { get; set; }
    public string? ToName { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
    public bool IsHtml { get; set; } = true;
    public List<string>? CcEmails { get; set; }
    public List<string>? BccEmails { get; set; }
    public List<EmailAttachmentDto>? Attachments { get; set; }
    public int? EmailSettingsId { get; set; }
}

public class SendBulkEmailDto
{
    public List<EmailRecipientDto> Recipients { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
    public bool IsHtml { get; set; } = true;
    public List<EmailAttachmentDto>? Attachments { get; set; }
    public int? EmailSettingsId { get; set; }
    public int DelayBetweenEmailsMs { get; set; } = 100;
}

public class EmailRecipientDto
{
    public string Email { get; set; }
    public string? Name { get; set; }
}

public class EmailAttachmentDto
{
    public string FileName { get; set; }
    public string FileContent { get; set; }  // Base64
    public string ContentType { get; set; } = "application/octet-stream";
}

public class EmailSendResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public int SuccessfulCount { get; set; }
    public int FailedCount { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime SentAt { get; set; }
}

public class TestEmailSettingsDto
{
    public int EmailSettingsId { get; set; }
    public string TestRecipientEmail { get; set; }
}
```

---

## سناریوهای کاربردی

### 1. ارسال ایمیل خوش‌آمدگویی پس از ثبت‌نام

```javascript
async function sendWelcomeEmail(userEmail, userName, token) {
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Tahoma, Arial; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          padding: 10px 20px; 
          background: #4CAF50; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>خوش آمدید ${userName}!</h1>
        </div>
        <div class="content">
          <p>سلام ${userName} عزیز،</p>
          <p>از اینکه به جمع ما پیوستید بسیار خوشحالیم.</p>
          <p>حساب کاربری شما با موفقیت ایجاد شد.</p>
          <br>
          <a href="https://your-domain.com/profile" class="button">
            مشاهده پروفایل
          </a>
          <br><br>
          <p>با تشکر،<br>تیم پشتیبانی</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await fetch('https://your-domain.com/api/Email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toEmail: userEmail,
      toName: userName,
      subject: `خوش آمدید ${userName}!`,
      body: htmlBody,
      isHtml: true
    })
  });
}
```

### 2. ارسال فاکتور خرید با PDF

```javascript
async function sendInvoiceEmail(orderData, pdfFile, token) {
  const fileContent = await fileToBase64(pdfFile);

  const htmlBody = `
    <div style="font-family: Tahoma; max-width: 600px; margin: 0 auto;">
      <h2>فاکتور سفارش #${orderData.orderNumber}</h2>
      <p>مشتری گرامی ${orderData.customerName}،</p>
      <p>فاکتور سفارش شما در فایل پیوست ارسال شده است.</p>
      <hr>
      <h3>خلاصه سفارش:</h3>
      <ul>
        <li>شماره سفارش: ${orderData.orderNumber}</li>
        <li>تاریخ: ${orderData.date}</li>
        <li>مبلغ کل: ${orderData.totalAmount} تومان</li>
      </ul>
      <p>با تشکر از خرید شما!</p>
    </div>
  `;

  return await fetch('https://your-domain.com/api/Email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toEmail: orderData.customerEmail,
      toName: orderData.customerName,
      subject: `فاکتور سفارش #${orderData.orderNumber}`,
      body: htmlBody,
      isHtml: true,
      attachments: [
        {
          fileName: `invoice-${orderData.orderNumber}.pdf`,
          fileContent: fileContent,
          contentType: 'application/pdf'
        }
      ]
    })
  });
}
```

### 3. ارسال خبرنامه به تمام مشترکان

```javascript
async function sendNewsletterToSubscribers(newsletterData, token) {
  // دریافت لیست مشترکان از API
  const subscribers = await fetch('/api/Newsletter/subscriptions?isActive=true', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  const recipients = subscribers.items.map(sub => ({
    email: sub.email,
    name: sub.name || 'کاربر'
  }));

  // ارسال گروهی
  return await fetch('https://your-domain.com/api/Email/send-bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: newsletterData.subject,
      body: newsletterData.htmlContent,
      isHtml: true,
      delayBetweenEmailsMs: 1000  // 1 ثانیه تاخیر
    })
  });
}
```

### 4. ارسال کد تایید (OTP)

```javascript
async function sendOTPEmail(email, otpCode, expiryMinutes, token) {
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>کد تایید شما</h2>
        <p>کد تایید برای ورود به حساب کاربری:</p>
        <div style="
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          margin: 20px 0;
        ">
          ${otpCode}
        </div>
        <p>این کد تا ${expiryMinutes} دقیقه دیگر معتبر است.</p>
        <p style="color: #999; font-size: 12px;">
          اگر این درخواست را شما انجام نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.
        </p>
      </div>
    </body>
    </html>
  `;

  return await fetch('https://your-domain.com/api/Email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toEmail: email,
      subject: `کد تایید شما: ${otpCode}`,
      body: htmlBody,
      isHtml: true
    })
  });
}
```

### 5. ارسال اعلان تغییر وضعیت سفارش

```javascript
async function sendOrderStatusEmail(orderId, newStatus, customerEmail, token) {
  const statusMessages = {
    'pending': 'در انتظار پردازش',
    'processing': 'در حال آماده‌سازی',
    'shipped': 'ارسال شد',
    'delivered': 'تحویل داده شد',
    'cancelled': 'لغو شد'
  };

  const htmlBody = `
    <div style="font-family: Tahoma; max-width: 600px; margin: 0 auto;">
      <h2>تغییر وضعیت سفارش</h2>
      <p>سفارش شماره ${orderId} به وضعیت <strong>${statusMessages[newStatus]}</strong> تغییر کرد.</p>
      <p>
        <a href="https://your-domain.com/orders/${orderId}" 
           style="display: inline-block; padding: 10px 20px; background: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 5px;">
          مشاهده جزئیات سفارش
        </a>
      </p>
    </div>
  `;

  return await fetch('https://your-domain.com/api/Email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toEmail: customerEmail,
      subject: `تغییر وضعیت سفارش #${orderId}`,
      body: htmlBody,
      isHtml: true
    })
  });
}
```

---

## مدیریت خطاها

### کدهای وضعیت HTTP

| کد | توضیحات |
|----|---------|
| 200 | ارسال موفق |
| 400 | خطای اعتبارسنجی |
| 401 | عدم احراز هویت |
| 403 | عدم دسترسی (فقط Admin) |
| 500 | خطای سرور |

### انواع خطاها

#### 1. خطای اعتبارسنجی (Validation Error)

```json
{
  "errors": {
    "ToEmail": ["The ToEmail field is required."],
    "Subject": ["The Subject field is required."]
  }
}
```

#### 2. خطای SMTP

```json
{
  "success": false,
  "message": "Failed to send email: SMTP server connection failed",
  "successfulCount": 0,
  "failedCount": 1,
  "errors": ["SMTP server connection failed"],
  "sentAt": "2025-11-20T10:30:00Z"
}
```

#### 3. خطای تنظیمات ایمیل

```json
{
  "success": false,
  "message": "No email settings configured",
  "successfulCount": 0,
  "failedCount": 1,
  "errors": null,
  "sentAt": "2025-11-20T10:30:00Z"
}
```

### مدیریت خطا در JavaScript

```javascript
async function sendEmailWithErrorHandling(emailData, token) {
  try {
    const response = await fetch('/api/Email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailData)
    });

    // بررسی وضعیت HTTP
    if (response.status === 401) {
      throw new Error('لطفاً ابتدا وارد شوید');
    }

    if (response.status === 403) {
      throw new Error('شما دسترسی لازم برای این عملیات را ندارید');
    }

    if (response.status === 400) {
      const validationErrors = await response.json();
      const errorMessages = Object.values(validationErrors.errors || {})
        .flat()
        .join(', ');
      throw new Error(`خطای اعتبارسنجی: ${errorMessages}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // بررسی نتیجه
    if (!result.success) {
      if (result.errors && result.errors.length > 0) {
        throw new Error(`خطا در ارسال: ${result.errors.join(', ')}`);
      }
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('خطا در ارسال ایمیل:', error);
    
    // نمایش پیام به کاربر
    alert(`خطا: ${error.message}`);
    
    throw error;
  }
}
```

---

## بهترین روش‌ها

### 1. امنیت

- ✅ **همیشه از HTTPS استفاده کنید**
- ✅ **Token را به صورت امن ذخیره کنید** (در localStorage یا httpOnly cookie)
- ✅ **Token را در هر درخواست ارسال کنید**
- ❌ **Token را در URL قرار ندهید**

### 2. عملکرد

- ✅ **از bulk email برای ارسال گروهی استفاده کنید** (به جای حلقه)
- ✅ **تاخیر مناسب بین ایمیل‌ها بگذارید** (500-1000ms)
- ✅ **حجم فایل‌های پیوست را محدود کنید** (حداکثر 5MB)
- ✅ **از فشرده‌سازی تصاویر استفاده کنید**

### 3. تجربه کاربری

- ✅ **Loading indicator نمایش دهید**
- ✅ **پیام موفقیت/خطا به کاربر نشان دهید**
- ✅ **از Retry برای خطاهای موقت استفاده کنید**
- ✅ **پیشرفت ارسال bulk email را نمایش دهید**

### 4. محتوای ایمیل

- ✅ **از قالب‌های HTML responsive استفاده کنید**
- ✅ **متن جایگزین (Plain Text) برای HTML ارسال کنید**
- ✅ **لینک لغو اشتراک اضافه کنید**
- ✅ **از inline CSS استفاده کنید** (نه external)

### 5. نمونه کد با بهترین روش‌ها

```javascript
class EmailService {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async sendWithRetry(emailData, retries = this.maxRetries) {
    try {
      return await this.send(emailData);
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`Retrying... (${retries} attempts left)`);
        await this.delay(this.retryDelay);
        return this.sendWithRetry(emailData, retries - 1);
      }
      throw error;
    }
  }

  async send(emailData) {
    const response = await fetch(`${this.apiUrl}/Email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  isRetryableError(error) {
    // فقط برای خطاهای موقت شبکه retry کن
    return error.message.includes('network') || 
           error.message.includes('timeout');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate email before sending
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Sanitize HTML to prevent XSS
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
}

// استفاده
const emailService = new EmailService('https://api.example.com', 'TOKEN');

try {
  const result = await emailService.sendWithRetry({
    toEmail: 'user@example.com',
    subject: 'Test',
    body: '<h1>Hello</h1>',
    isHtml: true
  });
  
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Failed after retries:', error);
}
```

---

## تست API با cURL

### 1. ارسال ایمیل ساده

```bash
curl -X POST https://your-domain.com/api/Email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "toEmail": "test@example.com",
    "subject": "تست ایمیل",
    "body": "<h1>سلام!</h1><p>این یک ایمیل تستی است.</p>",
    "isHtml": true
  }'
```

### 2. ارسال ایمیل گروهی

```bash
curl -X POST https://your-domain.com/api/Email/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipients": [
      {"email": "user1@example.com", "name": "User 1"},
      {"email": "user2@example.com", "name": "User 2"}
    ],
    "subject": "Newsletter",
    "body": "<h1>Hello</h1>",
    "isHtml": true,
    "delayBetweenEmailsMs": 500
  }'
```

### 3. ارسال ایمیل تستی

```bash
curl -X POST https://your-domain.com/api/Email/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "emailSettingsId": 1,
    "testRecipientEmail": "test@example.com"
  }'
```

---

## سوالات متداول (FAQ)

### 1. چگونه می‌توانم ایمیل ارسال کنم؟
باید ابتدا با نقش Admin وارد شوید و JWT Token دریافت کنید. سپس این Token را در هدر Authorization ارسال کنید.

### 2. آیا می‌توانم بدون تنظیمات ایمیل، ایمیل ارسال کنم؟
خیر، باید حداقل یک Email Settings پیکربندی شده داشته باشید.

### 3. حداکثر تعداد گیرندگان در bulk email چقدر است؟
محدودیت خاصی وجود ندارد، اما توصیه می‌شود برای تعداد بالا (بیش از 1000) از batch processing استفاده کنید.

### 4. چگونه فایل را به Base64 تبدیل کنم؟
از FileReader API در JavaScript یا Convert.ToBase64String در C# استفاده کنید. (نمونه کد در بالا موجود است)

### 5. آیا می‌توانم چندین فایل پیوست کنم؟
بله، فیلد attachments یک آرایه است و می‌توانید چندین فایل اضافه کنید.

### 6. چه زمانی باید از send-bulk استفاده کنم؟
زمانی که می‌خواهید یک ایمیل یکسان به چندین گیرنده ارسال کنید. این روش بهینه‌تر از ارسال تکی در حلقه است.

### 7. delayBetweenEmailsMs چیست؟
تاخیر بین هر ایمیل در ارسال گروهی است که برای جلوگیری از rate limiting و اسپم فیلتر استفاده می‌شود.

### 8. آیا ایمیل‌ها به صورت Async ارسال می‌شوند؟
بله، همه ایمیل‌ها به صورت async ارسال می‌شوند و درخواست شما block نمی‌شود.

---

## منابع بیشتر

- [API Documentation - Account (Login/Register)](./API_DOCUMENTATION.md)
- [API Documentation - Newsletter](./NEWSLETTER_API_GUIDE.md)
- [Email Settings Configuration Guide](./EMAIL_SETTINGS_GUIDE.md)

---

## پشتیبانی

برای گزارش مشکلات یا سوالات:
- ایمیل: support@spirithubcafe.com
- GitHub Issues: https://github.com/spirithubcafe/spirithubcafe-api/issues

---

**نسخه API:** 1.0  
**تاریخ به‌روزرسانی:** 20 نوامبر 2025  
**وضعیت:** فعال ✅
