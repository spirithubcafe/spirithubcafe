import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, File as FileIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { fileUploadService, type FolderType, type FileType } from '@/services/fileUploadService';
import { useApp } from '@/hooks/useApp';

export interface FileUploadProps {
  /** Current file URL (for edit mode) */
  value?: string;
  
  /** Callback when file is uploaded */
  onChange?: (fileUrl: string) => void;
  
  /** Target folder for upload */
  folder?: FolderType;
  
  /** Type of file (image, document, etc.) */
  fileType?: FileType;
  
  /** Optional prefix for filename */
  prefix?: string;
  
  /** Accept file types (e.g., "image/*") */
  accept?: string;
  
  /** Maximum file size in MB */
  maxSizeMB?: number;
  
  /** Show preview of uploaded file */
  showPreview?: boolean;
  
  /** Enable image compression */
  compress?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Label text */
  label?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Error message */
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  folder = 'temp',
  fileType = 'image',
  prefix,
  accept = 'image/*',
  maxSizeMB = 5,
  showPreview = true,
  compress = true,
  className,
  disabled = false,
  label,
  helperText,
  error,
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Validate file
      const validation = fileUploadService.validateFile(file, maxSizeMB, accept.split(','));
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      try {
        setUploading(true);

        // Create preview
        if (showPreview && fileUploadService.isImageFile(file)) {
          const preview = await fileUploadService.createPreviewUrl(file);
          setPreviewUrl(preview);
        }

        // Compress image if needed
        let fileToUpload = file;
        if (compress && fileUploadService.isImageFile(file)) {
          fileToUpload = await fileUploadService.compressImage(file);
        }

        // Upload file
        const response = await fileUploadService.uploadFile(
          fileToUpload,
          folder,
          fileType,
          prefix
        );

        if (response.success && response.fileUrl) {
          setPreviewUrl(response.fileUrl);
          onChange?.(response.fileUrl);
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        alert(isArabic ? 'فشل رفع الملف' : 'Failed to upload file');
        setPreviewUrl(value || null);
      } finally {
        setUploading(false);
      }
    },
    [disabled, maxSizeMB, accept, showPreview, compress, folder, fileType, prefix, onChange, value, isArabic]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled || !e.dataTransfer.files.length) return;

      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    },
    [disabled, handleFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files?.length) return;

      const file = e.target.files[0];
      handleFileSelect(file);
    },
    [disabled, handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onChange?.('');
  }, [onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const isImage = fileType === 'image' && previewUrl && !previewUrl.includes('.pdf');

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          dragActive && !disabled
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-red-500'
            : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !previewUrl && 'hover:border-primary cursor-pointer'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />

        {previewUrl ? (
          <div className="relative p-4">
            {isImage ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-48">
                <FileIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center p-8 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            ) : (
              <>
                {fileType === 'image' ? (
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                )}
              </>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {uploading ? (
                isArabic ? 'جاري الرفع...' : 'Uploading...'
              ) : (
                <>
                  {isArabic ? (
                    <>
                      <span className="font-semibold text-primary">انقر لاختيار ملف</span> أو اسحبه هنا
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-primary">Click to select</span> or drag and drop
                    </>
                  )}
                </>
              )}
            </p>

            {helperText && !uploading && (
              <p className="text-xs text-gray-500 mt-2">{helperText}</p>
            )}
          </label>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!error && helperText && previewUrl && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
