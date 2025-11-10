import React, { useCallback, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { fileUploadService, type FolderType, type FileType } from '@/services/fileUploadService';
import { useApp } from '@/hooks/useApp';

export interface MultipleFileUploadProps {
  /** Current file URLs (for edit mode) */
  value?: string[];
  
  /** Callback when files are uploaded */
  onChange?: (fileUrls: string[]) => void;
  
  /** Target folder for upload */
  folder?: FolderType;
  
  /** Type of files (image, document, etc.) */
  fileType?: FileType;
  
  /** Accept file types (e.g., "image/*") */
  accept?: string;
  
  /** Maximum file size in MB */
  maxSizeMB?: number;
  
  /** Maximum number of files */
  maxFiles?: number;
  
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
}

interface PreviewFile {
  url: string;
  uploading?: boolean;
  file?: File;
}

export const MultipleFileUpload: React.FC<MultipleFileUploadProps> = ({
  value = [],
  onChange,
  folder = 'temp',
  fileType = 'image',
  accept = 'image/*',
  maxSizeMB = 5,
  maxFiles = 10,
  compress = true,
  className,
  disabled = false,
  label,
  helperText,
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  
  const [files, setFiles] = useState<PreviewFile[]>(
    value.map(url => ({ url }))
  );
  const [dragActive, setDragActive] = useState(false);

  const handleFilesSelect = useCallback(
    async (selectedFiles: FileList) => {
      if (disabled) return;

      const newFiles = Array.from(selectedFiles);
      
      // Check max files limit
      if (files.length + newFiles.length > maxFiles) {
        alert(isArabic 
          ? `الحد الأقصى للملفات هو ${maxFiles}`
          : `Maximum ${maxFiles} files allowed`
        );
        return;
      }

      // Validate and create previews
      const validFiles: PreviewFile[] = [];
      
      for (const file of newFiles) {
        const validation = fileUploadService.validateFile(file, maxSizeMB);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          continue;
        }

        if (fileUploadService.isImageFile(file)) {
          const preview = await fileUploadService.createPreviewUrl(file);
          validFiles.push({ url: preview, uploading: true, file });
        } else {
          validFiles.push({ url: '', uploading: true, file });
        }
      }

      // Add files to state
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);

      // Upload files
      const uploadPromises = validFiles.map(async (previewFile) => {
        if (!previewFile.file) return null;

        try {
          let fileToUpload = previewFile.file;
          
          // Compress if image
          if (compress && fileUploadService.isImageFile(fileToUpload)) {
            fileToUpload = await fileUploadService.compressImage(fileToUpload);
          }

          const response = await fileUploadService.uploadFile(
            fileToUpload,
            folder,
            fileType
          );

          return response.fileUrl;
        } catch (error) {
          console.error('Upload error:', error);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Update files with uploaded URLs
      const finalFiles = updatedFiles.map((file, index) => {
        if (file.uploading && uploadedUrls[index - files.length]) {
          return { url: uploadedUrls[index - files.length]!, uploading: false };
        }
        return file;
      }).filter(f => !f.uploading || f.url); // Remove failed uploads

      setFiles(finalFiles);
      onChange?.(finalFiles.map(f => f.url));
    },
    [disabled, files, maxFiles, maxSizeMB, compress, folder, fileType, onChange, isArabic]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled || !e.dataTransfer.files.length) return;
      handleFilesSelect(e.dataTransfer.files);
    },
    [disabled, handleFilesSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files?.length) return;
      handleFilesSelect(e.target.files);
    },
    [disabled, handleFilesSelect]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange?.(newFiles.map(f => f.url));
    },
    [files, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-colors',
            dragActive && !disabled
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:border-primary cursor-pointer'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept={accept}
            multiple
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            id="multiple-file-upload"
          />

          <label
            htmlFor="multiple-file-upload"
            className="flex flex-col items-center justify-center p-8 cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {isArabic ? (
                <>
                  <span className="font-semibold text-primary">انقر لاختيار الملفات</span> أو اسحبها هنا
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">Click to select files</span> or drag and drop
                </>
              )}
            </p>

            {helperText && (
              <p className="text-xs text-gray-500 mt-2">{helperText}</p>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {files.length} / {maxFiles} {isArabic ? 'ملفات' : 'files'}
            </p>
          </label>
        </div>
      )}

      {/* File Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {file.url ? (
                <img
                  src={file.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {file.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {!disabled && !file.uploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
