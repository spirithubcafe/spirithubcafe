# 📁 File Upload System

سیستم آپلود فایل کامل برای Spirithub Café با پشتیبانی از آپلود تکی و چندتایی، فشرده‌سازی تصاویر، و مدیریت فایل‌ها.

## 🚀 نحوه استفاده

### 1. آپلود تک فایل (Single File Upload)

```tsx
import { FileUpload } from '@/components/ui/file-upload';

function ProductForm() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <FileUpload
      value={imageUrl}
      onChange={setImageUrl}
      folder="products"
      fileType="image"
      prefix="product-main"
      label="Product Image"
      accept="image/*"
      maxSizeMB={5}
      compress={true}
    />
  );
}
```

### 2. آپلود چند فایل (Multiple Files Upload)

```tsx
import { MultipleFileUpload } from '@/components/ui/multiple-file-upload';

function ProductGallery() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <MultipleFileUpload
      value={images}
      onChange={setImages}
      folder="products"
      fileType="image"
      maxFiles={10}
      accept="image/*"
      compress={true}
    />
  );
}
```

### 3. استفاده مستقیم از Service

```tsx
import { fileUploadService } from '@/services';

async function uploadImage(file: File) {
  try {
    // Compress image
    const compressed = await fileUploadService.compressImage(file, 1920, 1080, 0.85);
    
    // Upload to server
    const response = await fileUploadService.uploadFile(
      compressed,
      'products',
      'image',
      'product'
    );
    
    console.log('Uploaded:', response.fileUrl);
    return response.fileUrl;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## 📦 Props - FileUpload

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | - | URL فایل آپلود شده |
| onChange | (url: string) => void | - | callback هنگام آپلود موفق |
| folder | FolderType | 'temp' | پوشه مقصد: products, categories, slides, etc. |
| fileType | FileType | 'image' | نوع فایل: image, document, video, audio |
| prefix | string | - | پیشوند نام فایل |
| accept | string | 'image/*' | فرمت‌های مجاز |
| maxSizeMB | number | 5 | حداکثر حجم فایل (MB) |
| showPreview | boolean | true | نمایش پیش‌نمایش |
| compress | boolean | true | فعال‌سازی فشرده‌سازی تصاویر |
| disabled | boolean | false | غیرفعال کردن |
| label | string | - | برچسب |
| helperText | string | - | متن راهنما |
| error | string | - | پیام خطا |

## 📦 Props - MultipleFileUpload

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string[] | [] | آرایه URL های آپلود شده |
| onChange | (urls: string[]) => void | - | callback هنگام آپلود |
| folder | FolderType | 'temp' | پوشه مقصد |
| fileType | FileType | 'image' | نوع فایل |
| accept | string | 'image/*' | فرمت‌های مجاز |
| maxSizeMB | number | 5 | حداکثر حجم هر فایل |
| maxFiles | number | 10 | حداکثر تعداد فایل |
| compress | boolean | true | فشرده‌سازی تصاویر |
| disabled | boolean | false | غیرفعال کردن |
| label | string | - | برچسب |
| helperText | string | - | متن راهنما |

## 📂 پوشه‌های موجود (Folder Types)

- `products` - تصاویر محصولات
- `categories` - تصاویر دسته‌بندی‌ها
- `slides` - تصاویر اسلایدر
- `banners` - بنرهای تبلیغاتی
- `users` - آواتار کاربران
- `brands` - لوگوی برندها
- `documents` - اسناد و فایل‌های PDF
- `temp` - فایل‌های موقت

## 🛠️ متدهای Service

### uploadFile()
آپلود یک فایل به سرور

```tsx
const response = await fileUploadService.uploadFile(
  file,
  'products',
  'image',
  'product-main'
);
```

### uploadMultipleFiles()
آپلود چند فایل همزمان

```tsx
const response = await fileUploadService.uploadMultipleFiles(
  files,
  'products',
  'image'
);
```

### listFiles()
دریافت لیست فایل‌های یک پوشه

```tsx
const response = await fileUploadService.listFiles('products');
```

### deleteFile()
حذف یک فایل

```tsx
await fileUploadService.deleteFile('filename.jpg', 'products');
```

### validateFile()
اعتبارسنجی فایل قبل از آپلود

```tsx
const validation = fileUploadService.validateFile(file, 5, ['.jpg', '.png']);
if (!validation.valid) {
  alert(validation.error);
}
```

### compressImage()
فشرده‌سازی تصویر

```tsx
const compressed = await fileUploadService.compressImage(
  file,
  1920,  // max width
  1080,  // max height
  0.85   // quality
);
```

### createPreviewUrl()
ایجاد URL پیش‌نمایش

```tsx
const previewUrl = await fileUploadService.createPreviewUrl(file);
```

### formatFileSize()
فرمت‌بندی حجم فایل

```tsx
const size = fileUploadService.formatFileSize(1024000); // "1000 KB"
```

## ✨ ویژگی‌ها

### 1. فشرده‌سازی خودکار تصاویر
تصاویر قبل از آپلود به صورت خودکار فشرده می‌شوند:
- حداکثر عرض: 1920px
- حداکثر ارتفاع: 1080px  
- کیفیت: 85%

### 2. Drag & Drop
امکان کشیدن و رها کردن فایل‌ها مستقیماً روی کامپوننت

### 3. اعتبارسنجی
- بررسی نوع فایل
- بررسی حجم فایل
- پیام‌های خطای واضح

### 4. پیش‌نمایش
نمایش پیش‌نمایش فایل‌های تصویری قبل و بعد از آپلود

### 5. چندزبانه
پشتیبانی از زبان‌های فارسی و انگلیسی

### 6. وضعیت بارگذاری
نمایش spinner هنگام آپلود

## 📝 مثال‌های کاربردی

### آپلود تصویر محصول با prefix

```tsx
<FileUpload
  value={mainImage}
  onChange={setMainImage}
  folder="products"
  fileType="image"
  prefix={`product-${productId}-main`}
  label="Main Product Image"
  helperText="PNG, JPG (max 5MB)"
  maxSizeMB={5}
/>
```

### آپلود گالری محصول

```tsx
<MultipleFileUpload
  value={galleryImages}
  onChange={setGalleryImages}
  folder="products"
  fileType="image"
  maxFiles={10}
  label="Product Gallery"
  helperText="Upload up to 10 images"
/>
```

### آپلود PDF

```tsx
<FileUpload
  value={catalogPdf}
  onChange={setCatalogPdf}
  folder="documents"
  fileType="document"
  accept=".pdf"
  maxSizeMB={10}
  label="Product Catalog"
  showPreview={false}
  compress={false}
/>
```

### آپلود با Validation سفارشی

```tsx
const handleFileSelect = async (file: File) => {
  const validation = fileUploadService.validateFile(
    file,
    2, // max 2MB
    ['.jpg', '.png', '.webp']
  );
  
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  const response = await fileUploadService.uploadFile(
    file,
    'products',
    'image'
  );
  
  setImageUrl(response.fileUrl);
};
```

## 🔧 پیکربندی

دریافت تنظیمات آپلود از سرور:

```tsx
const config = await fileUploadService.getConfig();
console.log('Max file size:', config.maxFileSizeMB);
console.log('Allowed extensions:', config.allowedImageExtensions);
```

دریافت آمار فضای ذخیره‌سازی:

```tsx
const stats = await fileUploadService.getStats();
console.log('Total files:', stats.totalFiles);
console.log('Total size:', stats.totalSizeMB);
```

## 🧪 تست

برای تست سیستم آپلود، از صفحه `FileUploadTestPage` استفاده کنید:

```tsx
import { FileUploadTestPage } from '@/pages/FileUploadTestPage';

// در Router
<Route path="/test-upload" element={<FileUploadTestPage />} />
```

یا فایل HTML تست را باز کنید:
```
file-upload-test.html
```

## 🚨 نکات مهم

1. **اندازه فایل**: حداکثر اندازه فایل در سمت سرور بررسی می‌شود
2. **فشرده‌سازی**: فقط برای تصاویر فعال است
3. **امنیت**: فایل‌ها در سمت سرور اعتبارسنجی می‌شوند
4. **نام‌گذاری**: نام فایل‌ها به صورت خودکار unique می‌شوند
5. **مسیر**: تمام فایل‌ها در `/uploads/{folder}/` ذخیره می‌شوند

## 📱 Responsive

کامپوننت‌ها به طور کامل responsive هستند و روی موبایل، تبلت و دسکتاپ به خوبی کار می‌کنند.

## 🌐 API Endpoints

- POST `/api/fileupload/upload` - آپلود تک فایل
- POST `/api/fileupload/upload-multiple` - آپلود چند فایل
- GET `/api/fileupload/list?folder={folder}` - لیست فایل‌ها
- DELETE `/api/fileupload/delete?fileName={name}&folder={folder}` - حذف فایل
- GET `/api/fileupload/config` - دریافت پیکربندی
- GET `/api/fileupload/stats` - دریافت آمار

## 📄 License

MIT
