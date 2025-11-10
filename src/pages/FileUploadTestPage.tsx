import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { MultipleFileUpload } from '@/components/ui/multiple-file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/useApp';

/**
 * File Upload Test Page
 * Demonstrates usage of file upload components
 */
export const FileUploadTestPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  // Single file states
  const [productImage, setProductImage] = useState<string>('');
  const [categoryImage, setCategoryImage] = useState<string>('');
  const [document, setDocument] = useState<string>('');

  // Multiple files state
  const [productGallery, setProductGallery] = useState<string[]>([]);

  const handleSubmit = () => {
    console.log('Form Data:', {
      productImage,
      categoryImage,
      document,
      productGallery,
    });

    alert(isArabic 
      ? 'تم حفظ البيانات بنجاح!'
      : 'Data saved successfully!'
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isArabic ? 'اختبار رفع الملفات' : 'File Upload Test'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isArabic 
            ? 'اختبر رفع الصور والملفات إلى الخادم'
            : 'Test uploading images and files to the server'
          }
        </p>
      </div>

      <div className="space-y-6">
        {/* Single Image Upload - Product */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? 'صورة المنتج الرئيسية' : 'Product Main Image'}
            </CardTitle>
            <CardDescription>
              {isArabic 
                ? 'ارفع صورة المنتج الرئيسية (يتم ضغط الصور تلقائياً)'
                : 'Upload main product image (automatic compression)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={productImage}
              onChange={setProductImage}
              folder="products"
              fileType="image"
              prefix="product-main"
              label={isArabic ? 'صورة المنتج' : 'Product Image'}
              helperText={isArabic 
                ? 'PNG, JPG, WebP (حد أقصى 5MB)'
                : 'PNG, JPG, WebP (max 5MB)'
              }
              accept="image/*"
              maxSizeMB={5}
              showPreview={true}
              compress={true}
            />

            {productImage && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  {isArabic ? 'رابط الصورة:' : 'Image URL:'}
                </p>
                <code className="text-xs break-all">{productImage}</code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single Image Upload - Category */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? 'صورة الفئة' : 'Category Image'}
            </CardTitle>
            <CardDescription>
              {isArabic 
                ? 'ارفع صورة الفئة'
                : 'Upload category image'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={categoryImage}
              onChange={setCategoryImage}
              folder="categories"
              fileType="image"
              prefix="category"
              label={isArabic ? 'صورة الفئة' : 'Category Image'}
              helperText={isArabic 
                ? 'PNG, JPG (حد أقصى 5MB)'
                : 'PNG, JPG (max 5MB)'
              }
              accept="image/png,image/jpeg,image/jpg"
              maxSizeMB={5}
            />
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? 'رفع مستند' : 'Document Upload'}
            </CardTitle>
            <CardDescription>
              {isArabic 
                ? 'ارفع ملف PDF أو مستند'
                : 'Upload PDF or document file'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              value={document}
              onChange={setDocument}
              folder="documents"
              fileType="document"
              label={isArabic ? 'المستند' : 'Document'}
              helperText={isArabic 
                ? 'PDF, DOC, DOCX (حد أقصى 10MB)'
                : 'PDF, DOC, DOCX (max 10MB)'
              }
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
              showPreview={false}
              compress={false}
            />
          </CardContent>
        </Card>

        {/* Multiple Images Upload */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? 'معرض صور المنتج' : 'Product Gallery'}
            </CardTitle>
            <CardDescription>
              {isArabic 
                ? 'ارفع عدة صور للمنتج (حد أقصى 10 صور)'
                : 'Upload multiple product images (max 10 images)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultipleFileUpload
              value={productGallery}
              onChange={setProductGallery}
              folder="products"
              fileType="image"
              label={isArabic ? 'صور المنتج' : 'Product Images'}
              helperText={isArabic 
                ? 'اختر أو اسحب عدة صور (PNG, JPG)'
                : 'Select or drag multiple images (PNG, JPG)'
              }
              accept="image/*"
              maxSizeMB={5}
              maxFiles={10}
              compress={true}
            />

            {productGallery.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  {isArabic ? 'روابط الصور:' : 'Image URLs:'}
                </p>
                <div className="space-y-1">
                  {productGallery.map((url, index) => (
                    <code key={index} className="text-xs block break-all">
                      {index + 1}. {url}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setProductImage('');
              setCategoryImage('');
              setDocument('');
              setProductGallery([]);
            }}
          >
            {isArabic ? 'مسح الكل' : 'Clear All'}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!productImage && !categoryImage && !document && productGallery.length === 0}
          >
            {isArabic ? 'حفظ البيانات' : 'Save Data'}
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">
            {isArabic ? '📝 ملاحظات:' : '📝 Notes:'}
          </h3>
          <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
            <li>
              {isArabic 
                ? 'يتم ضغط الصور تلقائياً قبل الرفع لتوفير المساحة'
                : 'Images are automatically compressed before upload to save space'
              }
            </li>
            <li>
              {isArabic 
                ? 'يمكنك سحب وإفلات الملفات مباشرة'
                : 'You can drag and drop files directly'
              }
            </li>
            <li>
              {isArabic 
                ? 'جميع الملفات يتم التحقق من صحتها قبل الرفع'
                : 'All files are validated before upload'
              }
            </li>
            <li>
              {isArabic 
                ? 'يتم حفظ الملفات في المجلدات المناسبة على الخادم'
                : 'Files are saved in appropriate folders on the server'
              }
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
