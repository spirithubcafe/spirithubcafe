import { http } from './apiClient';

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

export interface EmailAttachmentDto {
  fileName: string;
  fileContent: string; // Base64 encoded content
  contentType?: string; // Default: application/octet-stream
}

export interface EmailRecipientDto {
  email: string;
  name?: string;
}

export interface SendEmailDto {
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  isHtml?: boolean; // Default: true
  ccEmails?: string[];
  bccEmails?: string[];
  attachments?: EmailAttachmentDto[];
  emailSettingsId?: number; // null = use default settings
}

export interface SendBulkEmailDto {
  recipients: EmailRecipientDto[];
  subject: string;
  body: string;
  isHtml?: boolean; // Default: true
  attachments?: EmailAttachmentDto[];
  emailSettingsId?: number;
  delayBetweenEmailsMs?: number; // Default: 100ms, Max: 60000ms
}

export interface TestEmailSettingsDto {
  emailSettingsId: number;
  testRecipientEmail: string;
}

export interface EmailSendResponseDto {
  success: boolean;
  message: string;
  successfulCount: number;
  failedCount: number;
  errors?: string[];
  sentAt: string; // ISO 8601 format
}

// ============================================
// Email Service
// ============================================

export const emailService = {
  /**
   * Send a single email (Admin only)
   * @param data Email data including recipient, subject, body, etc.
   * @returns Response with success status and details
   */
  sendSingleEmail: async (data: SendEmailDto): Promise<EmailSendResponseDto> => {
    try {
      const response = await http.post<EmailSendResponseDto>(
        '/api/Email/send',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      throw error;
    }
  },

  /**
   * Send bulk emails to multiple recipients (Admin only)
   * @param data Bulk email data including recipients list, subject, body, etc.
   * @returns Response with success status and count of successful/failed emails
   */
  sendBulkEmail: async (data: SendBulkEmailDto): Promise<EmailSendResponseDto> => {
    try {
      const response = await http.post<EmailSendResponseDto>(
        '/api/Email/send-bulk',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to send bulk email:', error);
      throw error;
    }
  },

  /**
   * Send a test email to verify SMTP settings (Admin only)
   * @param data Test email settings including emailSettingsId and recipient
   * @returns Response with success status
   */
  sendTestEmail: async (data: TestEmailSettingsDto): Promise<EmailSendResponseDto> => {
    try {
      const response = await http.post<EmailSendResponseDto>(
        '/api/Email/send-test',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      throw error;
    }
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Convert File object to Base64 string
 * @param file File object to convert
 * @returns Promise with Base64 string (without data URL prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Validate email address format
 * @param email Email address to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Get MIME content type from file extension
 * @param fileName File name with extension
 * @returns MIME content type
 */
export const getContentTypeFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Text
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    
    // Others
    csv: 'text/csv',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
};

/**
 * Prepare attachments from File objects
 * @param files Array of File objects
 * @returns Promise with array of EmailAttachmentDto
 */
export const prepareAttachments = async (files: File[]): Promise<EmailAttachmentDto[]> => {
  return Promise.all(
    files.map(async (file) => ({
      fileName: file.name,
      fileContent: await fileToBase64(file),
      contentType: file.type || getContentTypeFromFileName(file.name),
    }))
  );
};
