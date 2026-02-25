const nodemailer = require('nodemailer');
const config = require('../config/env');

// SendGrid Web API (not SMTP - works on Render)
let sgMail = null;
if (config.email.sendgridApiKey) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.email.sendgridApiKey);
  } catch (error) {
    console.warn('⚠️  @sendgrid/mail package not installed. Run: npm install @sendgrid/mail');
  }
}

/**
 * Email Service - Handles sending emails
 */
class EmailService {
  constructor() {
    // Prevent multiple initializations
    if (EmailService.instance) {
      return EmailService.instance;
    }

    this.transporter = null;
    this.useSendGridApi = false; // Flag to use SendGrid Web API instead of SMTP
    this.initTransporter();

    // Store instance for singleton pattern
    EmailService.instance = this;
  }

  /**
   * Initialize email transporter
   */
  initTransporter() {
    // Skip if already initialized (singleton pattern)
    if (this.isReady) {
      return;
    }

    // Check if SendGrid API Key is configured
    if (!config.email.sendgridApiKey) {
      console.error('❌ SENDGRID_API_KEY is not set in environment variables.');
      this.isReady = false;
      return;
    }

    // Check if EMAIL_FROM is configured
    if (!config.email.fromEmail) {
      console.error('❌ EMAIL_FROM is not set in environment variables.');
      this.isReady = false;
      return;
    }

    // SendGrid Web API (not SMTP - works on Render)
    if (sgMail) {
      this.useSendGridApi = true;
      this.isReady = true;
      console.log('✅ Email service initialized with SendGrid Web API (not blocked by Render)');
      console.log(`   📧 From: ${config.email.fromEmail}`);
      console.log(`   📝 Name: ${config.email.fromName || 'Tutor Platform'}`);
      return;
    }

    // Fallback: SendGrid SMTP (may be blocked by Render)
    console.warn('⚠️  @sendgrid/mail package not found. Using SMTP (may be blocked by Render).');
    console.warn('   To use Web API, run: npm install @sendgrid/mail');

    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: config.email.sendgridApiKey,
      },
      connectionTimeout: 120000,
      greetingTimeout: 60000,
      socketTimeout: 120000,
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
    });
    this.isReady = true;
    console.log('✅ Email service initialized with SendGrid SMTP');
    console.log('⚠️  Warning: SendGrid SMTP may be blocked by Render. Install @sendgrid/mail to use Web API instead.');
  }

  /**
   * Wait for transporter to be ready
   */
  async waitForReady() {
    // If using SendGrid (Web API or SMTP), it's ready immediately
    if (config.email.sendgridApiKey && this.isReady) {
      return;
    }

    // If not ready, throw error
    if (!this.isReady) {
      throw new Error('Email service failed to initialize. Please check SENDGRID_API_KEY environment variable.');
    }
  }

  /**
   * Send email via SendGrid Web API
   */
  async sendViaSendGridApi(mailOptions) {
    if (!sgMail) {
      throw new Error('SendGrid Web API not available. Please install @sendgrid/mail package: npm install @sendgrid/mail');
    }

    if (!config.email.sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY is not set in environment variables');
    }

    if (!config.email.fromEmail) {
      throw new Error('EMAIL_FROM is not set in environment variables');
    }

    const msg = {
      to: mailOptions.to,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName || 'Tutor Platform',
      },
      subject: mailOptions.subject,
      html: mailOptions.html,
    };

    try {
      const response = await sgMail.send(msg);
      return {
        messageId: response[0].headers['x-message-id'] || 'sendgrid-' + Date.now(),
        response: response[0],
      };
    } catch (error) {
      // Enhanced error logging for SendGrid - always log in production
      console.error('❌ SendGrid API Error Details:', {
        message: error.message,
        code: error.code,
        statusCode: error.response?.statusCode,
        responseBody: error.response?.body,
      });

      // Log full response in production for debugging
      if (error.response) {
        console.error('SendGrid Full Response:', JSON.stringify({
          statusCode: error.response.statusCode,
          body: error.response.body,
          headers: error.response.headers,
        }, null, 2));
      }

      // Provide user-friendly error messages
      if (error.response) {
        const { statusCode, body } = error.response;
        if (statusCode === 401) {
          const friendlyError = new Error('SendGrid API Key is invalid. Please check your SENDGRID_API_KEY environment variable.');
          friendlyError.statusCode = 401;
          friendlyError.originalError = error;
          throw friendlyError;
        }
        if (statusCode === 403) {
          const friendlyError = new Error('SendGrid: Sender email is not verified. Please verify your email in SendGrid dashboard.');
          friendlyError.statusCode = 403;
          friendlyError.originalError = error;
          throw friendlyError;
        }
        if (statusCode === 400) {
          const errorMsg = body?.errors?.[0]?.message || error.message;
          const friendlyError = new Error(`SendGrid validation error: ${errorMsg}`);
          friendlyError.statusCode = 400;
          friendlyError.originalError = error;
          throw friendlyError;
        }
      }

      // Re-throw with enhanced info
      const enhancedError = new Error(error.message || 'SendGrid API error');
      enhancedError.originalError = error;
      enhancedError.statusCode = error.response?.statusCode;
      throw enhancedError;
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmailWithRetry(mailOptions, maxRetries = 3) {
    // Use SendGrid Web API if available (not blocked by Render)
    if (this.useSendGridApi) {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const info = await this.sendViaSendGridApi(mailOptions);
          return info;
        } catch (error) {
          lastError = error;
          console.error(`❌ SendGrid API attempt ${attempt}/${maxRetries} failed:`, error.message);
          if (error.response) {
            console.error('   Status Code:', error.response.statusCode);
            console.error('   Response Body:', JSON.stringify(error.response.body, null, 2));
          }

          // Don't retry on authentication/authorization errors
          if (error.code === 401 || error.code === 403 || error.response?.statusCode === 401 || error.response?.statusCode === 403) {
            throw error;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastError;
    }

    // Use SMTP for other services
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait for transporter to be ready
        await this.waitForReady();

        const info = await this.transporter.sendMail(mailOptions);
        return info;
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt}/${maxRetries} failed:`, error.message);

        // Don't retry on certain errors
        if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(to, otp, userName = 'User') {
    try {
      // Validate configuration before sending
      if (!config.email.sendgridApiKey) {
        throw new Error('SENDGRID_API_KEY is not configured. Please set it in environment variables.');
      }

      if (!config.email.fromEmail) {
        throw new Error('EMAIL_FROM is not configured. Please set it in environment variables.');
      }

      if (!this.isReady) {
        throw new Error('Email service is not initialized. Please check your configuration.');
      }

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject: 'Xác thực tài khoản - Mã OTP',
        html: this.getOtpEmailTemplate(otp, userName),
      };

      const info = await this.sendEmailWithRetry(mailOptions);

      if (config.nodeEnv !== 'production') {
        console.log('📧 Email sent: %s', info.messageId);
        if (info.previewUrl) {
          console.log('📧 Preview URL: %s', info.previewUrl);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: info.previewUrl,
      };
    } catch (error) {
      // Enhanced error logging - always log in production for debugging
      console.error('❌ Error sending OTP email:', error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.response?.statusCode,
        response: error.response?.body,
        stack: config.nodeEnv === 'production' ? error.stack : undefined, // Only log stack in production for debugging
      });

      // Log SendGrid specific errors
      if (error.response) {
        console.error('SendGrid API Response:', {
          statusCode: error.response.statusCode,
          body: JSON.stringify(error.response.body, null, 2),
          headers: error.response.headers,
        });
      }

      // Preserve original error message for better debugging
      const errorMessage = error.message || 'Failed to send OTP email';
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.statusCode = error.response?.statusCode;
      throw enhancedError;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to, userName) {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject: 'Chào mừng bạn đến với Tutor Platform!',
        html: this.getWelcomeEmailTemplate(userName),
      };

      const info = await this.sendEmailWithRetry(mailOptions);

      if (config.nodeEnv !== 'production') {
        console.log('📧 Welcome email sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      // Don't throw error for welcome email
      return { success: false };
    }
  }

  /**
   * OTP email template
   */
  getOtpEmailTemplate(otp, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #f44336; font-size: 14px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Tutor Platform</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Tutor Platform</strong>.</p>
            <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">Mã có hiệu lực trong 10 phút</p>
            </div>
            
            <p class="warning">
              ⚠️ <strong>Lưu ý:</strong> Không chia sẻ mã OTP này với bất kỳ ai. 
              Nhân viên của chúng tôi sẽ không bao giờ yêu cầu mã OTP của bạn.
            </p>
            
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            
            <p>Trân trọng,<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  getWelcomeEmailTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
          .feature-item:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Tutor Platform!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Tài khoản của bạn đã được kích hoạt thành công. Chào mừng bạn đến với cộng đồng học tập của chúng tôi!</p>
            
            <div class="features">
              <h3>🚀 Bạn có thể bắt đầu:</h3>
              <div class="feature-item">Tìm kiếm gia sư phù hợp với nhu cầu của bạn</div>
              <div class="feature-item">Xem hồ sơ và đánh giá của các gia sư</div>
              <div class="feature-item">Đặt lịch học trực tuyến dễ dàng</div>
              <div class="feature-item">Theo dõi tiến độ học tập của bạn</div>
            </div>
            
            <center>
              <a href="${config.frontendUrl || 'http://localhost:3000'}" class="button">Bắt đầu ngay</a>
            </center>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email này.</p>
            
            <p>Chúc bạn có trải nghiệm học tập tuyệt vời!<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, otp, userName) {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject: 'Đặt lại mật khẩu - Mã OTP',
        html: this.getPasswordResetEmailTemplate(otp, userName),
      };

      const info = await this.sendEmailWithRetry(mailOptions);

      if (config.nodeEnv !== 'production') {
        console.log('📧 Password reset email sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Password reset email template
   */
  getPasswordResetEmailTemplate(otp, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px solid #f44336; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #f44336; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #f44336; font-size: 14px; margin-top: 15px; background: #ffebee; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Vui lòng sử dụng mã OTP dưới đây để tiếp tục:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">Mã có hiệu lực trong 10 phút</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Cảnh báo bảo mật:</strong><br>
              • Không chia sẻ mã OTP này với bất kỳ ai<br>
              • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này<br>
              • Liên hệ ngay với chúng tôi nếu bạn nghi ngờ tài khoản bị xâm nhập
            </div>
            
            <p>Trân trọng,<br><strong>Tutor Platform Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Tutor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance instead of class
let emailServiceInstance = null;

module.exports = function () {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

// Also export class for backward compatibility if needed
module.exports.EmailService = EmailService;
