import { apiClient } from './apiClient';

export interface UploadedFile {
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: string;
  extension: string;
  createdDate: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  folder?: string;
  extension?: string;
  createdDate?: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  files: UploadedFile[];
  uploadedCount: number;
  failedCount: number;
}

export interface FileListResponse {
  success: boolean;
  files: UploadedFile[];
  totalFiles: number;
  folder: string;
}

export interface UploadConfig {
  maxFileSizeMB: number;
  allowedImageExtensions: string[];
  allowedDocumentExtensions: string[];
  uploadPath: string;
  baseUrl: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSizeMB: number;
  totalSizeGB: number;
  folderStats?: Array<{
    folder: string;
    fileCount: number;
    totalSizeMB: number;
  }>;
}

export type FolderType = 
  | 'products' 
  | 'categories' 
  | 'slides' 
  | 'banners' 
  | 'users' 
  | 'brands' 
  | 'documents' 
  | 'temp';

export type FileType = 'image' | 'document' | 'video' | 'audio';

/**
 * File Upload Service
 * Handles all file upload operations including images and documents
 */
export const fileUploadService = {
  /**
   * Upload a single file
   * POST /api/fileupload/upload
   * 
   * @param file - The file to upload
   * @param folder - Target folder (products, categories, slides, etc.)
   * @param fileType - Type of file (image, document, video, audio)
   * @param prefix - Optional prefix for the filename
   * @returns Promise with upload response
   */
  async uploadFile(
    file: File,
    folder: FolderType = 'temp',
    fileType: FileType = 'image',
    prefix?: string
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('fileType', fileType);
      
      if (prefix) {
        formData.append('prefix', prefix);
      }

      console.log(`📤 Uploading file: ${file.name} to folder: ${folder}`);

      const response = await apiClient.post<UploadResponse>(
        '/api/fileupload/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ File uploaded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ File upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  },

  /**
   * Upload multiple files
   * POST /api/fileupload/upload-multiple
   * 
   * @param files - Array of files to upload
   * @param folder - Target folder
   * @param fileType - Type of files
   * @returns Promise with upload response
   */
  async uploadMultipleFiles(
    files: File[],
    folder: FolderType = 'temp',
    fileType: FileType = 'image'
  ): Promise<MultipleUploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      formData.append('folder', folder);
      formData.append('fileType', fileType);

      console.log(`📤 Uploading ${files.length} files to folder: ${folder}`);

      const response = await apiClient.post<MultipleUploadResponse>(
        '/api/fileupload/upload-multiple',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log(`✅ Uploaded ${response.data.uploadedCount} files successfully`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Multiple file upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload files');
    }
  },

  /**
   * List files in a folder
   * GET /api/fileupload/list
   * 
   * @param folder - Folder to list files from
   * @returns Promise with list of files
   */
  async listFiles(folder: FolderType): Promise<FileListResponse> {
    try {
      const response = await apiClient.get<FileListResponse>(
        `/api/fileupload/list`,
        { params: { folder } }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ List files error:', error);
      throw new Error(error.response?.data?.message || 'Failed to list files');
    }
  },

  /**
   * Delete a file
   * DELETE /api/fileupload/delete
   * 
   * @param fileName - Name of the file to delete
   * @param folder - Folder containing the file
   * @returns Promise with deletion result
   */
  async deleteFile(fileName: string, folder: FolderType): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(
        `/api/fileupload/delete`,
        { params: { fileName, folder } }
      );

      console.log(`✅ File deleted: ${fileName}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Delete file error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  },

  /**
   * Get upload configuration
   * GET /api/fileupload/config
   * 
   * @returns Promise with upload configuration
   */
  async getConfig(): Promise<UploadConfig> {
    try {
      const response = await apiClient.get<UploadConfig>('/api/fileupload/config');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get config error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get configuration');
    }
  },

  /**
   * Get storage statistics
   * GET /api/fileupload/stats
   * 
   * @returns Promise with storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      const response = await apiClient.get<StorageStats>('/api/fileupload/stats');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get statistics');
    }
  },

  /**
   * Validate file before upload
   * 
   * @param file - File to validate
   * @param maxSizeMB - Maximum file size in MB (default: 5)
   * @param allowedExtensions - Array of allowed extensions (default: common image formats)
   * @returns Object with validation result
   */
  validateFile(
    file: File,
    maxSizeMB: number = 5,
    allowedExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  ): { valid: boolean; error?: string } {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds maximum allowed size (${maxSizeMB} MB)`
      };
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  },

  /**
   * Create a preview URL for a file
   * 
   * @param file - File to create preview for
   * @returns Promise with preview URL
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to create preview'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  },

  /**
   * Format file size to human readable format
   * 
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Get file extension from filename
   * 
   * @param filename - Name of the file
   * @returns File extension with dot (e.g., '.jpg')
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  },

  /**
   * Check if file is an image
   * 
   * @param file - File to check
   * @returns True if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  },

  /**
   * Compress image before upload (client-side)
   * 
   * @param file - Image file to compress
   * @param maxWidth - Maximum width (default: 1920)
   * @param maxHeight - Maximum height (default: 1080)
   * @param quality - JPEG quality 0-1 (default: 0.85)
   * @returns Promise with compressed file
   */
  async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.85
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.isImageFile(file)) {
        resolve(file); // Return original if not an image
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              console.log(`🗜️ Image compressed: ${this.formatFileSize(file.size)} -> ${this.formatFileSize(compressedFile.size)}`);
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  },
};
