/**
 * نمونه‌های استفاده از Email API
 * 
 * این فایل شامل مثال‌های عملی برای استفاده از Email API در سناریوهای مختلف است.
 */

import { emailService, prepareAttachments } from '../services/emailService';
import type { SendEmailDto } from '../services/emailService';

// ============================================
// مثال 1: ارسال ایمیل خوش‌آمدگویی
// ============================================

export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
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
          <a href="${window.location.origin}/profile" class="button">
            مشاهده پروفایل
          </a>
          <br><br>
          <p>با تشکر،<br>تیم Spirit Hub Cafe</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: userEmail,
      toName: userName,
      subject: `خوش آمدید ${userName}!`,
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
// مثال 2: ارسال فاکتور سفارش با فایل PDF
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
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma; max-width: 600px; margin: 0 auto;">
      <h2>فاکتور سفارش #${orderData.orderNumber}</h2>
      <p>مشتری گرامی ${orderData.customerName}،</p>
      <p>فاکتور سفارش شما ${pdfFile ? 'در فایل پیوست' : 'در ادامه'} ارسال شده است.</p>
      <hr>
      <h3>خلاصه سفارش:</h3>
      <ul>
        <li>شماره سفارش: ${orderData.orderNumber}</li>
        <li>تاریخ: ${orderData.date}</li>
        <li>مبلغ کل: ${orderData.totalAmount.toLocaleString('fa-IR')} تومان</li>
      </ul>
      <h4>اقلام:</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f0f0f0;">
          <th style="padding: 8px; border: 1px solid #ddd;">نام</th>
          <th style="padding: 8px; border: 1px solid #ddd;">تعداد</th>
          <th style="padding: 8px; border: 1px solid #ddd;">قیمت</th>
        </tr>
        ${orderData.items.map(item => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.price.toLocaleString('fa-IR')} تومان</td>
          </tr>
        `).join('')}
      </table>
      <br>
      <p>با تشکر از خرید شما!</p>
      <p>تیم Spirit Hub Cafe</p>
    </body>
    </html>
  `;

  try {
    const emailData: SendEmailDto = {
      toEmail: orderData.customerEmail,
      toName: orderData.customerName,
      subject: `فاکتور سفارش #${orderData.orderNumber}`,
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
// مثال 3: ارسال کد تایید (OTP)
// ============================================

export const sendOTPEmail = async (email: string, otpCode: string, expiryMinutes: number = 10) => {
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
          border-radius: 8px;
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

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: email,
      subject: `کد تایید شما: ${otpCode}`,
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
// مثال 4: ارسال اعلان تغییر وضعیت سفارش
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
      title: 'در انتظار پردازش',
      message: 'سفارش شما ثبت شد و در انتظار پردازش است.',
      color: '#FF9800'
    },
    'processing': {
      title: 'در حال آماده‌سازی',
      message: 'سفارش شما در حال آماده‌سازی برای ارسال است.',
      color: '#2196F3'
    },
    'shipped': {
      title: 'ارسال شد',
      message: 'سفارش شما ارسال شد و به زودی به دستتان می‌رسد.',
      color: '#9C27B0'
    },
    'delivered': {
      title: 'تحویل داده شد',
      message: 'سفارش شما با موفقیت تحویل داده شد.',
      color: '#4CAF50'
    },
    'cancelled': {
      title: 'لغو شد',
      message: 'سفارش شما لغو شد.',
      color: '#F44336'
    }
  };

  const status = statusMessages[newStatus];

  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${status.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">تغییر وضعیت سفارش</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
          ${customerName ? `<p>سلام ${customerName} عزیز،</p>` : '<p>سلام،</p>'}
          <p>سفارش شماره <strong>#${orderId}</strong> به وضعیت <strong style="color: ${status.color}">${status.title}</strong> تغییر کرد.</p>
          <p>${status.message}</p>
          ${trackingNumber ? `
            <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
              <strong>کد رهگیری:</strong> ${trackingNumber}
            </div>
          ` : ''}
          <p>
            <a href="${window.location.origin}/orders/${orderId}" 
               style="display: inline-block; padding: 10px 20px; background: ${status.color}; 
                      color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              مشاهده جزئیات سفارش
            </a>
          </p>
          <br>
          <p>با تشکر،<br>تیم Spirit Hub Cafe</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await emailService.sendSingleEmail({
      toEmail: customerEmail,
      toName: customerName,
      subject: `تغییر وضعیت سفارش #${orderId} - ${status.title}`,
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
// مثال 5: ارسال خبرنامه به مشترکان
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
// مثال 6: ارسال ایمیل با CC و BCC
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
// مثال 7: ارسال ایمیل با چندین فایل پیوست
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
// مثال 8: ارسال ایمیل بازیابی رمز عبور
// ============================================

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName?: string
) => {
  const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>بازیابی رمز عبور</h2>
        ${userName ? `<p>سلام ${userName} عزیز،</p>` : '<p>سلام،</p>'}
        <p>درخواستی برای بازیابی رمز عبور حساب کاربری شما دریافت شد.</p>
        <p>برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 30px; background: #2196F3; 
                    color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            بازیابی رمز عبور
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          این لینک تا 24 ساعت معتبر است.
        </p>
        <p style="color: #999; font-size: 12px;">
          اگر این درخواست را شما انجام نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.
        </p>
        <hr style="margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          اگر دکمه کار نمی‌کند، لینک زیر را کپی کرده و در مرورگر خود باز کنید:<br>
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
      subject: 'بازیابی رمز عبور',
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
