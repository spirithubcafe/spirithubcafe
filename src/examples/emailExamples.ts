/**
 * Email API Usage Examples
 * 
 * This file contains practical examples for using the Email API in various scenarios.
 */

import { emailService, prepareAttachments } from '../services/emailService';
import type { SendEmailDto } from '../services/emailService';

// ============================================
// Example 1: Send Welcome Email
// ============================================

export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
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
          <h1>مرحباً ${userName}!</h1>
        </div>
        <div class="content">
          <p>مرحباً ${userName},</p>
          <p>نحن سعداء جداً بانضمامك إلينا.</p>
          <p>تم إنشاء حسابك بنجاح.</p>
          <br>
          <a href="${window.location.origin}/profile" class="button">
            عرض الملف الشخصي
          </a>
          <br><br>
          <p>مع الشكر،<br>فريق Spirit Hub Cafe</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: userEmail,
      toName: userName,
      subject: `مرحباً ${userName}!`,
      body: htmlBody,
      isHtml: true
    });

    console.log('Welcome email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

// ============================================
// Example 2: Send Order Invoice with PDF
// ============================================

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  date: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export const sendOrderInvoice = async (orderData: OrderData, pdfFile?: File) => {
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <body style="font-family: Tahoma; max-width: 600px; margin: 0 auto;">
      <h2>فاتورة الطلب #${orderData.orderNumber}</h2>
      <p>عزيزنا العميل ${orderData.customerName}،</p>
      <p>فاتورة طلبك ${pdfFile ? 'في الملف المرفق' : 'أدناه'}.</p>
      <hr>
      <h3>ملخص الطلب:</h3>
      <ul>
        <li>رقم الطلب: ${orderData.orderNumber}</li>
        <li>التاريخ: ${orderData.date}</li>
        <li>المبلغ الإجمالي: ${orderData.totalAmount.toFixed(3)} OMR</li>
      </ul>
      <h4>المنتجات:</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f0f0f0;">
          <th style="padding: 8px; border: 1px solid #ddd;">الاسم</th>
          <th style="padding: 8px; border: 1px solid #ddd;">الكمية</th>
          <th style="padding: 8px; border: 1px solid #ddd;">السعر</th>
        </tr>
        ${orderData.items.map(item => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.price.toFixed(3)} OMR</td>
          </tr>
        `).join('')}
      </table>
      <br>
      <p>شكراً لك على الشراء!</p>
      <p>فريق Spirit Hub Cafe</p>
    </body>
    </html>
  `;

  try {
    const emailData: SendEmailDto = {
      toEmail: orderData.customerEmail,
      toName: orderData.customerName,
      subject: `فاتورة الطلب #${orderData.orderNumber}`,
      body: htmlBody,
      isHtml: true
    };

    // Add PDF attachment if provided
    if (pdfFile) {
      emailData.attachments = await prepareAttachments([pdfFile]);
    }

    const result = await emailService.sendSingleEmail(emailData);
    console.log('Invoice email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    throw error;
  }
};

// ============================================
// Example 3: Send OTP Code
// ============================================

export const sendOTPEmail = async (email: string, otpCode: string, expiryMinutes: number = 10) => {
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <body style="font-family: Tahoma;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>رمز التحقق الخاص بك</h2>
        <p>رمز التحقق لتسجيل الدخول إلى حسابك:</p>
        <div style="
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          margin: 20px 0;
          border-radius: 8px;
        ">
          ${otpCode}
        </div>
        <p>هذا الرمز صالح لمدة ${expiryMinutes} دقيقة.</p>
        <p style="color: #999; font-size: 12px;">
          إذا لم تقم بهذا الطلب، يرجى تجاهل هذا البريد الإلكتروني.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: email,
      subject: `رمز التحقق الخاص بك: ${otpCode}`,
      body: htmlBody,
      isHtml: true
    });

    console.log('OTP email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
};

// ============================================
// Example 4: Send Order Status Update
// ============================================

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const sendOrderStatusEmail = async (
  orderId: string,
  newStatus: OrderStatus,
  customerEmail: string,
  customerName?: string,
  trackingNumber?: string
) => {
  const statusMessages: Record<OrderStatus, { title: string; message: string; color: string }> = {
    'pending': {
      title: 'في انتظار المعالجة',
      message: 'تم تسجيل طلبك وهو في انتظار المعالجة.',
      color: '#FF9800'
    },
    'processing': {
      title: 'قيد التحضير',
      message: 'طلبك قيد التحضير للشحن.',
      color: '#2196F3'
    },
    'shipped': {
      title: 'تم الشحن',
      message: 'تم شحن طلبك وسيصل إليك قريباً.',
      color: '#9C27B0'
    },
    'delivered': {
      title: 'تم التوصيل',
      message: 'تم توصيل طلبك بنجاح.',
      color: '#4CAF50'
    },
    'cancelled': {
      title: 'تم الإلغاء',
      message: 'تم إلغاء طلبك.',
      color: '#F44336'
    }
  };

  const status = statusMessages[newStatus];

  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <body style="font-family: Tahoma;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${status.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">تحديث حالة الطلب</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
          ${customerName ? `<p>مرحباً ${customerName}،</p>` : '<p>مرحباً،</p>'}
          <p>الطلب رقم <strong>#${orderId}</strong> تم تحديثه إلى <strong style="color: ${status.color}">${status.title}</strong>.</p>
          <p>${status.message}</p>
          ${trackingNumber ? `
            <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <strong>رقم التتبع:</strong> ${trackingNumber}
            </div>
          ` : ''}
          <p>
            <a href="${window.location.origin}/orders/${orderId}" 
               style="display: inline-block; padding: 10px 20px; background: ${status.color}; 
                      color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              عرض تفاصيل الطلب
            </a>
          </p>
          <br>
          <p>مع الشكر،<br>فريق Spirit Hub Cafe</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: customerEmail,
      toName: customerName,
      subject: `تحديث حالة الطلب #${orderId} - ${status.title}`,
      body: htmlBody,
      isHtml: true
    });

    console.log('Order status email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send order status email:', error);
    throw error;
  }
};

// ============================================
// Example 5: Send Newsletter to Subscribers
// ============================================

interface NewsletterData {
  subject: string;
  htmlContent: string;
  subscribers: Array<{ email: string; name?: string }>;
}

export const sendNewsletter = async (data: NewsletterData) => {
  try {
    const result = await emailService.sendBulkEmail({
      recipients: data.subscribers,
      subject: data.subject,
      body: data.htmlContent,
      isHtml: true,
      delayBetweenEmailsMs: 500 // 500ms delay to avoid spam filters
    });

    console.log(`Newsletter sent to ${result.successfulCount} subscribers`);
    if (result.failedCount > 0) {
      console.warn(`Failed to send to ${result.failedCount} subscribers:`, result.errors);
    }

    return result;
  } catch (error) {
    console.error('Failed to send newsletter:', error);
    throw error;
  }
};

// ============================================
// Example 6: Send Email with CC and BCC
// ============================================

export const sendEmailWithCopy = async (
  toEmail: string,
  subject: string,
  body: string,
  ccEmails?: string[],
  bccEmails?: string[]
) => {
  try {
    const result = await emailService.sendSingleEmail({
      toEmail: toEmail,
      subject: subject,
      body: body,
      isHtml: true,
      ccEmails: ccEmails,
      bccEmails: bccEmails
    });

    console.log('Email with CC/BCC sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email with CC/BCC:', error);
    throw error;
  }
};

// ============================================
// Example 7: Send Email with Multiple Attachments
// ============================================

export const sendEmailWithMultipleAttachments = async (
  toEmail: string,
  subject: string,
  body: string,
  files: File[]
) => {
  try {
    const attachments = await prepareAttachments(files);

    const result = await emailService.sendSingleEmail({
      toEmail: toEmail,
      subject: subject,
      body: body,
      isHtml: true,
      attachments: attachments
    });

    console.log(`Email sent with ${attachments.length} attachments:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send email with attachments:', error);
    throw error;
  }
};

// ============================================
// Example 8: Send Password Reset Email
// ============================================

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName?: string
) => {
  const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <body style="font-family: Tahoma;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>استعادة كلمة المرور</h2>
        ${userName ? `<p>مرحباً ${userName}،</p>` : '<p>مرحباً،</p>'}
        <p>تم استلام طلب لاستعادة كلمة مرور حسابك.</p>
        <p>لتعيين كلمة مرور جديدة، انقر على الزر أدناه:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 30px; background: #2196F3; 
                    color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            استعادة كلمة المرور
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          هذا الرابط صالح لمدة 24 ساعة.
        </p>
        <p style="color: #999; font-size: 12px;">
          إذا لم تقم بهذا الطلب، يرجى تجاهل هذا البريد الإلكتروني.
        </p>
        <hr style="margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          إذا لم يعمل الزر، انسخ الرابط أدناه وافتحه في متصفحك:<br>
          ${resetLink}
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: email,
      toName: userName,
      subject: 'استعادة كلمة المرور',
      body: htmlBody,
      isHtml: true
    });

    console.log('Password reset email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};
